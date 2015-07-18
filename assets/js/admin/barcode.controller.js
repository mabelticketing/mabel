/* global _ */
angular.module('mabel.admin')
	.controller("BarcodeController", BarcodeController);

function BarcodeController() {
	JsBarcode(document.getElementById("barcode"), "123456789005", {format:"UPC",displayValue:true,fontSize:20})
}