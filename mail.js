var mail_opts = require('./mail_opts.js');
var nodemailer = require("nodemailer");
var myutil = require('./myutil.js');

var smtpTransport = nodemailer.createTransport("SMTP",{
    service: "Gmail",
    auth: {
        user: mail_opts.smtp_server_user,
        pass: mail_opts.smtp_server_pass
    }
});


function send_email(subject, text, body){
    var mailOptions = {
	from: mail_opts.from_email, // sender address
	to: mail_opts.to_email, // list of receivers
	subject: subject, // Subject line
	text: text, // plaintext body
	html: body // html body
    }
    smtpTransport.sendMail(mailOptions, function(error, response){
	if(error){
            console.log(error);
	}else{
            console.log("== Email Message sent: " + response.message);
	}

    // if you don't want to use this transport object anymore, uncomment following line
	smtpTransport.close(); // shut down the connection pool, no more messages
    });
}

function my_test(){
    var subject = "error AmazonAppStore Scrapting";
    var text = 'no jobs, probally client is shut down';
    var body = '<p>check client if shut down<p>';
    send_email(subject, text, body);
}


////////////////////////////
var old_read_done_i = 0;
var ec2_addr = 'http://ec2-176-34-208-178.eu-west-1.compute.amazonaws.com';

function response_process_get(callback, vars, response, body){
    var ms = body;
    ms = JSON.parse(ms);
    read_done_i = ms.read_done;
    console.log(old_read_done_i, read_done_i, new Date());
    if (read_done_i == undefined){
	
    } else {
	if (old_read_done_i != read_done_i) {
	    old_read_done_i = read_done_i;
	    callback();
	} else {
	    console.log(read_done_i);
	}
    }
}

function check_server(){
    var uri = ec2_addr+':8080/jobs_view';
    vars = {uri:uri};
    myutil.request_ec2(check_server_timeout, response_process_get, vars);
}

function check_server_timeout(){
    setTimeout(check_server, myutil.timeout_ms*10);
}

check_server();

module.exports.send_email = send_email;