///////////////////////
// global variables top levels
global.g_db_path = './amazon_client.db';
//////////////////////
//var c_id = 'macbookpro';
var c_id = 'dtc';
var jobs_count = '10';
var ec2_addr = 'http://ec2-176-34-208-178.eu-west-1.compute.amazonaws.com';


var inspect = require('util').inspect;
var scrape_app = require('./scrape_app.js');
var myutil = require('./myutil.js');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(g_db_path);
var sprintf = require('util').format;
var querystring = require('querystring');
var domain = require('domain').create();

myutil.db_show(g_db_path);

/////////////////////

function response_process_get(callback, vars, response, body){
    //console.log('response_process_get');
    var apps = body;
    apps = JSON.parse(apps);
    console.log('jobs_get: response: apps.length: ', apps.length)
    if (apps.length == 0) {
	//console.log('jobs_get: apps length ', apps.length);
	callback('jobs_g_response_0', apps.length);
    } else {
	var sql_a = ''
	for (app_i in apps){
	    app = apps[app_i];
	    var sql_i = sprintf('INSERT OR IGNORE INTO app_web_download (app_asin, app_name, app_name_lower, app_url, file_path, read_status, create_date, update_date) VALUES ("%s","%s","%s","%s","%s",%s,"%s","%s");\n', app.app_asin, app.app_name, app.app_name_lower, app.app_url, app.file_path, app.read_status, app.create_date, app.update_date);
	    sql_a = sql_a + sql_i;
	}
	db.exec(sql_a, function(err){
	    //console.log(sql_a);
	    //console.log('** db.exec in response_proess_get');
	    callback('jobs_get', apps.length);
	});
    }
}


function response_process_put(callback, vars, response, body){
    app_asins = JSON.parse(body);
    if (app_asins.length == 0){
	callback('jobs_p_response_0', 0);
    }
    //console.log(app_asins);
    var sql_a = ''
    for (i in app_asins){
	app_asin = app_asins[i];
	var sql_i = sprintf('DELETE FROM app_web_download WHERE app_asin="%s";', app_asin);
	sql_a = sql_a + sql_i
    }
    console.log('job_put: response: ', app_asins.length);
    db.exec(sql_a, function(err){
	//console.log('** db.exec in response_process_put');
	callback('jobs_put', app_asins.length);
    });
}


///////////////////////

function jobs_get(callback){
    url_query = querystring.stringify({c_id:c_id, jobs:jobs_count});
    uri = ec2_addr+':8080/jobs_get?'+url_query;
    var vars = {uri:uri};
    console.log('jobs_get', vars);
    myutil.request_ec2(callback, response_process_get, vars);
}

function jobs_do(callback){
    console.log('jobs_do:');
    scrape_app.app_page_read_cp();
}

function jobs_put(callback){
    var sql_put = 'SELECT * FROM app_web_download LIMIT 100';
    db.all(sql_put, function(err, rows){
	console.log(err, rows.length);
	if (rows.length == 0) {
	    callback('jobs_p_request_0', 0);
	} else {
	    apps_s = JSON.stringify(rows);
	    url_query = querystring.stringify({c_id:c_id, apps:apps_s});
	    console.log('jobs_put: request apps.length:', rows.length);
	    var uri = ec2_addr+':8080/jobs_put?'+url_query;
	    var vars = {uri:uri};
	    myutil.request_ec2(callback, response_process_put, vars);
	}
    });
    
}

var jobs_loop_i_count = 0;
var old_jobs_get_response_app_length = -1;
///////////////////////
function flow_control(fun, arg){
    console.log('**flow_control', fun, arg);
    switch(fun){
    case 'jobs_init':
	jobs_loop_i_count += 1;
	console.log('\n==jobs_loop_i_count:', jobs_loop_i_count);
	jobs_get(flow_control);
	break;
    case 'jobs_g_response_0':
	if (old_jobs_get_response_app_length == 0 && arg == 0){
	    //loop_f = true;
	    main_loop();
	} else {
	    jobs_do(flow_control);
	}
	break;
    case 'jobs_get':
	console.log(old_jobs_get_response_app_length, arg);
	old_jobs_get_response_app_length = arg;
	jobs_do(flow_control);
	break;
    case 'jobs_do':
	jobs_put(flow_control);
	break;
    case 'jobs_put':
	setTimeout(jobs_put_timeout, myutil.timeout_ms);
	break;
    case 'jobs_p_request_0':
    case 'jobs_p_response_0':
	//main_loop();
	setTimeout(jobs_p_timeout, myutil.timeout_ms);
	break;
    default:
	//console.log('others')
	//main_loop();
	flow_control('jobs_init', 0);
	break;
    }
}
function flow_control(){
    flow_control('jobs_init', 0);
}

function jobs_put_timeout(){
    jobs_put(flow_control);
}
function jobs_p_timeout(){
    jobs_get(flow_control);
}

////////////////////////
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
	try {
	    flow_control('jobs_init', 0);
	} catch (err) {
	    console.log('======= uncaught error try--catch-- ===========');
	}
    } else {
	console.log('\n====== jobs done =========');
	return
    }
}

/*
process.on('uncaughtException', function(err){
    console.log('======= uncaught error process.on ==========');
    main_loop();
});
*/

domain.on('error', function(err){
    console.log("==== error in doamin ======", err);
    main_loop();
});

function main(argv){
    if (argv.length == 3) {
	switch (argv[2]){
	case 'jobs_get': jobs_get(flow_control); break;
	case 'jobs_do': jobs_do(flow_control); break;
	case 'jobs_put': jobs_put(flow_control); break;
	default : console.log('** error **: need to pass argumet of [jobs_get, jobs_do, jobs_put]');
	}
    } else {
	console.log('** error **: need to pass argumet of [jobs_get, jobs_do, jobs_put]');
    }
}

domain.run(function(){
    main(process.argv);
});

module.exports.flow_control = flow_control;