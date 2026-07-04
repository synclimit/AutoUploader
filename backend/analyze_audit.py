import json

with open('db_audit_result.json', 'r') as f:
    audit = json.load(f)

for db_name, data in audit.items():
    print(f'=== {db_name} ===')
    if 'error' in data:
        print('Error:', data['error'])
        continue
    print('Alembic Version:', data['alembic_version'])
    for t_name, t_data in data['tables'].items():
        print(f'  Table: {t_name} (Columns: {len(t_data["columns"])})')
        
print("--- Detailed Mismatches ---")
# Compare app.db and app_test.db
app_cols = {t: set(d["columns"].keys()) for t, d in audit["app.db"]["tables"].items()}
test_cols = {t: set(d["columns"].keys()) for t, d in audit["app_test.db"]["tables"].items()}

for t in set(app_cols.keys()).union(set(test_cols.keys())):
    a = app_cols.get(t, set())
    tst = test_cols.get(t, set())
    if a != tst:
        print(f"Table {t} differences between app.db and app_test.db:")
        only_in_app = a - tst
        only_in_test = tst - a
        if only_in_app: print(f"  Only in app.db: {only_in_app}")
        if only_in_test: print(f"  Only in app_test.db: {only_in_test}")

# Compare app_v2.db and app_test.db
v2_cols = {t: set(d["columns"].keys()) for t, d in audit["app_v2.db"]["tables"].items()}
for t in set(v2_cols.keys()).union(set(test_cols.keys())):
    v2 = v2_cols.get(t, set())
    tst = test_cols.get(t, set())
    if v2 != tst:
        print(f"Table {t} differences between app_v2.db and app_test.db:")
        only_in_v2 = v2 - tst
        only_in_test = tst - v2
        if only_in_v2: print(f"  Only in app_v2.db: {only_in_v2}")
        if only_in_test: print(f"  Only in app_test.db: {only_in_test}")
