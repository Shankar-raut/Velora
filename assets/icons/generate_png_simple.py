#!/usr/bin/env python3
"""
Generate simple PNG icons for Chrome extension using Pillow.
No external dependencies beyond Pillow.
"""

from PIL import Image, ImageDraw
import os

# Icon sizes needed for Chrome extension
ICON_SIZES = {
    'icon16': 16,
    'icon48': 48,
    'icon128': 128,
}

# Colors
BG_COLOR = (10, 10, 15)  # #0a0a0f
ACCENT_COLOR = (99, 102, 241)  # #6366f1

def draw_icon(draw, size):
    """Draw the Velora icon: clock-like circle with crosshairs"""
    center = size // 2
    radius = int(size * 0.35)
    stroke_width = max(1, size // 32)

    # Draw circle
    draw.ellipse(
        [center - radius, center - radius, center + radius, center + radius],
        outline=ACCENT_COLOR,
        width=stroke_width
    )

    # Draw crosshairs (vertical and horizontal lines)
    line_length = int(radius * 0.7)
    # Vertical
    draw.line(
        [center, center - line_length, center, center + line_length],
        fill=ACCENT_COLOR,
        width=stroke_width
    )
    # Horizontal
    draw.line(
        [center - line_length, center, center + line_length, center],
        fill=ACCENT_COLOR,
        width=stroke_width
    )

def generate_icons():
    script_dir = os.path.dirname(os.path.abspath(__file__))

    for name, size in ICON_SIZES.items():
        png_path = os.path.join(script_dir, f"{name}.png")

        # Create image
        img = Image.new('RGBA', (size, size), BG_COLOR + (255,))
        draw = ImageDraw.Draw(img)

        # Draw rounded rectangle background (Chrome extension icons are usually square with rounded corners)
        corner_radius = max(1, size // 8)
        draw.rounded_rectangle(
            [0, 0, size - 1, size - 1],
            radius=corner_radius,
            fill=BG_COLOR
        )

        # Draw icon
        draw_icon(draw, size)

        # Save
        img.save(png_path, 'PNG')
        print(f"Generated: {png_path} ({size}x{size})")

    print("\nDone! PNG icons generated.")

if __name__ == "__main__":
    generate_icons()