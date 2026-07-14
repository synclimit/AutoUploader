from PIL import Image
import shutil
import os

source_logo = r"d:\AutoUploader\logo baru.png"

def copy_file(src, dst):
    try:
        shutil.copy2(src, dst)
        print(f"Copied to {dst}")
    except Exception as e:
        print(f"Failed to copy to {dst}: {e}")

# Overwrite Logo.png and favicon.png
copy_file(source_logo, r"d:\AutoUploader\Logo.png")
copy_file(source_logo, r"d:\AutoUploader\favicon.png")
copy_file(source_logo, r"d:\AutoUploader\frontend\app\public\favicon.png")

# Also if there's a logo.png in public
copy_file(source_logo, r"d:\AutoUploader\frontend\app\public\logo.png")

# Generate icon.ico
ico_dest = r"d:\AutoUploader\assets\icon.ico"
try:
    img = Image.open(source_logo)
    # Convert to RGBA just in case
    img = img.convert("RGBA")
    # Save as ico, specifying sizes
    img.save(ico_dest, format="ICO", sizes=[(256, 256), (128, 128), (64, 64), (32, 32), (16, 16)])
    print(f"Generated {ico_dest}")
except Exception as e:
    print(f"Failed to generate ICO: {e}")

