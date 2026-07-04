import sqlite3
c = sqlite3.connect('app_v2.db')
c.row_factory = sqlite3.Row
row = c.execute("SELECT id, title, category_id, ai_use, default_language, audio_language, recording_date FROM upload_tasks WHERE id='40f28739-c876-4235-b321-4f980cedd2ef'").fetchone()
print(dict(row))
