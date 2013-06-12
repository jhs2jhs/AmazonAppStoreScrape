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

2. 