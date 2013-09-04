import my
db_path = './amazon_parse_html.db'
my.db_init(db_path)
import sqlite3
db = sqlite3.connect(db_path)
import os
from bs4 import BeautifulSoup
import codecs
import re

show_step = False

def get_field_by_attrs_n(label, soup, name, attrs, n):
    if show_step:
        print "**", label, "==", 
    bs = soup.find_all(name=name, attrs=attrs)
    t = bs[n].text.strip()
    if show_step:
        print t
    return t

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
        raise Exception('one_must_get_field', '%s: %s : %s'%(label, unicode(len(bs)), unicode(bs)))
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
    

    

def parse_file(p):
    print p
    #f = codecs.open(p, 'r', 'utf-8')
    soup = BeautifulSoup(open(p).read())
    #### product details
    asin = one_must_get_field_by_text('asin', soup, 'b', {}, 'ASIN:', 'ASIN:', '')
    org_date = one_must_get_field_by_text('org_date', soup, 'b', {}, 'Original Release Date:', 'Original Release Date:', '')
    amn_date = one_must_get_field_by_text('amn_date', soup, 'b', {}, ' Date first available at Amazon.com:', 'Date first available at Amazon.com:', '')
    rated = one_must_get_field_by_attrs('rated', soup, 'a', {'id':"mas-product-rating-definition"})
    best_seller_rank = one_may_get_field_by_text('best_seller_rank', soup, 'b', {}, 'Amazon Best Sellers Rank:', 'Amazon Best Sellers Rank:', '')
    #### product top
    app_title = one_must_get_field_by_attrs('title', soup, 'span', {'id':'btAsinTitle'})
    app_author =  one_must_get_field_by_href_regexp('author', soup, 'a', 's/ref=bl_sr_mobile-apps') ## have problem
    app_platform = get_field_by_attrs_n('platform', soup, 'span', {'class': 'mas-platform-value'}, 0)
    price = one_must_get_field_by_attrs('price', soup, 'b', {'class':'priceLarge'})
    sold_by = one_must_get_field_by_attrs_textrp('sold_by', soup, 'td', {'class':'priceBlockLabel', 'id':''}, 'Sold by:', '')
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
    print asin, org_date, amn_date, rating_count, rating_score, len(permission_list), len(relate_app_asins)
    
    
    

def loop_dir(p):
    i = 0
    for path, dir_web, files_app in os.walk(p):
        for f_app in files_app:
            fileName, fileExtension = os.path.splitext(f_app)
            if fileExtension != '.html':
                break
            print '============='
            fullpath = os.path.join(path, f_app)
            realpath = os.path.realpath(fullpath)
            parse_file(realpath)
            i = i + 1
            print i
            #return
            


if __name__ == '__main__':
    loop_dir('./html0')
    #parse_file('/Users/jianhuashao/github/AmazonAppStoreScrape/html0/web/http___www.amazon.com_GabySoft-FlipPix-Art-Nature_dp_B006QAK25Q.html')
    #parse_file('/Users/jianhuashao/github/AmazonAppStoreScrape/html0/web/http___www.amazon.com_1-Yurei-Me-Japanese_dp_B004P572SY.html')
