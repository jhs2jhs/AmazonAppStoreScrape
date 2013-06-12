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
  c_id TEXT NOT NULL DEFAULT "no",
  c_status INTEGER NOT NULL DEFAULT 0,
  c_date TEXT NOT NULL DEFAULT "",
  read_status INTEGER NOT NULL DEFAULT 0,
  create_date TEXT NOT NULL,
  update_date TEXT NOT NULL
);
---------------
CREATE TABLE IF NOT EXISTS app_review_download (
  app_asin TEXT NOT NULL UNIQUE, 
  app_web_c_status INTEGER NOT NULL DEFAULT 0,
  app_web_read_status INTEGER NOT NULL DEFAULT 0,
  c_id TEXT NOT NULL DEFAULT "no",
  c_status INTEGER NOT NULL DEFAULT 0,
  c_date TEXT NOT NULL DEFAULT "",
  review_page_i INTEGER NOT NULL DEFAULT 0,
  review_page_total INTEGER NOT NULL DEFAULT 0,
  read_status INTEGER NOT NULL DEFAULT 0,
  create_date TEXT NOT NULL,
  update_date TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS app_review_download_result (
  app_asin TEXT NOT NULL, 
  review_page_i INTEGER NOT NULL,
  file_path TEXT,
  read_status INTEGER NOT NULL DEFAULT 0, -- 0=fail
  create_date TEXT NOT NULL,
  UNIQUE (app_asin, review_page_i)
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

