var request = require("request");
var fs = require('fs');
var spawn = require('child_process').spawn;
/*
//var sqlite3 = require('sqlite3').verbose();
//var db = new sqlite3.Database('./amazon_c.db'); // not defined here as defiend in each specific files
*/
var timeout_ms = 5000 // 10*1000 seconds

var ec2_addr = 'http://ec2-176-34-208-178.eu-west-1.compute.amazonaws.com';
//var ec2_addr = 'http://localhost';

//////////////////
module.exports.fs_path_normal = fs_path_normal;
module.exports.db_run_callback = db_run_callback;
module.exports.request_amazon_appstore = request_amazon_appstore;
module.exports.request_amazon_appstore_flow_control = request_amazon_appstore_flow_control;
module.exports.request_amazon_appstore_flow_control_review = request_amazon_appstore_flow_control_review;
module.exports.request_amazon_appstore_appid_to_asin = request_amazon_appstore_appid_to_asin;
module.exports.request_ec2 = request_ec2;
//module.exports.db = db;
module.exports.count = count;
module.exports.db_show = db_show;
module.exports.timeout_ms = timeout_ms;
module.exports.ec2_addr = ec2_addr
module.exports.folder_path_root = folder_path_root


/////////////////////////////////////
var folder_path_root = '../data_row';
fs.mkdir(folder_path_root, function(){});
folder_path_root = '../data_row/AmazonAppStoreScrape';
fs.mkdir(folder_path_root, function(){});

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
	timeout: 20000, // milliseconds
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

    request(r_options, request_function).pipe(file);
    /*
    try {
	request(r_options, request_function).pipe(file);
    } catch (err) {
	console.log('**error:', err);
	//callback()
    }*/
}

function request_amazon_appstore_appid_to_asin(callback, err_response_process, response_process, vars){
    // doc in https://npmjs.org/package/request 
    var r_options = {
	uri: vars.uri,
	method: 'GET',
	timeout: 20000, // milliseconds
	maxRedirects: 10,
	followRedirect:true, // to avoid jump to home page
	//pool.maxSockets:1,
	proxy:'',
	qs:{},
	headers:{'Accept':'text/html'}
    };
    console.log(vars.uri);
    
    var file = fs.createWriteStream(vars.fs_path);

    var request_function = function(error, response, body){
		// the response can be undefined
		if (! error && (response.statusCode == 200 || response.statusCode == 302)) {
			vars.statusCode = response.statusCode;
			response_process(callback, vars, response, body);
		} else {
	    	console.log('**error: in request_function', error);
	    	if (response != undefined){
				console.log(response.statusCode);
				vars.statusCode = response.statusCode;
	    	} else {
	    		vars.statusCode = -1;
	    	}
	    	err_response_process(callback, vars, body);
		}
    };

    request(r_options, request_function).pipe(file);
}


function request_amazon_appstore_flow_control(callback, err_callback, response_process, vars){
    // doc in https://npmjs.org/package/request 
    var r_options = {
	uri: vars.uri,
	method: 'GET',
	timeout: 20000, // milliseconds
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
	    err_callback();
	}
    };

    console.log('\t4 request_amazon_appstore_flow_control');
    request(r_options, request_function).pipe(file);
}

function request_amazon_appstore_flow_control_review(callback, client_callback, err_callback, response_process, vars){
    // doc in https://npmjs.org/package/request 
    var r_options = {
	uri: vars.uri,
	method: 'GET',
	timeout: 20000, // milliseconds
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
	    response_process(callback, client_callback, vars, response, body);
	} else {
	    console.log('**error: in request_function')
	    console.log(error, vars.uri, vars);
	    if (response != undefined){
		console.log(response.statusCode);
	    }
	    err_callback(client_callback);
	}
    };

    console.log('\t4 request_amazon_appstore_flow_control');
    request(r_options, request_function).pipe(file);
}


function request_ec2(callback, response_process, vars){
    var r_options = {
	uri: vars.uri,
	method: 'GET',
	timeout: 20000, // milliseconds
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
	    console.err(err.stack)
	    if (response != undefined){
		console.log(response.statusCode);
	    }
	    callback();
	}
    };
    request(r_options, request_function);
    /*
    try {
	request(r_options, request_function);
    } catch (err) {
	console.log('**error:', err);
	callback();
    }*/
}