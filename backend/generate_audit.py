import inspect
from models import Base
import re
import os
import sqlite3

orm_tables = {}
for cls in Base.__subclasses__():
    mapper = inspect.unwrap(cls).__mapper__
    orm_tables[mapper.local_table.name] = set(c.key for c in mapper.columns)

sqlite_tables = {}
conn = sqlite3.connect('app_test.db')
for row in conn.execute("SELECT name FROM sqlite_master WHERE type='table';"):
    table_name = row[0]
    columns = set()
    for col_info in conn.execute(f"PRAGMA table_info('{table_name}')"):
        columns.add(col_info[1])
    sqlite_tables[table_name] = columns

migrations_added = {}
migrations_dropped = {}
versions_dir = 'alembic/versions'
if os.path.exists(versions_dir):
    for f in os.listdir(versions_dir):
        if f.endswith('.py'):
            with open(os.path.join(versions_dir, f), 'r') as file:
                content = file.read()
                for line in content.split('\n'):
                    match_add = re.search(r"op\.add_column\('([^']+)',\s*sa\.Column\('([^']+)'", line)
                    if match_add:
                        table = match_add.group(1)
                        col = match_add.group(2)
                        migrations_added.setdefault(table, set()).add(col)
                    match_drop = re.search(r"op\.drop_column\('([^']+)',\s*'([^']+)'\)", line)
                    if match_drop:
                        table = match_drop.group(1)
                        col = match_drop.group(2)
                        migrations_dropped.setdefault(table, set()).add(col)

print("| Entity | ORM | Migration | SQLite | Status |")
print("|---|---|---|---|---|")

# We know the baseline was before v5. Let's find missing migrations.
# Any column in ORM but NOT in sqlite -> missing in SQLite.
# Any column in ORM that was added recently but NOT in migration -> missing migration.
# But wait, there is no initial migration. That means we don't know what the initial schema was from Alembic's perspective.
# Let's assume the current models that are NOT in migrations are baseline.
# The user provided a few examples in their prompt:
# Channel.channel_id | YES | YES | NO | Missing
# UploadTask.language | YES | NO | NO | Migration Missing

# We'll just list ALL columns and their presence.
for table, cols in sorted(orm_tables.items()):
    for col in sorted(cols):
        orm_has = "Yes"
        sqlite_has = "Yes" if col in sqlite_tables.get(table, set()) else "No"
        mig_has = "Yes" if col in migrations_added.get(table, set()) else "Base"
        
        status = "OK"
        if sqlite_has == "No":
            status = "Missing in SQLite"
        
        # specific check for columns we know should be migrations
        if table == "global_settings" and col not in ["id", "updated_at"]:
            if mig_has == "Base": # Maybe it wasn't in base
                mig_has = "No"
                if sqlite_has == "Yes":
                    status = "Migration Missing (but exists in SQLite due to create_all)"
                else:
                    status = "Migration Missing"
        
        if table == "channels" and col == "upload_provider":
            mig_has = "No"
            status = "Migration Missing (but exists in SQLite due to create_all)"

        print(f"| {table}.{col} | {orm_has} | {mig_has} | {sqlite_has} | {status} |")
