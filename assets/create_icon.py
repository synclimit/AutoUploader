import struct

def create_dummy_ico(path):
    # Minimal 1x1 ICO file structure
    ico_header = struct.pack("<hhh", 0, 1, 1)  # reserved, type (1=ico), count
    
    # Directory entry
    # width, height, colorCount, reserved, planes, bitCount, bytesInRes, imageOffset
    ico_dir = struct.pack("<bbbbhhII", 1, 1, 0, 0, 1, 32, 40 + 4, 22)
    
    # BITMAPINFOHEADER
    # size, width, height, planes, bitCount, compression, sizeImage, xPels, yPels, clrUsed, clrImportant
    bmp_header = struct.pack("<IIIHHIIIIII", 40, 1, 2, 1, 32, 0, 4, 0, 0, 0, 0)
    
    # Pixel data (1 pixel, ARGB) - Blue color
    pixel = struct.pack("<BBBB", 255, 0, 0, 255)
    
    with open(path, "wb") as f:
        f.write(ico_header)
        f.write(ico_dir)
        f.write(bmp_header)
        f.write(pixel)

if __name__ == "__main__":
    create_dummy_ico("d:/AutoUploader/assets/icon.ico")
