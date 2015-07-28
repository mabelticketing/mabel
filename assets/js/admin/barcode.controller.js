/* global _ */
angular.module('mabel.admin')
	.controller("BarcodeController", BarcodeController);

function BarcodeController($scope, APICaller) {
	var vm = this;

	var PDFRenderer = function PDFRenderer(doc, stickerWidth, stickerHeight) {
		this.doc = doc;
		this.offX = 0;
		this.offY = 0;
		this.stickerWidth = stickerWidth;
		this.stickerHeight = stickerHeight;
	};
	PDFRenderer.prototype = Object.create(JsBarcode.Renderer.prototype);
	PDFRenderer.prototype.coffX = function() {
		return this.offX + this.stickerWidth / 2 - this.width / 2;
	}

	PDFRenderer.prototype.size = function(w, h) {
		this.width = w;
		this.height = h;
	};
	PDFRenderer.prototype.rect = function(colour, x, y, w, h) {
		this.doc.rect(mm(x + this.coffX()), mm(y + this.offY), mm(w), mm(h)).fill(colour)
	}
	PDFRenderer.prototype.text = function(text, x, y, size, font, align) {

		if (align === "right") {
			x -= this.width
		} else if (align === "center") {
			x -= this.width / 2
		}
		this.doc
			.font(font)
			.fontSize(size)
			.text(text, mm(x + this.coffX()), mm(y - 8 + this.offY), {
				width: mm(this.width),
				align: align
			})
	}

	function mm(n) {
		return n * 2.8346456692895527;
	}

	function drawStickerBase() {
		// modelled after https://www.a4labels.com/products/transparent-gloss-labels-63-x-38mm/24696
		for (var y = 0; y < 7; y++) {
			for (var x = 0; x < 3; x += 1) {
				doc.roundedRect(mm(7.75 + (63.5 + 2) * x), mm(15.5 + 38.1 * y), mm(63.5), mm(38.1), mm(1.5)).fillAndStroke("#EEEEEE", "#000000")
			}
		}
	}

	function drawSticker(r, doc, code, name, type) {
		// barcodes
		JsBarcode(r, code, {
			format: "UPC",
			displayValue: true,
			font: "Helvetica",
			fontSize: 10,
			quite: 5,
			width: 0.32,
			height: r.stickerHeight
		})

		// labels
		doc
			.font("Helvetica")
			.fontSize(14)
			.text(name, mm(r.offX), mm(r.offY - 12), {
				width: mm(r.stickerWidth),
				align: "center"
			})
			.font("Helvetica-Bold")
			.fontSize(10)
			.text(type, mm(r.offX), mm(r.offY - 5), {
				width: mm(r.stickerWidth),
				align: "center"
			})
	}

	function fiveChar(n) {
		return ("00000" + n).slice(-5);
	}

	function makePDF(iframeID) {
		// create a document and pipe to a blob
		var doc = new PDFDocument({
			size: "a4",
			margin: 0
		});

		var stream = doc.pipe(blobStream());

		var showGrid = false;
		if (showGrid) drawStickerBase();


		var cols = 3,
			rows = 7;
		var w = 35,
			h = 13,
			offX = 7.75,
			offY = 32,
			mX = 2,
			mY = 25.1;
		var r = new PDFRenderer(doc, 63.5, 13);
		r.stickerWidth = 63.5
		for (var i = 0; i < 50; i++) {
			
			if (i > 0 && i % (cols * rows) === 0) {
				doc.addPage()
				if (showGrid) drawStickerBase();
			}
			
			var x = i % cols;
			var y = Math.floor(i / cols) % rows;
			r.offY = offY + y * (h + mY);
			r.offX = offX + x * (r.stickerWidth + mX);

			var code = fiveChar(vm.allTickets[i].user_id) + "  " + fiveChar(vm.allTickets[i].id)
			drawSticker(r, doc, code, allTickets[i].guest_name, allTickets[i].ticket_type_name);
		}
		console.log("Sent all commands");
		// end and display the document in the iframe
		doc.end();
		console.log("Ended")
		stream.on('finish', function() {
			document.getElementById(iframeID).src = stream.toBlobURL('application/pdf');
			console.log("Document written");
		});
		stream.on('pipe', function() {
			console.log("Got data");
		})
	}

	console.log("Getting ticket data...")
	APICaller.get("ticket/getAllDetailed", {},
		function(err, data) {
			if (err) return alert(err);
			if (data.length < 1) return alert("No tickets found");
			console.log("Ticket data obtained.")
			vm.allTickets = _.filter(data, function(t) {
				return t.status_id===2;
			});
			allTickets = vm.allTickets;
			makePDF("pdf");
		}
	);

}