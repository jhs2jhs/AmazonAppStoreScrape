import parse_app
import os
import my
db_path = './amazon_parse_html.db'
import sqlite3
db = sqlite3.connect(db_path)
from bs4 import BeautifulSoup, Comment
import codecs
import re
from datetime import datetime

sql_db_review_parse_insert = '''
UPDATE app_parse SET category = ?, game_sub = ? WHERE asin = ?
'''
def parse_file_app_category(p, category, game_sub):
	#print p
	c = db.cursor()
	asins = {}
	## to spped up, have to use lxml library as parser , it would require external c library
	soup = BeautifulSoup(open(p).read())
	apps_d = soup.find_all(name='div', attrs={'name':True})
	for app_d in apps_d:
		asin = app_d['name'].strip()
		if not asins.has_key(asin):
			asins[asin] = {}
	apps_d = soup.find_all(name='td', attrs={'name':True})
	for app_d in apps_d:
		asin = app_d['name'].strip()
		if not asins.has_key(asin):
			asins[asin] = {}
	if len(asins) > 0:
		print '\t', len(asins)
		c = db.cursor()
		for asin in asins:
			c.execute(sql_db_review_parse_insert, (category, game_sub, asin))
		db.commit()
		c.close()
	return len(asins)


# html folder: it is initially used by macos
def loop_dir_1(p):
	dir_lists = os.listdir(p)
	t = len(dir_lists)
	k = 0
	for dir_list in dir_lists:
		#dir_list = 'books & comics_2478833011'
		dir_fullpath = os.path.join(p, dir_list)
		t = 0
		if not os.path.isdir(dir_fullpath):
			print '**********is not dir', dir_fullpath
			continue
		f_lists = os.listdir(dir_fullpath)
		if len(dir_list.split("_")) > 2:
			category = 'games'
			game_sub = dir_list.split("_")[0].strip().lower()
		else:
			category = dir_list.split("_")[0].strip().lower()
			game_sub = ''
		i = 0
		j = len(f_lists)
		for f_list in f_lists:
			#print f_list
			f_fullpath = os.path.join(dir_fullpath, f_list)
			if not os.path.isfile(f_fullpath):
				print '**********is not file', f_fullpath
				continue
			realpath = os.path.realpath(f_fullpath)
			#print i, j, k, t, realpath, str(datetime.now())
			fileName, fileExtension = os.path.splitext(realpath)
			if fileExtension != '.html':
				continue
			t = t + parse_file_app_category(realpath, category, game_sub)
			#print t
			#return
			i = i + 1
		k = k + 1
		print "====", dir_list, t, category, game_sub


## html2 folder: it is used by DTC. This is the default one
def loop_dir_2(p):
	dir_lists = os.listdir(p)
	t = len(dir_lists)
	k = 0
	for dir_list in dir_lists:
		#dir_list = 'books & comics_2478833011'
		dir_fullpath = os.path.join(p, dir_list)
		t = 0
		if not os.path.isdir(dir_fullpath):
			print '**********is not dir', dir_fullpath
			continue
		f_lists = os.listdir(dir_fullpath)
		category = dir_list.split("_")[0].strip().lower()
		game_sub = ''
		print "==== start ", dir_list, t, category, game_sub
		i = 0
		j = len(f_lists)
		for f_list in f_lists:
			#print f_list
			f_fullpath = os.path.join(dir_fullpath, f_list)
			if not os.path.isfile(f_fullpath):
				print '**********is not file', f_fullpath
				continue
			realpath = os.path.realpath(f_fullpath)
			#print i, j, k, t, realpath, str(datetime.now())
			fileName, fileExtension = os.path.splitext(realpath)
			if fileExtension != '.html':
				continue
			t = t + parse_file_app_category(realpath, category, game_sub)
			#print t
			#return
			i = i + 1
		k = k + 1
		print "==== end ", dir_list, t, category, game_sub


if __name__ == '__main__':
	#loop_dir_1('./html/category')
	loop_dir_2('./html2/category')
	#print parse_file_app_category('/Users/jianhuashao/github/AmazonAppStoreScrape/html/category/books & comics_2478833011/http___www.amazon.com_b_ref=sr_pg_522?ie=UTF8&node=2478833011&page=522.html', 'book')
	#parse_file_app_review('/Users/jianhuashao/github/AmazonAppStoreScrape/html_review/B004GJ6BY0/4.html', 'asin')
