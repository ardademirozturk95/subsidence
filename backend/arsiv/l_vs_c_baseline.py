"""Compare NISAR L-band and Sentinel-1 C-band coherence degradation over baseline (12d vs 24d/36d).

Reads:
  - backend/out/forest_box.json (selected independently from ESA WorldCover 2021)
  - backend/out/c_band/jobs_long.json (long-baseline Sentinel-1 HyP3 orders)
  - backend/out/cache/<track>/*.npz (NISAR L2 GUNW coherence + connected components)
  - backend/out/c_band/*_corr.tif (Sentinel-1 HyP3 coherence GeoTIFFs)

Reprojects Sentinel-1 _corr.tif onto the exact NISAR 80 m UTM 14N grid (bilinear,
src_nodata=0 -> NaN), keeps ALL pixels in each 15x15 box (including NISAR cc==0),
evaluates the pre-registered baseline criterion across the 3 long-baseline pairs,
and writes:
  - backend/out/l_vs_c_baseline.json
  - backend/out/l_vs_c_baseline.png
"""
from __future__ import annotations

import json
import re
import sys
from datetime import datetime
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.lines import Line2D
import numpy as np
import rasterio
from rasterio.transform import from_origin
from rasterio.warp import Resampling, reproject

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))  # arsiv/ -> backend/ (geo_util)
from geo_util import to_utm  # noqa: E402

OUT = Path(__file__).resolve().parent.parent / "out"
CBAND_DIR = OUT / "c_band"
CACHE_DIR = OUT / "cache"
FOREST_BOX_PATH = OUT / "forest_box.json"
JOBS_LONG_PATH = CBAND_DIR / "jobs_long.json"

HALF_BOX = 7  # 15x15 pixels -> 1.2 km x 1.2 km at 80 m spacing

FIXED_BOXES = [
    {
        "id": "zocalo",
        "label": "Zócalo (şehir)",
        "short": "ZOC",
        "lat": 19.433,
        "lon": -99.133,
        "is_agri_wetland": False,
        "worldcover_2021": "Yapılaşma %92,6; Çıplak/seyrek %6,1; Ağaç %1,2",
        "landcover_ok": True,
        "landcover_note": "Yoğun kentsel doku; tanıma uyuyor.",
        "color": "#111111",
        "marker": "o",
    },
    {
        "id": "chalco",
        "label": "Chalco tarlaları",
        "short": "CHA",
        "lat": 19.2453,
        "lon": -98.9363,
        "is_agri_wetland": True,
        "worldcover_2021": "Çayır/otlak %42,3; Tarım %39,5; Ağaç %5,9; Yapılaşma %4,3; Çalılık %4,0; Su %1,9",
        "landcover_ok": True,
        "landcover_note": "Ağırlıklı tarım/otlak; tanıma uyuyor.",
        "color": "#1b9e77",
        "marker": "s",
    },
    {
        "id": "xochimilco_fields",
        "label": "Xochimilco tarlaları",
        "short": "XOC",
        "lat": 19.26,
        "lon": -99.09,
        "is_agri_wetland": True,
        "worldcover_2021": "Ağaç örtüsü %49,5; Yapılaşma %46,5; Çıplak/seyrek %2,9 (Tarım %0)",
        "landcover_ok": False,
        "landcover_note": (
            "Arazi örtüsü tanıma uymuyor (WorldCover 2021: %49,5 ağaç + %46,5 yapılaşma, Tarım %0; "
            "kural gereği kutu taşınmadı)."
        ),
        "color": "#d95f02",
        "marker": "^",
    },
    {
        "id": "tlaxialtemalco",
        "label": "Xochimilco–Tláhuac sulak alanı",
        "short": "TLA",
        "lat": 19.2682,
        "lon": -99.0392,
        "is_agri_wetland": True,
        "worldcover_2021": "Ağaç örtüsü %52,2; Yapılaşma %23,6; Çalılık %13,3; Çayır %4,5; Su %2,5; Tarım %2,5",
        "landcover_ok": True,
        "landcover_note": "Ağırlıklı bitki/su dokulu sulak chinampa alanı (%75+ doğal/tarımsal örtü).",
        "color": "#7570b3",
        "marker": "D",
    },
    {
        "id": "santafe",
        "label": "Santa Fe (kaya)",
        "short": "STF",
        "lat": 19.36,
        "lon": -99.26,
        "is_agri_wetland": False,
        "worldcover_2021": "Yapılaşma %55,4; Ağaç %30,3; Çayır %7,1; Tarım %4,2; Çalılık %2,3",
        "landcover_ok": True,
        "landcover_note": "Batı yamacı kaya zemin (kentsel + ağaçlık).",
        "color": "#e7298a",
        "marker": "v",
    },
]

# 12-day references matched strictly by track (orbit direction) and season
REF_12D_PAIRS = {
    "desc-dry-0422-0504": {
        "name": "desc-dry-0422-0504",
        "track": "113",
        "direction": "descending",
        "season": "dry",
        "nisar_npz": "113/20260423_20260505.npz",
        "s1_prefix": "S1DD_20260422T122516_20260504T122517",
    },
    "desc-rain-0609-0621": {
        "name": "desc-rain-0609-0621",
        "track": "113",
        "direction": "descending",
        "season": "rain",
        "nisar_npz": "113/20260610_20260622.npz",
        "s1_prefix": "S1DD_20260609T122519_20260621T122520",
    },
    "desc-rain-0901-0913": {
        "name": "desc-rain-0901-0913",
        "track": "113",
        "direction": "descending",
        "season": "rain",
        "nisar_npz": "113/20260902_20260914.npz",
        "s1_prefix": "S1DD_20260901T122512_20260913T122512",
    },
    "asc-rain-0523-0604": {
        "name": "asc-rain-0523-0604",
        "track": "19",
        "direction": "ascending",
        "season": "rain",
        "nisar_npz": "19/20260522_20260603.npz",
        "s1_prefix": "S1CC_20260523T004725_20260604T004726",
    },
}

LONG_PAIR_SPECS = [
    {
        "name": "desc-dry-24d",
        "panel_title": "Descending Kurak (Track 113: 12g vs 24g)",
        "track": "113",
        "direction": "descending",
        "season": "dry",
        "nisar_npz": "113/20260318_20260411.npz",
        "expected_days": 24,
        "ref_12d_names": ["desc-dry-0422-0504"],
        "ref_12d_label": "desc-dry-0422-0504",
    },
    {
        "name": "desc-rain-36d",
        "panel_title": "Descending Yağış (Track 113: 12g vs 36g)",
        "track": "113",
        "direction": "descending",
        "season": "rain",
        "nisar_npz": "113/20260716_20260821.npz",
        "expected_days": 36,
        "ref_12d_names": ["desc-rain-0609-0621", "desc-rain-0901-0913"],
        "ref_12d_label": "mean(desc-rain-0609-0621, desc-rain-0901-0913)",
    },
    {
        "name": "asc-rain-24d",
        "panel_title": "Ascending Yağış (Track 19: 12g vs 24g)",
        "track": "19",
        "direction": "ascending",
        "season": "rain",
        "nisar_npz": "19/20260721_20260814.npz",
        "expected_days": 24,
        "ref_12d_names": ["asc-rain-0523-0604"],
        "ref_12d_label": "asc-rain-0523-0604",
    },
]


def load_boxes() -> list[dict]:
    """Build the 6 fixed 15x15 boxes, adding the WorldCover-selected forest box."""
    fb = json.loads(FOREST_BOX_PATH.read_text(encoding="utf-8"))
    wc_parts = [f"{k} %{v:.1f}" for k, v in fb.get("worldcover_2021_breakdown", {}).items()]
    forest_box = {
        "id": fb.get("id", "forest"),
        "label": fb.get("label", "Orman (Ajusco–Los Dinamos)"),
        "short": fb.get("short", "FOR"),
        "lat": float(fb["lat"]),
        "lon": float(fb["lon"]),
        "ix_expected": fb.get("ix"),
        "iy_expected": fb.get("iy"),
        "is_agri_wetland": False,
        "is_forest": True,
        "worldcover_2021": "; ".join(wc_parts) if wc_parts else "Tree cover %100.0",
        "landcover_ok": True,
        "landcover_note": (
            f"Bağımsız ESA WorldCover 2021 en büyük ağaç örtüsü yaması ({fb.get('patch_area_km2')} km²); "
            "tutarlılık görülmeden seçildi."
        ),
        "color": "#006d2c",
        "marker": "P",
        "patch_area_km2": fb.get("patch_area_km2"),
    }
    return [*FIXED_BOXES, forest_box]


def load_jobs_long() -> dict[str, dict]:
    """Load backend/out/c_band/jobs_long.json indexed by pair name."""
    raw = json.loads(JOBS_LONG_PATH.read_text(encoding="utf-8"))
    if isinstance(raw, list):
        items = raw
    elif isinstance(raw, dict):
        if "pairs" in raw and isinstance(raw["pairs"], list):
            items = raw["pairs"]
        elif "orders" in raw and isinstance(raw["orders"], list):
            items = raw["orders"]
        elif "jobs" in raw and isinstance(raw["jobs"], list):
            items = raw["jobs"]
        else:
            # Dict keyed by pair name
            return {k: v for k, v in raw.items() if isinstance(v, dict)}
    else:
        raise ValueError(f"Unsupported jobs_long.json format: {type(raw)}")
    return {item["name"]: item for item in items if "name" in item}


def _extract_timestamp(granule_name: str) -> str | None:
    m = re.search(r"(\d{8}T\d{6})", granule_name)
    return m.group(1) if m else None


def find_corr_tif_for_job(job: dict) -> Path:
    """Locate the downloaded *_corr.tif file in backend/out/c_band/ for a long job."""
    for key in ("corr_tif", "corr_file", "s1_corr_tif", "s1_file", "local_corr_path"):
        val = job.get(key)
        if val:
            p = Path(val)
            if p.exists():
                return p
            p2 = CBAND_DIR / p.name
            if p2.exists():
                return p2

    g1 = job.get("g1") or job.get("granule_1") or ""
    g2 = job.get("g2") or job.get("granule_2") or ""
    t1 = _extract_timestamp(g1)
    t2 = _extract_timestamp(g2)
    if t1 and t2:
        matches = sorted(CBAND_DIR.glob(f"*{t1}*{t2}*_corr.tif"))
        if matches:
            return matches[0]
        d1, d2 = t1[:8], t2[:8]
        matches = sorted(CBAND_DIR.glob(f"*{d1}*{d2}*_corr.tif"))
        if matches:
            return matches[0]

    raise FileNotFoundError(f"Could not locate _corr.tif in {CBAND_DIR} for job {job}")


def find_corr_tif_by_prefix(prefix: str) -> Path:
    matches = sorted(CBAND_DIR.glob(f"{prefix}*_corr.tif"))
    if not matches:
        raise FileNotFoundError(f"Missing Sentinel-1 _corr.tif for prefix {prefix} in {CBAND_DIR}")
    return matches[0]


def reproject_s1_to_nisar(tif_path: Path, nx: np.ndarray, ny: np.ndarray) -> np.ndarray:
    """Reproject Sentinel-1 _corr.tif onto the exact NISAR 80 m UTM 14N grid."""
    dx = float(abs(nx[1] - nx[0]))
    dy = float(abs(ny[1] - ny[0]))
    dst_transform = from_origin(float(nx[0]) - dx / 2.0, float(ny[0]) + dy / 2.0, dx, dy)
    dst = np.full((len(ny), len(nx)), np.nan, dtype=np.float32)
    with rasterio.open(tif_path) as src:
        arr = src.read(1).astype(np.float32)
        src_nodata = 0.0 if src.nodata is None else float(src.nodata)
        reproject(
            source=arr,
            destination=dst,
            src_transform=src.transform,
            src_crs=src.crs,
            src_nodata=src_nodata,
            dst_transform=dst_transform,
            dst_crs="EPSG:32614",
            dst_nodata=np.nan,
            resampling=Resampling.bilinear,
        )
    return dst


def parse_dates_and_days_from_npz(npz_rel: str) -> tuple[str, int, datetime, datetime]:
    stem = Path(npz_rel).stem
    d1_str, d2_str = stem.split("_")
    d1 = datetime.strptime(d1_str, "%Y%m%d")
    d2 = datetime.strptime(d2_str, "%Y%m%d")
    return f"{d1:%Y-%m-%d} / {d2:%Y-%m-%d}", abs((d2 - d1).days), d1, d2


def parse_dates_and_days_from_s1_name(tif_name: str) -> tuple[str, int, datetime | None, datetime | None]:
    matches = re.findall(r"(\d{8})T\d{6}", tif_name)
    if len(matches) >= 2:
        d1 = datetime.strptime(matches[0], "%Y%m%d")
        d2 = datetime.strptime(matches[1], "%Y%m%d")
        return f"{d1:%Y-%m-%d} / {d2:%Y-%m-%d}", abs((d2 - d1).days), d1, d2
    return tif_name, 0, None, None


def compute_s1_minus_nisar_offset(
    s1_d1: datetime | None,
    s1_d2: datetime | None,
    n_d1: datetime,
    n_d2: datetime,
) -> dict:
    """Compute (S1 - NISAR) offset in days for start and end dates and flag |offset| > 4."""
    if s1_d1 is None or s1_d2 is None:
        return {"start": None, "end": None, "label": "N/A", "weak_match": False, "match_flag": None}
    off_start = (s1_d1 - n_d1).days
    off_end = (s1_d2 - n_d2).days
    weak = max(abs(off_start), abs(off_end)) > 4
    fmt = lambda v: f"{v:+d}" if v != 0 else "0"
    return {
        "start": off_start,
        "end": off_end,
        "label": f"{fmt(off_start)}/{fmt(off_end)} gün",
        "weak_match": weak,
        "match_flag": "zayıf eşleşme" if weak else "uygun (|Δ| ≤ 4 gün)",
    }


def measure_pair(nisar_npz_rel: str, tif_path: Path, boxes: list[dict]) -> dict[str, dict]:
    """Compute NISAR and reprojected S1 15x15 box medians (all pixels kept, including cc==0)."""
    d = np.load(CACHE_DIR / nisar_npz_rel)
    nx, ny = d["x"], d["y"]
    ncoh = d["coh"].astype(np.float32)
    ncc = d["cc"]
    scoh = reproject_s1_to_nisar(tif_path, nx, ny)

    stats = {}
    for b in boxes:
        ux, uy = to_utm(b["lat"], b["lon"])
        ix = int(np.argmin(np.abs(nx - ux)))
        iy = int(np.argmin(np.abs(ny - uy)))
        if b.get("ix_expected") is not None and b.get("iy_expected") is not None:
            assert ix == int(b["ix_expected"]) and iy == int(b["iy_expected"]), (
                f"Box {b['id']} pixel mismatch: computed ({ix},{iy}) vs expected ({b['ix_expected']},{b['iy_expected']})"
            )
        sl_y = slice(iy - HALF_BOX, iy + HALF_BOX + 1)
        sl_x = slice(ix - HALF_BOX, ix + HALF_BOX + 1)
        sub_n = ncoh[sl_y, sl_x]
        sub_cc = ncc[sl_y, sl_x]
        sub_s = scoh[sl_y, sl_x]

        assert sub_n.shape == (2 * HALF_BOX + 1, 2 * HALF_BOX + 1), f"Bad box shape {sub_n.shape} for {b['id']}"
        n_med = float(np.nanmedian(sub_n)) if np.isfinite(sub_n).any() else None
        s_valid_frac = float(np.isfinite(sub_s).mean())
        s_med = float(np.nanmedian(sub_s)) if np.isfinite(sub_s).any() else None
        cc0_frac = float((sub_cc == 0).mean())

        stats[b["id"]] = {
            "nisar_median": n_med,
            "s1_median": s_med,
            "nisar_cc0_frac": cc0_frac,
            "s1_valid_frac": s_valid_frac,
            "n_pixels": int(sub_n.size),
            "ix": ix,
            "iy": iy,
        }
    return stats


def _opt_round(val: float | None, digits: int = 4) -> float | None:
    return round(val, digits) if val is not None else None


def combine_12d_refs(ref_names: list[str], ref_measurements: dict[str, dict[str, dict]], boxes: list[dict]) -> dict[str, dict]:
    """Return 12-day baseline stats per box; averages the two rain pairs when len(ref_names) == 2."""
    combined = {}
    for b in boxes:
        bid = b["id"]
        entries = [ref_measurements[rn][bid] for rn in ref_names]
        n_vals = [e["nisar_median"] for e in entries if e["nisar_median"] is not None]
        s_vals = [e["s1_median"] for e in entries if e["s1_median"] is not None]
        cc0_vals = [e["nisar_cc0_frac"] for e in entries]
        sv_vals = [e["s1_valid_frac"] for e in entries]

        # Strict check: if multiple 12d pairs are averaged, require both to be finite if any is expected
        n_med = float(np.mean(n_vals)) if len(n_vals) == len(entries) and n_vals else (float(np.mean(n_vals)) if n_vals else None)
        s_med = float(np.mean(s_vals)) if len(s_vals) == len(entries) and s_vals else None
        combined[bid] = {
            "nisar_median": n_med,
            "s1_median": s_med,
            "nisar_cc0_frac": float(np.mean(cc0_vals)),
            "s1_valid_frac": float(np.mean(sv_vals)),
            "per_pair": {
                rn: {
                    "nisar_median": _opt_round(ref_measurements[rn][bid]["nisar_median"]),
                    "s1_median": _opt_round(ref_measurements[rn][bid]["s1_median"]),
                    "nisar_cc0_frac": _opt_round(ref_measurements[rn][bid]["nisar_cc0_frac"]),
                }
                for rn in ref_names
            },
        }
    return combined


def make_plot(pair_results: list[dict], boxes: list[dict], png_path: Path) -> None:
    """Plot 1 panel per long pair: x = baseline days (12 vs 24/36), solid=NISAR, dashed=S1."""
    n_panels = len(pair_results)
    fig, axes = plt.subplots(1, n_panels, figsize=(5.4 * n_panels, 5.4), sharey=True, constrained_layout=True)
    if n_panels == 1:
        axes = [axes]

    for ax, pr in zip(axes, pair_results):
        days_12 = 12
        days_long = pr["baseline_days_s1"] or pr["baseline_days_nisar"]
        ax.axhline(0.20, color="#888888", linestyle=":", linewidth=1.0, zorder=1)
        ax.text(
            (days_12 + days_long) / 2.0,
            0.206,
            "0.20 eşiği (ikisi de <0.20 → hariç)",
            fontsize=7.3,
            color="#555555",
            ha="center",
            va="bottom",
            bbox=dict(boxstyle="round,pad=0.12", fc="white", ec="none", alpha=0.8),
            zorder=4,
        )

        for b in boxes:
            bid = b["id"]
            bs = pr["boxes"][bid]
            n12, nl = bs["nisar_12d"], bs["nisar_long"]
            s12, sl = bs["s1_12d"], bs["s1_long"]

            if n12 is not None and nl is not None:
                ax.plot(
                    [days_12, days_long],
                    [n12, nl],
                    color=b["color"],
                    linestyle="-",
                    linewidth=2.1,
                    marker=b["marker"],
                    markersize=6.5,
                    zorder=3,
                )
            if s12 is not None and sl is not None:
                ax.plot(
                    [days_12, days_long],
                    [s12, sl],
                    color=b["color"],
                    linestyle="--",
                    linewidth=1.8,
                    marker=b["marker"],
                    markersize=5.5,
                    markerfacecolor="white",
                    markeredgewidth=1.4,
                    zorder=2,
                )

        pass_txt = "GEÇTİ" if pr["l_band_holds_up_better"] else "GEÇEMEDİ"
        eval_n = len(pr["evaluated_agri_boxes"])
        excl_n = len(pr["excluded_agri_boxes"])
        excl_note = f", {excl_n} hariç" if excl_n else ""
        off_lbl = pr["s1_vs_nisar_offset"]["label"]
        ax.set_title(
            f"{pr['panel_title']} (S1−NISAR: {off_lbl})\n"
            f"Ölçüt: {pr['agri_boxes_passed']}/{eval_n} tarım/sulak geçti{excl_note} → {pass_txt}",
            fontsize=9.6,
            fontweight="bold",
        )
        ax.set_xlabel("Zaman bazı (gün)", fontsize=9.5)
        ax.set_xticks([days_12, days_long])
        ax.set_xticklabels([f"{days_12}g", f"{days_long}g"], fontsize=9)
        ax.set_xlim(days_12 - 2.5, days_long + 2.5)
        ax.set_ylim(0.0, 1.03)
        ax.grid(True, linestyle=":", alpha=0.45)

    axes[0].set_ylabel("Medyan Tutarlılık (15×15 piksel, cc==0 dahil)", fontsize=9.5)

    box_handles = [
        Line2D(
            [0], [0],
            color=b["color"],
            marker=b["marker"],
            linewidth=2.0,
            markersize=6.5,
            label=f"{b['short']}: {b['label']}" + (" *" if not b["landcover_ok"] else ""),
        )
        for b in boxes
    ]
    sensor_handles = [
        Line2D([0], [0], color="#333333", linestyle="-", linewidth=2.1, marker="o", markersize=5.5, label="NISAR L-band (düz çizgi)"),
        Line2D([0], [0], color="#333333", linestyle="--", linewidth=1.8, marker="o", markerfacecolor="white", markersize=5.5, label="Sentinel-1 C-band (kesikli çizgi)"),
    ]
    fig.legend(
        handles=box_handles + sensor_handles,
        loc="lower center",
        bbox_to_anchor=(0.5, -0.14),
        ncol=4,
        fontsize=8.3,
        frameon=True,
    )

    verdict = pair_results[0].get("_overall_verdict", "")
    passed_cnt = sum(1 for pr in pair_results if pr["l_band_holds_up_better"])
    fig.suptitle(
        f"NISAR L-band vs Sentinel-1 C-band Uzun Zaman Bazı Karşılaştırması (12 gün → 24/36 gün)\n"
        f"Genel Sonuç: {verdict.upper()} ({passed_cnt}/{len(pair_results)} çift ölçütü sağladı) | "
        f"* XOC arazi örtüsü tanıma uymuyor (WorldCover: %49,5 ağaç, %46,5 yapılaşma)",
        fontsize=11.5,
        fontweight="bold",
    )
    fig.savefig(png_path, dpi=150, bbox_inches="tight")
    plt.close(fig)


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    boxes = load_boxes()
    agri_ids = [b["id"] for b in boxes if b["is_agri_wetland"]]
    jobs_long = load_jobs_long()

    # Measure all required 12-day reference pairs once
    ref_measurements: dict[str, dict[str, dict]] = {}
    ref_metadata: dict[str, dict] = {}
    for ref_name, ref_spec in REF_12D_PAIRS.items():
        tif_path = find_corr_tif_by_prefix(ref_spec["s1_prefix"])
        n_dates, n_days, n_d1, n_d2 = parse_dates_and_days_from_npz(ref_spec["nisar_npz"])
        s_dates, s_days, s_d1, s_d2 = parse_dates_and_days_from_s1_name(tif_path.name)
        ref_metadata[ref_name] = {
            "name": ref_name,
            "nisar_file": ref_spec["nisar_npz"],
            "nisar_dates": n_dates,
            "baseline_days_nisar": n_days,
            "s1_file": tif_path.name,
            "s1_dates": s_dates,
            "baseline_days_s1": s_days,
            "s1_vs_nisar_offset": compute_s1_minus_nisar_offset(s_d1, s_d2, n_d1, n_d2),
        }
        ref_measurements[ref_name] = measure_pair(ref_spec["nisar_npz"], tif_path, boxes)

    pair_results = []
    for spec in LONG_PAIR_SPECS:
        name = spec["name"]
        if name not in jobs_long:
            raise KeyError(f"Long pair {name} missing from {JOBS_LONG_PATH}")
        job = jobs_long[name]
        if job.get("skipped"):
            raise RuntimeError(f"Long pair {name} was marked skipped in {JOBS_LONG_PATH}: {job}")

        s1_tif = find_corr_tif_for_job(job)
        s1_dates, s1_days, s1_d1, s1_d2 = parse_dates_and_days_from_s1_name(s1_tif.name)
        nisar_dates, nisar_days, n_d1, n_d2 = parse_dates_and_days_from_npz(spec["nisar_npz"])
        long_offset = compute_s1_minus_nisar_offset(s1_d1, s1_d2, n_d1, n_d2)

        long_stats = measure_pair(spec["nisar_npz"], s1_tif, boxes)
        ref_stats = combine_12d_refs(spec["ref_12d_names"], ref_measurements, boxes)

        box_out = {}
        evaluated_agri = []
        excluded_agri = []
        passed_agri = []

        for b in boxes:
            bid = b["id"]
            r12 = ref_stats[bid]
            rlg = long_stats[bid]

            n12, s12 = r12["nisar_median"], r12["s1_median"]
            nl, sl = rlg["nisar_median"], rlg["s1_median"]

            diff_12d = (n12 - s12) if (n12 is not None and s12 is not None) else None
            diff_long = (nl - sl) if (nl is not None and sl is not None) else None
            nisar_loss = (n12 - nl) if (n12 is not None and nl is not None) else None
            s1_loss = (s12 - sl) if (s12 is not None and sl is not None) else None
            s1_loss_minus_nisar_loss = (
                (s1_loss - nisar_loss) if (s1_loss is not None and nisar_loss is not None) else None
            )

            both_lost_12d = bool(n12 is not None and s12 is not None and n12 < 0.20 and s12 < 0.20)
            both_lost_long = bool(nl is not None and sl is not None and nl < 0.20 and sl < 0.20)

            cond_diff = None
            cond_loss = None
            passes_box = None
            if bid in agri_ids:
                if both_lost_long:
                    excluded_agri.append(bid)
                    passes_box = False
                elif diff_long is not None and s1_loss_minus_nisar_loss is not None:
                    evaluated_agri.append(bid)
                    cond_diff = bool(diff_long >= 0.15)
                    cond_loss = bool(s1_loss_minus_nisar_loss >= 0.10)
                    passes_box = bool(cond_diff and cond_loss)
                    if passes_box:
                        passed_agri.append(bid)
                else:
                    excluded_agri.append(bid)
                    passes_box = False

            box_out[bid] = {
                "label": b["label"],
                "short": b["short"],
                "lat": b["lat"],
                "lon": b["lon"],
                "ix": rlg["ix"],
                "iy": rlg["iy"],
                "is_agri_wetland": b["is_agri_wetland"],
                "landcover_ok": b["landcover_ok"],
                "worldcover_2021": b["worldcover_2021"],
                "landcover_note": b["landcover_note"],
                "nisar_12d": _opt_round(n12),
                "s1_12d": _opt_round(s12),
                "diff_12d": _opt_round(diff_12d),
                "nisar_cc0_frac_12d": _opt_round(r12["nisar_cc0_frac"]),
                "s1_valid_frac_12d": _opt_round(r12["s1_valid_frac"]),
                "nisar_long": _opt_round(nl),
                "s1_long": _opt_round(sl),
                "diff_long": _opt_round(diff_long),
                "nisar_cc0_frac_long": _opt_round(rlg["nisar_cc0_frac"]),
                "s1_valid_frac_long": _opt_round(rlg["s1_valid_frac"]),
                "nisar_loss": _opt_round(nisar_loss),
                "s1_loss": _opt_round(s1_loss),
                "s1_loss_minus_nisar_loss": _opt_round(s1_loss_minus_nisar_loss),
                "both_lost_lt_020_12d": both_lost_12d,
                "both_lost_lt_020_long": both_lost_long,
                "excluded_both_lost": bool(bid in agri_ids and both_lost_long),
                "cond_diff_ge_015": cond_diff,
                "cond_s1_loss_minus_nisar_loss_ge_010": cond_loss,
                "passes_box_criterion": passes_box,
                "ref_12d_components": r12["per_pair"] if len(spec["ref_12d_names"]) > 1 else None,
            }

        l_holds = len(passed_agri) >= 2
        pair_results.append({
            "name": name,
            "panel_title": spec["panel_title"],
            "track": spec["track"],
            "direction": spec["direction"],
            "season": spec["season"],
            "nisar_file": spec["nisar_npz"],
            "nisar_dates": nisar_dates,
            "baseline_days_nisar": nisar_days,
            "s1_file": s1_tif.name,
            "s1_job_id": job.get("job_id"),
            "s1_satellite": job.get("satellite"),
            "s1_relative_orbit": job.get("relative_orbit"),
            "s1_frame": job.get("frame"),
            "s1_dates": s1_dates,
            "baseline_days_s1": s1_days,
            "s1_vs_nisar_offset": long_offset,
            "s1_match_note": job.get("note"),
            "ref_12d_comparison_note": job.get("ref_12d_comparison"),
            "ref_12d_pairs": spec["ref_12d_names"],
            "ref_12d_details": [ref_metadata[rn] for rn in spec["ref_12d_names"]],
            "ref_12d_rule": spec["ref_12d_label"],
            "evaluated_agri_boxes": evaluated_agri,
            "excluded_agri_boxes": excluded_agri,
            "passed_agri_boxes": passed_agri,
            "agri_boxes_passed": len(passed_agri),
            "l_band_holds_up_better": l_holds,
            "boxes": box_out,
        })

    n_passed = sum(1 for pr in pair_results if pr["l_band_holds_up_better"])
    if n_passed == 3:
        verdict = "doğrulandı"
    elif n_passed == 2:
        verdict = "kısmen"
    else:
        verdict = "doğrulanmadı"

    for pr in pair_results:
        pr["_overall_verdict"] = verdict

    png_path = OUT / "l_vs_c_baseline.png"
    make_plot(pair_results, boxes, png_path)

    for pr in pair_results:
        pr.pop("_overall_verdict", None)

    summary = {
        "criterion": {
            "agri_wetland_boxes": agri_ids,
            "pair_rule": (
                "3 tarım/sulak alan kutusundan en az 2'sinde: "
                "(i) uzun baz medyan farkı (NISAR - S1) >= 0.15 VE "
                "(ii) (S1 kaybı - NISAR kaybı) >= 0.10"
            ),
            "exclusion_rule": (
                "Uzun bazda her iki sensör de < 0.20 ise kutu 'ikisi de kaybetti' sayılır ve ölçüt dışında bırakılır"
            ),
            "overall_rule": "3/3 çift: doğrulandı; 2/3 çift: kısmen; <2 çift: doğrulanmadı",
            "box_size": "15x15 piksel (1.2 km x 1.2 km, NISAR cc==0 pikseller dahil, S1 nodata=0 -> NaN)",
        },
        "verdict": verdict,
        "passed_pairs_count": n_passed,
        "total_pairs": len(pair_results),
        "forest_box_source": str(FOREST_BOX_PATH.relative_to(Path(__file__).resolve().parent.parent.parent)).replace("\\", "/"),
        "jobs_long_source": str(JOBS_LONG_PATH.relative_to(Path(__file__).resolve().parent.parent.parent)).replace("\\", "/"),
        "pairs": pair_results,
    }

    json_path = OUT / "l_vs_c_baseline.json"
    json_path.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"Saved {json_path} and {png_path}")
    print(f"Verdict: {verdict} ({n_passed}/{len(pair_results)} pairs passed)")
    for pr in pair_results:
        print(
            f"\n[{pr['name']}] ({pr['s1_dates']} | S1 {pr['baseline_days_s1']}d, NISAR {pr['baseline_days_nisar']}d) "
            f"passed={pr['agri_boxes_passed']}/{len(pr['evaluated_agri_boxes'])} "
            f"(excluded={pr['excluded_agri_boxes']}) -> {pr['l_band_holds_up_better']}"
        )
        for bid, bs in pr["boxes"].items():
            s12 = f"{bs['s1_12d']:.3f}" if bs["s1_12d"] is not None else "  N/A"
            slg = f"{bs['s1_long']:.3f}" if bs["s1_long"] is not None else "  N/A"
            dl = f"{bs['diff_long']:+.3f}" if bs["diff_long"] is not None else "   N/A"
            ld = f"{bs['s1_loss_minus_nisar_loss']:+.3f}" if bs["s1_loss_minus_nisar_loss"] is not None else "   N/A"
            flag = " [EXCL <0.20]" if bs["excluded_both_lost"] else (" [PASS]" if bs["passes_box_criterion"] else "")
            print(
                f"  {bid:<18}: 12d N={bs['nisar_12d']:.3f} S1={s12} | "
                f"long N={bs['nisar_long']:.3f} (cc0={100*bs['nisar_cc0_frac_long']:4.1f}%) S1={slg} | "
                f"diff={dl} dLoss={ld}{flag}"
            )


if __name__ == "__main__":
    main()
