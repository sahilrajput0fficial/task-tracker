import sqlite3

conn = sqlite3.connect('task_tracker.db')
cur = conn.cursor()
existing = [row[1] for row in cur.execute('PRAGMA table_info(tasks)').fetchall()]
print('Columns:', existing)
if 'updated_at' not in existing:
    cur.execute('ALTER TABLE tasks ADD COLUMN updated_at DATETIME')
    cur.execute('UPDATE tasks SET updated_at = created_at')
    print('Added updated_at')
conn.commit()
conn.close()
print('Done')
