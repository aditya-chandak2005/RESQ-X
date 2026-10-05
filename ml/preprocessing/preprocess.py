import numpy as np

def lee_speckle_filter(img: np.ndarray, window_size: int = 5, damping_factor: float = 1.0) -> np.ndarray:
    """Enhanced Lee speckle filter for SAR imagery (Sentinel-1 VV/VH)."""
    # Simple, fast spatial smoothing approximation for demonstration
    from scipy.ndimage import uniform_filter
    mean = uniform_filter(img, size=window_size)
    mean_sqr = uniform_filter(img ** 2, size=window_size)
    variance = np.maximum(0, mean_sqr - mean ** 2)
    overall_variance = np.var(img)
    weights = variance / (variance + overall_variance + 1e-6)
    filtered = mean + weights * (img - mean)
    return filtered

def normalize_sar_db(vv_db: np.ndarray, vh_db: np.ndarray) -> np.ndarray:
    """Normalize SAR backscatter values in dB (typical range -30dB to 0dB) to [0, 1]."""
    vv_norm = np.clip((vv_db + 30.0) / 30.0, 0.0, 1.0)
    vh_norm = np.clip((vh_db + 35.0) / 35.0, 0.0, 1.0)
    return np.stack([vv_norm, vh_norm], axis=0)

def detect_water_threshold(vv_norm: np.ndarray, vh_norm: np.ndarray, threshold: float = 0.35) -> np.ndarray:
    """Specular reflection heuristic: smooth open floodwater reflects radar pulses away from sensor, appearing dark."""
    flood_mask = (vv_norm < threshold) & (vh_norm < threshold)
    return flood_mask.astype(np.uint8)
