import sqlite3
import sys

sql_init = '''
CREATE TABLE IF NOT EXISTS category (
  cate TEXT NOT NULL, 
  cate_lower TEXT NOT NULL,
  cate_nodeid TEXT NOT NULL UNIQUE,
  app_counts INTEGER NOT NULL DEFAULT 0,
  cate_type TEXT, -- b or s
  read_status INTEGER NOT NULL DEFAULT 0,
  create_date TEXT NOT NULL,
  update_date TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS category_i (
  cate TEXT NOT NULL, 
  cate_lower TEXT NOT NULL,
  cate_nodeid TEXT NOT NULL , 
  page_i INTEGER NOT NULL,
  file_path TEXT,
  cate_type TEXT,
  read_status INTEGER NOT NULL DEFAULT 0,
  create_date TEXT NOT NULL,
  update_date TEXT NOT NULL,
  UNIQUE (cate_nodeid, page_i)
);
--------------
CREATE TABLE IF NOT EXISTS category2 (
  cate TEXT NOT NULL, 
  cate_lower TEXT NOT NULL,
  cate_nodeid TEXT NOT NULL UNIQUE,
  app_counts INTEGER NOT NULL DEFAULT 0,
  cate_type TEXT, -- b or s
  read_status INTEGER NOT NULL DEFAULT 0,
  create_date TEXT NOT NULL,
  update_date TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS category2_i (
  cate TEXT NOT NULL, 
  cate_lower TEXT NOT NULL,
  cate_nodeid TEXT NOT NULL , 
  page_i INTEGER NOT NULL,
  file_path TEXT,
  cate_type TEXT,
  read_status INTEGER NOT NULL DEFAULT 0,
  create_date TEXT NOT NULL,
  update_date TEXT NOT NULL,
  UNIQUE (cate_nodeid, page_i)
);
--------------
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

def db_init(db_path):
    db = sqlite3.connect(db_path)
    c = db.cursor()
    c.executescript(sql_init)
    db.commit()
    c.execute('SELECT * FROM SQLITE_MASTER')
    tables = c.fetchall()
    print u'** %s ** tables: %s **'%(db_path, len(tables))
    c.close()

if __name__ == '__main__':
    if len(sys.argv) > 1:
        db_path = sys.argv[1]
        db_init(db_path)
    else:
        print "** error: need to know db_path"

