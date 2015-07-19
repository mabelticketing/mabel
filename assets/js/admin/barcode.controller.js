/* global _ */
angular.module('mabel.admin')
	.controller("BarcodeController", BarcodeController);

function BarcodeController() {
	JsBarcode(document.getElementById("barcode"), "12345 45678", {format:"UPC",displayValue:true,fontSize:20})
}