///////////////////////
// global variables top levels
global.g_db_path = './amazon_client.db';
//////////////////////
//var c_id = 'macbookpro';
var c_id = 'dtc';
var c_aim = 'app_review'
var jobs_count = '1';

var myutil = require('./myutil.js');
var ec2_addr = myutil.ec2_addr;


var inspect = require('util').inspect;
var scrape_review = require('./scrape_review.js');

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(g_db_path);
var sprintf = require('util').format;
var querystring = require('querystring');
var domain = require('domain').create();

myutil.db_show(g_db_path);


////////////////////////////////////////////

function response_process_get(callback, vars, response, body){
    //console.log('response_process_get');
    var apps = body;
    apps = JSON.parse(apps);
    console.log('\tjobs_get: response: apps.length: ', apps.length)
    if (apps.length == 0) {
	//console.log('jobs_get: apps length ', apps.length);
	callback('jobs_g_response_0', apps.length);
	return
    } else {
	var sql_a = ''
	for (app_i in apps){
	    app = apps[app_i];
	    var sql_i = sprintf('INSERT OR IGNORE INTO app_review_download (app_asin, app_web_c_status, app_web_read_status, c_id,  c_status, c_date, review_page_i, review_page_total, read_status, create_date, update_date) VALUES ("%s",%s,%s,"%s",%s, "%s", %s, %s, %s, "%s", "%s");\n', app.app_asin, app.app_web_c_status, app.app_web_read_status, c_id, app.c_status, app.c_date, app.review_page_i, app.review_page_total, app.read_status, app.create_date, app.update_date);
	    sql_a = sql_a + sql_i;
	}
	db.exec(sql_a, function(err){
	    console.log(sql_a);
	    //console.log('** db.exec in response_proess_get');
	    callback('jobs_get', apps.length);
	    return
	});
    }
}


function response_process_put(callback, vars, response, body){
    app_asins = JSON.parse(body);
    if (app_asins.length == 0){
	jobs_put_result(flow_control);
    }
    //console.log(app_asins);
    var sql_a = ''
    for (i in app_asins){
	app_asin = app_asins[i];
	var sql_i = sprintf('DELETE FROM app_review_download WHERE app_asin="%s";', app_asin);
	sql_a = sql_a + sql_i
    }
    console.log('\tjob_put: response: ', app_asins.length);
    db.exec(sql_a, function(err){
	//console.log('** db.exec in response_process_put');
	callback('jobs_put', app_asins.length);
    });
}

function response_process_put_result(callback, vars, response, body){
    app_asins = JSON.parse(body);
    if (app_asins.length == 0){
	callback('jobs_p_request_0', 0);
    }
    //console.log(app_asins);
    var sql_a = ''
    for (i in app_asins){
	app_asin = app_asins[i].app_asin;
	review_page_i = app_asins[i].review_page_i;
	var sql_i = sprintf('DELETE FROM app_review_download_result WHERE app_asin="%s" AND review_page_i = %s;', app_asin, review_page_i);
	sql_a = sql_a + sql_i
    }
    console.log('\tjob_put: response result: ', app_asins.length);
    db.exec(sql_a, function(err){
	//console.log('** db.exec in response_process_put');
	callback('jobs_put_result', app_asins.length);
    });
}


///////////////////////
function jobs_get(callback){
    console.log('================================================');
    url_query = querystring.stringify({c_aim:c_aim, c_id:c_id, jobs:jobs_count});
    uri = ec2_addr+':8080/jobs_get?'+url_query;
    var vars = {uri:uri};
    console.log('jobs_get:', vars);
    myutil.request_ec2(callback, response_process_get, vars);
}

function jobs_do(callback){
    console.log('jobs_do:');
    scrape_review.app_review_read_cp(flow_control_jobs_put);
}

function flow_control_jobs_put(){
    console.log('**flow_control_jobs_put');
    jobs_put(flow_control);
}

function jobs_put(callback){
    console.log('jobs put:');
    var sql_put = 'SELECT * FROM app_review_download LIMIT 100';
    db.all(sql_put, function(err, rows){
	console.log('\t', err, rows.length);
	if (err != null || rows.length == 0) {
	    jobs_put_result(flow_control);
	} else {
	    apps_s = JSON.stringify(rows);
	    url_query = querystring.stringify({review_result:0, c_aim:c_aim, c_id:c_id, apps:apps_s});
	    console.log('\tjobs_put: request apps.length:', rows.length);
	    var uri = ec2_addr+':8080/jobs_put?'+url_query;
	    var vars = {uri:uri};
	    myutil.request_ec2(callback, response_process_put, vars);
	}
    });
}

function jobs_put_result(callback){
    console.log('jobs put result:');
    var sql_put = 'SELECT * FROM app_review_download_result LIMIT 100';
    db.all(sql_put, function(err, rows){
	console.log('\t', err, rows.length);
	if (err != null || rows.length == 0) {
	    callback('jobs_p_request_0', 0);
	} else {
	    apps_s = JSON.stringify(rows);
	    url_query = querystring.stringify({review_result:1, c_aim:c_aim, c_id:c_id, apps:apps_s});
	    console.log('jobs_put: request result apps.length:', rows.length);
	    var uri = ec2_addr+':8080/jobs_put?'+url_query;
	    var vars = {uri:uri};
	    myutil.request_ec2(callback, response_process_put_result, vars);
	}
    });
}

function jobs_p_timeout(){
    jobs_get(flow_control);
}

////////////////////////////////////////////
var old_jobs_get_response_app_length = -1;
///////////////////////
function flow_control(fun, arg){
    console.log('**flow_control', fun, arg);
    //if (fun == undefined){
    //main_loop();
    //}
    switch(fun){
    case 'jobs_g_response_0':
	if (old_jobs_get_response_app_length == 0 && arg == 0){
	    //loop_f = true;
	    main_loop();
	} else {
	    jobs_do(flow_control);
	}
	break;
    case 'jobs_get':
	//console.log(old_jobs_get_response_app_length, arg);
	old_jobs_get_response_app_length = arg;
	jobs_do(flow_control);
	break;
    case 'jobs_do':
	jobs_put(flow_control);
	break;
    case 'jobs_put':
	setTimeout(flow_control_jobs_put, myutil.timeout_ms);
	break;
    case 'jobs_p_request_0':
    case 'jobs_p_response_0':
	//main_loop();
	setTimeout(jobs_p_timeout, myutil.timeout_ms);
	break;
    case undefined:
    default:
	jobs_get(flow_control);
	break;
    }
}

var loop_f = false;
var loop_i = 0;
var loop_t = 20;
function main_loop(){
    if (loop_f == true){
	console.log('\n====== loop_f = true =========');
	return
    }
    if (loop_i < loop_t) {
	console.log('\n====== %d of %d (loop_i, loop_t) =====', loop_i, loop_t);
	loop_i = loop_i + 1;
	jobs_get(flow_control);
    } else {
	console.log('\n====== jobs done =========');
	return
    }
}

function main(argv){
    if (argv.length == 3) {
	switch (argv[2]){
	case 'jobs_get': jobs_get(flow_control); break;
	case 'jobs_do': jobs_do(flow_control); break;
	case 'jobs_put': jobs_put(flow_control); break;
	default : console.log('** error **: need to pass argumet of [jobs_get, jobs_do, jobs_put]'); break;
	}
    } else {
	console.log('** error **: need to pass argumet of [jobs_get, jobs_do, jobs_put]');
	//flow_control();
    }
}

domain.run(function(){
    main(process.argv);
});

