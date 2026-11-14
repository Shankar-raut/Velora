#!/usr/bin/env python3
"""
Generate PNG icons from SVG files for Chrome extension.
Requires: pip install cairosvg
"""

import os
import sys

try:
    import cairosvg
except ImportError:
    print("Installing cairosvg...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "cairosvg"])
    import cairosvg

# Icon sizes needed for Chrome extension
ICON_SIZES = {
    'icon16': 16,
    'icon48': 48,
    'icon128': 128,
}

def generate_icons():
    script_dir = os.path.dirname(os.path.abspath(__file__))

    for name, size in ICON_SIZES.items():
        svg_path = os.path.join(script_dir, f"{name}.svg")
        png_path = os.path.join(script_dir, f"{name}.png")

        if not os.path.exists(svg_path):
            print(f"SVG not found: {svg_path}")
            continue

        try:
            cairosvg.svg2png(
                url=svg_path,
                write_to=png_path,
                output_width=size,
                output_height=size
            )
            print(f"Generated: {png_path} ({size}x{size})")
        except Exception as e:
            print(f"Error generating {name}: {e}")

    print("\nDone! PNG icons generated.")

if __name__ == "__main__":
    generate_icons()