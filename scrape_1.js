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
//var http = require('http');
//http.globalAgent.maxSockets = 1;
var timeout_ms = 10000 // 10*1000 seconds

///////////////////////////////////////
function fs_path_normal(fs_path) {
    fs_path = fs_path.replace(new RegExp('/', 'g'), '_');
    fs_path = fs_path.replace(new RegExp(':', 'g'), '_');
    return fs_path
}

function db_run_callback(err){
    //console.log('db_run_error:'+err)
}

///////////////////////////////////////
function request_amazon_appstore(callback, response_process, vars){
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
	    response_process(callback, vars, response, body);
	} else {
	    console.log('**error: in request_function')
	    console.log(error);
	    if (response != undefined){
		console.log(response.statusCode);
	    }
	    callback();
	}
    };

    try {
	request(r_options, request_function).pipe(file);
    } catch (err) {
	console.log('**error:', err);
    }
}

///////////////////////////////////////
var sql_cate_insert = "INSERT OR IGNORE INTO category (cate, cate_lower, cate_nodeid, cate_type, create_date, update_date) VALUES (?,?,?,?,?,?)";
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
	if (url_t.pathname == null){
	    return
	}
	var amb_link = url_pathname.indexOf('b/ref=amb_link');	    
	if (amb_link > 0){
	    if (url_query.node != undefined){
		var cate_nodeid = url_query.node;
		var cate_type = 'b';
		db.run(sql_cate_insert, category, category_l, cate_nodeid, cate_type, response_date, response_date, db_run_callback);
		console.log(i+" : "+ cate_type +":"+url_query.node + '  :  ' + category );
		i = i + 1;
	    }
	}
	var amb_link = url_pathname.indexOf('s/ref=amb_link');	    
	if (amb_link > 0){
	    if (url_query.rh != undefined){
		if (url_query.rh.indexOf('theme') == -1){
		    return
		}
		var cate_type = 's';
		var cate_nodeid = url_query.rh;
		db.run(sql_cate_insert, category, category_l, cate_nodeid, cate_type, response_date, response_date, db_run_callback);
		console.log(i+" : "+ cate_type +":"+url_query.rh + '  :  ' + category );
		i = i + 1
	    }
	}
    });
    callback()
}



///////////////////////////////////////
var sql_cate_done_update = "UPDATE category SET read_status = ?, app_counts= ?, update_date = ? WHERE cate_nodeid = ?";
function response_process_category_first(callback, vars, response, body){
    var response_date = response.headers.date;
    $ = cheerio.load(body);
    $('.resultCount').each(function(){
	app_counts = $(this).text();
	app_counts = app_counts.split('of')[1].trim().split(' ')[0].trim().replace(',', '');
	//console.log(sql_cate_done_update);
	//console.log(vars.cate_nodeid);
	db.run(sql_cate_done_update, '1', app_counts, response_date, vars.cate_nodeid, db_run_callback);
	var o = ''+ app_counts+"|"+vars.cate_lower +"|"+vars.cate_type + "|" + vars.folder_path+ " | "+ + response.statusCode + ' | '+ response_date;
	console.log(o);
    }); 
    callback();
}


var flag_cate_nodeid_old = '';
var flag_cate_i_count_old = 0;
///////////////////////////////////////
var sql_app_web_download_insert = "INSERT OR IGNORE INTO app_web_download (app_asin, app_name, app_name_lower, app_url, create_date, update_date) VALUES (?,?,?,?,?,?)";
var sql_cate_i_done = "UPDATE category_i SET read_status=1, file_path = ?, update_date = ? WHERE cate_nodeid = ? AND page_i = ?";
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
	    db.run(sql_app_web_download_insert, asin, app_name, app_name_l, app_url, response_date, response_date, db_run_callback);
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


///////////////////////////////////////
var sql_app_web_download_update = "UPDATE app_web_download SET read_status = 1,  file_path = ?,  update_date = ? WHERE app_asin = ? ";
function response_process_web(callback, vars, response, body){
    var response_date = response.headers.date;
    db.run(sql_app_web_download_update, vars.fs_path, response_date, vars.asin, db_run_callback);
    var o = ''+vars.asin+' | '+vars.folder_path+ " | "+ + response.statusCode + ' | '+ response_date;
    console.log(o);
    callback();
}


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
    request_amazon_appstore(function(){}, response_process_homepage, vars);
}

function download_frontpage_addition(){
    db.run("DELETE FROM category WHERE cate_lower = 'games'");
    db.run("UPDATE category SET cate_type='s', cate_nodeid=? WHERE cate_lower = 'multiplayer'", "n:2478844011,p_n_theme_browse-bin:2479038011")
    db.run('INSERT OR IGNORE INTO category (cate, cate_lower, cate_nodeid, cate_type, create_date, update_date) VALUES (?,?,?,?,?,?)', 'Sports', 'sports', 'n:2478866011', 's', new Date().getTime(), new Date().getTime());
    db.run("DELETE FROM category WHERE cate_lower = 'news & weather'");
}


function download_category (callback, cate_type, cate_lower, page_i, cate_nodeid, first) {
    var folder_path = './html/category/'+cate_lower+'_'+cate_nodeid;
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
    //console.log(a_url);
    var fs_path = a_url+'.html';
    fs_path = fs_path_normal(fs_path);
    fs_path = ""+folder_path +"/" +fs_path;
    //console.log(fs_path);
    var vars = {uri:a_url, fs_path:fs_path, folder_path:folder_path, cate_nodeid:cate_nodeid, page_i:page_i, cate_type:cate_type, cate_lower:cate_lower};
    if (first) {
	request_amazon_appstore(callback, response_process_category_first, vars);
    } else {
	request_amazon_appstore(callback, response_process_category, vars);
    }
}

function download_app_web (callback, asin, a_url) {
    folder_path = './html/web';
    fs.mkdir(folder_path, function(){});
    var fs_path = a_url+'.html';
    fs_path = fs_path_normal(fs_path);
    fs_path = ""+folder_path +"/" +fs_path;
    //console.log(fs_path);
    var vars = {uri:a_url, fs_path:fs_path, folder_path:folder_path, asin:asin}
    request_amazon_appstore(callback, response_process_web, vars);
}


////////////////////////////////
function cate_app_counts_read_i(){
    var sql_cate_get = 'SELECT cate_nodeid, cate_lower, cate_type FROM category WHERE read_status = 0';
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
    setTimeout(cate_app_counts_read_i, timeout_ms);
}


////////////////////////////////
function cate_page_i_generate(){
    var sql_cate_get = 'SELECT app_counts, cate, cate_lower, cate_nodeid, cate_type FROM category WHERE read_status = 1 AND app_counts > 0';
    var sql_cate_update = 'UPDATE category SET read_status = 2 WHERE cate_nodeid = ?'
    var sql_cate_insert = 'INSERT OR IGNORE INTO category_i (cate, cate_lower, cate_nodeid, page_i, cate_type, create_date, update_date) VALUES (?,?,?,?,?,?,?)';
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
	page_max = app_counts / 12
	page_max = Math.ceil(page_max) + 1
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
    var sql_cate_get = 'SELECT cate_nodeid, cate_lower, cate_nodeid, page_i, cate_type FROM category_i WHERE read_status = 0';
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
    setTimeout(cate_page_read_i, timeout_ms);
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
	    db.run('UPDATE app_web_download SET read_status = 2, update_date = ? WHERE app_asin = ?', new Date().getTime(), asin);
	}
    });
}
function app_page_read() {
    setTimeout(app_page_read_i, timeout_ms);
}

//download_frontpage();
//download_frontpage_addition();
//cate_app_counts_read();
//cate_page_generate();
cate_page_read()
//app_page_read();

