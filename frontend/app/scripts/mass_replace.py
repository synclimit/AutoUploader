import os
import re

search_dir = r"d:\AutoUploader\frontend\app\src"
target = "AutoUploader"
replacement = "Raynz PitStop"

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if target in content:
        new_content = content.replace(target, replacement)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Replaced in {filepath}")

for root, _, files in os.walk(search_dir):
    for file in files:
        if file.endswith(('.jsx', '.js', '.ts', '.tsx', '.html')):
            replace_in_file(os.path.join(root, file))

# Also replace in html
replace_in_file(r"d:\AutoUploader\frontend\app\index.html")
