"""
TableQR — per-table QR code generator

Usage:
  python generate_qr.py --base-url https://yourapp.com/order --tables 10

Each table gets its own PNG at ./qr-codes/table_<N>.png.
Print and laminate these, or embed them in a table tent template.
"""

import argparse
import os
import sys

try:
    import qrcode
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Missing dependencies. Run:  pip install -r requirements.txt")
    sys.exit(1)


def make_qr(url: str, label: str, output_path: str) -> None:
    """Generate a QR code PNG with a label underneath."""

    # QR code image
    qr = qrcode.QRCode(
        version=None,          # auto-size
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=12,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="#1E1B16", back_color="white").convert("RGB")

    # Canvas: QR + label strip below
    qr_w, qr_h = qr_img.size
    label_h = 60
    canvas = Image.new("RGB", (qr_w, qr_h + label_h), color="white")
    canvas.paste(qr_img, (0, 0))

    draw = ImageDraw.Draw(canvas)

    # Try to use a system monospace font, fall back to default
    font = None
    font_candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationMono-Bold.ttf",
        "/System/Library/Fonts/Courier New Bold.ttf",   # macOS
        "C:/Windows/Fonts/courbd.ttf",                   # Windows
    ]
    for path in font_candidates:
        if os.path.exists(path):
            try:
                font = ImageFont.truetype(path, 22)
                break
            except Exception:
                pass

    text = label
    if font:
        bbox = draw.textbbox((0, 0), text, font=font)
        text_w = bbox[2] - bbox[0]
    else:
        text_w = len(text) * 10

    x = (qr_w - text_w) // 2
    y = qr_h + (label_h - 26) // 2
    draw.text((x, y), text, fill="#1E1B16", font=font)

    canvas.save(output_path)
    print(f"  ✓  {output_path}  →  {url}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate per-table QR codes for TableQR."
    )
    parser.add_argument(
        "--base-url",
        required=True,
        help="Base URL of your deployed app, e.g. https://yourapp.com/order",
    )
    parser.add_argument(
        "--tables",
        type=int,
        default=5,
        help="Number of tables to generate codes for (default: 5)",
    )
    parser.add_argument(
        "--output-dir",
        default="./qr-codes",
        help="Directory to write PNG files into (default: ./qr-codes)",
    )
    args = parser.parse_args()

    base_url = args.base_url.rstrip("/")
    os.makedirs(args.output_dir, exist_ok=True)

    print(f"\nGenerating {args.tables} QR codes → {args.output_dir}/\n")
    for i in range(1, args.tables + 1):
        url = f"{base_url}/{i}"
        label = f"Table {i}  ·  Scan to order"
        output_path = os.path.join(args.output_dir, f"table_{i:02d}.png")
        make_qr(url, label, output_path)

    print(f"\nDone. Print the PNGs from {args.output_dir}/ and place them on each table.")


if __name__ == "__main__":
    main()
