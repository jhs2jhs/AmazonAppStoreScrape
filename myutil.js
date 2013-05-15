var request = require("request");
var fs = require('fs');
var spawn = require('child_process').spawn;
/*
//var sqlite3 = require('sqlite3').verbose();
//var db = new sqlite3.Database('./amazon_c.db'); // not defined here as defiend in each specific files
*/
var timeout_ms = 20000 // 10*1000 seconds

//////////////////
module.exports.fs_path_normal = fs_path_normal;
module.exports.db_run_callback = db_run_callback;
module.exports.request_amazon_appstore = request_amazon_appstore;
module.exports.request_ec2 = request_ec2;
//module.exports.db = db;
module.exports.count = count;
module.exports.db_show = db_show;


//////////////////////////////////////
function db_show(g_db_path){
    py_sql = spawn('python', ['my.py', g_db_path]);
    py_sql.stdout.on('data', function(data){
	console.log('STDOUT py_sql: '+data);
    });
    py_sql.stderr.on('data', function(data){
	console.log('STDERR py_sql: '+data);
    });
}


//////////////////////////////////////
function count(){
    var counter = 0;
    for (var p in this){
	if (this.hasOwnProperty(p)){
	    counter = counter + 1;
	}
    }
    return counter;
}

///////////////////////////////////////
function fs_path_normal(fs_path) {
    fs_path = fs_path.replace(new RegExp('/', 'g'), '_');
    fs_path = fs_path.replace(new RegExp(':', 'g'), '_');
    fs_path = fs_path.replace('?', '-');
    //console.log(fs_path);
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
	    console.log(error, vars.uri, vars);
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

function request_ec2(callback, response_process, vars){
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
    }
    var request_function = function(error, response, body){
	// the response can be undefined
	if (! error && response.statusCode == 200) {
	    response_process(callback, vars, response, body);
	} else {
	    console.log('**error: in request_function')
	    console.log(error, vars.uri, vars);
	    if (response != undefined){
		console.log(response.statusCode);
	    }
	    callback();
	}
    };
    try {
	request(r_options, request_function);
    } catch (err) {
	console.log('**error:', err);
    }
}