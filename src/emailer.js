/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

// imports
var connection = require('./api/connection.js');
var config = require('./config.js');
var mabelData = require('../mabel.json');
var mailgun = require('mailgun-js')({ apiKey: config.mailgun_api_key, domain: "emmajuneevent.com" });
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
	var from = "'Emmanuel June Event Ticketing' <ticketing@emmajuneevent.com>";

	// debug
	// to = "'Christopher Little Test' <hephistocles+mabeltest@gmail.com>";

	var render = jade.compileFile(template, {
		filename:template,
		pretty:"\t"
	});
	var html = render(extend({}, mabelData, data));
	var text = htmlToText.fromString(html, {
		tables:['.emailTable'],
		linkHrefBaseUrl: 'http://tickets.emmajuneevent.com'
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

function extend(target) {
    var sources = [].slice.call(arguments, 1);
    sources.forEach(function (source) {
        for (var prop in source) {
            target[prop] = source[prop];
        }
    });
    return target;
}