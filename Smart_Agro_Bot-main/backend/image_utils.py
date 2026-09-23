from __future__ import annotations

from typing import Optional

import cv2
import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = 20_000_000

MIN_DIMENSION = 200
BLUR_THRESHOLD = 80.0
DARKNESS_THRESHOLD = 40.0
BRIGHTNESS_THRESHOLD = 235.0
ANALYSIS_SIZE = (600, 600)


def _to_gray_array(image: Image.Image) -> np.ndarray:
    small = image.copy()
    small.thumbnail(ANALYSIS_SIZE)
    return cv2.cvtColor(np.array(small.convert("RGB")), cv2.COLOR_RGB2GRAY)


def is_blurry(gray, threshold=BLUR_THRESHOLD) -> bool:
    return cv2.Laplacian(gray, cv2.CV_64F).var() < threshold


def check_image_quality(image: Image.Image) -> Optional[str]:
    try:
        width, height = image.size
        if width < MIN_DIMENSION or height < MIN_DIMENSION:
            return (
                f"⚠️ Image is too small ({width}×{height} px). "
                f"Please provide a clear image at least "
                f"{MIN_DIMENSION}×{MIN_DIMENSION} px."
            )
        gray = _to_gray_array(image)
        if float(gray.mean()) < DARKNESS_THRESHOLD:
            return "🌑 The image is too dark. Please take a new photo in better lighting."
        if float(gray.mean()) > BRIGHTNESS_THRESHOLD:
            return "☀️ The image has too much light or glare. Please take the photo in a shaded area."
        if is_blurry(gray):
            return "📷 The image is blurry. Hold the camera steady and take a clear, close-up photo."
        return None
    except Exception:
        return None