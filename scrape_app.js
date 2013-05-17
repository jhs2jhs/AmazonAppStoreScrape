var fs = require('fs');
var cheerio = require('cheerio');
var url = require("url");
var myutil = require('./myutil.js');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(global.g_db_path);
var client = require('./client.js');

///////////////////////////////////////
var sql_app_web_download_update = "UPDATE app_web_download SET read_status = 1,  file_path = ?,  update_date = ? WHERE app_asin = ? ";
function response_process_web(callback, vars, response, body){
    console.log('5 respnse_process_web');
    var response_date = response.headers.date;
    db.run(sql_app_web_download_update, vars.fs_path, response_date, vars.asin, function(err){
	var o = ''+vars.asin+' | '+vars.folder_path+ " | "+ + response.statusCode + ' | '+ response_date;
	console.log(o);
	callback();
    });
}

////////////////////////////////////////
function download_app_web (callback, asin, a_url) {
    folder_path = './html0';
    fs.mkdir(folder_path, function(){});
    folder_path = './html0/web';
    fs.mkdir(folder_path, function(){});
    var fs_path = a_url+'.html';
    fs_path = myutil.fs_path_normal(fs_path);
    fs_path = ""+folder_path +"/" +fs_path;
    //console.log(fs_path);
    var vars = {uri:a_url, fs_path:fs_path, folder_path:folder_path, asin:asin}
    myutil.request_amazon_appstore(callback, response_process_web, vars);
}

////////////////////////////////////////
function download_app_web_cp (callback, asin, a_url) {
    console.log('3 download_app_web_cp');
    folder_path = './html0';
    fs.mkdir(folder_path, function(){});
    folder_path = './html0/web';
    fs.mkdir(folder_path, function(){});
    var fs_path = a_url+'.html';
    fs_path = myutil.fs_path_normal(fs_path);
    fs_path = ""+folder_path +"/" +fs_path;
    //console.log(fs_path);
    var vars = {uri:a_url, fs_path:fs_path, folder_path:folder_path, asin:asin}
    myutil.request_amazon_appstore_flow_control(callback, client.flow_control_jobs_put, response_process_web, vars);
}

////////////////////////////////////////
var old_asin = ''
function app_page_read_i(){
    var sql_app_get = 'SELECT app_asin, app_url FROM app_web_download WHERE read_status = 0';
    db.get(sql_app_get, function(err, row){
	//console.log(row);
	if (row == undefined){
	    console.log('app_page_read is done');
	    return
	}
	var asin = row.app_asin;
	var a_url = row.app_url;
	if (old_asin != asin){
	    download_app_web(app_page_read, asin, a_url);
	    old_asin = asin;
	} else {
	    db.run('UPDATE app_web_download SET read_status = 10, update_date = ? WHERE app_asin = ?', new Date().getTime(), asin);
	}
    });
}
function app_page_read() {
    setTimeout(app_page_read_i, myutil.timeout_ms);
}

function app_page_read_i_cp(){
    console.log('2 app_page_read_i_cp');
    var sql_app_get = 'SELECT app_asin, app_url FROM app_web_download WHERE read_status = 0';
    db.get(sql_app_get, function(err, row){
	console.log('2 app_page_read_i_cp:', err, (row == undefined));
	if (err != null || row == undefined){
	    if (err == null) {
		console.log('app_page_read is done');
	    } else {
		consoel.log('app_page_read is not null');
	    }
	    client.flow_control_jobs_put();
	} else {
	    var asin = row.app_asin;
	    var a_url = row.app_url;
	    if (asin == undefined || a_url == undefined){
		console.log('2 app_people_read_i_cp asin', asin);
		client.flow_control_jobs_put();
		//app_page_read_cp();
	    } else {
		if (old_asin != asin){
		    download_app_web_cp(app_page_read_cp, asin, a_url);
		    old_asin = asin;
		} else {
		    db.run('UPDATE app_web_download SET read_status = 10, update_date = ? WHERE app_asin = ?', new Date().getTime(), asin, function(err){
			if (err != null){
			    console.log('2 app_page_read_i_cp db_run error');
			    app_page_read_cp();
			}
		    });
		}
	    }
	}
    });
}
function app_page_read_cp() {
    console.log('1 app_page_read_cp');
    setTimeout(app_page_read_i_cp, myutil.timeout_ms);
}

module.exports.app_page_read = app_page_read;
module.exports.app_page_read_cp = app_page_read_cp;