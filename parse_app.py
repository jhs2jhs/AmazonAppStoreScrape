import my
db_path = './amazon_parse_html.db'
my.db_init(db_path)
import sqlite3
db = sqlite3.connect(db_path)
import os
from bs4 import BeautifulSoup
import codecs
import re
from datetime import datetime

show_step = False

def get_field_by_attrs_n(label, soup, name, attrs, n):
    if show_step:
        print "**", label, "==", 
    bs = soup.find_all(name=name, attrs=attrs)
    t = bs[n].text.strip()
    if show_step:
        print t
    return t

def get_field_by_attrs_textrp(label, soup, name, attrs, rp, rpn):
    if show_step:
        print "**", label, "==", 
    bs = soup.find_all(name=name, attrs=attrs)
    if len(bs) == 1:
        asin = bs[0].parent.text
        asin = asin.replace(rp, rpn).strip()
        if show_step:
            print asin
        return asin
    else:
        if show_step:
            print "++WRONG++", len(bs), bs
        return False 

def one_must_get_field_by_attrs_textrp(label, soup, name, attrs, rp, rpn):
    if show_step:
        print "**", label, "==", 
    bs = soup.find_all(name=name, attrs=attrs)
    if len(bs) == 1:
        asin = bs[0].parent.text
        asin = asin.replace(rp, rpn).strip()
        if show_step:
            print asin
        return asin
    else:
        if show_step:
            print "++WRONG++", len(bs), bs
        raise Exception('one_must_get_field', '%s: %s : %s'%(label, unicode(len(bs)), unicode(bs)))
        return False 


def get_field_by_attrs_selftextrp(label, soup, name, attrs, rp, rpn):
    if show_step:
        print "**", label, "==", 
    bs = soup.find_all(name=name, attrs=attrs)
    if len(bs) == 1:
        asin = bs[0].text.strip()
        asin = asin.replace(rp, rpn).strip()
        if show_step:
            print asin
        return asin
    else:
        print "++WRONG++", len(bs), bs
        return False 

def one_must_get_field_by_attrs_selftextrp(label, soup, name, attrs, rp, rpn):
    if show_step:
        print "**", label, "==", 
    bs = soup.find_all(name=name, attrs=attrs)
    if len(bs) == 1:
        asin = bs[0].text.strip()
        asin = asin.replace(rp, rpn).strip()
        if show_step:
            print asin
        return asin
    else:
        print "++WRONG++", len(bs), bs
        return False 

def one_must_get_field_by_attrs(label, soup, name, attrs):
    if show_step:
        print "**", label, "==", 
    bs = soup.find_all(name=name, attrs=attrs)
    if len(bs) == 1:
        t = bs[0].text.strip()
        if show_step:
            print t
        return t
    else:
        print "++WRONG++", len(bs), bs
        raise Exception('one_must_get_field', '%s: %s : %s'%(label, unicode(len(bs)), unicode(bs)))
        return False

def one_may_get_field_by_attrs(label, soup, name, attrs):
    if show_step:
        print "**", label, "==", 
    bs = soup.find_all(name=name, attrs=attrs)
    if len(bs) == 1:
        t = bs[0].text.strip()
        if show_step:
            print t
        return t
    else:
        print "++WRONG++", len(bs), bs
        #raise Exception('one_must_get_field', '%s: %s : %s'%(label, unicode(len(bs)), unicode(bs)))
        return False

def get_field_by_price(label, soup, name, attrs):
    if show_step:
        print "**", label, "==", 
    bs = soup.find_all(name=name, attrs=attrs)
    if len(bs) == 1:
        t = bs[0].text.strip()
        if show_step:
            print t
        return t
    else:
        print "++WRONG++", len(bs), bs
        #raise Exception('one_must_get_field', '%s: %s : %s'%(label, unicode(len(bs)), unicode(bs)))
        return False

def many_must_get_field_by_attrs(label, soup, name, attrs):
    if show_step:
        print "**", label, "==", 
    bs = soup.find_all(name=name, attrs=attrs)
    #print bs
    if len(bs) == 0:
        return False
    else:
        return True

def many_must_get_field_by_permission(label, soup, name, attrs):
    if show_step:
        print '**', label, '==',
    bs = soup.find_all(name=name, attrs=attrs)
    perms = []
    if (len(bs) == 1):
        ps = bs[0].find_all(name='li')
        for p in ps:
            p = p.text.strip().lower()
            perms.append(p)
    if show_step:
        print perms
    return perms

def many_must_get_field_by_relate(label, soup, name, attrs):
    if show_step:
        print '**', label, '==',
    bs = soup.find_all(name='div', attrs={'class':'new-faceout p13nimp'})
    #bs = soup.find_all(name='div', attrs={'class':'shoveler-content'})
    #print bs
    asins = []
    for p in bs:
        #print p
        asin = p['data-asin']
        asins.append(asin)
    if show_step:
        print asins
    return asins

def one_must_get_field_by_text(label, soup, name, attrs, text, rp, rpn):
    if show_step:
        print "**", label, "==",  
    bs = soup.find_all(name=name, attrs=attrs, text=text)
    if len(bs) == 1:
        asin = bs[0].parent.text
        asin = asin.replace(rp, rpn).strip()
        if show_step:
            print asin
        return asin
    else:
        print ""
        raise Exception('one_must_get_field', '%s: %s : %s'%(label, unicode(len(bs)), unicode(bs)))
        return False

def get_field_by_asin(label, soup, name, attrs, text, rp, rpn):
    if show_step:
        print "**", label, "==",  
    bs = soup.find_all(name=name, attrs=attrs, text=text)
    if len(bs) == 1:
        asin = bs[0].parent.text
        asin = asin.replace(rp, rpn).strip()
        if show_step:
            print asin
        return asin
    else:
        print ""
        return False

def one_may_get_field_by_text(label, soup, name, attrs, text, rp, rpn):
    if show_step:
        print "**", label, "==",  
    bs = soup.find_all(name=name, attrs=attrs, text=text)
    if len(bs) == 1:
        asin = bs[0].parent.text
        asin = asin.replace(rp, rpn).strip()
        if show_step:
            print asin
        return asin
    else:
        if show_step:
            print ""
        return False


def one_must_get_field_by_href_regexp(label, soup, name, reg):
    if show_step:
        print "**", label, "==",  
    bs = soup.find_all(name=name, href=re.compile(reg))
    if len(bs) == 1:
        asin = bs[0].text.strip()
        if show_step:
            print asin
        return asin
    else:
        print ""
        #raise Exception('one_must_get_field', '%s: %s : %s'%(label, unicode(len(bs)), unicode(bs)))
        return False

def get_field_by_privacy(label, soup, name, attrs, text, rp, rpn):
    if show_step:
        print "**", label, "==",  
    bs = soup.find_all(name=name, attrs=attrs, text=text)
    if len(bs) == 1:
        asin = bs[0].parent
        privacys = asin.find_all(name='a')
        if len(privacys) > 0:
            privacy_href = privacys[0]['href']
            if show_step:
                print privacy_href
            return True, privacy_href
        else:
            if show_step:
                print "none"
            return False, 'none'
    else:
        if show_step:
            print ""
        return False, ''
    

    
sql_app_parse_update = '''
UPDATE app_parse SET 
org_date=?, amn_date=?, age_rated=?, best_seller_rank=?, title=?, author=?, app_platform=?, 
price=?, sold_by=?, app_features=?, product_desc=?, developer_desc=?, app_size=?, app_version=?, 
app_by=?, app_privacy=?, app_depedency=?, rating_count=?, rating_score=?, 
rating_5=?, rating_4=?, rating_3=?, rating_2=?, rating_1=?, update_date=?
WHERE asin = ?
'''
def parse_file_app(p):
    #global db
    c = db.cursor()
    #print p
    #f = codecs.open(p, 'r', 'utf-8')
    #soup = BeautifulSoup(open(p).read(), 'html.parser') ## html.parse is not working in mac os
    soup = BeautifulSoup(open(p).read())
    #### product details
    asin = get_field_by_asin('asin', soup, 'b', {}, 'ASIN:', 'ASIN:', '')
    if asin == False:
        return 
    org_date = one_may_get_field_by_text('org_date', soup, 'b', {}, 'Original Release Date:', 'Original Release Date:', '')
    amn_date = one_must_get_field_by_text('amn_date', soup, 'b', {}, ' Date first available at Amazon.com:', 'Date first available at Amazon.com:', '')
    age_rated = one_may_get_field_by_attrs('rated', soup, 'a', {'id':"mas-product-rating-definition"})
    best_seller_rank = one_may_get_field_by_text('best_seller_rank', soup, 'b', {}, 'Amazon Best Sellers Rank:', 'Amazon Best Sellers Rank:', '')
    #### product top
    app_title = one_must_get_field_by_attrs('title', soup, 'span', {'id':'btAsinTitle'})
    app_author =  one_must_get_field_by_href_regexp('author', soup, 'a', 's/ref=bl_sr_mobile-apps') ## have problem
    if app_author == False:
        return
    app_platform = get_field_by_attrs_n('platform', soup, 'span', {'class': 'mas-platform-value'}, 0)
    price = get_field_by_price('price', soup, 'b', {'class':'priceLarge'})
    sold_by = get_field_by_attrs_textrp('sold_by', soup, 'td', {'class':'priceBlockLabel', 'id':''}, 'Sold by:', '')
    ##### product features
    app_features = get_field_by_attrs_selftextrp('app_features', soup, 'div', {'id':'feature-bullets_feature_div'}, 'Product Features', '')
    ##### product description
    product_desc = get_field_by_attrs_selftextrp('app_desc', soup, 'div', {'class':'mas-product-description-wrapper bucket'}, 'Product Description', '')
    developer_desc = get_field_by_attrs_selftextrp('developer_desc', soup, 'div', {'class':'amabot-slot'}, 'Developer Info', '')
    #### Technical Details
    app_size = one_must_get_field_by_text('app_size', soup, 'strong', {}, 'Size:', 'Size:', '')
    app_version = one_must_get_field_by_text('app_version', soup, 'strong', {}, 'Version:', 'Version:', '')
    app_by = one_must_get_field_by_text('app_by', soup, 'strong', {}, 'Developed By:', 'Developed By:', '')
    has_privacy, app_by_privacy = get_field_by_privacy('privacy', soup, 'strong', {}, 'Developed By:', 'Developed By:', '')
    app_dependency = one_must_get_field_by_text('minimum operating os', soup, 'strong', {}, 'Minimum Operating System:', 'Minimum Operating System:', '')
    #### rating
    has_rating = many_must_get_field_by_attrs('has_rating', soup, 'span', {'class':'asinReviewsSummary acr-popover non-lazy'})
    print has_rating
    if has_rating == True:
        rating_count = one_must_get_field_by_attrs('rating_count', soup, 'div', {'class':'fl gl5 mt3 txtnormal acrCount'})
        rating_score = one_must_get_field_by_attrs_selftextrp('rating_score', soup, 'div', {'class':'gry txtnormal acrRating'}, 'out of 5 stars', '')
    else:
        rating_count = '0'
        rating_score = 'none'
    rating_5 = one_must_get_field_by_attrs_selftextrp('rating_5', soup, 'div', {'class':'fl histoRowfive clearboth'}, '5 star', '')
    rating_4 = one_must_get_field_by_attrs_selftextrp('rating_4', soup, 'div', {'class':'fl histoRowfour clearboth'}, '4 star', '')
    rating_3 = one_must_get_field_by_attrs_selftextrp('rating_3', soup, 'div', {'class':'fl histoRowthree clearboth'}, '3 star', '')
    rating_2 = one_must_get_field_by_attrs_selftextrp('rating_2', soup, 'div', {'class':'fl histoRowtwo clearboth'}, '2 star', '')
    rating_1 = one_must_get_field_by_attrs_selftextrp('rating_1', soup, 'div', {'class':'fl histoRowone clearboth'}, '1 star', '')
    #### permission
    permission_list = many_must_get_field_by_permission('permission', soup, 'ul', {'class':'mas-app-permissions-list'})
    #### relate apps
    relate_app_asins = many_must_get_field_by_relate('relate_apps', soup, 'div', {'class':'new-faceout p13nimp'})
    ## db app_parse insert
    #c = db.cursor()
    sql_db_parse_insert = 'INSERT OR IGNORE INTO app_parse (asin, create_date, update_date) VALUES (?, ?, ?)'
    c.execute(sql_db_parse_insert, (asin, str(datetime.now()), str(datetime.now())))
    #db.commit()
    #c.close()
    ## db app_parse update
    #c = db.cursor()
    c.execute(sql_app_parse_update, (org_date, amn_date, age_rated, best_seller_rank, app_title, app_author, app_platform, price, sold_by, app_features, product_desc, developer_desc, app_size, app_version, app_by, app_by_privacy, app_dependency, rating_count, rating_score, rating_5, rating_4, rating_3, rating_2, rating_1, str(datetime.now()), asin))
    #db.commit()
    #c.close()
    ## db app_parse_perm insert
    #c = db.cursor()
    for perm in permission_list:
        sql_app_parse_perm_insert = 'INSERT OR IGNORE INTO app_parse_perm (asin, perm, create_date, update_date) VALUES (?,?,?,?)'
        c.execute(sql_app_parse_perm_insert, (asin, perm, str(datetime.now()), str(datetime.now())))
    #db.commit()
    #c.close()
    ## db app_relate insert
    #c = db.cursor()
    for asin_relate in relate_app_asins:
        c.execute(sql_db_parse_insert, (asin_relate, str(datetime.now()), str(datetime.now())))
    db.commit()
    #c.close()
    print asin, org_date, amn_date, rating_count, rating_score, len(permission_list), len(relate_app_asins)
    c.execute("INSERT OR REPLACE INTO app_parse_read (html_file_path, asin, datetime) VALUES (?,?,?)", (p, asin, str(datetime.now())))
    db.commit()
    c.close()
    
    
    

def loop_dir(p):
    c = db.cursor()
    dir_lists = os.listdir(p)
    t = len(dir_lists)
    k = 0
    for dir_list in dir_lists:
        dir_fullpath = os.path.join(p, dir_list)
        if not os.path.isdir(dir_fullpath):
            print '**********is not dir', dir_fullpath
            continue
        f_lists = os.listdir(dir_fullpath)
        i = 0
        j = len(f_lists)
        for f_list in f_lists:
            f_fullpath = os.path.join(dir_fullpath, f_list)
            if not os.path.isfile(f_fullpath):
                print '**********is not file', f_fullpath
                continue
            realpath = os.path.realpath(f_fullpath)
            print i, j, k, t, realpath, str(datetime.now())
            fileName, fileExtension = os.path.splitext(realpath)
            if fileExtension != '.html':
                continue
            c.execute('SELECT * FROM app_parse_read WHERE html_file_path = ?', (realpath, ))
            r = c.fetchone()
            if r != None:
                i = i + 1
                continue
            parse_file_app(realpath)
            i = i + 1
        k = k + 1
        print "===="
    c.close()
            


if __name__ == '__main__':
    loop_dir('./html0')
    #parse_file('/Users/jianhuashao/github/AmazonAppStoreScrape/html0/web/http___www.amazon.com_GabySoft-FlipPix-Art-Nature_dp_B006QAK25Q.html')
    #parse_file('/Users/jianhuashao/github/AmazonAppStoreScrape/html0/web/http___www.amazon.com_1-Yurei-Me-Japanese_dp_B004P572SY.html')
    #parse_file_app('C:/Users/psxjs4/Documents/GitHub/AmazonAppStoreScrape/html0/web/http___www.amazon.com_Android-eBook-Source-Code-Moblie_dp_B00AHVJB6Q.html')
