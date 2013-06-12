///////////////////////
// global variables top levels
global.g_db_path = './amazon_client.db';
//////////////////////
//var c_id = 'macbookpro';
var c_id = 'dtc';
var jobs_count = '10';

var myutil = require('./myutil.js');
var ec2_addr = myutil.ec2_addr;


var inspect = require('util').inspect;
var scrape_app = require('./scrape_app.js');

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(g_db_path);
var sprintf = require('util').format;
var querystring = require('querystring');
var domain = require('domain').create();

myutil.db_show(g_db_path);