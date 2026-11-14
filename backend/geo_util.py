"""Small helpers: UTM14N <-> lat/lon without pyproj (uses probe_gunw.latlon_to_utm)."""
import numpy as np
from probe_gunw import latlon_to_utm

def to_utm(lat, lon):
    return latlon_to_utm(lat, lon, 14)

def to_latlon(x, y, it=6):
    lat, lon = 19.3, -99.1
    for _ in range(it):
        x0, y0 = latlon_to_utm(lat, lon, 14)
        xa, ya = latlon_to_utm(lat + 1e-4, lon, 14)
        xb, yb = latlon_to_utm(lat, lon + 1e-4, 14)
        J = np.array([[xb - x0, xa - x0], [yb - y0, ya - y0]]) / 1e-4
        d = np.linalg.solve(J, [x - x0, y - y0])
        lon += d[0]; lat += d[1]
    return lat, lon
