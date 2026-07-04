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
        return {"error": "File not found"}
        
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    result = {
        "alembic_version": None,
        "tables": {}
    }
    
    # Alembic version
    try:
        cur = conn.execute("SELECT version_num FROM alembic_version")
        row = cur.fetchone()
        if row:
            result["alembic_version"] = row[0]
    except sqlite3.OperationalError:
        result["alembic_version"] = "Table missing"
        
    # Tables
    cur = conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [r[0] for r in cur.fetchall()]
    
    for t in tables:
        if t == "alembic_version" or t.startswith("sqlite_"): continue
        
        table_info = {"columns": {}, "indexes": [], "foreign_keys": []}
        
        # Columns
        cur_cols = conn.execute(f"PRAGMA table_info('{t}')")
        for c in cur_cols.fetchall():
            # c: cid, name, type, notnull, dflt_value, pk
            table_info["columns"][c['name']] = {
                "type": c['type'],
                "notnull": c['notnull'],
                "pk": c['pk']
            }
            
        # Indexes
        cur_idx = conn.execute(f"PRAGMA index_list('{t}')")
        for i in cur_idx.fetchall():
            idx_name = i['name']
            idx_unique = i['unique']
            cur_idx_info = conn.execute(f"PRAGMA index_info('{idx_name}')")
            cols = [r['name'] for r in cur_idx_info.fetchall()]
            table_info["indexes"].append({"name": idx_name, "unique": idx_unique, "columns": cols})
            
        # Foreign Keys
        cur_fk = conn.execute(f"PRAGMA foreign_key_list('{t}')")
        for fk in cur_fk.fetchall():
            table_info["foreign_keys"].append({
                "table": fk['table'],
                "from": fk['from'],
                "to": fk['to']
            })
            
        result["tables"][t] = table_info
        
    return result

audit = {}
for name, path in dbs.items():
    audit[name] = analyze_db(path)
    
print(json.dumps(audit, indent=2))
