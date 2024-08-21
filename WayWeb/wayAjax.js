/**
 * wayAjax.js
 * Handles Ajax and XML-RPC requests, as well as XML-parsing.
 * 
 * $Revision: 1.6 $
 * $Date: 2006/03/22 17:35:17 $
 * $Author: gfonseca $ (of revision)
 */

var gXmlRpcUrl = "/goform/RPC2/";
var gKillUrl = "/goform/defaultURL/?wswskill";
//var gXmlRpcUrl = "/RPC2/";
var gCommError = false;


/** Gets the XMLHttpRequest object */
function getXMLHttpRequest() {
	// branch for native XMLHttpRequest object
	if (window.XMLHttpRequest) {
		return new XMLHttpRequest();
	// branch for IE/Windows ActiveX version
	} else if (window.ActiveXObject) {
		return new ActiveXObject("Microsoft.XMLHTTP");
	} else {
		fatalError("Error: the browser must support XMLHttpRequest");
	}
}
/** Gets the response id from an XML node */
function getResponseId(domNode) {
	var nodeId = findByPath(domNode, "methodResponse;params;param;value;struct;member[name=id];value;*;text");
	if (nodeId) {
		return Number(nodeId.data);
	} else {
		return -1;
	}
}
/** Creates the XML-RPC request for a method call */
function buildXmlMethodCall(methodName, params) {
	var data = "<?xml version=\"1.0\"?>\n"
        + "<methodCall>\n"
        + " <methodName>" + methodName + "</methodName>\n"
        + " <params>\n"
		+     buildParamsXml(params)
		+ " </params>"
    	+ "</methodCall>\n";
    return data;
    
	/** Builds the xml for a list of parameters */
	function buildParamsXml(params) {
		var data = "";
		for (var i=0; i<params.length; i++) {
			data += "  <param>\n";
			if (isArray(params[i])) {
				data += "   <value>\n    <array><data>";
				var array = params[i];
				for (var j=0; j<array.length; j++) {
					data += buildValueXml(array[j]);
				}
				data += "    </data></array>\n   </value>";
			} else {
				data += buildValueXml(params[i]);
			}
			data += "  </param>\n";
		}
		return data;
	}
	function buildValueXml(value) {
		if (value == null) {
			return "   <value></value>\n";
		} else if (isInteger(value)) {
			return "   <value><i4>" + value + "</i4></value>\n";
		} else {
			return "   <value><string>" + value + "</string></value>\n";
		}
	}
}
/** Creates the XML-RPC request for a "query" operation */
function buildQueryXml(id) {
	var params = new Array();
	params[0] = id;
	return buildXmlMethodCall("Query", params);
}
/** Sends the given XML-RPC command. Response will be passed to the given "callBack" */
function asyncXmlRpc(xmlData, callBack) {
	var req = getXMLHttpRequest();
	req.onreadystatechange = function () {
		if (req.readyState == 4) {
			callBack(req);
			delete(req);
			delete(xmlData);
		}
	}
	req.open("POST", gXmlRpcUrl, true);
	req.send(xmlData);
}

/** Sends a request to kill Web Server */
function requestKill() {
	window.location=gKillUrl;
}


/** Sends the given XML-RPC command and returns the response */
function syncXmlRpc(xmlData) {
	var req = getXMLHttpRequest();
	req.open("POST", gXmlRpcUrl, false);
	req.send(xmlData);
	return req;
}
/** Checks if an ajax request is ok */
function isRequestOk(req) {
	try {
		gCommError = (req.status == 12029); // Connection error on IE
		return (req.status == 200);
	} catch (ex) {
		gCommError = true; // Connection error on Firefox
		return false;
	}
}
/** Gets the real value from an XML-RPC <value> node */
function getXmlRpcValue(nodeValue) {
	if (!nodeValue) return "";
	var valueType = firstChildElement(nodeValue);
	var tagName = "string"; // default;
	if (!valueType) {
		valueType = nodeValue;
	} else {
		tagName = valueType.tagName;
	}
	var children = valueType.childNodes;
	var data = "";
	for (var i = 0; i < children.length; i++) {
		if (isTextNode(children[i])) {
			data += children[i].data;
		}
	}
	switch (tagName) {
		case "string" :
			return data;
		case "i4":
		case "int":
		case "double":
			return Number(data);
		case "boolean":
			return data != "0";
		case "base64":
			return decodeB64(data);
		default:
			throw new Error("Invalid XML-RPC value type: [" + child.tagName + "]");
	}
}
/** Checks if a response contains any faultCode */
function isFault(req) {
	var fault = findByPath(req.responseXML, "methodResponse;params;param;value;struct;member[name=faultCode]");
	return fault != null;
}
/** Gets the fault code of a response */
function getFaultCode(req) {
	return getXmlRpcValue(findByPath(req.responseXML, "methodResponse;params;param;value;struct;member[name=faultCode];value"));
}
/** Gets the fault string of a response */
function getFaultString(req) {
	return getXmlRpcValue(findByPath(req.responseXML, "methodResponse;params;param;value;struct;member[name=faultString];value"));
}
/** Checks if a request is still under processing */
function isUnderProcessing(req) {
	var nodeValue = findByPath(req.responseXML, "methodResponse;params;param;value;struct;member[name=faultCode];value");
	if (nodeValue) {
		var faultCode = getXmlRpcValue(nodeValue);
		return faultCode == 99; // 99 means "under processing"
	}
	return false;
}
/** Parses an XML url and passes the DOM node to the given handler when done */
function parseXmlUrl(url, handler) {
	var req = getXMLHttpRequest();
	req.onreadystatechange = function () {
		if (req.readyState == 4) {
			if (isRequestOk(req) && req.responseXML) {
				handler(req.responseXML);
			} else {
				handler(null);
			}
			delete(req);
		}
	}
	url += "?ts=" + new Date().getTime();
	req.open("GET", url, true);
	req.send(null);
}
/** Parses an XML text and returns the DOM node */
function parseXmlText(text) {
	var xmlDoc = null;
	if (window.ActiveXObject) {
		xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
		xmlDoc.async = false;
		xmlDoc.loadXML(text);
	} else if (document.implementation && document.implementation.createDocument) {
		var parser = new DOMParser();
		xmlDoc = parser.parseFromString(text, "text/xml");
	} else {
		fatalError("This browser does not support xml-text parsing");
	}
	return xmlDoc;
}