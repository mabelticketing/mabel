/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

/* global _ */
angular.module('mabel.admin')
	.controller("BarcodeController", BarcodeController);

function BarcodeController($scope, APICaller) {
	var vm = this;

	function EANchecksum(number){
		var result = 0;
		
		for(var i=0;i<12;i+=2){result+=parseInt(number[i]);}
		for(var j=1;j<12;j+=2){result+=parseInt(number[j])*3;}

		return (10 - (result % 10)) % 10;
	}

	function fiveChar(n) {
		return ("00000" + n).slice(-5);
	}
	
	function ticketType(n) {
	  switch(n) {
		  case 1: //Standard (discounted)
		  case 4: //Standard
		  case 7: //Free Standard
		  case 10: //Set up
		  case 12: //Robinson/Tit Hall Swap
		  case 13: //Master's Guest
		  case 14: //Staff
		  case 15: //Staff Guest
		  case 18: //Photographer
		  case 19: //Downing Swap
		  case 20: //Performer (50)
		  case 21: //Performer (115)
		  case 22: //Performer (95)
			return "Standard";
		  case 5: //Queue Jump
		  case 2: //Queue Jump (discounted)
		  case 8: //10 Pound Q jump
		  case 17: //Free Queue Jump
			return "Queue Jump";
		  case 6: //Dining
		  case 3: //Dining (discounted)
		  case 9: //President's Dining
		  case 11: //Free Dining
		  case 16: //Set up Dining
				return "Dining";
	  }
	}

	function makePDF(iframeID) {
		function drawStickerBase(doc) {
			// modelled after https://www.a4labels.com/products/transparent-gloss-labels-63-x-38mm/24696
			for (var y = 0; y < 7; y++) {
				for (var x = 0; x < 3; x += 1) {
					doc
						.setFillColor(230)
						.setDrawColor(0)
						.roundedRect(7.75 + (63.5 + 2) * x, 15.5 + 38.1 * y, 63.5, 38.1, 1.5, 1.5, 'DF');
				}
			}
		}

	  	function drawSticker(r, doc, code, name, type, stickerWidth, stickerHeight) {

		  	// tolerate any spaces (just strip them out)
		  	var EANnumber = (code + "").replace(/\s/g, "");
		  	// Add an EAN country code and prefix
		  	EANnumber = "00" + EANnumber;
		  	// add an EAN check digit
		  	EANnumber += EANchecksum(EANnumber);

		  	// barcodes
		  	var data = {};
		  	JsBarcode(data, EANnumber, {
			  	format: "EAN13",
			  	font: "Helvetica",
			  	fontSize: 10,
		  	});

		  	var count = 0;
		  	var slack = 10;
		  	var barCodeWidth = stickerWidth - slack;
		  	var barCodeHeight = stickerHeight;
		  	// there seems to be 95 strips for our codes?
		  	var barWidth = barCodeWidth/95;

		  	for (var i=0; i<data.encodings.length; i++) {
			  	var section = data.encodings[i];
			  	// discard null initial blocks
			  	if (parseInt(section.data) === 0 && i===0)
			  	  continue;

			  	for (var j=0; j<section.data.length; j++) {
				  	var bar = section.data[j] === "1";
				  	count ++;
					var x = slack/2 + barWidth*count;
				  	if (bar)
						doc.rect(x + r.offX, r.offY, barWidth, barCodeHeight, 'F');
				  	  // r.rect(doc, "black", slack/2 + barWidth*count, 0, barWidth, barCodeHeight);
			  	}
		  	}

		  	// labels
		  	doc
				.setLineWidth(stickerWidth)
			  	.setFont("helvetica", "normal")
			  	.setFontSize(14)
			  	.text(name, stickerWidth/2 + r.offX,r.offY - 8, "center")
			  	.setFont("helvetica", "bold")
			  	.setFontSize(10)
			  	.text(type || "Unknown",  stickerWidth/2 + r.offX, r.offY -3, "center")
			  	.setFont("courier", "normal")
			  	.setFontSize(10)
			  	.text(code,  stickerWidth/2 + r.offX, r.offY + 17, "center");
	  	}


		// create a document and pipe to a blob
		var doc = new jsPDF();
		
		var showGrid = false;
		if (showGrid) drawStickerBase(doc);
				doc.setDrawColor(0).setFillColor(0);

		var cols = 3,
			rows = 7;
		var h = 13,
			offX = 7.75,
			offY = 32,
			mX = 2,
			mY = 25.1;
		var r = {offX: 0, offY: 0};
		var stickerWidth = 63.5;
		var stickerHeight = 13;

		for (var i = 0; i < vm.allTickets.length; i++) {
			
			if (i > 0 && i % (cols * rows) === 0) {
				doc.addPage();
				if (showGrid) drawStickerBase(doc);
				doc.setDrawColor(0).setFillColor(0);
			}
			
			var x = i % cols;
			var y = Math.floor(i / cols) % rows;
			r.offY = offY + y * (h + mY);
			r.offX = offX + x * (stickerWidth + mX);

			var code = fiveChar(vm.allTickets[i].user_id) + "  " + fiveChar(vm.allTickets[i].id);
			drawSticker(r, doc, code, vm.allTickets[i].guest_name, ticketType(vm.allTickets[i].ticket_type_id), stickerWidth, stickerHeight);
		}

		console.log("Sent all commands");

		// end and display the document in the iframe
		document.getElementById(iframeID).src = doc.output('bloburl');
		console.log("Ended");
	}

	console.log("Getting ticket data...")
	APICaller.get("ticket", {},
		function(err, data) {
			if (err) return console.error(err);
			if (data.length < 1) return alert("No tickets found");
			console.log("Ticket data obtained.")
			vm.allTickets = _.filter(data, function(t) {
				return t.status==="CONFIRMED";
			});
			allTickets = vm.allTickets;
			makePDF("pdf");
		}
	);

}
