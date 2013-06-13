var fs = require('fs');
var cheerio = require('cheerio');
var url = require("url");
var myutil = require('./myutil.js');
var sqlite3 = require('sqlite3').verbose();
global.g_db_path = './amazon_client.db';
var db = new sqlite3.Database(global.g_db_path);
var sprintf = require('util').format;

function response_process_web_review(callback, client_callback, review_page_i, review_page_total, asin, response_date, fs_path){
    read_status = 0;
    var review_page_next = review_page_i+1;
    if (review_page_i == review_page_total){
	read_status = 1;
	review_page_next = review_page_i;
    }
    console.log('\t6 => ', review_page_i, review_page_total, read_status);
    var sql_app_review_download_update = sprintf("UPDATE app_review_download SET read_status = %s, review_page_i=%s, review_page_total=%s, update_date = '%s' WHERE app_asin = '%s';", read_status, review_page_next, review_page_total, response_date, asin);
    var sql_app_review_download_result_insert = sprintf("INSERT OR REPLACE INTO app_review_download_result (app_asin, review_page_i, file_path, read_status, create_date) VALUES ('%s',%s,'%s',%s,'%s');", asin, review_page_next, fs_path, '1', response_date);
    var sql = sql_app_review_download_update+'\n'+sql_app_review_download_result_insert;
    db.exec(sql, function(err){
	console.log('\t\t => '+asin+' | '+review_page_i+' | '+review_page_total, err);
	if (!err) {
	    callback(client_callback);
	} else {
	    console.log(sql);
	    console.log('******* error in response_process_web_review****');
	}
    });
}


function response_process_web_review_home(callback, client_callback, vars, response, body){
    console.log('\t5 response_process_web_review_home', vars.review_page_i);
    var response_date = response.headers.date;
    old_review_page_i = vars.review_page_i;
    if (vars.review_page_i > 0 & vars.review_page_total > 0) {
	response_process_web_review(callback, client_callback, vars.review_page_i, vars.review_page_total, vars.asin, response_date, vars.fs_path);
	return
    }
    $ = cheerio.load(body);
    var a = $('span[class=crAvgStars]').text().trim();
    if (a == '') {
	var sql_app_review_download_update = "UPDATE app_review_download SET read_status = 1, review_page_i=0, review_page_total=0, update_date = ? WHERE app_asin = ? ";
	db.run(sql_app_review_download_update, response_date, vars.asin, function(err){
	    console.log('\t\t'+vars.asin+' | 0');
	    callback(client_callback);
	});
	return
    } else {
	var n = a.match(/([0-9]|,)* customer/g);
	if (n.length == 1){
	    n = n[0].match(/([0-9]|,)*/g)[0];
	    n = n.replace(',', '');
	    p_t = Math.floor(parseInt(n)/10)+1;
	    console.log('\t5 response_process_web_review_home', n, p_t)
	    review_page_i = 1;
	    review_page_total = p_t;
	    response_process_web_review(callback, client_callback, review_page_i, review_page_total, vars.asin, response_date, vars.fs_path);
	    return
	} else {
	    callback(client_callback);
	    return
	}
    }
    return
}

function download_app_review_home_cp(callback, client_callback, asin, a_url, review_page_i, review_page_total){
    console.log('\t3 download_app_web_cp');
    //folder_path = './html_review';
    //fs.mkdir(folder_path, function(){});
    folder_path = './html_review/'+asin;
    fs.mkdirSync(folder_path);
    review_page_i = parseInt(review_page_i);
    review_page_total = parseInt(review_page_total);
    var fs_path = (review_page_i)+'.html';
    //fs_path = myutil.fs_path_normal(fs_path);
    fs_path = ""+folder_path +"/" +fs_path;
    //console.log(fs_path);
    var vars = {uri:a_url, fs_path:fs_path, folder_path:folder_path, asin:asin, review_page_i:review_page_i, review_page_total:review_page_total}
    // callback, err_callback
    myutil.request_amazon_appstore_flow_control_review(callback, client_callback, callback, response_process_web_review_home, vars);
}


function app_review_read_i(callback, asin, review_page_i, review_page_total){
    if (review_page_i == 0) {
	review_page_i = 1;
    }
    var a_url = 'http://www.amazon.com/product-reviews/'+asin+'/ref=cm_cr_pr_top_link_2?ie=UTF8&pageNumber='+review_page_i+'&showViewpoints=0&sortBy=bySubmissionDateDescending'
    console.log("\t2 app_review_read_i_cp db.get old_asin", old_asin, asin, old_review_page_i, review_page_i);
    if (old_asin == asin & (parseInt(review_page_total) == 0 || old_review_page_i == parseInt(review_page_i))){
	db.run('UPDATE app_review_download SET read_status = 10, update_date = ? WHERE app_asin = ?', new Date().getTime(), asin, function(err){
	    if (err != null){
		console.log('\t2 app_review_read_i_cp db_run error');
		callback();
		return
	    } else {
		console.log('\t2 app_review_read_i_cp db_run noerror');
		callback();
		return
	    }
	});
    } else {
	download_app_review_home_cp(app_review_read_cp, callback, asin, a_url, review_page_i, review_page_total); ////
	old_asin = asin;
    }
}

var old_asin = ''
var old_review_page_i = -1
function app_review_read_i_cp(callback){
    console.log('\t2 app_review_read_i_cp');
    var sql_app_get = 'SELECT app_asin, review_page_i, review_page_total FROM app_review_download WHERE read_status = 0';
    db.get(sql_app_get, function(err, row){
	console.log('\t2 app_review_read_i_cp db.get:', err, (row == undefined));
	if (err != null || row == undefined){
	    if (err == null) {
		console.log('\tapp_review_read is done');
	    } else {
		console.log('\tapp_review_read is not null');
	    }
	    callback();
	    return
	} else {
	    var asin = row.app_asin;
	    var review_page_i = row.review_page_i;
	    var review_page_total = row.review_page_total;
	    //console.log(row);
	    if (asin == undefined || review_page_i == undefined || review_page_total == undefined){
		console.log('\t2 app_review_read_i_cp db.get asin', asin);
		callback();
		return
	    } else {
		review_page_i = parseInt(review_page_i);
		review_page_total = parseInt(review_page_total);
		app_review_read_i(callback, asin, review_page_i, review_page_total);
	    }
	}
    });
}

function app_review_read(){
}

function app_review_read_cp(callback) {
    console.log('\t1 app_page_read_cp');
    setTimeout(app_review_read_i_cp, myutil.timeout_ms, callback);
}

module.exports.app_review_read_cp = app_review_read_cp;

//app_review_read_i_cp(function(){});
//app_review_read_i(function(){}, 'B0067VKQLE', 0, 0);
//app_review_read_i(function(){}, 'B00CXNRA5U', 0, 0);
//app_review_read_i(function(){}, 'B00D6PBTLA', 0, 0);