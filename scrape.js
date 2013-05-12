var request = require("request");
var inspect = require('util').inspect;
var fs = require('fs');
var cheerio = require('cheerio');
var url = require("url");
var path = require('path');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./amazon.db');
var spawn = require('child_process').spawn;
py_sql = spawn('python', ['my.py']);
py_sql.stdout.on('data', function(data){
    console.log('STDOUT py_sql: '+data);
});
py_sql.stderr.on('data', function(data){
    console.log('STDERR py_sql: '+data);
});
var http = require('http');
http.globalAgent.maxSockets = 1;

///////////////////////////////////////
function fs_path_normal(fs_path) {
    fs_path = fs_path.replace(new RegExp('/', 'g'), '_');
    fs_path = fs_path.replace(new RegExp(':', 'g'), '_');
    return fs_path
}

function db_run_error(err){
    //console.log('db_run_error:'+err)
}

///////////////////////////////////////
function request_amazon_appstore(response_process, vars){
    // doc in https://npmjs.org/package/request 
    var r_options = {
	uri: vars.uri,
	method: 'GET',
	timeout: 10000, // milliseconds
	maxRedirects: 10,
	followRedirect:false, // to avoid jump to home page
	//pool.maxSockets:1,
	proxy:'',
	qs:{},
	headers:{'Accept':'text/html'}
    };
    
    var file = fs.createWriteStream(vars.fs_path);

    var request_function = function(error, response, body){
	// the response can be undefined
	if (! error && response.statusCode == 200) {
	    response_process(vars, response, body);
	} 
    };

    try {
	request(r_options, request_function).pipe(file);
    } catch (err) {
	console.log('**error:', err);
    }
}


///////////////////////////////////////
var sql_cate_insert = "INSERT OR IGNORE INTO category (cate, cate_lower, cate_nodeid, create_date, update_date) VALUES (?,?,?,?,?)";
function response_process_homepage(vars, response, body){
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
	var url_t = url.parse(href, true);
	var url_pathname = url_t.pathname;
	var url_query = url_t.query;
	if (url_query.node != undefined){
	    var amb_link = url_pathname.indexOf('b/ref=amb_link');	    
	    if (amb_link > 0){
		var cate_nodeid = url_query.node;
		var category_l = category.toLowerCase().trim();
		db.run(sql_cate_insert, category, category_l, cate_nodeid, response_date, response_date, db_run_error);
		console.log(i+" : "+url_query.node + '  :  ' + category );
		i = i + 1;
	    }
	}
    });
}



///////////////////////////////////////
var sql_cate_done_update = "UPDATE category SET read_status = ?, app_counts= ?, update_date = ? WHERE cate_nodeid = ?";
function response_process_category_first(vars, response, body){
    var response_date = response.headers.date;
    $ = cheerio.load(body);
    $('.resultCount').each(function(){
	app_counts = $(this).text();
	app_counts = app_counts.split('of')[1].trim().split(' ')[0].trim().replace(',', '');
	//console.log(sql_cate_done_update);
	//console.log(vars.cate_nodeid);
	db.run(sql_cate_done_update, '1', app_counts, response_date, vars.cate_nodeid, db_run_error);
	var o = ''+ app_counts + "|" + vars.folder_path+ " | "+ + response.statusCode + ' | '+ response_date;
	console.log(o);
    });    
}


///////////////////////////////////////
var sql_app_web_download_insert = "INSERT OR IGNORE INTO app_web_download (app_asin, app_name, app_name_lower, app_url, create_date, update_date) VALUES (?,?,?,?,?,?)";
function response_process_category(vars, response, body){
    var response_date = response.headers.date;
    $ = cheerio.load(body);
    var i = 0;
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
	    db.run(sql_app_web_download_insert, asin, app_name, app_name_l, app_url, response_date, response_date, db_run_error);
	    i = i + 1;
	}
    });
    var pagenext = $('.pagnNext').length;
    if (pagenext == 0) {
	console.log(sql_cate_done_update+vars.cate_nodeid);
	db.run(sql_cate_done_update, '1', response_date, vars.cate_nodeid, db_run_error);
    }
    var o = ''+i+ "|"+ pagenext + ' | '+vars.folder_path+ " | "+ + response.statusCode + ' | '+ response_date;
    console.log(o);
}


///////////////////////////////////////
function response_process_web(vars, response, body){
    var response_date = response.headers.date;
    db.run(sql_app_web_download_update, vars.file_path, response_date, vars.asin, db_run_error);
    var o = ''+vars.asin+' | '+vars.folder_path+ " | "+ + response.statusCode + ' | '+ response_date;
    console.log(o);
}

var sql_app_web_download_update = "UPDATE app_web_download SET read_status = 1,  file_path = ?,  update_date = ? WHERE app_asin = ? ";


//////////////////////////////////////
function download_frontpage (){
    folder_path = './html';
    fs.mkdir(folder_path, function(){});
    fs.mkdir(folder_path+"/category", function(){});
    fs.mkdir(folder_path+"/web", function(){});
    var a_url = 'http://www.amazon.com/mobile-apps/b/ref=topnav_storetab_mas?node=2350149011'
    var fs_path = a_url+'.html';
    fs_path = fs_path_normal(fs_path);
    fs_path = ""+folder_path +"/" +fs_path
    console.log(fs_path);
    var vars = {uri:a_url, fs_path:fs_path, folder_path:folder_path}
    request_amazon_appstore(response_process_homepage, vars);
}

function download_category (cate_lower, page_i, cate_nodeid, first) {
    folder_path = './html/category/'+cate_lower;
    fs.mkdir(folder_path, function(){})
    var a_url = 'http://www.amazon.com/b/ref=sr_pg_'+page_i+'?ie=UTF8&node='+cate_nodeid+"&page="+page_i;
    var fs_path = a_url+'.html';
    fs_path = fs_path_normal(fs_path);
    fs_path = ""+folder_path +"/" +fs_path;
    console.log(fs_path);
    var vars = {uri:a_url, fs_path:fs_path, folder_path:folder_path, cate_nodeid:cate_nodeid};
    if (first) {
	request_amazon_appstore(response_process_category_first, vars);
    } else {
	request_amazon_appstore(response_process_category, vars);
    }
}

function download_app_web (asin) {
    folder_path = './html/web';
    fs.mkdir(folder_path, function(){});
    var fs_path = a_url+'.html';
    fs_path = fs_path_normal(fs_path);
    fs_path = ""+folder_path +"/" +fs_path
    console.log(fs_path);
    var vars = {uri:a_url, fs_path:fs_path, folder_path:folder_path, asin:asin}
    request_amazon_appstore(response_process_web, vars);
}

////////////////////////////////
//download_frontpage();

function cate_app_counts_read() {
    var sql_cate_get = 'SELECT cate_nodeid, cate_lower FROM category';
    db.get(sql_cate_get, function(err, row){
	if (row == undefined){
	    return
	}
	cate_nodeid = row.cate_nodeid;
	cate_lower = row.cate_lower;
	download_category(cate_app_counts_read, cate_lower, page_i, cate_nodeid, true);
    });
    /*
    db.all(sql_cate_get, function(err, row){
	for (var i = 0; i < row.length; i++){
	    //console.log();
	    page_i = 1;
	    cate_nodeid = row[i].cate_nodeid;
	    cate_lower = row[i].cate_lower;
	    e = download_category(cate_lower, page_i, cate_nodeid, true);
	}
    });*/
}
cate_app_counts_read();

var page_i = 12;
var cate_nodeid = '2478833011';
var cate_lower = 'books & comics';
//download_category (cate_lower, page_i, cate_nodeid, true)

var asin = 'B005VVSQU4'
var a_url = 'http://www.amazon.com/comiXology-Comics/dp/B005VVSQU4'
