"""Zemin eğimi (diferansiyel çökme) hesaplama, jeoteknik doğrulama ve web çıktısı üretici.

Ön-kayıt ölçütleri: docs/tilt-olcut.md
Girdi:  export_web.compute(backend_out) -> R["vU"] (cm/yıl, UTM 14N, 80 m)
Çıktı:  --out/cdmx/tilt.png, --out/cdmx/tilt.json, --backend-out/tilt_check.png
"""
import argparse
import json
import sys
from pathlib import Path

import geopandas as gpd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from rasterio.features import rasterize
from rasterio.transform import from_origin
from scipy.ndimage import gaussian_filter

HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

from export_web import BOX, TRACKS, Sampler, compute, latlon_to_utm, write_png


DEFAULT_THRESHOLDS = {
    "low": 1.0 / 5000.0,   # 0.0002 m/m/yr (0.2 permil/yr)
    "mid": 1.0 / 2000.0,   # 0.0005 m/m/yr (0.5 permil/yr)
    "high": 1.0 / 1000.0,  # 0.0010 m/m/yr (1.0 permil/yr)
}


def nan_gaussian(arr: np.ndarray, sigma: float) -> np.ndarray:
    """NaN-duyarlı normalize edilmiş Gauss konvolüsyonu (maskeli pikseller NaN kalır)."""
    arr = np.asarray(arr, dtype=np.float64)
    if sigma <= 0:
        return arr.copy()
    valid = np.isfinite(arr)
    num = gaussian_filter(np.where(valid, arr, 0.0), sigma=sigma, mode="nearest")
    den = gaussian_filter(valid.astype(np.float64), sigma=sigma, mode="nearest")
    out = np.full_like(arr, np.nan)
    ok = valid & (den > 1e-12)
    out[ok] = num[ok] / den[ok]
    return out


def compute_beta(v_cm_yr: np.ndarray, dx: float = 80.0, dy: float = -80.0) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Merkezi fark gradyanı ile eğim büyüklüğü beta = sqrt(gx^2 + gy^2) / 100 (m/m/yr).
    Herhangi bir eksenel komşusu NaN olan veya kenar pikseller NaN bırakılır.
    """
    v = np.asarray(v_cm_yr, dtype=np.float64)
    gy, gx = np.gradient(v, dy, dx)
    ok = np.isfinite(v) & np.isfinite(gx) & np.isfinite(gy)
    ok[0, :] = False
    ok[-1, :] = False
    ok[:, 0] = False
    ok[:, -1] = False
    ok[1:-1, 1:-1] &= (
        np.isfinite(v[:-2, 1:-1])
        & np.isfinite(v[2:, 1:-1])
        & np.isfinite(v[1:-1, :-2])
        & np.isfinite(v[1:-1, 2:])
    )
    beta = np.full_like(v, np.nan)
    beta[ok] = np.hypot(gx[ok], gy[ok]) / 100.0
    return beta, gx, gy


def point_median_7x7(arr: np.ndarray, bx: np.ndarray, by: np.ndarray, lat: float, lon: float) -> float | None:
    """export_web.py ile aynı 7x7 piksel (560 m) medyanı."""
    ux, uy = latlon_to_utm(lat, lon)
    jx = int(np.abs(bx - ux).argmin())
    jy = int(np.abs(by - uy).argmin())
    win = (slice(max(0, jy - 3), jy + 4), slice(max(0, jx - 3), jx + 4))
    sub = arr[win]
    if not np.isfinite(sub).any():
        return None
    return float(np.nanmedian(sub))


def format_inv(beta: float | None) -> str | None:
    if beta is None or not np.isfinite(beta) or beta <= 0:
        return None
    return f"1/{int(round(1.0 / beta))} yr^-1"


def color_tilt(beta_grid: np.ndarray, t_low: float, t_mid: float, t_high: float):
    """beta_grid -> (idx, palette, alpha). < t_low veya NaN -> indeks 0 (tam saydam).
    t_low -> sarı, t_mid -> turuncu, >= t_high -> kırmızı.
    """
    u_vals = np.linspace(0.0, 1.0, 255)
    u_mid = np.clip((t_mid - t_low) / max(t_high - t_low, 1e-12), 0.05, 0.95)
    stops_u = np.array([0.0, u_mid, 1.0])
    stops_rgb = np.array([
        [255, 230, 50],   # sarı (t_low)
        [253, 141, 30],   # turuncu (t_mid)
        [215, 25, 28],    # kırmızı (>= t_high)
    ], dtype=np.float64)
    ramp_rgb = np.stack([np.interp(u_vals, stops_u, stops_rgb[:, k]) for k in range(3)], axis=-1).round().astype(np.uint8)
    pal = np.vstack([np.array([[0, 0, 0]], dtype=np.uint8), ramp_rgb])
    alpha = np.concatenate([np.array([0], dtype=np.uint8), np.full(255, 255, dtype=np.uint8)])

    ok = np.isfinite(beta_grid) & (beta_grid >= t_low)
    u = np.clip((np.nan_to_num(beta_grid, nan=0.0) - t_low) / max(t_high - t_low, 1e-12), 0.0, 1.0)
    idx = np.where(ok, 1 + np.round(u * 254).astype(np.int32), 0).astype(np.uint8)
    return idx, pal, alpha


def track_jaccard(A: dict, dx: float, dy: float, sigma: float = 1.0, top_pct: float = 1.0) -> dict:
    b113, _, _ = compute_beta(nan_gaussian(A[113]["rate"], sigma), dx, dy)
    b19, _, _ = compute_beta(nan_gaussian(A[19]["rate"], sigma), dx, dy)
    both = np.isfinite(b113) & np.isfinite(b19)
    v113 = b113[both]
    v19 = b19[both]
    q = 100.0 - top_pct
    thr113 = float(np.percentile(v113, q))
    thr19 = float(np.percentile(v19, q))
    m113 = v113 >= thr113
    m19 = v19 >= thr19
    inter = int((m113 & m19).sum())
    union = int((m113 | m19).sum())
    return {
        "top_pct": top_pct,
        "valid_both_pixels": int(both.sum()),
        "threshold_113": thr113,
        "threshold_19": thr19,
        "intersection": inter,
        "union": union,
        "jaccard": float(inter / union) if union > 0 else 0.0,
    }


def sigma_sensitivity(vU: np.ndarray, bx: np.ndarray, by: np.ndarray, dx: float, dy: float,
                      santafe_lat: float, santafe_lon: float, t_low: float, t_mid: float, t_high: float) -> list[dict]:
    rows = []
    for s in (0, 1, 2):
        b, _, _ = compute_beta(nan_gaussian(vU, float(s)), dx, dy)
        vals = b[np.isfinite(b)]
        sf = point_median_7x7(b, bx, by, santafe_lat, santafe_lon)
        rows.append({
            "sigma_px": s,
            "sigma_m": s * abs(dx),
            "valid_pixels": int(vals.size),
            "median": float(np.median(vals)),
            "p95": float(np.percentile(vals, 95)),
            "p99": float(np.percentile(vals, 99)),
            "max": float(np.max(vals)),
            "frac_ge_low": float((vals >= t_low).mean()),
            "frac_ge_mid": float((vals >= t_mid).mean()),
            "frac_ge_high": float((vals >= t_high).mean()),
            "santafe_median": sf,
        })
    return rows


def plot_diagnostic(out_png: Path, vU: np.ndarray, beta: np.ndarray,
                    t_low: float, t_mid: float, t_high: float, noise_floor: float):
    fig, axes = plt.subplots(2, 2, figsize=(12, 10), dpi=150)

    ax = axes[0, 0]
    im0 = ax.imshow(vU, cmap="RdYlBu", vmin=-40, vmax=8)
    ax.set_title("Dikey hız vU (cm/yıl)")
    plt.colorbar(im0, ax=ax, fraction=0.046, pad=0.04)

    ax = axes[0, 1]
    beta_pm = beta * 1000.0
    im1 = ax.imshow(beta_pm, cmap="YlOrRd", vmin=0, vmax=max(1.5, t_high * 1000.0 * 1.2))
    ax.set_title("Eğim büyüklüğü β (‰/yıl, σ=1 px)")
    plt.colorbar(im1, ax=ax, fraction=0.046, pad=0.04)

    ax = axes[1, 0]
    mask = np.isfinite(beta).astype(float)
    ax.imshow(mask, cmap="gray", vmin=0, vmax=1)
    ax.set_title(f"Geçerli gradyan maskesi ({int(mask.sum())} piksel)")

    ax = axes[1, 1]
    vals = beta_pm[np.isfinite(beta_pm)]
    vals_clip = vals[vals <= np.percentile(vals, 99.5)]
    ax.hist(vals_clip, bins=80, color="#fd8d3c", alpha=0.85, edgecolor="none")
    ax.axvline(t_low * 1000, color="#d4b800", ls="--", lw=1.5, label=f"Alt ({t_low*1000:.2f} ‰)")
    ax.axvline(t_mid * 1000, color="#fd8d3c", ls="--", lw=1.5, label=f"Orta ({t_mid*1000:.2f} ‰)")
    ax.axvline(t_high * 1000, color="#d7191c", ls="--", lw=1.5, label=f"Üst ({t_high*1000:.2f} ‰)")
    ax.axvline(noise_floor * 1000, color="#2b83ba", ls=":", lw=1.5, label=f"Santa Fe ({noise_floor*1000:.3f} ‰)")
    ax.set_xlabel("β (‰/yıl)")
    ax.set_ylabel("Piksel sayısı")
    ax.set_title("β Dağılımı (p99.5 kırpılmış)")
    ax.legend(fontsize=8)

    for a in axes.flat[:3]:
        a.set_xticks([])
        a.set_yticks([])

    fig.tight_layout()
    fig.savefig(out_png)
    plt.close(fig)


def evaluate_zoning(zonas_path: Path, beta: np.ndarray, bx: np.ndarray, by: np.ndarray, dx: float, dy: float) -> dict:
    """CDMX NTC 2017 jeoteknik bölgeleme katmanına göre ön-kayıtlı doğrulama ölçütünü hesaplar."""
    gdf = gpd.read_file(zonas_path).to_crs("EPSG:32614")
    zone_map = {
        "Zona firme de lomas": 1,
        "Zona de transición": 2,
        "Zona de lago": 3,
    }
    shapes = [
        (geom, zone_map[name])
        for geom, name in zip(gdf.geometry, gdf["nombre"])
        if geom is not None and not geom.is_empty and name in zone_map
    ]
    transform = from_origin(float(bx[0]) - abs(dx) / 2.0, float(by[0]) + abs(dy) / 2.0, abs(dx), abs(dy))
    zgrid = rasterize(shapes, out_shape=beta.shape, transform=transform, fill=0, dtype="uint8")

    stats = {}
    for code, label, key in (
        (1, "Zona I (Lomas)", "zona_i"),
        (2, "Zona II (Transición)", "zona_ii"),
        (3, "Zona III (Lacustre)", "zona_iii"),
    ):
        mask = (zgrid == code) & np.isfinite(beta)
        vals = beta[mask]
        stats[key] = {
            "label": label,
            "pixel_count": int(vals.size),
            "median": float(np.median(vals)),
            "median_permil_yr": float(np.median(vals) * 1000.0),
            "median_inv": format_inv(float(np.median(vals))),
            "p75": float(np.percentile(vals, 75)),
            "p95": float(np.percentile(vals, 95)),
            "frac_ge_1_5000": float((vals >= DEFAULT_THRESHOLDS["low"]).mean()),
            "frac_ge_1_2000": float((vals >= DEFAULT_THRESHOLDS["mid"]).mean()),
            "frac_ge_1_1000": float((vals >= DEFAULT_THRESHOLDS["high"]).mean()),
        }

    m1 = stats["zona_i"]["median"]
    m2 = stats["zona_ii"]["median"]
    m3 = stats["zona_iii"]["median"]
    r_ii_iii = m2 / m3
    r_ii_i = m2 / m1
    c1 = r_ii_iii >= 1.5
    c2 = r_ii_i >= 1.5
    if c1 and c2:
        verdict = "doğrulandı"
    elif c1 or c2:
        verdict = "kısmen"
    else:
        verdict = "doğrulanmadı"

    return {
        "source": str(zonas_path.name),
        "evidence_quality": "resmi_ntc_2017",
        "zones": stats,
        "ratios": {
            "zona_ii_over_zona_iii": float(r_ii_iii),
            "zona_ii_over_zona_i": float(r_ii_i),
        },
        "conditions": {
            "ii_ge_1_5_iii": bool(c1),
            "ii_ge_1_5_i": bool(c2),
        },
        "verdict": verdict,
    }


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    ap = argparse.ArgumentParser()
    ap.add_argument("--backend-out", default=str(HERE / "out"))
    ap.add_argument("--out", default=str(HERE.parent / "web" / "public" / "data"))
    ap.add_argument("--points", default=str(HERE / "points_cdmx.json"))
    ap.add_argument("--step", type=float, default=0.00075)
    ap.add_argument("--sigma", type=float, default=1.0)
    args = ap.parse_args()

    bo = Path(args.backend_out)
    outdir = Path(args.out)

    R = compute(bo)
    bx, by = R["bx"], R["by"]
    dx = float(bx[1] - bx[0])
    dy = float(by[1] - by[0])
    vU = R["vU"]

    vU_smooth = nan_gaussian(vU, args.sigma)
    beta, _, _ = compute_beta(vU_smooth, dx, dy)

    pts = json.loads(Path(args.points).read_text(encoding="utf-8"))["points"]
    sf_pt = next(p for p in pts if p["id"] == "santafe")
    noise_floor = point_median_7x7(beta, bx, by, sf_pt["lat"], sf_pt["lon"])
    if noise_floor is None:
        raise RuntimeError("Santa Fe referans noktasında geçerli eğim pikseli yok")

    t_low = DEFAULT_THRESHOLDS["low"]
    t_mid = DEFAULT_THRESHOLDS["mid"]
    t_high = DEFAULT_THRESHOLDS["high"]
    noise_floor_raised = False
    if noise_floor > t_low:
        t_low = noise_floor
        noise_floor_raised = True

    nlat = int(round((BOX["north"] - BOX["south"]) / args.step))
    nlon = int(round((BOX["east"] - BOX["west"]) / args.step))
    lat = BOX["north"] - (np.arange(nlat) + 0.5) * (BOX["north"] - BOX["south"]) / nlat
    lon = BOX["west"] + (np.arange(nlon) + 0.5) * (BOX["east"] - BOX["west"]) / nlon
    samp = Sampler(bx, by, lat, lon)
    beta_grid = samp(beta).astype("float32")

    cdmx_dir = outdir / "cdmx"
    cdmx_dir.mkdir(parents=True, exist_ok=True)
    write_png(cdmx_dir / "tilt.png", *color_tilt(beta_grid, t_low, t_mid, t_high))

    point_vals = []
    for p in pts:
        b_pt = point_median_7x7(beta, bx, by, p["lat"], p["lon"])
        point_vals.append({
            "id": p["id"],
            "name": p["name"],
            "beta": None if b_pt is None else round(b_pt, 7),
            "beta_permil_yr": None if b_pt is None else round(b_pt * 1000.0, 4),
            "beta_inv": format_inv(b_pt),
        })

    sens = sigma_sensitivity(vU, bx, by, dx, dy, sf_pt["lat"], sf_pt["lon"], t_low, t_mid, t_high)
    jacc = track_jaccard(R["A"], dx, dy, sigma=args.sigma, top_pct=1.0)
    zonas_file = bo / "zonas" / "zonificacion_geotecnica.geojson"
    if not zonas_file.exists():
        raise FileNotFoundError(f"Jeoteknik bölgeleme dosyası bulunamadı: {zonas_file}")
    zoning = evaluate_zoning(zonas_file, beta, bx, by, dx, dy)

    plot_diagnostic(bo / "tilt_check.png", vU, beta, t_low, t_mid, t_high, noise_floor)

    meta = {
        "sigma_px": args.sigma,
        "dx_m": dx,
        "dy_m": dy,
        "grid_shape": [nlat, nlon],
        "thresholds": {
            "low": t_low,
            "mid": t_mid,
            "high": t_high,
            "low_inv": format_inv(t_low),
            "mid_inv": format_inv(t_mid),
            "high_inv": format_inv(t_high),
        },
        "noise_floor": {
            "point_id": "santafe",
            "beta": noise_floor,
            "beta_permil_yr": noise_floor * 1000.0,
            "beta_inv": format_inv(noise_floor),
            "raised_lower_threshold": noise_floor_raised,
        },
        "sensitivity": sens,
        "track_jaccard": jacc,
        "points": point_vals,
        "zoning": zoning,
    }
    (cdmx_dir / "tilt.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"tilt ok: grid={nlat}x{nlon}, noise_floor={noise_floor:.6f} ({format_inv(noise_floor)}), raised={noise_floor_raised}")
    print(f"Track 113 vs 19 top-1% Jaccard={jacc['jaccard']:.4f}")
    print(f"Zoning verdict={zoning['verdict']} (II/III={zoning['ratios']['zona_ii_over_zona_iii']:.3f}, II/I={zoning['ratios']['zona_ii_over_zona_i']:.3f})")


if __name__ == "__main__":
    main()
