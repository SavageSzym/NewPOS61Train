/**
 * wayCommon.js
 * Contains some helper functions that can be used by any other module.
 * 
 * $Revision: 1.10 $
 * $Date: 2009/12/11 13:50:15 $
 * $Author: dsantos $ (of revision)
 */

// Globals
var gErrorPage = "about:blank";
var gBusinessDate = "";
var gWayStationDate = "";

/** Set the global business Date */
function setBusinessDate(obj) {
	gBusinessDate = obj;
}

/** Set the global business Date */
function setWayStationDate(obj) {
	gWayStationDate = obj;
}

/** Get the global business Date */
function getBusinessDate() {
	return gBusinessDate;
}

/** Get the global business Date */
function getWayStationDate() {
	return gWayStationDate ;
}


/** Displays an error message and closes the WayStation */
function fatalError(obj) {
	if (!obj) {
		alert("Fatal error");
	} else if (isError(obj)) {
		var message = "Unexpected error (" + obj.name + ").\n\n"
		+ "Error message: " + obj.message;
		if (obj.fileName) message += "\n\nScript file: " + obj.fileName;
		if (obj.lineNumber) message += "\nLine number: " + obj.lineNumber;
		if (obj.stack) message += "\n\nStack trace:\n" + obj.stack;
		alert(message);
		throw obj;
	} else {
		alert(obj);
	}
	//window.location = gErrorPage;
}
/** Gets the name and values (optional) of an object's properties. */
function getProps(obj, includeValues) {
	var str = "";
	for (var prop in obj) {
		str += prop;
		if (includeValues) {
			str += " = " + obj[prop];
		}
		str += "\n";
	}
	return str;
}
/**
 * Implements a very simple path-find language.
 * @param node node to start looking for path
 * @path query to execute on the node
 */
var regex_times = /\((\d+)\)/; //new RegExp("\\((\\d+)\\)");
var regex_value = /\[(@?\w+)=(\w+)\]/; //new RegExp("\\[(@?\\w+)=(\\w+)\\]");
function findByPath(node, path) {
	var paths = path.toLowerCase().split(';');
	for (var i = 0; i < paths.length; i++) {
		var timeGroups = regex_times.exec(paths[i]);
		paths[i] = paths[i].replace(regex_times, "");
		var times = (timeGroups == null || timeGroups.length == 0) ? 1 : parseInt(timeGroups[1]);
		var valueGroups = regex_value.exec(paths[i]);
		paths[i] = paths[i].replace(regex_value, "");
		var childName = (valueGroups == null || valueGroups.length == 0) ? null : valueGroups[1];
		var childValue = (valueGroups == null || valueGroups.length == 0) ? null : valueGroups[2];
		var children = node.childNodes;
		var found = false;
		for (var j = 0; j < children.length; j++) {
			if ((paths[i] == "text" && isTextNode(children[j])) 
					|| (namesEqual(paths[i], children[j].tagName) && hasChild(children[j], childName, childValue))
				) {
				if (--times == 0) {
					node = children[j];
					found = true;
					break;
				}
			}
		}
		if (!found) {
			return null;
		}
	}
	function namesEqual(pathName, tagName) {
		return tagName && (pathName == "*" || pathName == tagName.toLowerCase());
	}
	function hasChild(node, childName, childValue) {
		if (childName && childValue) {
			if (childName.charAt(0) == '@') {
				var attribute = node.getAttribute(childName.substring(1));
				if (attribute && cmp(attribute, childValue)) {
					return true;
				}
			} else {
				var children = node.childNodes;
				for (var i = 0; i < children.length; i++) {
					if (cmp(children[i].tagName, childName) && children[i].firstChild && cmp(children[i].firstChild.data, childValue)) {
						return true;
					}
				}
			}
			return false;
		} else {
			return true;
		}
	}
	function cmp(o1, o2) {
		if (o1 == o2) return true;
		if (!o1 || !o2) return false;
		return (o1.toLowerCase() == o2.toLowerCase());
	}
	return node;
}
/** Checks if a DOM node represents a text node */
function isTextNode(node) {
	return node && (node.nodeType == 3);
}
/** Returns the first element of the given node list */
function firstElement(nodeList) {
	for (var i = 0; i < nodeList.length; i++) {
		if (isElement(nodeList[i])) {
			return nodeList[i];
		}
	}
	return null;
}
/** Returns the first child element of the given node */
function firstChildElement(node) {
	return firstElement(node.childNodes);
}
/** Returns the next element from the given node */
function nextElement(node) {
	do {
		node = node.nextSibling;
	} while (node && !isElement(node));
	return node;
}
/** Removes all child nodes from the given parent */
function removeChildNodes(parent) {
	while (parent.lastChild) parent.removeChild(parent.lastChild);
}

//SDO-1703
//if (!this.atob || !this.btoa) { 
	var B64_keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	var base64test = /[^A-Za-z0-9\+\/\=]/g;
//}
/** Encodes a text to BASE64 */
function encodeB64(input) {
	if (this.btoa) {
		// Mozilla / opera has native base 64 encoder
		return btoa(input);
	}
	var output = "";
	var chr1, chr2, chr3 = "";
	var enc1, enc2, enc3, enc4 = "";
	var i = 0;

	do {
		chr1 = input.charCodeAt(i++);
		chr2 = input.charCodeAt(i++);
		chr3 = input.charCodeAt(i++);

		enc1 = chr1 >> 2;
		enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
		enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
		enc4 = chr3 & 63;

		if (isNaN(chr2)) {
			enc3 = enc4 = 64;
		} else if (isNaN(chr3)) {
			enc4 = 64;
		}
		output = output + 
			B64_keyStr.charAt(enc1) + 
			B64_keyStr.charAt(enc2) + 
			B64_keyStr.charAt(enc3) + 
			B64_keyStr.charAt(enc4);
		chr1 = chr2 = chr3 = "";
		enc1 = enc2 = enc3 = enc4 = "";
	} while (i < input.length);
	return output;
}

/** Decodes a BASE64 to plain text */
function decodeB64(input) {
	//SDO-1703
	/*if (this.atob) { 
		// Mozilla / opera has native base 64 decoder
		return atob(input);
	}*/
	var output = "";
	var chr1, chr2, chr3 = "";
	var enc1, enc2, enc3, enc4 = "";
	var i = 0;
	//Fix Problem with UTF8 Decoding By Tiger
	var utf8Chars=new Array();
	//...Fix Problem with UTF8 Decoding By Tiger
	/* The commented lines bellow should be used to clean '\n', etc... if needed
	if (base64test.exec(input)) {
		throw new Error("There were invalid base64 characters in the input text");
	}
	// remove all characters that are not A-Z, a-z, 0-9, +, /, or =
	input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
	*/
	do {
		enc1 = B64_keyStr.indexOf(input.charAt(i++));
		enc2 = B64_keyStr.indexOf(input.charAt(i++));
		enc3 = B64_keyStr.indexOf(input.charAt(i++));
		enc4 = B64_keyStr.indexOf(input.charAt(i++));		

		chr1 = (enc1 << 2) | (enc2 >> 4);
		chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
		chr3 = ((enc3 & 3) << 6) | enc4;
		
		//Fix Problem with UTF8 Decoding By Tiger
		utf8Chars.push(chr1);
		if (enc3 != 64) utf8Chars.push(chr2);
		if (enc4 != 64) utf8Chars.push(chr3);		
		
		//output = output + String.fromCharCode(chr1);
		//if (enc3 != 64) output = output + String.fromCharCode(chr2);
		//if (enc4 != 64) output = output + String.fromCharCode(chr3);
		//...Fix Problem with UTF8 Decoding By Tiger

		chr1 = chr2 = chr3 = "";
		enc1 = enc2 = enc3 = enc4 = "";
	} while (i < input.length);
	
	//Fix Problem with UTF8 Decoding By Tiger
	i = 0;
	var c, c2, c3 = "";
	while ( i < utf8Chars.length ) {
 
		c = utf8Chars[i];
 
		if (c < 128) {
			output += String.fromCharCode(c);
			i++;
		}
		else if((c > 191) && (c < 224)) {
			c2 = utf8Chars[i+1];
			output += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
			i += 2;
		}
		else {
			c2 = utf8Chars[i+1];
			c3 = utf8Chars[i+2];
			output += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
			i += 3;
		} 
	}
	//...Fix Problem with UTF8 Decoding By Tiger
	
	return output;
}

/** Escape xml characters */
function escapeXml(text) {
	text = text.replace(/&/g, "&#38;");
	text = text.replace(/</g, "&#60;");
	text = text.replace(/>/g, "&#62;");
	text = text.replace(/\"/g, "&#34;");
	return text;
}
/** Gets the text data from the given node */
function getTextData(node) {
	var text = "";
	node = node.firstChild;
	while (node) {
		if (isTextNode(node)) {
			text += node.data;
		}
		node = node.nextSibling;
	}
	return text;
}
/** Calculates a cross-browser offset (in pixels) */
function calculateOffsetLeft(node) {
	return _calculateOffset(node, "offsetLeft");
}
/** Calculates a cross-browser offset (in pixels) */
function calculateOffsetTop(node) {
	return _calculateOffset(node, "offsetTop");
}
/** Internal: Calculates a cross-browser offset (in pixels) */
function _calculateOffset(node, attr) {
	var offset = 0;
	while (node) {
		offset += node[attr];
		node = node.offsetParent;
	}
	return offset;
}
/** Display the given text on a separated window */
function displayOnWindow(text) {
	var w = window.open("", "_blank");
	w.document.write("<html><body><pre>");
	w.document.write(escapeXml(text));
	w.document.write("</pre></body></html>");
	w.document.close();
	return w;
}