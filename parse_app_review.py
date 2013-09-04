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

def parse_file_app_review(p):
	print p
	soup = BeautifulSoup(open(p).read())
	comments = soup.find_all(text=lambda text:isinstance(text, Comment))
	for comment in comments:
		print comment


def loop_dir(p):
	i = 0
	for path, dirs, files in os.walk(p):
		for f_app_review in files:
			fileName, fileExtension = os.path.splitext(f_app_review)
			if fileExtension != '.html':
				break
			fullpath = os.path.join(path, f_app_review)
			realpath = os.path.realpath(fullpath)
			parse_file_app_review(realpath)
			i = i + 1
			print i, realpath
			return
		print "=="

if __name__ == '__main__':
	loop_dir('./html_review')
