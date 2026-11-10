"""Generates Nexora's icons from the logo image.

    python tools/make_icon.py path/to/logo.png

Outputs assets/nexora.ico (executable icon, 16–256 px), assets/nexora.png and
frontend/public/favicon.png. The white background around the logo becomes
transparent; light areas inside the logo (the circuit lines) are kept, because
only the background connected to the image border is removed.
"""

import sys
from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ICO_SIZES = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
# A pixel is "background" when its darkest channel is above this value.
BACKGROUND_MIN = 165


def remove_background(image):
    image = image.convert("RGBA")
    width, height = image.size
    pixels = image.load()
    is_light = lambda x, y: min(pixels[x, y][:3]) > BACKGROUND_MIN  # noqa: E731

    # Flood fill from the border: only the outer white area is background.
    background = set()
    queue = deque((x, y) for x in range(width) for y in (0, height - 1))
    queue.extend((x, y) for y in range(height) for x in (0, width - 1))
    while queue:
        x, y = queue.popleft()
        if (x, y) in background or not (0 <= x < width and 0 <= y < height) or not is_light(x, y):
            continue
        background.add((x, y))
        queue.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))

    for x, y in background:
        red, green, blue, _ = pixels[x, y]
        # Anti-aliased edge pixels keep a little opacity; pure white disappears.
        alpha = round(max(0, 255 - min(red, green, blue)) * 255 / (255 - BACKGROUND_MIN))
        if alpha == 0:
            pixels[x, y] = (0, 0, 0, 0)
        else:
            unblend = lambda channel: max(0, min(255, round((channel - 255 * (1 - alpha / 255)) / (alpha / 255))))  # noqa: E731
            pixels[x, y] = (unblend(red), unblend(green), unblend(blue), alpha)
    return image


def square(image, margin=0.04):
    """Centers the logo on a transparent square canvas."""
    side = round(max(image.size) * (1 + 2 * margin))
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(image, ((side - image.width) // 2, (side - image.height) // 2), image)
    return canvas


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    logo = square(remove_background(Image.open(sys.argv[1])))
    large = logo.resize((256, 256), Image.Resampling.LANCZOS)

    (ROOT / "assets").mkdir(exist_ok=True)
    large.save(ROOT / "assets" / "nexora.png")
    large.save(ROOT / "assets" / "nexora.ico", sizes=ICO_SIZES)
    large.resize((64, 64), Image.Resampling.LANCZOS).save(ROOT / "frontend" / "public" / "favicon.png")
    print("Icons written to assets/ and frontend/public/favicon.png")


if __name__ == "__main__":
    main()
