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


function jobs_get(req, res){
    qs = req.query;
    console.log(req.method, req.path, req.query);
    c_id = qs.c_id;
    jobs = qs.jobs;
    if (c_id == undefined || jobs == undefined) {
	res.send(400, 'wrong json');
    }
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

function jobs_put(req, res){
    qs = req.query;
    console.log(req.method, req.path, req.query.length);
    c_id = qs.c_id;
    apps = qs.apps;
    if (c_id == undefined || apps == undefined) {
	res.send(400, 'wrong json');
    }
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

function jobs_view(req, res){
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
	results = {page:'job views of AmazonAppStore scraping', reset:'http://'+req.host+'/jobs_reset', read_no:read_no, read_done:read_done, read_assigned:read_assigned, rows:rows};
	res.send(results);
    });
}

function jobs_reset(req, res){
    var sql = 'UPDATE app_web_download SET read_status = 0 WHERE read_status = 2';
    db.run(sql, function(err, rows){
	res.redirect('/jobs_view');
    });
}

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

app.listen(80);
