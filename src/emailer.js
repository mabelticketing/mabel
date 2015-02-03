var connection = require('./api/impl/connection.js');
var config = require('./config.js');
var mailgun = require('mailgun-js')({ apiKey: config.mailgun_api_key, domain: "mg.emmamayball.com" });
var jade = require("jade");
var htmlToText = require('html-to-text');
var Q = require("q");
var MailComposer = require("mailcomposer").MailComposer;

module.exports = {
	send: send
};

function send(to, subject, template, data) {
	template = __dirname + "/../views/email/" + template;

	// TODO: parameterise event details
	var from = "'Emmanuel May Ball Ticketing' <ticketing@emmamayball.com>";

	var render = jade.compileFile(template, {
		filename:template,
		pretty:"\t"
	});
	var html = render(data);
	var text = htmlToText.fromString(html, {
		tables:['.emailTable'],
		linkHrefBaseUrl: 'http://tickets.emmamayball.com'
	});

	var mailcomposer = new MailComposer();
	mailcomposer.setMessageOption({
		from    : from,
		to      : to,
		subject : subject,
		text    : text,
		html    : html
	});

	var build = Q.nbind(mailcomposer.buildMessage, mailcomposer);
	// var sendMsg = Q.nbind(mg.sendRaw, mg);
	return build().then(function(message) {
		// TODO: Log
		connection.runSql("INSERT INTO email SET ?, send_time=UNIX_TIMESTAMP()",[
		{
			from_email: from,
			message_content: text
		}]).then(function(result) {
			connection.runSql("INSERT INTO email_destination SET ?",[{
				address: to.toString(), // TODO: toString might not be necessary
				email_id: result.insertId
			}]);
		});

		var d = Q.defer();
		mailgun.messages().sendMime({
			to: to,
			message: message
		}, function(sendError, body) {
			if (sendError) {
				d.reject(sendError);
				console.log(sendError);
				return;
			}
			d.resolve(body);
		});

		return d.promise;
	});

}