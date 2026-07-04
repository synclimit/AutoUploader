import json

with open('db_audit_result.json', 'r') as f:
    audit = json.load(f)

for db_name, data in audit.items():
    print(f'=== {db_name} ===')
    if 'error' in data: continue
    for t_name, t_data in data['tables'].items():
        if t_name == 'upload_tasks':
            print(f'  Table: {t_name}')
            print('    Indexes:', [i['name'] for i in t_data.get('indexes', [])])
            print('    FKs:', [f"{fk['from']}->{fk['table']}.{fk['to']}" for fk in t_data.get('foreign_keys', [])])
