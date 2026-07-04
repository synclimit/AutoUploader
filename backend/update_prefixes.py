import glob
import re

files = glob.glob('api/*.py')
for f in files:
    with open(f, 'r') as file:
        content = file.read()
    
    new_content = re.sub(r'prefix="/api/(?!v1/)', 'prefix="/api/v1/', content)
    
    if new_content != content:
        with open(f, 'w') as file:
            file.write(new_content)
        print(f"Updated {f}")
