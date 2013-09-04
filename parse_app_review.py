import parse_app
import os

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
		print "=="

if __name__ == '__main__':
	loop_dir('./html_review')
