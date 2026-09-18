"""Geographically realistic demo seed for the map.

Generates ~48 detections anchored to real Indian industrial / agricultural
/ forested regions, spread across multiple zones of India:

  - Gas Flare            -> Gujarat refineries + Mumbai offshore + Assam oilfields
  - Industrial Fire      -> Chhattisgarh-Odisha mining belt + Jharkhand + Maharashtra
  - Wildfire             -> Central India forests + Northeast + Western Ghats + Himalayas
  - Agricultural Burning -> Punjab-Haryana + UP-Bihar + Maharashtra-MP
  - Other/Unknown        -> scattered across multiple regions

Feature values are sampled from the class profiles in
generate_synthetic_data (so each detection is internally consistent); the
final class shown on the map is whatever the trained model predicts.
"""

from __future__ import annotations

from dataclasses import replace

import numpy as np

from .generate_synthetic_data import PROFILES, _sample_profile

_SEED = 26162

ANCHORS: dict[str, list[tuple[float, float]]] = {
    "Gas Flare": [
        (22.75, 69.95), (22.73, 70.02), (22.28, 73.17),
        (18.95, 72.85), (21.10, 72.65),
        (26.20, 69.80),
        (27.18, 94.10), (26.75, 93.15),
    ],
    "Industrial Fire": [
        (22.35, 82.68), (22.30, 82.74), (23.25, 82.30),
        (23.60, 85.95), (23.35, 86.40),
        (19.80, 75.40), (20.10, 75.80),
        (11.10, 78.65),
    ],
    "Wildfire": [
        (22.50, 78.50), (22.80, 79.20), (21.50, 80.80),
        (25.60, 78.50), (25.90, 79.10),
        (27.10, 94.20), (26.50, 93.80), (25.80, 94.50),
        (15.40, 76.50), (14.80, 75.80),
        (30.50, 79.00), (30.20, 79.50),
    ],
    "Agricultural Burning": [
        (31.63, 74.87), (30.90, 75.85), (30.34, 76.38),
        (28.60, 77.80), (28.20, 78.50), (27.90, 79.10),
        (26.10, 81.50), (25.80, 82.00),
        (20.50, 78.20), (21.00, 77.50),
        (23.20, 77.40), (23.80, 76.90),
        (29.20, 75.80), (29.80, 76.50),
    ],
    "Other/Unknown": [
        (28.61, 77.21), (19.08, 72.88), (13.08, 80.27),
        (22.98, 88.43), (26.85, 80.95), (23.03, 72.58),
    ],
}


def _py(v):
    if isinstance(v, np.floating):
        return float(v)
    if isinstance(v, np.integer):
        return int(v)
    return v


def generate_seed() -> list[dict]:
    """Return seeded detections: [{features: {...}, detection_month: int}]"""
    rng = np.random.default_rng(_SEED)
    rows: list[dict] = []
    for cls, anchors in ANCHORS.items():
        profile = replace(PROFILES[cls], n=len(anchors))
        df = _sample_profile(profile, rng)
        for i, (_, r) in enumerate(df.iterrows()):
            lat0, lon0 = anchors[i]
            features = {
                k: _py(v) for k, v in r.items() if k != "class_label"
            }
            features["latitude"] = round(float(lat0 + rng.normal(0, 0.05)), 5)
            features["longitude"] = round(float(lon0 + rng.normal(0, 0.05)), 5)
            rows.append({
                "features": features,
                "detection_month": int(r["detection_month"]),
            })
    return rows
