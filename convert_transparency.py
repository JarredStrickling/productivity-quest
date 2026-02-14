#!/usr/bin/env python3
"""
Convert sprites with fake transparency (baked checkerboard) to real RGBA transparency.
This removes white and light gray pixels that make up the typical checkerboard pattern.
"""

try:
    from PIL import Image
    import os
    import sys
except ImportError:
    print("ERROR: PIL (Pillow) not installed. Install with: pip install Pillow")
    sys.exit(1)

def make_transparent(input_path, output_path, threshold=50):
    """
    Convert fake transparency to real alpha channel.

    Args:
        input_path: Path to input PNG file
        output_path: Path to output PNG file
        threshold: Color threshold for transparency (0-255)
    """
    print(f"Processing: {input_path}")

    # Open image and convert to RGBA
    img = Image.open(input_path)
    img = img.convert("RGBA")

    # Get pixel data
    pixels = img.load()
    width, height = img.size

    # Process each pixel
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]

            # If pixel is white or very light gray (checkerboard pattern)
            # Make it transparent
            # Also handle light gray checkerboard (192, 192, 192)
            is_white = r > (255 - threshold) and g > (255 - threshold) and b > (255 - threshold)
            is_light_gray = abs(r - 192) < threshold and abs(g - 192) < threshold and abs(b - 192) < threshold

            if is_white or is_light_gray:
                pixels[x, y] = (r, g, b, 0)  # Set alpha to 0 (transparent)

    # Save with transparency
    img.save(output_path, "PNG")
    print(f"Saved: {output_path}")

def main():
    sprite_dir = "public/assets/sprites"

    # Files to convert
    files_to_convert = [
        "map1.png",
        "archer.png",
        "paladin.png",
        "warrior.png",
        "mage.png",
        "cleric.png",
        "dungeon.png",
        "taskboard.png",
        "taskmaster.png",
        "character-menu-xp-bars.png"
    ]

    print("=" * 60)
    print("Converting sprites to have real alpha transparency...")
    print("=" * 60)

    converted = 0
    for filename in files_to_convert:
        input_path = os.path.join(sprite_dir, filename)

        if not os.path.exists(input_path):
            print(f"WARNING: Skipping {filename} - file not found")
            continue

        # Backup original
        backup_path = os.path.join(sprite_dir, f"{filename}.backup")
        if not os.path.exists(backup_path):
            import shutil
            shutil.copy2(input_path, backup_path)
            print(f"  Backed up to {backup_path}")

        # Convert to transparent
        make_transparent(input_path, input_path, threshold=30)
        converted += 1

    print("=" * 60)
    print(f"Converted {converted} files!")
    print("=" * 60)
    print("\nOriginal files backed up with .backup extension")
    print("If something looks wrong, you can restore from backups.")

if __name__ == "__main__":
    main()
