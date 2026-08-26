import os
import io
import logging
from PIL import Image, ImageOps, ImageChops

logger = logging.getLogger("thumbnail_processor")

def remove_black_borders(img: Image.Image, threshold: int = 15) -> Image.Image:
    """
    Detects and crops out pure black or near-black borders (letterbox/pillarbox)
    baked into an image.
    """
    try:
        # Create pure black reference image
        bg = Image.new('RGB', img.size, (0, 0, 0))
        diff = ImageChops.difference(img, bg)
        # Apply threshold to ignore compression artifacts in black areas
        diff = ImageChops.add(diff, diff, 2.0, -threshold)
        bbox = diff.getbbox()
        if bbox:
            width, height = img.size
            left, top, right, bottom = bbox
            # Only crop if there are noticeable borders (at least 1% of width or height)
            if (left > width * 0.01 or top > height * 0.01 or 
                right < width * 0.99 or bottom < height * 0.99):
                logger.info(f"Trimming black bars: original={img.size}, cropped bbox={bbox}")
                return img.crop(bbox)
    except Exception as e:
        logger.warning(f"Error while trimming borders: {e}")
    return img

def fit_thumbnail_to_16_9(image_input, output_path: str = None, target_width: int = 1280, target_height: int = 720) -> str | bytes:
    """
    Processes an image (bytes or file path) to ensure:
    1. RGB format
    2. Baked-in black bars are automatically stripped
    3. Image is cleanly fitted to 16:9 (1280x720) with high quality Lanczos resampling
    4. Saved as optimized JPEG or returned as bytes
    """
    if isinstance(image_input, (bytes, bytearray)):
        img = Image.open(io.BytesIO(image_input))
    elif isinstance(image_input, str) and os.path.exists(image_input):
        img = Image.open(image_input)
    elif hasattr(image_input, 'read'):
        img = Image.open(image_input)
    else:
        raise ValueError("Invalid image input provided")

    # 1. Convert to RGB properly (handling transparency if PNG/WEBP)
    if img.mode in ('RGBA', 'LA', 'P'):
        background = Image.new('RGB', img.size, (0, 0, 0))
        if img.mode == 'P':
            img = img.convert('RGBA')
        if 'A' in img.mode:
            background.paste(img, mask=img.split()[-1])
            img = background
        else:
            img = img.convert('RGB')
    elif img.mode != 'RGB':
        img = img.convert('RGB')

    # 2. Strip baked-in black bars
    img = remove_black_borders(img)

    # 3. Fit to exact 16:9 aspect ratio using center crop and high quality Lanczos filter
    fitted_img = ImageOps.fit(
        img,
        (target_width, target_height),
        method=Image.Resampling.LANCZOS,
        centering=(0.5, 0.5)
    )

    if output_path:
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        fitted_img.save(output_path, format="JPEG", quality=95, optimize=True)
        return output_path
    else:
        out_io = io.BytesIO()
        fitted_img.save(out_io, format="JPEG", quality=95, optimize=True)
        return out_io.getvalue()
