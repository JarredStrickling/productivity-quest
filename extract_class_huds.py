#!/usr/bin/env python3
"""
Extract individual class HUD sprites from character-menu-xp-bars.png
Order: Paladin, Warrior, Archer, Mage, Cleric (top to bottom)
"""

try:
    from PIL import Image
    import os
except ImportError:
    print("ERROR: PIL (Pillow) not installed. Install with: pip install Pillow")
    import sys
    sys.exit(1)

def extract_class_hud(img, class_index, class_name, output_dir, threshold=35):
    """
    Extract a single class HUD from the sprite sheet.

    Args:
        img: PIL Image object
        class_index: Index (0-4) of the class in the vertical stack
        class_name: Name for the output file
        output_dir: Directory to save the file
        threshold: Color threshold for transparency
    """
    width, height = img.size

    # Each class HUD is 1/5 of the total height
    hud_height = height // 5

    # Calculate crop bounds
    top = class_index * hud_height
    bottom = top + hud_height

    # Crop the section
    cropped = img.crop((0, top, width, bottom))

    # Convert to RGBA
    cropped = cropped.convert("RGBA")

    # Make background transparent
    pixels = cropped.load()
    crop_width, crop_height = cropped.size

    for y in range(crop_height):
        for x in range(crop_width):
            r, g, b, a = pixels[x, y]

            # If pixel is white or very light gray (checkerboard pattern)
            is_white = r > (255 - threshold) and g > (255 - threshold) and b > (255 - threshold)
            is_light_gray = abs(r - 192) < threshold and abs(g - 192) < threshold and abs(b - 192) < threshold

            if is_white or is_light_gray:
                pixels[x, y] = (r, g, b, 0)  # Set alpha to 0 (transparent)

    # Save the extracted HUD
    output_path = os.path.join(output_dir, f"{class_name}-hud.png")
    cropped.save(output_path, "PNG")
    print(f"  + Saved: {class_name}-hud.png")

    return output_path

def main():
    sprite_dir = "public/assets/sprites"
    input_file = "character-menu-xp-bars.png"
    input_path = os.path.join(sprite_dir, input_file)

    if not os.path.exists(input_path):
        print(f"ERROR: File not found: {input_path}")
        return

    print("=" * 60)
    print("Extracting individual class HUD sprites...")
    print("=" * 60)

    # Open the source image
    img = Image.open(input_path)
    print(f"Source image: {img.size[0]}x{img.size[1]}")

    # Class order (top to bottom)
    classes = [
        "paladin",
        "warrior",
        "archer",
        "mage",
        "cleric"
    ]

    print(f"\nExtracting {len(classes)} class HUDs:\n")

    # Extract each class
    for index, class_name in enumerate(classes):
        extract_class_hud(img, index, class_name, sprite_dir, threshold=35)

    print("\n" + "=" * 60)
    print(f"Done! Extracted {len(classes)} class HUD sprites.")
    print("=" * 60)
    print("\nFiles created:")
    for class_name in classes:
        print(f"  - {class_name}-hud.png")

if __name__ == "__main__":
    main()
