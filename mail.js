var mail_opts = require('./mail_opts.js');
var nodemailer = require("nodemailer");

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
            console.log("Message sent: " + response.message);
	}

    // if you don't want to use this transport object anymore, uncomment following line
	smtpTransport.close(); // shut down the connection pool, no more messages
    });
}


var subject = "error AmazonAppStore Scrapting";
var text = 'no jobs, probally client is shut down';
var body = '<p>check client if shut down<p>';
send_mail(subject, text, body);