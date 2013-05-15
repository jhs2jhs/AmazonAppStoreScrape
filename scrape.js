///////////////////////
// global variables top levels
global.g_db_path = 'amazon_scrape.db'
///////////////////////

var scrape_cate_1 = require('./scrape_cate_1.js');
var scrape_cate_2 = require('./scrape_cate_2.js');
var scrape_app = require('./scrape_app.js');
var myutil = require('./myutil.js');

myutil.db_show(g_db_path);

var run_stage = 1;

switch(run_stage) {
case 1:
    scrape_cate_1.download_frontpage();
    scrape_cate_1.download_frontpage_addition();
    scrape_cate_1.cate_app_counts_read();
    scrape_cate_1.cate_page_generate();
    scrape_cate_1.cate_page_read();
    break;
case 2:
    scrape_cate_2.download_frontpage();
    scrape_cate_2.cate_app_counts_read();
    scrape_cate_2.cate_page_generate();
    scrape_cate_2.cate_page_read();
    break;
case 0:
    scrape_app.app_page_read();
    break;
}