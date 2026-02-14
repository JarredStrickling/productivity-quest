# Sprite Sheet Guide

## Directory
Place all character sprite sheets in this folder:
`productivity-game/public/assets/sprites/`

## Required Files
- `paladin.png` - Paladin tank character
- `warrior.png` - Warrior melee character
- `mage.png` - Mage spellcaster character
- `archer.png` - Archer ranged character
- `cleric.png` - Cleric healer character

## Sprite Sheet Format

### Dimensions
- **Total size**: 128x128 pixels (recommended)
- **Frame size**: 32x32 pixels
- **Layout**: 4 columns x 4 rows (16 frames total)

### Layout Structure
```
[Down-0] [Down-1] [Down-2] [Down-3]    <- Row 0 (frames 0-3)
[Left-0] [Left-1] [Left-2] [Left-3]    <- Row 1 (frames 4-7)
[Right-0][Right-1][Right-2][Right-3]   <- Row 2 (frames 8-11)
[Up-0]   [Up-1]   [Up-2]   [Up-3]      <- Row 3 (frames 12-15)
```

### Frame Breakdown
- **Column 0**: Idle/standing pose for each direction
- **Columns 1-3**: Walking animation frames

### Requirements
- ✅ PNG format with transparent background
- ✅ Pixel art style (Game Boy Color aesthetic)
- ✅ Top-down view
- ✅ Each frame exactly 32x32 pixels
- ✅ 4 rows (down, left, right, up)
- ✅ 4 frames per row (1 idle + 3 walking)

## Creating from Single Sprite

If you have a single sprite image, you'll need to:
1. Create a 128x128 pixel canvas
2. Create 4 variations facing different directions
3. Create 3 walking frames for each direction
4. Arrange them in the grid layout above
5. Save as PNG with transparent background

## Tools
- **Piskel** (free, web-based): https://www.piskelapp.com/
- **Aseprite** (paid, powerful): https://www.aseprite.org/
- **GraphicsGale** (free): https://graphicsgale.com/

## Testing
After placing your sprite file, refresh the game. The character should now use your custom sprite with walking animations!
