import sqlite3
import os
import json

dbs = {
    'app.db': 'd:/AutoUploader/backend/app.db',
    'app_v2.db': 'd:/AutoUploader/app_v2.db',
    'app_test.db': 'd:/AutoUploader/backend/app_test.db'
}

def analyze_db(db_path):
    if not os.path.exists(db_path):
        return {'error': 'File not found'}
        
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    result = {
        'alembic_version': None,
        'tables': {}
    }
    
    try:
        cur = conn.execute('SELECT version_num FROM alembic_version')
        row = cur.fetchone()
        if row:
            result['alembic_version'] = row[0]
    except sqlite3.OperationalError:
        result['alembic_version'] = 'Table missing'
        
    cur = conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [r[0] for r in cur.fetchall()]
    
    for t in tables:
        if t == 'alembic_version' or t.startswith('sqlite_'): continue
        
        table_info = {'columns': {}}
        
        cur_cols = conn.execute(f"PRAGMA table_info('{t}')")
        for c in cur_cols.fetchall():
            table_info['columns'][c['name']] = c['type']
            
        result['tables'][t] = table_info
        
    return result

audit = {}
for name, path in dbs.items():
    audit[name] = analyze_db(path)

with open('db_audit_result.json', 'w') as f:
    json.dump(audit, f)
