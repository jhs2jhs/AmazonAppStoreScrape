var fs = require('fs');
var cheerio = require('cheerio');
var url = require("url");
var myutil = require('./myutil.js');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./amazon_parse_html.db');

///////////////////////////////////////
var sql_app_web_download_update = "UPDATE appid_to_asin SET read_status = 1,  file_path = ?, update_date = ? WHERE app_id = ? ";
function response_process_web(callback, vars, response, body){
    console.log('5 respnse_process_web');
    var response_date = response.headers.date;
    db.run(sql_app_web_download_update, vars.fs_path, response_date, vars.app_id, function(err){
		var o = ''+vars.app_id+' | '+vars.folder_path+ " | "+ + response.statusCode + ' | '+ response_date;
		console.log(o);
		callback();
    });
}

////////////////////////////////////////
////////////////////////////////////////
function download_app_web_cp (callback, app_id, a_url) {
    console.log('3 download_app_web_cp');
    folder_path = myutil.folder_path_root;
    folder_path = '../data_row/AmazonAppStoreScrape/appid_to_asin';
    fs.mkdir(folder_path, function(){});
    folder_path = '../data_row/AmazonAppStoreScrape/appid_to_asin/web';
    fs.mkdir(folder_path, function(){});
    var fs_path = a_url+'.html';
    fs_path = myutil.fs_path_normal(fs_path);
    fs_path = ""+folder_path +"/" +fs_path;
    console.log(fs_path);
    var vars = {uri:a_url, fs_path:fs_path, folder_path:folder_path, app_id:app_id}
    myutil.request_amazon_appstore_appid_to_asin(callback, err_response, response_process_web, vars);
}

////////////////////////////////////////
////////////////////////////////////////
function app_page_read_i_cp(){
    console.log('2 app_page_read_i_cp');
    var sql_app_get = 'SELECT app_id FROM appid_to_asin WHERE read_status = 0';
    db.get(sql_app_get, function(err, row){
		//console.log('2 app_page_read_i_cp db.get:', err, (row == undefined));
	    var app_id = row.app_id;
		console.log("2 app_people_read_i_cp db.get app_id", app_id);
		a_url = 'http://www.amazon.com/gp/mas/dl/android?p='+app_id;
		//a_url = 'http://www.amazon.com/gp/mas/dl/android?p=com.rovio.angrybirds'
		console.log(a_url)
		download_app_web_cp(app_page_read_cp, app_id, a_url);
		console.log(app_id);
	});
}
function app_page_read_cp() {
    console.log('\n1 app_page_read_cp');
    setTimeout(app_page_read_i_cp, myutil.timeout_ms);
}

app_page_read_cp()

module.exports.app_page_read_cp = app_page_read_cp;