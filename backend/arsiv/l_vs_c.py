"""Compare NISAR L-band and Sentinel-1 C-band 12-day interferometric coherence over Mexico City.

Reads cached NISAR GUNW sections (out/cache/<track>/*.npz) and Sentinel-1 HyP3
coherence GeoTIFFs (out/c_band/*_corr.tif), reprojects Sentinel-1 onto the
exact NISAR 80 m UTM 14N grid, evaluates five fixed 15x15-pixel (1.2 km) boxes,
and writes:
  - backend/out/l_vs_c_coherence.json
  - backend/out/l_vs_c_coherence.png
"""
import json
import re
import sys
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np
import rasterio
from rasterio.transform import from_origin
from rasterio.warp import Resampling, reproject

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))  # arsiv/ -> backend/ (geo_util)
from geo_util import to_utm  # noqa: E402

OUT = Path(__file__).resolve().parent.parent / "out"
CBAND_DIR = OUT / "c_band"
CACHE_DIR = OUT / "cache"

# Fixed 12-day pair matchings (max 1-day offset)
PAIRS = [
    {
        "name": "desc-dry-0422-0504",
        "track": "113",
        "direction": "descending",
        "season": "dry",
        "s1_dates": "2026-04-22 / 2026-05-04",
        "nisar_dates": "2026-04-23 / 2026-05-05",
        "nisar_npz": "113/20260423_20260505.npz",
        "s1_prefix": "S1DD_20260422T122516_20260504T122517",
    },
    {
        "name": "desc-rain-0609-0621",
        "track": "113",
        "direction": "descending",
        "season": "rain",
        "s1_dates": "2026-06-09 / 2026-06-21",
        "nisar_dates": "2026-06-10 / 2026-06-22",
        "nisar_npz": "113/20260610_20260622.npz",
        "s1_prefix": "S1DD_20260609T122519_20260621T122520",
    },
    {
        "name": "desc-rain-0901-0913",
        "track": "113",
        "direction": "descending",
        "season": "rain",
        "s1_dates": "2026-09-01 / 2026-09-13",
        "nisar_dates": "2026-09-02 / 2026-09-14",
        "nisar_npz": "113/20260902_20260914.npz",
        "s1_prefix": "S1DD_20260901T122512_20260913T122512",
    },
    {
        "name": "asc-dry-0216-0228",
        "track": "19",
        "direction": "ascending",
        "season": "dry",
        "s1_dates": "2026-02-16 / 2026-02-28",
        "nisar_dates": "2026-02-15 / 2026-02-27",
        "nisar_npz": "19/20260215_20260227.npz",
        "s1_prefix": "S1CC_20260216T004722_20260228T004722",
    },
    {
        "name": "asc-rain-0523-0604",
        "track": "19",
        "direction": "ascending",
        "season": "rain",
        "s1_dates": "2026-05-23 / 2026-06-04",
        "nisar_dates": "2026-05-22 / 2026-06-03",
        "nisar_npz": "19/20260522_20260603.npz",
        "s1_prefix": "S1CC_20260523T004725_20260604T004726",
    },
]

# Fixed 15x15 pixel (1.2 km x 1.2 km) regions with ESA WorldCover 2021 v200 check
BOXES = [
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
        "landcover_note": "arazi örtüsü tanıma uymuyor (yaklaşık yarısı yapılaşmış + ağaçlık kentsel chinampa sınırı; kural gereği kutu taşınmadı)",
        "color": "#d95f02",
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
    },
]

AGRI_IDS = [b["id"] for b in BOXES if b["is_agri_wetland"]]
HALF_BOX = 7  # 15x15 pixels -> 1200 m x 1200 m at 80 m spacing


def find_cband_corr(prefix: str) -> Path:
    matches = sorted(CBAND_DIR.glob(f"{prefix}*_corr.tif"))
    if not matches:
        raise FileNotFoundError(f"Missing Sentinel-1 _corr.tif for prefix {prefix} in {CBAND_DIR}")
    return matches[0]


def parse_s1_meta(prefix: str) -> dict:
    txts = sorted(CBAND_DIR.glob(f"{prefix}*.txt"))
    txts = [t for t in txts if not t.name.endswith(".README.md.txt")]
    meta = {}
    if txts:
        for line in txts[0].read_text(encoding="utf-8", errors="ignore").splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                meta[k.strip()] = v.strip()
    return meta


def reproject_s1_to_nisar(tif_path: Path, nx: np.ndarray, ny: np.ndarray) -> np.ndarray:
    dx = float(abs(nx[1] - nx[0]))
    dy = float(abs(ny[1] - ny[0]))
    dst_transform = from_origin(float(nx[0]) - dx / 2.0, float(ny[0]) + dy / 2.0, dx, dy)
    dst = np.full((len(ny), len(nx)), np.nan, dtype=np.float32)
    with rasterio.open(tif_path) as src:
        arr = src.read(1).astype(np.float32)
        reproject(
            source=arr,
            destination=dst,
            src_transform=src.transform,
            src_crs=src.crs,
            src_nodata=src.nodata,
            dst_transform=dst_transform,
            dst_crs="EPSG:32614",
            dst_nodata=np.nan,
            resampling=Resampling.bilinear,
        )
    return dst


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    results = []
    grids = []

    for pair in PAIRS:
        npz_path = CACHE_DIR / pair["nisar_npz"]
        d = np.load(npz_path)
        nx, ny, ncoh, ncc = d["x"], d["y"], d["coh"].astype(np.float32), d["cc"]
        tif_path = find_cband_corr(pair["s1_prefix"])
        s1_meta = parse_s1_meta(pair["s1_prefix"])
        scoh = reproject_s1_to_nisar(tif_path, nx, ny)
        diff = ncoh - scoh

        box_stats = {}
        box_rects = []
        for b in BOXES:
            ux, uy = to_utm(b["lat"], b["lon"])
            ix = int(np.argmin(np.abs(nx - ux)))
            iy = int(np.argmin(np.abs(ny - uy)))
            sl_y = slice(iy - HALF_BOX, iy + HALF_BOX + 1)
            sl_x = slice(ix - HALF_BOX, ix + HALF_BOX + 1)
            sub_n = ncoh[sl_y, sl_x]
            sub_cc = ncc[sl_y, sl_x]
            sub_s = scoh[sl_y, sl_x]
            # Rule 4: include ALL pixels in the 15x15 box (do NOT drop cc == 0)
            n_med = float(np.nanmedian(sub_n)) if np.isfinite(sub_n).any() else None
            s_med = float(np.nanmedian(sub_s)) if np.isfinite(sub_s).any() else None
            diff_med = round(n_med - s_med, 4) if (n_med is not None and s_med is not None) else None
            cc0_frac = float((sub_cc == 0).mean())
            box_stats[b["id"]] = {
                "label": b["label"],
                "lat": b["lat"],
                "lon": b["lon"],
                "nisar_median": round(n_med, 4) if n_med is not None else None,
                "s1_median": round(s_med, 4) if s_med is not None else None,
                "diff_nisar_minus_s1": diff_med,
                "nisar_cc0_frac": round(cc0_frac, 4),
                "n_pixels": int(sub_n.size),
                "landcover_ok": b["landcover_ok"],
                "worldcover_2021": b["worldcover_2021"],
                "landcover_note": b["landcover_note"],
            }
            box_rects.append((b, ix, iy))

        # Rule 5: L-band superior if >= 2 of the 3 agri/wetland boxes have diff >= 0.15
        agri_diffs = [box_stats[bid]["diff_nisar_minus_s1"] for bid in AGRI_IDS if box_stats[bid]["diff_nisar_minus_s1"] is not None]
        agri_pass_count = sum(1 for v in agri_diffs if v >= 0.15)
        l_superior = agri_pass_count >= 2

        # Rule 6: Zocalo sanity check (both >= 0.5)
        z_n = box_stats["zocalo"]["nisar_median"]
        z_s = box_stats["zocalo"]["s1_median"]
        zocalo_ok = (z_n is not None and z_s is not None and z_n >= 0.5 and z_s >= 0.5)

        results.append({
            "name": pair["name"],
            "track": pair["track"],
            "direction": pair["direction"],
            "season": pair["season"],
            "s1_dates": pair["s1_dates"],
            "nisar_dates": pair["nisar_dates"],
            "s1_file": tif_path.name,
            "nisar_file": pair["nisar_npz"],
            "s1_looks": f"{s1_meta.get('Range looks', '20')}x{s1_meta.get('Azimuth looks', '4')}",
            "s1_adf_alpha": s1_meta.get("Phase filter parameter", "0.6"),
            "zocalo_sanity_ok": zocalo_ok,
            "agri_boxes_ge_015": agri_pass_count,
            "l_band_superior": l_superior,
            "mean_agri_diff": round(float(np.mean(agri_diffs)), 4),
            "median_agri_diff": round(float(np.median(agri_diffs)), 4),
            "boxes": box_stats,
        })
        grids.append((pair, ncoh, scoh, diff, box_rects))

    n_superior = sum(1 for r in results if r["l_band_superior"])
    if n_superior >= 4:
        verdict = "doğrulandı"
    elif n_superior >= 2:
        verdict = "kısmen"
    else:
        verdict = "doğrulanmadı"

    # Rule 7: select featured pair by median agri/wetland difference across the 5 pairs
    sorted_by_med = sorted(results, key=lambda r: r["median_agri_diff"])
    featured = sorted_by_med[len(sorted_by_med) // 2]

    summary = {
        "comparability": {
            "nisar_gunw": {
                "product": "NISAR L2 GUNW Provisional (HH, frequencyA unwrappedInterferogram)",
                "pixel_spacing_m": 80,
                "crs": "EPSG:32614",
                "looks_range_x_azimuth": "13x16 (208 looks)",
                "source": "HDF5 metadata: numberOfRangeLooks=13, numberOfAzimuthLooks=16, xCoordinateSpacing=80.0",
            },
            "sentinel1_hyp3": {
                "product": "Sentinel-1 IW InSAR On-Demand (ASF HyP3 / GAMMA)",
                "pixel_spacing_m": 80,
                "crs": "EPSG:32614",
                "looks_range_x_azimuth": "20x4 (80 looks)",
                "phase_filter": "GAMMA adf (alpha=0.6)",
            },
        },
        "criterion": {
            "pair_rule": "3 tarım/sulak alan kutusunun en az 2'sinde medyan fark (NISAR - S1) >= 0.15",
            "overall_rule": ">=4 çift: doğrulandı; 2-3 çift: kısmen; <2 çift: doğrulanmadı",
            "box_size": "15x15 piksel (1.2 km x 1.2 km), cc==0 pikseller dahil",
        },
        "verdict": verdict,
        "superior_pairs_count": n_superior,
        "total_pairs": len(results),
        "featured_pair_rule": "5 çift içinde tarım/sulak alan medyan farkı ortanca olan çift",
        "featured_pair": featured["name"],
        "pairs": results,
    }

    json_path = OUT / "l_vs_c_coherence.json"
    json_path.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")

    # Plot 5x3 grid
    fig, axes = plt.subplots(len(grids), 3, figsize=(13.5, 19.5), constrained_layout=True)
    for row_idx, (pair, ncoh, scoh, diff, box_rects) in enumerate(grids):
        r_info = results[row_idx]
        titles = [
            f"{pair['name']} — NISAR L-band\n({pair['nisar_dates']})",
            f"Sentinel-1 C-band (HyP3 20x4)\n({pair['s1_dates']})",
            f"Fark (NISAR − Sentinel-1)\nOrtanca tarım/sulak farkı: {r_info['median_agri_diff']:+.3f}",
        ]
        imgs = [ncoh, scoh, diff]
        cmaps = ["viridis", "viridis", "RdBu"]
        vmins = [0.0, 0.0, -0.6]
        vmaxs = [1.0, 1.0, 0.6]

        for col_idx in range(3):
            ax = axes[row_idx, col_idx]
            im = ax.imshow(imgs[col_idx], cmap=cmaps[col_idx], vmin=vmins[col_idx], vmax=vmaxs[col_idx])
            ax.set_title(titles[col_idx], fontsize=9.5)
            ax.set_xticks([])
            ax.set_yticks([])
            for b, ix, iy in box_rects:
                rect = patches.Rectangle(
                    (ix - HALF_BOX - 0.5, iy - HALF_BOX - 0.5),
                    2 * HALF_BOX + 1,
                    2 * HALF_BOX + 1,
                    linewidth=1.3,
                    edgecolor=b["color"],
                    facecolor="none",
                )
                ax.add_patch(rect)
                if col_idx == 0:
                    ax.text(
                        ix + HALF_BOX + 4,
                        iy + 3,
                        b["short"],
                        color="white",
                        fontsize=7.5,
                        fontweight="bold",
                        bbox=dict(boxstyle="round,pad=0.15", fc=b["color"], ec="none", alpha=0.85),
                    )
            cbar = fig.colorbar(im, ax=ax, fraction=0.042, pad=0.02)
            cbar.ax.tick_params(labelsize=8)

    fig.suptitle(
        f"NISAR L-band vs Sentinel-1 C-band 12 Günlük Tutarlılık (80 m UTM 14N)\n"
        f"Sonuç: {verdict.upper()} ({n_superior}/5 çift ölçütü sağladı) | "
        f"Kutular: ZOC=Zócalo, CHA=Chalco, XOC=Xochimilco, TLA=Xoch.-Tláhuac, STF=Santa Fe",
        fontsize=11.5,
        fontweight="bold",
    )
    png_path = OUT / "l_vs_c_coherence.png"
    fig.savefig(png_path, dpi=150, bbox_inches="tight")
    plt.close(fig)

    print(f"Saved {json_path} and {png_path}")
    print(f"Verdict: {verdict} ({n_superior}/5 pairs superior), featured (median): {featured['name']}")
    for r in results:
        print(f"\n[{r['name']}] zocalo_ok={r['zocalo_sanity_ok']} agri>=0.15: {r['agri_boxes_ge_015']}/3 superior={r['l_band_superior']} med_agri_diff={r['median_agri_diff']:+.3f}")
        for bid, bs in r["boxes"].items():
            s_str = f"{bs['s1_median']:.3f}" if bs["s1_median"] is not None else "  N/A"
            d_str = f"{bs['diff_nisar_minus_s1']:+.3f}" if bs["diff_nisar_minus_s1"] is not None else "   N/A"
            print(f"  {bid:<18}: NISAR={bs['nisar_median']:.3f} (cc0={100*bs['nisar_cc0_frac']:4.1f}%), S1={s_str}, diff={d_str}")


if __name__ == "__main__":
    main()
