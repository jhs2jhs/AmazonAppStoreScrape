var fs = require('fs');
var cheerio = require('cheerio');
var url = require("url");
var myutil = require('./myutil.js');
db = myutil.db;

///////////////////////////////////////
var sql_cate_insert = "INSERT OR IGNORE INTO category2 (cate, cate_lower, cate_nodeid, cate_type, create_date, update_date) VALUES (?,?,?,?,?,?)";
function response_process_homepage(callback, vars, response, body){
    var response_date = response.headers.date;
    var o = ''+vars.folder_path+ " | "+ + response.statusCode + ' | '+ response_date;
    console.log(o);
    $ = cheerio.load(body);
    var i = 0;
    $('body').find('a').each(function(){
	var href = $(this).attr('href');
	if (href == undefined) {
	    return
	}
	var category = $(this).text().trim();
	var category_l = category.toLowerCase().trim();
	var url_t = url.parse(href, true);
	var url_pathname = url_t.pathname;
	var url_query = url_t.query;
	if ((url_pathname == null) || (url_query.rh == undefined)) {
	    return
	}
	var sr_nr_p_n = url_pathname.indexOf('s/ref=sr_nr_n');
	if (sr_nr_p_n > 0) {
	    var cate_nodeid = url_query.rh;
	    var cate_type = 's'
	    db.run(sql_cate_insert, category, category_l, cate_nodeid, cate_type, response_date, response_date);
	    console.log(i+" : "+ cate_type +":"+url_query.node + '  :  ' + category );
	    i = i + 1
	}
    });
    callback()
}



///////////////////////////////////////
var sql_cate_done_update = "UPDATE category2 SET read_status = ?, app_counts= ?, update_date = ? WHERE cate_nodeid = ?";
function response_process_category_first(callback, vars, response, body){
    var response_date = response.headers.date;
    $ = cheerio.load(body);
    $('.resultCount').each(function(){
	app_counts = $(this).text();
	app_counts = app_counts.split('of')[1].trim().split(' ')[0].trim().replace(',', '');
	//console.log(sql_cate_done_update);
	//console.log(vars.cate_nodeid);
	db.run(sql_cate_done_update, '1', app_counts, response_date, vars.cate_nodeid);
	var o = ''+ app_counts+"|"+vars.cate_lower +"|"+vars.cate_type + "|" + vars.folder_path+ " | "+ + response.statusCode + ' | '+ response_date;
	console.log(o);
    }); 
    callback();
}


var flag_cate_nodeid_old = '';
var flag_cate_i_count_old = 0;
///////////////////////////////////////
var sql_app_web_download_insert = "INSERT OR IGNORE INTO app_web_download (app_asin, app_name, app_name_lower, app_url, create_date, update_date) VALUES (?,?,?,?,?,?)";
var sql_cate_i_done = "UPDATE category2_i SET read_status=1, file_path = ?, update_date = ? WHERE cate_nodeid = ? AND page_i = ?";
function response_process_category(callback, vars, response, body){
    var response_date = response.headers.date;
    $ = cheerio.load(body);
    var i = 0;
    if (flag_cate_nodeid_old != vars.cate_nodeid){
	flag_cate_nodeid_old = vars.cate_nodeid;
	flag_cate_i_count_old = 12;
    }
    $('a').each(function(){
	var href = $(this).attr('href');
	if (href == undefined) {
	    return
	}
	var app_name = $(this).text().trim();
	var app_name_l = app_name.toLowerCase()
	if (app_name_l == 'download' || app_name_l == '') {
	    return
	}
	var url_t = url.parse(href, true);
	var url_host = url_t.host;
	var url_protocol = url_t.protocol;
	var url_pathname = url_t.pathname;
	var url_query = url_t.query;
	if (url_query.s != undefined & url_query.s == 'mobile-apps'){
	    asins = url_pathname.split('/ref=')[0];
	    app_url = ''+url_t.protocol+"//"+url_t.host+asins;
	    asin = asins.split('/')[3];
	    //console.log(asin);
	    db.run(sql_app_web_download_insert, asin, app_name, app_name_l, app_url, response_date, response_date);
	    i = i + 1;
	}
    });
    db.run(sql_cate_i_done, vars.fs_path, response_date, vars.cate_nodeid, vars.page_i);
    //console.log(flag_cate_nodeid_old, flag_cate_i_count_old, i);
    if (flag_cate_i_count_old == 0 && i == 0){
	db.run('UPDATE category_i SET read_status = 1, update_date = ? WHERE cate_nodeid = ? AND page_i > ?', response_date, vars.cate_nodeid, vars.page_i+1);
    } else {
	flag_cate_i_count_old = i;
    }
    /*
    var pagenext = $('.pagnNext').length;
    if (pagenext == 0) {
	console.log(sql_cate_done_update+vars.cate_nodeid);
	db.run(sql_cate_done_update, '1', response_date, vars.cate_nodeid, db_run_error);
    }*/
    var o = ''+i +"|"+ vars.page_i + "|"+vars.cate_lower+ ' | '+vars.folder_path+ " | "+ + response.statusCode + ' | '+ response_date;
    console.log(o);
    callback();
}


//////////////////////////////////////
function download_frontpage (){
    folder_path = './html2';
    fs.mkdir(folder_path, function(){});
    fs.mkdir(folder_path+"/category", function(){});
    fs.mkdir(folder_path+"/web", function(){});
    var a_url = 'http://www.amazon.com/s/ref=sr_ex_n_1?rh=n%3A2350149011&bbn=2350149011'
    var fs_path = a_url+'.html';
    fs_path = myutil.fs_path_normal(fs_path);
    fs_path = ""+folder_path +"/" +fs_path
    console.log(fs_path);
    var vars = {uri:a_url, fs_path:fs_path, folder_path:folder_path}
    myutil.request_amazon_appstore(function(){}, response_process_homepage, vars);
}


function download_category (callback, cate_type, cate_lower, page_i, cate_nodeid, first) {
    var folder_path = './html2/category/'+cate_lower+'_'+cate_nodeid;
    folder_path = folder_path.replace(new RegExp(':', 'g'), '_');
    folder_path = folder_path.replace(new RegExp(',', 'g'), '_');
    fs.mkdir(folder_path, function(){})
    //console.log(folder_path, cate_type)
    var a_url = ''
    if (cate_type == 'b'){
	a_url = 'http://www.amazon.com/b/ref=sr_pg_'+page_i+'?ie=UTF8&node='+cate_nodeid+"&page="+page_i;
    }
    if (cate_type == 's'){
	a_url = 'http://www.amazon.com/s/ref=sr_pg_'+page_i+'?ie=UTF8&rh='+cate_nodeid+"&page="+page_i;
    }
    console.log(a_url);
    var fs_path = a_url+'.html';
    fs_path = myutil.fs_path_normal(fs_path);
    fs_path = ""+folder_path +"/" +fs_path;
    //console.log(fs_path);
    var vars = {uri:a_url, fs_path:fs_path, folder_path:folder_path, cate_nodeid:cate_nodeid, page_i:page_i, cate_type:cate_type, cate_lower:cate_lower};
    if (first) {
	myutil.request_amazon_appstore(callback, response_process_category_first, vars);
    } else {
	myutil.request_amazon_appstore(callback, response_process_category, vars);
    }
}


////////////////////////////////
function cate_app_counts_read_i(){
    var sql_cate_get = 'SELECT cate_nodeid, cate_lower, cate_type FROM category2 WHERE read_status = 0';
    db.get(sql_cate_get, function(err, row){
	//console.log(row);
	if (row == undefined){
	    console.log('cate_app_counts_read is done');
	    return
	}
	page_i = 1;
	cate_type = row.cate_type, 
	cate_nodeid = row.cate_nodeid;
	cate_lower = row.cate_lower;
	download_category(cate_app_counts_read, cate_type, cate_lower, page_i, cate_nodeid, true);
    });
}
function cate_app_counts_read() {
    setTimeout(cate_app_counts_read_i, myutil.timeout_ms);
}


////////////////////////////////
function cate_page_i_generate(){
    var sql_cate_get = 'SELECT app_counts, cate, cate_lower, cate_nodeid, cate_type FROM category2 WHERE read_status = 1 AND app_counts > 0';
    var sql_cate_update = 'UPDATE category2 SET read_status = 2 WHERE cate_nodeid = ?'
    var sql_cate_insert = 'INSERT OR IGNORE INTO category2_i (cate, cate_lower, cate_nodeid, page_i, cate_type, create_date, update_date) VALUES (?,?,?,?,?,?,?)';
    //console.log(sql_cate_get);
    db.get(sql_cate_get, function(err, row){
	if (row == undefined){
	    console.log('cate_page_read is done');
	    return
	}
	if (err){
	    console.log('**error in db.get:'+err);
	    return
	}
	app_counts = row.app_counts;
	cate = row.cate;
	cate_type = row.cate_type;
	cate_lower = row.cate_lower;
	cate_nodeid = row.cate_nodeid;
	page_max = app_counts / 48
	page_max = Math.ceil(page_max) + 1
	if (page_max > 400) {
	    page_max = 400;
	}
	console.log(cate, cate_type, cate_nodeid, app_counts, page_max);
	for (var i = 1; i < page_max+1; i ++){
	    now_date = new Date().getTime();
	    //console.log(app_counts, page_max);
	    page_i = i;
	    db.run(sql_cate_insert, cate, cate_lower, cate_nodeid, page_i, cate_type, now_date, now_date);
	}
	db.run(sql_cate_update, cate_nodeid);
	cate_page_generate();
    });

}
function cate_page_generate(){
    cate_page_i_generate();
}

//////////////////////////////////////////
function cate_page_read_i(){
    var sql_cate_get = 'SELECT cate_nodeid, cate_lower, cate_nodeid, page_i, cate_type FROM category2_i WHERE read_status = 0';
    db.get(sql_cate_get, function(err, row){
	//console.log(row);
	if (row == undefined){
	    return
	}
	cate_type = row.cate_type;
	page_i = row.page_i;
	cate_nodeid = row.cate_nodeid;
	cate_lower = row.cate_lower;
	download_category(cate_page_read, cate_type, cate_lower, page_i, cate_nodeid, false);
    });
}
function cate_page_read() {
    setTimeout(cate_page_read_i, myutil.timeout_ms);
}


///////////////////////////////////////////
module.exports.download_frontpage = download_frontpage;
module.exports.cate_app_counts_read = cate_app_counts_read;
module.exports.cate_page_generate = cate_page_generate;
module.exports.cate_page_read = cate_page_read;

