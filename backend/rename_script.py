import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    
    # 1. Replace "Account" model usage with "Channel"
    # Matches words like 'Account', 'AccountCreate', 'AccountUpdate'
    content = re.sub(r'\bAccount\b', 'Channel', content)
    
    # 2. Replace "account_id" with "channel_id"
    content = re.sub(r'\baccount_id\b', 'channel_id', content)
    
    # 3. Replace "accounts" with "channels" (like in endpoints, table names, urls)
    content = re.sub(r'\baccounts\b', 'channels', content)

    # 4. Replace variable names like "account =" to "channel ="
    content = re.sub(r'\baccount\b', 'channel', content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

def main():
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    for root, dirs, files in os.walk(backend_dir):
        # skip alembic versions and venv if any
        if 'alembic' in root or '__pycache__' in root or 'frontend_dist' in root or 'evidence' in root:
            continue
            
        for file in files:
            if file.endswith('.py') and file != 'rename_script.py':
                process_file(os.path.join(root, file))

if __name__ == '__main__':
    main()
