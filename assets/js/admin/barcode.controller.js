/* global _ */
angular.module('mabel.admin')
	.controller("BarcodeController", BarcodeController);

function BarcodeController() {
	// JsBarcode(document.getElementById("barcode"), "78945 63214", {format:"UPC",displayValue:true, fontSize:20})
	// JsBarcode(document.getElementById("barcode2"), "78945 63214", {format:"UPC",displayValue:true, fontSize:20})
	// JsBarcode(document.getElementById("barcode3"), "78945 63214", {format:"UPC",displayValue:true, fontSize:20})
	// JsBarcode(new JsBarcode.VectorRenderer(document.getElementById("barcode4")), "78945 63214", {format:"UPC",displayValue:true, fontSize:20})

    var PDFRenderer = function PDFRenderer(doc, stickerWidth) {
        this.doc = doc;
        this.offX = 0;
        this.offY = 0;
        this.stickerWidth = stickerWidth;
    };
    PDFRenderer.prototype = Object.create(JsBarcode.Renderer.prototype);
    PDFRenderer.prototype.coffX = function() {
        return this.offX + this.stickerWidth/2 - this.width/2;
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
            x -= this.width/2
        }
        this.doc
            .font(font)
            .fontSize(size)
            .text(text, mm(x + this.coffX()), mm(y  - 7 + this.offY), {
                width: mm(this.width),
                align: align
            })
    }

    function mm(n) {
        return n*2.8346456692895527;
    }


	// create a document and pipe to a blob
	var doc = new PDFDocument({size:"a4", margin:0});

	var stream = doc.pipe(blobStream());
    
    // measurement grid
    // for (var y = 0; y<297; y+=10) {
    //     for (var x = (y%20==0?10:0); x<290; x+=20) {
    //         doc.rect(mm(x), mm(y), mm(10), mm(10)).fill("#EEEEEE")
    //     }
    // }

    var cols = 4, rows = 9;
    var w = 30, h = 20, offX = 5, offY = 10, mX = 0, mY = 10;
    var r = new PDFRenderer(doc, w);
    r.stickerWidth = 50
    for (var i=0; i<50; i++) {
        if (i>0 && i%(cols*rows)===0) doc.addPage()
        var x = i%cols;
        var y = Math.floor(i/cols) % rows;
        r.offY = offY + y * (h + mY);
        r.offX = offX + x * (r.stickerWidth + mX);
        JsBarcode(r, "78945 63214", {format:"UPC",displayValue:true, font:"Courier", fontSize:10, quite:10, width:w/100, height: h})
    }
  // end and display the document in the iframe
  doc.end();
  stream.on('finish', function() {
    document.getElementById("pdf").src = stream.toBlobURL('application/pdf');
  });
}