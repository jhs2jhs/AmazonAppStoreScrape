var fs = require('fs');
var cheerio = require('cheerio');
var url = require("url");
var myutil = require('./myutil.js');
var sqlite3 = require('sqlite3').verbose();
//var db = new sqlite3.Database('./amazon_parse_html.db');
var db = new sqlite3.Database(global.g_db_path);
var sprintf = require('util').format;
var client = require('./client_appid_to_asin.js')

///////////////////////////////////////
var sql_app_web_download_update = 'UPDATE appid_to_asin_download SET read_status = 1,  http_status_code = %s, file_path = "%s", update_date = "%s" WHERE app_id = "%s" ';
function response_process_web(callback, vars, response, body){
    console.log('5 respnse_process_web');
    var response_date = response.headers.date;
    sql = sprintf(sql_app_web_download_update, vars.statusCode, vars.fs_path, response_date, vars.app_id)
    db.run(sql, function(err){
    	//console.log(err, sql);
		var o = ''+vars.app_id+' | '+vars.folder_path+ " | "+ + vars.statusCode + ' | '+ response_date;
		console.log(o);
		callback();
    });
}

function err_response_process_web(callback, vars, body){
    console.log('6 err respnse_process_web');
    sql = sprintf(sql_app_web_download_update, vars.statusCode, vars.fs_path, '', vars.app_id)
    db.run(sql, function(err){
    	//console.log(err, sql);
		var o = ''+vars.app_id+' | '+vars.folder_path+ " | " + vars.statusCode + ' | ';
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
    myutil.request_amazon_appstore_appid_to_asin(callback, err_response_process_web, response_process_web, vars);
}

////////////////////////////////////////
////////////////////////////////////////
function app_page_read_i_cp(){
    console.log('2 app_page_read_i_cp');
    var sql_app_get = 'SELECT app_id FROM appid_to_asin_download WHERE read_status = 0';
    db.get(sql_app_get, function(err, row){
		if (err != null || row == undefined){
	    	if (err == null) {
				console.log('app_page_read is done');
	    	} else {
				consoel.log('app_page_read is not null');
	    	}
	    	client.flow_control_jobs_put();
		} else {
			var app_id = row.app_id;
	    	if (app_id == undefined){
	    		client.flow_control_jobs_put();
	    	} else {
	    		console.log("2 app_people_read_i_cp db.get app_id", app_id);
				a_url = 'http://www.amazon.com/gp/mas/dl/android?p='+app_id;
				//a_url = 'http://www.amazon.com/gp/mas/dl/android?p=com.rovio.angrybirds'
				console.log(a_url)
				download_app_web_cp(app_page_read_cp, app_id, a_url);
				console.log(app_id);
	    	}
		}
	    
	});
}
function app_page_read_cp() {
    console.log('\n1 app_page_read_cp');
    setTimeout(app_page_read_i_cp, myutil.timeout_ms);
}

module.exports.app_page_read_cp = app_page_read_cp;