///////////////////////
// global variables top levels
global.g_db_path = './amazon_ec2.db';
//////////////////////


var express = require('express');
var app = express();
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(g_db_path);
var sprintf = require('util').format;

function hello(req, res){
    res.send('hello world from AMI!');
}

//console.log('Hello'.toLowerCase());

////////////////////////////////////////////////
function jobs_get_app_web(res, jobs, c_id){
    sql_get = 'SELECT * FROM app_web_download WHERE read_status = 0 LIMIT ?'
    sql_put = 'UPDATE app_web_download SET read_status = 2, update_date=? WHERE app_asin = ?'
    db.all(sql_get, jobs, function(err, row){
	// if all read_status = 1 has been assign, check read_status = 2
	for (var i = 0; i < row.length; i++){
	    var r = row[i];
	    app_asin = r.app_asin;
	    update_date = new Date().getTime();
	    db.run(sql_put, update_date, app_asin);
	}
	res.send(row);
    });
}

function jobs_get_app_review(res, jobs, c_id){
    sql_get = 'SELECT * FROM app_review_download WHERE read_status = 0 AND app_web_read_status = 1 LIMIT ?'
    sql_put = 'UPDATE app_review_download SET read_status = 2, update_date=? WHERE app_asin = ?'
    db.all(sql_get, jobs, function(err, row){
	// if all read_status = 1 has been assign, check read_status = 2
	for (var i = 0; i < row.length; i++){
	    var r = row[i];
	    app_asin = r.app_asin;
	    update_date = new Date().getTime();
	    db.run(sql_put, update_date, app_asin);
	}
	res.send(row);
    });
}

function jobs_get_appid_to_asin(res, jobs, c_id){
    sql_get = 'SELECT * FROM appid_to_asin_download WHERE read_status = 0 LIMIT ?'
    sql_put = 'UPDATE appid_to_asin_download SET read_status = 2, update_date=? WHERE app_id = ?'
    db.all(sql_get, jobs, function(err, row){
		// if all read_status = 1 has been assign, check read_status = 2
		for (var i = 0; i < row.length; i++){
	    	var r = row[i];
	    	app_id = r.app_id;
	    	update_date = new Date().getTime();
	    	db.run(sql_put, update_date, app_id);
		}
		res.send(row);
    });
}

function jobs_get(req, res){
    qs = req.query;
    console.log('====', req.method, req.path, req.query);
    c_aim = qs.c_aim;
    c_id = qs.c_id;
    jobs = qs.jobs;
    if (c_aim == undefined || c_id == undefined || jobs == undefined) {
		res.send(400, 'wrong json');
		return
    }
    c_aim = c_aim.toLowerCase();
    if (c_aim == 'app_web'){
		jobs_get_app_web(res, jobs, c_id);
    } else if (c_aim == 'app_review'){
		jobs_get_app_review(res, jobs, c_id);
    } else if (c_aim == 'appid_to_asin'){
		jobs_get_appid_to_asin(res, jobs, c_id);
    } else {
		res.send(400, 'wrong c_aim: is it all lower case');
    }
}
////////////////////////////////////////////////

function jobs_put_app_web(res, apps, c_id){
    apps = JSON.parse(apps);
    console.log('jobs_put: request from client: ', apps.length);
    var sql_a = ''
    var app_asins = [];
    for (app_i in apps){
	app = apps[app_i];
	c_date = new Date().getTime();
	var sql_i = sprintf('UPDATE app_web_download SET app_name="%s", app_name_lower="%s", app_url="%s", file_path="%s", read_status=%s, update_date="%s", c_date="%s", c_id="%s" WHERE app_asin="%s";', app.app_name, app.app_name_lower, app.app_url, app.file_path, app.read_status, app.update_date, c_date, c_id, app.app_asin );
	sql_a = sql_a + sql_i;
	app_asins.push(app.app_asin);  
    }
    db.exec(sql_a, function(a){
	app_asinss = JSON.stringify(app_asins);
	res.send(app_asinss);
    });
}

function jobs_put_app_review(res, apps, c_id){
    apps = JSON.parse(apps);
    console.log('jobs_put: request from client: ', apps.length);
    var sql_a = ''
    var app_asins = [];
    for (app_i in apps){
	app = apps[app_i];
	c_date = new Date().getTime();
	var sql_i = sprintf('UPDATE app_review_download SET app_web_c_status=%s, app_web_read_status=%s, c_id="%s", c_status=%s, c_date="%s", review_page_i=%s, review_page_total=%s, read_status=%s, update_date="%s" WHERE app_asin="%s";', app.app_web_c_status, app.app_web_read_status, app.c_id, app.c_status, app.c_date, app.review_page_i, app.review_page_total, app.read_status, app.update_date, app.app_asin );
	sql_a = sql_a + sql_i;
	app_asins.push(app.app_asin);  
    }
    db.exec(sql_a, function(a){
	app_asinss = JSON.stringify(app_asins);
	res.send(app_asinss);
    });
}

function jobs_put_app_review_result(res, apps, c_id){
    apps = JSON.parse(apps);
    console.log('jobs_put: request result from client: ', apps.length);
    var sql_a = ''
    var app_asins = [];
    for (app_i in apps){
	app = apps[app_i];
	c_date = new Date().getTime();
	var sql_i = sprintf('UPDATE app_review_download_result SET review_page_i=%s, file_path="%s", read_status="%s", create_date=%s WHERE app_asin="%s";', app.review_page_i, app.file_path, app.read_status, app.create_date, app.app_asin );
	sql_a = sql_a + sql_i;
	app_asins.push({app_asin:app.app_asin, review_page_i:app.review_page_i});  
    }
    db.exec(sql_a, function(a){
	app_asinss = JSON.stringify(app_asins);
	res.send(app_asinss);
    });
}

function jobs_put_appid_to_asin(res, apps, c_id){
    apps = JSON.parse(apps);
    console.log('jobs_put: request from client: ', apps.length);
    var sql_a = ''
    var app_asins = [];
    for (app_i in apps){
		app = apps[app_i];
		c_date = new Date().getTime();
		var sql_i = sprintf('UPDATE appid_to_asin_download SET http_status_code=%s, file_path="%s", read_status=%s, update_date="%s", c_date="%s", c_id="%s", c_status=%s WHERE app_id="%s";', app.http_status_code, app.file_path, app.read_status, app.update_date, c_date, app.c_id, app.c_status, app.app_id );
		sql_a = sql_a + sql_i;
		app_asins.push(app.app_id);  
    }
    db.exec(sql_a, function(a){
		app_asinss = JSON.stringify(app_asins);
		res.send(app_asinss);
    });
}

function jobs_put(req, res){
    qs = req.query;
    console.log('====', req.method, req.path, req.query.length);
    c_aim = qs.c_aim;
    c_id = qs.c_id;
    apps = qs.apps;
    if (c_aim == undefined || c_id == undefined || apps == undefined) {
		res.send(400, 'wrong json');
		return
    }
    c_aim = c_aim.toLowerCase();
    if (c_aim == 'app_web'){
		jobs_put_app_web(res, apps, c_id);
    } else if (c_aim == 'appid_to_asin'){
    	console.log('appid_to_asin');
		jobs_put_appid_to_asin(res, apps, c_id);
    } else if (c_aim == 'app_review'){
		if (qs.review_result == 1 || qs.review_result == '1') {
	    	jobs_put_app_review_result(res, apps, c_id)
		} else {
	    	jobs_put_app_review(res, apps, c_id);
		}
    } else {
		res.send(400, 'wrong c_aim: is it all lower case');
    }
}


////////////////////////////////////////////////
function jobs_view_app_web(req, res){
    var sql = 'SELECT COUNT(*) AS apps_count, read_status FROM app_web_download GROUP BY read_status'
    db.all(sql, function(err, rows){
	var read_no = 0;
	var read_done = 0;
	var read_assigned = 0;
	//console.log(rows, err)
	for (row_i in rows) {
	    apps_count = rows[row_i].apps_count;
	    switch (rows[row_i].read_status){
	    case 0: read_no = apps_count;
		break;
	    case 1: read_done = apps_count;
		break;
	    case 2: read_assigned = apps_count;
		break;
	    }
	}
	results = {page:'job views of AmazonAppStore scraping [app web]', reset:'http://'+req.host+':8080/jobs_reset?c_aim=app_web', read_no:read_no, read_done:read_done, read_assigned:read_assigned, rows:rows};
	res.send(results);
    });
}

function jobs_view_app_review(req, res){
    var sql = 'SELECT COUNT(*) AS apps_count, read_status FROM app_review_download GROUP BY read_status'
    db.all(sql, function(err, rows){
	var read_no = 0;
	var read_done = 0;
	var read_assigned = 0;
	//console.log(rows, err)
	for (row_i in rows) {
	    apps_count = rows[row_i].apps_count;
	    switch (rows[row_i].read_status){
	    case 0: read_no = apps_count;
		break;
	    case 1: read_done = apps_count;
		break;
	    case 2: read_assigned = apps_count;
		break;
	    }
	}
	results = {page:'job views of AmazonAppStore scraping [app review]', reset:'http://'+req.host+':8080/jobs_reset?c_aim=app_review', read_no:read_no, read_done:read_done, read_assigned:read_assigned, rows:rows};
	res.send(results);
    });
}

function jobs_view_appid_to_asin(req, res){
    var sql = 'SELECT COUNT(*) AS apps_count, read_status FROM appid_to_asin_download GROUP BY read_status'
    db.all(sql, function(err, rows){
	var read_no = 0;
	var read_done = 0;
	var read_assigned = 0;
	//console.log(rows, err)
	for (row_i in rows) {
	    apps_count = rows[row_i].apps_count;
	    switch (rows[row_i].read_status){
	    case 0: read_no = apps_count;
		break;
	    case 1: read_done = apps_count;
		break;
	    case 2: read_assigned = apps_count;
		break;
	    }
	}
	results = {page:'job views of AmazonAppStore scraping [appid_to_asin]', reset:'http://'+req.host+':8080/jobs_reset?c_aim=appid_to_asin', read_no:read_no, read_done:read_done, read_assigned:read_assigned, rows:rows};
	res.send(results);
    });
}

function jobs_view(req, res){
    qs = req.query;
    console.log(req.method, req.path, req.query.length);
    c_aim = qs.c_aim;
    if (c_aim == undefined) {
		res.send(400, 'wrong json');
		return
    }
    c_aim = c_aim.toLowerCase();
    if (c_aim == 'app_web'){
		jobs_view_app_web(req, res);
    } else if (c_aim == 'app_review'){
		jobs_view_app_review(req, res);
    } else if (c_aim == 'appid_to_asin'){
		jobs_view_appid_to_asin(req, res);
    } else {
		res.send(400, 'wrong c_aim: is it all lower case');
    }
}

////////////////////////////////////////////////
function jobs_reset_app_web(res){
    var sql = 'UPDATE app_web_download SET read_status = 0 WHERE read_status = 2';
    db.run(sql, function(err, rows){
	res.redirect('/jobs_view?c_aim=app_web');
    });
}

function jobs_reset_app_review(res){
    var sql = 'UPDATE app_review_download SET read_status = 0 WHERE read_status = 2';
    db.run(sql, function(err, rows){
	res.redirect('/jobs_view?c_aim=app_review');
    });
}

function jobs_reset_appid_to_asin(res){
    var sql = 'UPDATE appid_to_asin_download SET read_status = 0 WHERE read_status = 2';
    db.run(sql, function(err, rows){
	res.redirect('/jobs_view?c_aim=appid_to_asin');
    });
}

function jobs_reset(req, res){
    qs = req.query;
    console.log(req.method, req.path, req.query.length);
    c_aim = qs.c_aim;
    if (c_aim == undefined) {
	res.send(400, 'wrong json');
	return
    }
    c_aim = c_aim.toLowerCase();
    if (c_aim == 'app_web'){
	jobs_reset_app_web(res);
    } else if (c_aim == 'app_review'){
	jobs_reset_app_review(res);
    } else {
	res.send(400, 'wrong c_aim: is it all lower case');
    }
}

////////////////////////////////////////////////

function db_file_download(req, res){
    console.log('=== download db_files == ');
    //res.attachment('./amazon_client.db');
    //res.sendfile('./amazon_ec2.db');
    res.download('./amazon_ec2.db', 'amazon_ec2_'+(new Date().getTime())+'.db');
}


/*app.use(function(req, res, next){
    console.log('%s %s', req.method, req.url);
    next();
});*/
//app.use(express.logger());
//app.use(express.cookieSession());
//app.use(express.basicAuth('hello', 'world'));
app.use(express.bodyParser());

app.get('/hello', hello);
app.get('/jobs_get', jobs_get);
app.get('/jobs_put', jobs_put);
app.get('/jobs_view', jobs_view);
app.get('/jobs_reset', jobs_reset);
app.get('/db_file_download', db_file_download);

app.listen(8080);
