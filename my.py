import sqlite3

sql_init = '''
CREATE TABLE IF NOT EXISTS category (
  cate TEXT NOT NULL UNIQUE, 
  cate_lower TEXT NOT NULL UNIQUE,
  cate_nodeid TEXT NOT NULL UNIQUE, 
  app_counts INTEGER NOT NULL DEFAULT 0,
  read_status INTEGER NOT NULL DEFAULT 0,
  create_date TEXT NOT NULL,
  update_date TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS category_i (
  cate TEXT NOT NULL UNIQUE, 
  cate_lower TEXT NOT NULL UNIQUE,
  cate_nodeid TEXT NOT NULL UNIQUE, 
  page_i INTEGER NOT NULL DEFAULT 1,
  read_status INTEGER NOT NULL DEFAULT 0,
  create_date TEXT NOT NULL,
  update_date TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS app_web_download (
  app_asin TEXT NOT NULL UNIQUE, 
  app_name TEXT, 
  app_name_lower TEXT,
  app_url TEXT NOT NULL, 
  file_path TEXT,
  read_status INTEGER NOT NULL DEFAULT 0,
  create_date TEXT NOT NULL,
  update_date TEXT NOT NULL
);
'''

db = sqlite3.connect('./amazon.db')
c = db.cursor()
c.executescript(sql_init)
db.commit()
c.execute('SELECT * FROM SQLITE_MASTER')
tables = c.fetchall()
print u'** tables: %s **'%(len(tables))
c.close()
