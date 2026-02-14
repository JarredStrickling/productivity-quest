#!/usr/bin/env python3
"""
Extract just the Scrolls of Doom title from scrollsofdoomtitle.png
and convert background to transparent.
"""

try:
    from PIL import Image
    import os
except ImportError:
    print("ERROR: PIL (Pillow) not installed. Install with: pip install Pillow")
    import sys
    sys.exit(1)

def extract_and_make_transparent(input_path, output_path, threshold=35):
    """
    Crop the scrolls of doom logo and make background transparent.

    Args:
        input_path: Path to input PNG file
        output_path: Path to output PNG file
        threshold: Color threshold for transparency (0-255)
    """
    print(f"Processing: {input_path}")

    # Open image
    img = Image.open(input_path)
    img = img.convert("RGBA")

    width, height = img.size
    print(f"Original size: {width}x{height}")

    # The title appears to be in the bottom portion
    # Crop to get just the Scrolls of Doom title (bottom ~60%)
    crop_top = int(height * 0.45)  # Start at 45% down the image
    cropped = img.crop((0, crop_top, width, height))

    print(f"Cropped size: {cropped.size[0]}x{cropped.size[1]}")

    # Get pixel data
    pixels = cropped.load()
    crop_width, crop_height = cropped.size

    # Process each pixel to make checkerboard transparent
    for y in range(crop_height):
        for x in range(crop_width):
            r, g, b, a = pixels[x, y]

            # If pixel is white or very light gray (checkerboard pattern)
            is_white = r > (255 - threshold) and g > (255 - threshold) and b > (255 - threshold)
            is_light_gray = abs(r - 192) < threshold and abs(g - 192) < threshold and abs(b - 192) < threshold

            if is_white or is_light_gray:
                pixels[x, y] = (r, g, b, 0)  # Set alpha to 0 (transparent)

    # Save with transparency
    cropped.save(output_path, "PNG")
    print(f"Saved: {output_path}")

def main():
    sprite_dir = "public/assets/sprites"
    input_file = "scrollsofdoomtitle.png"
    output_file = "scrolls-of-doom-logo.png"

    input_path = os.path.join(sprite_dir, input_file)
    output_path = os.path.join(sprite_dir, output_file)

    if not os.path.exists(input_path):
        print(f"ERROR: File not found: {input_path}")
        return

    # Backup original
    backup_path = input_path + ".backup"
    if not os.path.exists(backup_path):
        import shutil
        shutil.copy2(input_path, backup_path)
        print(f"Backed up original to {backup_path}")

    print("=" * 60)
    print("Extracting Scrolls of Doom title logo...")
    print("=" * 60)

    extract_and_make_transparent(input_path, output_path, threshold=35)

    print("=" * 60)
    print(f"Done! New file created: {output_file}")
    print("=" * 60)

if __name__ == "__main__":
    main()
