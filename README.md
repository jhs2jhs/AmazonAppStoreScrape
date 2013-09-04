#AmazonAppStoreScrape
====================

## download app review

1. prepare for db

```
#in root:
	cp amazon_ec2.db ./db_versions/amazon_ec2_11_june_2013.db
	python my.py amazon_ec2.db
	cp amazon_ec2.db ./db_versions/amazon_ec2_11_june_2013_to.db
	# check amazon_ec2.db in root to see if app_review_download table created
# in db_versions:
	python db_worker.py
	# check amazon_ec2_11_june_to_2013.db to see if app_review_download has 3 distinct value for app_web_read_status
#in root
	cp ./db_versions/amazon_ec2_11_june_2013_to.db amazon_ec2.db

```



## in server
```
	./stop
	./start
```

## general tips


1. client_app.js is to scrape for app details.
2. client_review.js is to scrape for app reviews. 
3. callback() should usually followed by return to terminate the loop



## parse app in python local
```
# cmd: 
	python parse_db.py or python parse_db_review.py or (in sequence) python parse_app_main.py
# file merge
	in macbook 
	in dtc make sure to run on both
	need to scrape for new app from related asin as well
	make sure review contains all the history

```