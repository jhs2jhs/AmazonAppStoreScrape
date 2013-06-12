import sqlite3

db_from = sqlite3.connect('./amazon_scrape_dtc_14_may_2013.db')
db_to = sqlite3.connect('./amazon_scrape_mac_14_may_2013.db')
db_review_from = sqlite3.connect('./amazon_ec2_11_june_2013.db')
db_review_to = sqlite3.connect('./amazon_ec2_11_june_2013_to.db')

def app_web_download_aggregate():
    sql_get_f = 'SELECT app_asin, app_name, app_name_lower, app_url, file_path, read_status, create_date, update_date FROM app_web_download'
    sql_put_t = 'INSERT OR IGNORE INTO app_web_download (app_asin, app_name, app_name_lower, app_url, file_path, read_status, create_date, update_date) VALUES (?,?,?,?,?,?,?,?)'
    c_f = db_from.cursor()
    c_t = db_to.cursor()
    c_f.execute(sql_get_f)
    r = c_f.fetchone()
    i = 0
    i_i = 0
    while r != None:
        if i == i_i:
            print i
            i_i = i_i + 10000
        app_asin = r[0]
        app_name = r[1]
        app_name_lower = r[2]
        app_url = r[3]
        file_path = r[4]
        read_status = r[5]
        create_date = r[6]
        update_date = r[7]
        c_t.execute(sql_put_t, (app_asin, app_name, app_name_lower, app_url, file_path, read_status, create_date, update_date))
        db_to.commit()
        r = c_f.fetchone()
        i = i + 1
    c_f.close()
    c_t.close()


def alter_g(sql, params, db):
    try:
        c = db.cursor()
        c.execute(sql, params)
        db.commit()
    except sqlite3.Error as e:
        print '** sqlite3 error:', e


'''
#c_status: default 0
0 = unasign
1 = done
2 = assigned but not done 
'''
def app_web_download_alter():
    sql_add_t = 'ALTER TABLE app_web_download ADD COLUMN c_id TEXT NOT NULL DEFAULT "no"'
    alter_g(sql_add_t, (), db_to);
    sql_add_t = 'ALTER TABLE app_web_download ADD COLUMN c_status INTEGER NOT NULL DEFAULT 0'
    alter_g(sql_add_t, (), db_to)
    sql_add_t = 'ALTER TABLE app_web_download ADD COLUMN c_date TEXT NOT NULL DEFAULT ""'
    alter_g(sql_add_t, (), db_to)
    
    
def app_review_download_init():
    sql_review_fill_get = 'SELECT app_asin, c_status, read_status FROM app_web_download'
    sql_review_fill_put = 'INSERT OR IGNORE INTO app_review_download (app_asin, app_web_c_status, app_web_read_status, create_date, update_date) VALUES (?,?,?,?,?)'
    c_from = db_review_from.cursor()
    c_to = db_review_to.cursor()
    c_from.execute(sql_review_fill_get)
    i = 0
    i_i = 0
    r = c_from.fetchone()
    while r != None:
        if i == i_i:
            print i
            i_i = i_i + 10000
        app_asin = r[0]
        app_web_c_status = r[1]
        app_web_read_status = r[2]
        create_date = ''
        update_date = ''
        c_to.execute(sql_review_fill_put, (app_asin, app_web_c_status, app_web_read_status, create_date, update_date))
        db_review_to.commit()
        r = c_from.fetchone()
        i = i + 1
        #print i
    c_from.close()
    c_to.close()


if __name__ == '__main__':
    #app_web_download_aggregate()
    #app_web_download_alter()
    app_review_download_init()
