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
INSERT OR REPLACE INTO app_review_parse 
(r_id, asin, helpful_voting_i, helpful_voting_t, rating_score, title, r_date, author, author_link, verified_purchase, app_name, comment, create_date, update_date) 
VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
'''
def parse_file_app_review(p, asin):
	#print p
	soup = BeautifulSoup(open(p).read())
	comments = soup.find_all(text=lambda text:isinstance(text, Comment))
	for comment in comments:
		if comment.strip().upper() == 'BOUNDARY':
			print comment.strip()
			r_id_a = comment.next_sibling.next_sibling
			r_d_div = r_id_a.next_sibling.next_sibling.next_sibling
			r_id = r_id_a['name']
			#print r_d_div
			#### voting
			voting = r_d_div.find_all(name='div', text=re.compile('people found the following review helpful'))
			if len(voting) == 1:
				voting_count = voting[0].text.replace('people found the following review helpful', '').strip()
				voting_counts = voting_count.split('of')
				helpful_voting_i = voting_counts[0].strip()
				helpful_voting_t = voting_counts[1].strip()
			else:
				helpful_voting_i = 'none'
				helpful_voting_t = 'none'

			#### rating
			rating = r_d_div.find_all(name='span', attrs={'style':'margin-right:5px;'})
			if len(rating) == 1:
				rating_score = rating[0].text.strip()
				rating_score = rating_score.replace('out of 5 stars', '')
			else:
				rating_score = 'none'

			#### title
			title_span = r_d_div.find_all(name='span', attrs={'style':'vertical-align:middle;'})
			if len(title_span) == 1:
				title = title_span[0].b.text.strip()
				title = title.replace('out of 5 stars', '')
				r_date = title_span[0].nobr.text.strip()
			else:
				title = 'none'
				r_Date = 'none'

			#### author
			author_span = r_d_div.find_all(name='span', attrs={'style':'font-weight: bold;'})
			if len(author_span) == 1:
				author = author_span[0].text.strip()
			else:
				author = 'none'
			author_link_a = r_d_div.find_all(name='a', text='See all my reviews')
			if len(author_link_a) == 1:
				author_link = author_link_a[0]['href']
			else:
				author_link = 'none'

			#### Amazon Verified Purchase
			verified_purchase_if = r_d_div.find_all(name='b', text='Amazon Verified Purchase')
			if len(verified_purchase_if) > 0:
				verified_purchase = 'true'
			else:
				verified_purchase = 'false'

			#### comment 
			app_name_span = r_d_div.find_all(name='span', text='This review is from: ')
			if len(app_name_span) == 1:
				app_name = app_name_span[0].parent.text.strip().replace('This review is from: ', '').strip()
				comment = app_name_span[0].parent.parent.next_sibling.strip()
			else:
				app_name = 'none'
				comment = 'none'

			## db insert
			c = db.cursor()
			c.execute(sql_db_review_parse_insert, (r_id, asin, helpful_voting_i, helpful_voting_t, rating_score, title, r_date, author, author_link, verified_purchase, app_name, comment, str(datetime.now()), str(datetime.now())))
			db.commit()
			c.close()
			print r_id
			#print r_id, helpful_voting_i, helpful_voting_t, rating_score, title, r_date, author, author_link
			#print verified_purchase, app_name
			#print comment
			#print '====='


def loop_dir(p):
	i = 0
	for path, dirs, files in os.walk(p):
		for f_app_review in files:
			fileName, fileExtension = os.path.splitext(f_app_review)
			if fileExtension != '.html':
				break
			asin = path.replace('./html_review/', '').strip()
			fullpath = os.path.join(path, f_app_review)
			realpath = os.path.realpath(fullpath)
			print i, realpath, asin, str(datetime.now())
			parse_file_app_review(realpath, asin)
			i = i + 1
			#return
		print "=="

if __name__ == '__main__':
	loop_dir('./html_review')
	#parse_file_app_review('/Users/jianhuashao/github/AmazonAppStoreScrape/html_review/B004GJ6BY0/4.html', 'asin')
