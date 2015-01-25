var Mailgun = require('mailgun').Mailgun;
var config = require('./config.js');
var jade = require("jade");
var htmlToText = require('html-to-text');
var Q = require("q");
var MailComposer = require("mailcomposer").MailComposer;
var mg = new Mailgun(config.mailgun_api_key);

module.exports = {
	send: send
};

function send(to, subject, template, data) {
	if (typeof to === 'string') to = [to];
	template = __dirname + "/../views/email/" + template;

	// TODO: parameterise event details
	// TODO: Set up emmamayball.com domain on mailgun
	var from = "'Emmanuel May Ball Ticketing' <ticketing@emmamayball.com>";

	var render = jade.compileFile(template, {
		filename:template,
		pretty:"\t"
	});
	var html = render(data);
	var text = htmlToText.fromString(html);

	var mailcomposer = new MailComposer();
	mailcomposer.setMessageOption({
		from    : from, // TODO: Parameterise this
		to      : to,
		subject : subject,
		text    : text,
		html    : html
	});

	var build = Q.nbind(mailcomposer.buildMessage, mailcomposer);
	var sendMsg = Q.nbind(mg.sendRaw, mg);
	return build().then(function(message) {
		// TODO: Log
		return sendMsg(from, to, message);
	});

}