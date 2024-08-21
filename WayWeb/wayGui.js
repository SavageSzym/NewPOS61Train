/**
 * wayGui.js
 * Controls the user-interface.
 * 
 * $Revision: 1.23 $
 * $Date: 2009/11/13 20:09:37 $
 * $Author: dsantos $ (of revision)
 */
// Globals
var gScreensNode			= null;
var gPressedButton			= null;
var gButtonsList			= new Array();
var gPosNodesTable			= {};
var gProdNodesTable			= {};
var gPosNodesSignature		= "";
var gProdNodesSignature		= "";
var gQtyPosNodes			= 0;
var gQtyProdNodes			= 0;
var gGuiLoaded				= false;
var gModalVisible			= false;
var gDialogId				= "";
var gWaitingWorkflow		= false;
var gScreenTimesOut			= false;
var gLastEventTime			= new Date();
var gLastTextMessageId		= 0;
var gPosListMouseDown		= null;
var gWayTitle				= null;
var gShortPointNames		= {
	"FRONT_COUNTER": "FC",
	"DRIVE_THRU": "DT",
	"WALK_THRU": "WT"
};
// AUS-94
var dialog = null;
/**
 * Public function
 * Initializes the WayStation GUI.
 */
function initGui() {
	// Disables text selection on IE
	if (document.all) document.onselectstart = function () { return false; };
	// Initializes the messages area
	var messagesArea = document.getElementById("messagesArea");
	messagesArea.appendChild(document.createTextNode(""));	// Messages goes here
	// Initializes the clock
	var clockArea = document.getElementById("clockArea");
	removeChildNodes(clockArea);
	clockArea.appendChild(document.createTextNode(""));	// Current time
	// Adds "Enter" listener to input dialog
	addEvent(document.getElementById("inputDialog"), "keyup", onKeyUpInput);
	// Ajusts some sizes
	addEvent(document, "resize", ajustGuiSizes);
	document.body.onresize = ajustGuiSizes;
	window.onresize = ajustGuiSizes;
	window.setTimeout("ajustGuiSizes();", 50);window.setTimeout("ajustGuiSizes();", 100);
	window.setTimeout("ajustGuiSizes();", 500);window.setTimeout("ajustGuiSizes();", 1000);
	// Initializes the buttons area... (right-side)
	initButtonArea();
	// Starts GUI threads
	initGuiThreads();
	// Loads screen.xml
	parseScreenXml();
	// Cache some images
	loadImages();
}
/**
 * Public function
 * Display a text message on the system messages area
 */
function showTextMessage(message, dontTimeout) {
	var messagesArea = document.getElementById("messagesArea");
	var text = messagesArea.lastChild;
	if (message != null) {
		text.data = message;
		messagesArea.className="messagesAreaWithMessage";
		if (gLastTextMessageId) {
			window.clearTimeout(gLastTextMessageId);
		}
		if (!dontTimeout) {
			// message timeout
			gLastTextMessageId = window.setTimeout("showTextMessage(null)", gConfig["MESSAGES_TIMEOUT"]);
		}
	} else {
		text.data = gWayTitle;
		messagesArea.className="messagesAreaNoMessage";
		gLastTextMessageId = 0;
	}
}
/**
 * Public function.
 * Updates the POS list with the given nodes
 */
function updateNodesList(nodes,type) {
	var sigNature = getSignature(nodes, type);
	if(type=="POS") {
		if (sigNature != gPosNodesSignature) {
			recreatePosNodesList(nodes,"POS");
			gPosNodesSignature = sigNature;
		}
	}
	else {
		if (sigNature != gProdNodesSignature) {
			recreatePosNodesList(nodes,"PROD");
			gProdNodesSignature = sigNature;
		}
	} 	
	var WayBusinessDay = nodes.getAttribute("WayBusinessDay");
    setBusinessDate(WayBusinessDay);

	var WaySystemDate=nodes.getAttribute("WaySystemDate");
    setWayStationDate(WaySystemDate);
   
    var WayUpdt=nodes.getAttribute("WayVersion");
    var WayPackage=nodes.getAttribute("WayPackage");
    var WayUpdate=nodes.getAttribute("WayUpdt");
    var WayStoreState=nodes.getAttribute("WayState");
    gWayTitle="NewPOS v"+WayUpdt+ "  Pkg:" + WayPackage + "  Store:" + WayStoreState + " " + WayUpdate;
    showTextMessage(null);

	var node = firstChildElement(nodes);
	while (node) {
		var nodeType	= getAttribute(node, "node");
		if(type=="POS") {
			if(nodeType=="POS") {
				var posId		= node.getAttribute("id");
				var guiNode		= gPosNodesTable[posId];
				var first		= findByPath(guiNode, "tbody;tr");
				var second		= findByPath(guiNode, "tbody;tr(2)");
				var operator	= findByPath(first, "td(2);text");
				var state		= findByPath(first, "td(3);text");
				var network		= findByPath(first, "td(4);text");
				var pod			= findByPath(first, "td(5);text");
				var businessDay	= findByPath(second, "td(1);text");
				var pkg			= findByPath(second, "td(2);text");
				var version		= findByPath(second, "td(3);text");
				var ip			= findByPath(second, "td(4);text");
				var podType		= getAttribute(node, "type");
				
				//Use wayLanguage to translate NewPOS directives 
				// SDO-1720
				if(typeof getLanguageParam == 'function'){ 
					if(getAttribute(node, "online") == "1"){
						network.data = getLanguageParam("networkOn");
						
					}else{
						network.data = getLanguageParam("networkOff");
					}					
					state.data = getLanguageParam(getAttribute(node, "state"));
					pod.data   = getLanguageParam(gShortPointNames[podType] ? gShortPointNames[podType] : podType);
				}else{					
					network.data	= getAttribute(node, "online") == "1" ? "On" : "Off";
					state.data		= getAttribute(node, "state");
					pod.data		= gShortPointNames[podType] ? gShortPointNames[podType] : podType;
				}
				operator.data	= getAttribute(node, "operator");
				businessDay.data= getAttribute(node, "businessDate");
				pkg.data		= getAttribute(node, "pkg");
				version.data	= getAttribute(node, "version");
				ip.data			= getAttribute(node, "ip");
				nodeType		= getAttribute(node, "node");
			}
		}
		else {
			if(nodeType=="PROD") {
				var posId		= node.getAttribute("id");
				var guiNode		= gProdNodesTable[posId];
				var first		= findByPath(guiNode, "tbody;tr");
				var second		= findByPath(guiNode, "tbody;tr(2)");
				var alias		= findByPath(first, "td(2);text");
				var network		= findByPath(second, "td(1);text");
				var pkg			= findByPath(second, "td(2);text");
				var version		= findByPath(second, "td(3);text");
				var ip			= findByPath(second, "td(4);text");
				
				// SDO-1720
				if(typeof getLanguageParam == 'function'){ 
					if(getAttribute(node, "online") == "1"){
						network.data = getLanguageParam("networkOn");
						
					}else{
						network.data = getLanguageParam("networkOff");
					}					
				}else{					
					network.data	= getAttribute(node, "online") == "1" ? "On" : "Off";
				}
				
				alias.data		= getAttribute(node, "alias");
				pkg.data		= getAttribute(node, "pkg");
				version.data	= getAttribute(node, "version");
				ip.data			= getAttribute(node, "ip");
				nodeType		= getAttribute(node, "node");
			}
		}		
		node = nextElement(node);
	}
	function getAttribute(node, attribute) {
		var val = node.getAttribute(attribute);
		return (val && val != "") ? val : "N/A";
	}
	/** Gets the signature of a list of nodes */
	function getSignature(nodes, type) {
		var sigNature = "";
		var nodeType = "";
		var node = firstChildElement(nodes);
		while (node) {
			var posId = node.getAttribute("id");
			var nodeType = node.getAttribute("node");
			if(type==nodeType) {
				sigNature += posId+"|";
			}
			node = nextElement(node);
		}
		return sigNature;
	}
	/** Recreates the pos nodes list by removing all items and creating new ones */
	function recreatePosNodesList(nodes,type) {
		if(type=="POS") {
			gQtyPosNodes = 0;
			gPosNodesTable = {};
		}
		else {
			gQtyProdNodes = 0;
			gProdNodesTable = {};
		}	
		var lineToClone = document.getElementById("lineToClone");
		var nodesTableBody = lineToClone.parentNode;
		var linePrdToClone = document.getElementById("linePrdToClone");		
		var nodesPrdTableBody = linePrdToClone.parentNode;
		
		if(type=="POS") {
			removeChildNodes(nodesTableBody);
			nodesTableBody.appendChild(lineToClone);
		}
		else {
			removeChildNodes(nodesPrdTableBody);
			nodesPrdTableBody.appendChild(linePrdToClone);
		}
		
		var node = firstChildElement(nodes);
		while (node) {
			var nodeType			= node.getAttribute("node");
			if(type=="POS") {
				if(nodeType=="POS") {
					var newLine			= lineToClone.cloneNode(true);
					var table			= findByPath(newLine, "td;table");
					table.isSelected	= false;
					table.className		= "posInfoNormal";
					var first			= findByPath(table, "tbody;tr");
					var second			= findByPath(table, "tbody;tr(2)");
					var posNumber		= findByPath(first, "td(1);text");
					var posId			= node.getAttribute("id");
					posNumber.data		= Number(posId.substring(3)) + "";
					nodesTableBody.appendChild(newLine);
					
					addEvent(table, "mousedown", onMouseDownPosList);
					addEvent(table, "mouseup", onMouseUpPosList);
					
					gPosNodesTable[posId] = table;
					gQtyPosNodes++;
				}
			}
			else {
				if(nodeType=="PROD") {
					var newLine			= linePrdToClone.cloneNode(true);
					var table			= findByPath(newLine, "td;table");
					table.isSelected	= false;
					table.className		= "prodInfoNormal";
					var first			= findByPath(table, "tbody;tr");
					var posNumber		= findByPath(first, "td(1);text");
					var posId			= node.getAttribute("id");
					posNumber.data		= Number(posId.substring(3)) + "";
					nodesPrdTableBody.appendChild(newLine);
					
					//addEvent(table, "mousedown", onMouseDownPosList);
					//addEvent(table, "mouseup", onMouseUpPosList);
					
					gProdNodesTable[posId] = table;
					gQtyProdNodes++;
				}
			}	
			node = nextElement(node);
		}
		// This last <tr> element is used only to fill up needed space
		if(type=="POS") {
			nodesTableBody.appendChild(document.createElement("tr"));
		}
		else {
			nodesPrdTableBody.appendChild(document.createElement("tr"));
		}
	}
}
/** Displays a message dialog. The given callback is called when the dialog is closed. */
function showMessageDialog(message, callback) {
	showGenericDialog("ok", message, callback);
}
/** Displays a preview dialog. The given callback is called when the dialog is closed. */
function showPreviewDialog(text, callback) {
	showGenericDialog("preview", text, callback);
}
/**
 * Displays a yes/no dialog. The given callback is called when the dialog is
 * closed, passing true of false as a parameter
 */
function showYesNoDialog(message, callback) {
	showGenericDialog("yesNo", message, callback);
}
/**
 * Displays an input dialog with the given message and default value.
 * The user response is passed to "callback"
 */
function showInputDialog(message, defaultVal, callback) {
	if (!defaultVal) {
		defaultVal = "";
	}
	showGenericDialog("input", message, callback, defaultVal);
}

// Shows an input field allowing the user to fill it by typing or by choosing a date from the calendar helper.
// Covers the feature SDO-469 - Enhance the date entry in the web browser front-end
function showDateDialog(message, defaultVal, callback) {
	if (!defaultVal) {
		defaultVal = "";
	}
	showGenericDialog("input", message, callback, defaultVal, false, true);
}

/**
 * Displays a password dialog with the given message and default value.
 * The user response is passed to "callback"
 */
function showPasswordDialog(message, callback) {
	showGenericDialog("input", message, callback, "", true);
}
/** @return the number of milliseconds elapsed since the last user action */
function getGuiIdleTime() {
	return (new Date().getTime() - gLastEventTime.getTime());
}
/** Sets the global error state (if on error, a little popup will warn the user)*/
function setErrorState(error) {
	document.getElementById("commErrorPopup").className = (error ? "commErrorPopup" : "commErrorPopupHidden");
}
/** Loads the given screen */
function loadScreen(screen) {
	if (screen == null) return false;
	if (screen.tagName) { // It's already a DOM node
		var nodeScreen = screen;
	} else { // It's the screen number
		var nodeScreen = findByPath(gScreensNode, "Screen[@number=" + screen + "]");
		if (!nodeScreen) return false;
	}
	// Hides all buttons
	for (var i = 0; i < gButtonsList.length; i++) {
		gButtonsList[i].className = "buttonHidden";
	}
	// Loads buttons on that screen number
	var children = nodeScreen.childNodes;
	for (var i = 0; i < children.length; i++) {
		if (children[i].tagName == "Button") {
			loadButtonData(children[i]);
		}
	}
	gScreenTimesOut = nodeScreen.getAttribute("timeout") == "true";
	return true;
}
/** @return an Array with selected pos ids */
function getSelectedPosList() {
	var r = new Array();
	for (var node in gPosNodesTable) {
		if (gPosNodesTable[node].isSelected) {
			r.push(node);
		}
	}
	return r;
}
/** (Un)select all pos */
function selectAllPos() {
	if (isGuiActive()) {
		var select = (getSelectedPosList().length == 0);
		for (var node in gPosNodesTable) {
			gPosNodesTable[node].isSelected = select;
			gPosNodesTable[node].className = select ? "posInfoSelected" : "posInfoNormal";
		}
	}
}

////////////////////
// Private functions
////////////////////
/** Internal function to show a generic dialog */
function showGenericDialog(dlgId, message, callback, defaultVal, isPassword, isDate) {
	if (gModalVisible) throw new Error("Can't show two dialogs at the same time!");
	gModalVisible = true;
	dialogClick.callback = callback;
	// AUS-94 var dialog = document.getElementById(dlgId + "Dialog");
	dialog = document.getElementById(dlgId + "Dialog");
	var pMessage = document.getElementById(dlgId + "DialogMessage");
	
	if (dlgId == "preview") {
		if (pMessage.scrollTop) { // On IE, puts the scroll up if it's not already
			pMessage.scrollTop = 0;
		}
		pMessage.value = message;
		dialog.style.top = "10%";
		dialog.style.left = "15%";
		dialog.style.width = "70%";
		dialog.style.height = "80%";
	} else {
		message = message.split('\n');
		removeChildNodes(pMessage);
		for (var i = 0; i < message.length; i++) {
			pMessage.appendChild(document.createTextNode(message[i]));
			if (i < message.length - 1) {
				pMessage.appendChild(document.createElement("BR"));
			}
		}
		dialog.style.top = "30%";
		dialog.style.left = "32%";
		dialog.style.width = "35%";
		dialog.style.height = "40%";
	}
	// Displays the dialog on screen
	dialog.disabled = false;
	dialog.className = "dialog";
	gDialogId = dlgId;
	ajustDialogSizes();
	
	if (dlgId == "input") {
		document.getElementById("calendarButton").className = (isDate ? "dialogButton" : "dialogButtonHidden");
		var input = document.getElementById("inputDialogArea");
		var type = isPassword ? "password" : "text";
		if (input.type != type) {
			if (document.all) {
				// IE bug... can't change input type, must create a new one
				var newInput = document.createElement('input');
				newInput.setAttribute('id', input.id);
				newInput.setAttribute('type', type);
				input.parentNode.replaceChild(newInput, input);
				input = newInput;
			} else {
				input.type = type;
			}
		}
		input.value = defaultVal;
		ensureInputFocus();
		// On IE, focus may not be set.
		window.setTimeout("ensureInputFocus()", 10);
	} else {
		ensureBodyFocus();
		// On IE, focus may not be set.
		window.setTimeout("ensureBodyFocus()", 10);
	}
}
/** Ensure that the dialog input has the focus */
function ensureInputFocus() {
	try {document.getElementById("inputDialogArea").focus()}catch(ex){}
}
/** Ensure that the document body has the focus */
function ensureBodyFocus() {
	try {document.body.focus()}catch(ex){}
}
/** Parses the screen.xml by loading it from server*/
function parseScreenXml(tryNumber) {
	if (!tryNumber) tryNumber = 0;
	if (tryNumber++ < 5) {
		parseXmlUrl(gConfig["SCREEN_XML_URL"], onScreenXmlLoad);
		// Firefox error workaround...
		window.setTimeout("if (!gScreensNode) parseScreenXml(" + tryNumber + ");", 2000);
	}
	function onScreenXmlLoad(xml) {
		try {
			if (!gScreensNode && xml) {
				// Gets the root node
				gScreensNode = findByPath(xml, "Screens");
				// Removes unecessary nodes
				cleanUpScreenXml(gScreensNode);
				// Loads the base screen
				loadScreen(gConfig["BASE_SCREEN"]);
				checkGuiLoaded();
			}
		} catch (ex) {fatalError(ex)}
	}
	function cleanUpScreenXml(screensNode) {
		var screen = firstChildElement(screensNode);
		while (screen) {
			if (screen.getAttribute("type") != "1100") {
				var next = nextElement(screen);
				screensNode.removeChild(screen);
				screen = next;
			} else {
				screen = nextElement(screen);
			}
		}
	}
}
/** Thread that checks if the screen timeout has been reached and loads the base screen if so. */
function screenTimeoutThread() {
	try {
		if (gScreenTimesOut && isGuiActive() && getGuiIdleTime() > gConfig["SCREEN_TIMEOUT"]) {
			// Loads the first screen with WayStation type
			loadScreen(gConfig["BASE_SCREEN"]);
			gScreenTimesOut = false;
		}
		window.setTimeout("screenTimeoutThread()", 1000);
	} catch (ex) {fatalError(ex);}
}
/** Checks if all GUI components have been loaded and change global status */
function checkGuiLoaded() {
	// Put more contitions here if needed
	if (gScreensNode != null/*&& gModalsLoaded*/) {
		gGuiLoaded = true;
	}
}
/** Updates the clock with the given date/time */
function updateClock(time) {
	var clockArea = document.getElementById("clockArea");
	clockArea.lastChild.data = getWayStationDate() + " Business Day: " + getBusinessDate();
	//clockArea.lastChild.data = time.toString();
}
/** Loads a button data into a button */
function loadButtonData(buttonData) {
	if (buttonData) {
		var att = buttonData.getAttribute("number");
		if (att) {
			var btn = gButtonsList[Number(att) - 1];
			// Clears text
			removeChildNodes(btn);
			// Sets new text
			var captions = buttonData.getAttribute("title").split("\\n");
			for (var i = 0; i < captions.length; i++) {
				btn.appendChild(document.createTextNode(captions[i]));
				if (i < captions.length - 1) {
					btn.appendChild(document.createElement("br"));
				}
			}
			// Sets action
			btn.action = findByPath(buttonData, "Action[@type=onclick]");
			changeButton(btn, false);
		}
	}
}
/** Initializes the button area */
function initButtonArea() {
	var buttonsTable = document.getElementById("buttonsTable");
	var num = 0;
	for (var row = 0; row < 7; row++) {
		var tr = document.createElement("tr");
		for (var col = 0; col < 5; col++) {
			var btnNumber = num++;
			var td	= document.createElement("td");
			td.className = "buttonHidden";
			td.number	= btnNumber;
			
			addEvent(td, "mousedown",	onMouseDownButton);
			addEvent(td, "click",		onMouseClickButton);
			
			tr.appendChild(td);
			gButtonsList[btnNumber] = td;
		}
		buttonsTable.appendChild(tr);
	}
	addEvent(document.body, "mouseup", onMouseUpBody);
}
/** Event called on "mouse up" events on the pos list*/
function onMouseDownPosList(event) {
	if (isGuiActive()) {
		var node = event.currentTarget;
		gPosListMouseDown = node;
	}
}
/** Event called on "mouse up" events on the pos list*/
function onMouseUpPosList(event) {
	if (isGuiActive()) {
		var node = event.currentTarget;
		if (gPosListMouseDown == node) {
			node.isSelected = !node.isSelected;
			node.className = node.isSelected ? "posInfoSelected" : "posInfoNormal";
		}
	}
}
/** Changes a button appearance */
function changeButton(btn, selected) {
	if (btn != null) {
		var className = selected ? "buttonPressed" : "buttonNormal";
		btn.className = className;
	}
}
/** Event called when a button is released */
function releaseButton() {
	if (gPressedButton && gPressedButton.className != "buttonHidden") {
		changeButton(gPressedButton, false);
	}
	gPressedButton = null;
}
/** Callback called everytime a workflow ends execution */
function workflowCallback(data) {
	gWaitingWorkflow = false;
	if (data) {
		var type = data.getAttribute("type");
		if (type == "Report") {
			showPreviewDialog(getTextData(data));
		} else if (type == "Message") {
			showMessageDialog(getTextData(data), null);
		} else {
			// TODO: Implement open/close result
		}
	}
	releaseButton();
}
/** Event called everytime a mouse button is released */
function onMouseUpBody(event) {
	// window.setTimeout is needed to give a chance of other events to execute before
	window.setTimeout("if (isGuiActive()) releaseButton()", 10);
	window.setTimeout("gPosListMouseDown = null", 10);
	gLastEventTime = new Date();
}
/** Event called when a button is clicked (fire button action) */
function onMouseClickButton(event) {
	if (isGuiActive()) {
		gWaitingWorkflow = true;
		var btn = event.currentTarget;
		executeAction(btn.action, workflowCallback);
	}
}
/** Event called when a button is pressed */
function onMouseDownButton(event) {
	if (isGuiActive()) {
		var btn = event.currentTarget;
		gPressedButton = btn;
		changeButton(btn, true);
	}
}
/** Event called when a key is pressed on the input dialog */
function onKeyUpInput(event) {
	if (gModalVisible && gDialogId == "input") {
		if (window.event) event = window.event;
		if (event.keyCode == 13) { // Enter
			scwHide();
			dialogClick('okInput');
		} else if (event.keyCode == 27) { // ESC
			scwHide();
			dialogClick('cancelInput');
		}
	}
}
/** Returns true if the GUI is active (operable by user) */
function isGuiActive() {
	return gGuiLoaded && !gWaitingWorkflow && !gModalVisible;
}
/** Event called when a dialog button is pressed. */
function dialogClick(btn) {
	// AUS-94 var dialog = null;
	dialog = null;
	var resp = null;
	switch (btn) {
		case "ok":
			dialog = document.getElementById("okDialog");
			break;
		case "yes":
			dialog = document.getElementById("yesNoDialog");
			resp = true;
			break;
		case "no":
			dialog = document.getElementById("yesNoDialog");
			resp = false;
			break;
		case "closePreview":
			dialog = document.getElementById("previewDialog");
			break;
		case "print":
			dialog = document.getElementById("previewDialog");
			break;
		case "okInput":
			dialog = document.getElementById("inputDialog");
			resp = document.getElementById("inputDialogArea").value;
			if (!resp) resp = "";
			break;
		case "cancelInput":
			dialog = document.getElementById("inputDialog");
			break;
	}
	// IE bug
	if (document.body.focus) {
		window.setTimeout("if (!gModalVisible) document.body.focus()", 50);
		window.setTimeout("if (!gModalVisible) document.body.focus()", 1000);
	}
	// AUS-94
	if (btn == "print") {
		showTextMessage("Printing report...");
		var text = document.getElementById("previewDialogMessage").value;
		var w = window.open("", "_blank");
		w.document.write("<html><head>");
		w.document.write("<script language=\"JavaScript\">");
		w.document.write("function OnCloseWindow(){window.close();window.opener.unloadPrintWindow();return;}");
		w.document.write("function OnLoadPage(){window.print();setTimeout(\"OnCloseWindow()\", 1000);return;}");		
		w.document.write("</script></head><body onload=\"OnLoadPage()\"><pre>");		
		w.document.write(escapeXml(text));
		w.document.write("</pre></body></html>");		
		w.document.close();

	} else {
		closeDialog(resp);
	}
}

/** AUS-94
 * Notifies when print window is closed.
 */
function unloadPrintWindow() {
	closeDialog(null);
}

/** AUS-94
  * Closes dialog box.
  * @param resp Operation response to be send to caller.
  */
function closeDialog(resp) {
	// "Closes" the dialog
	dialog.disabled = true;
	dialog.className = "dialogHidden";
	gModalVisible = false;
	notifyDialogCaller.callback = dialogClick.callback;
	notifyDialogCaller.resp = resp;
	dialogClick.callback = null;
	window.setTimeout("notifyDialogCaller()", 0);	
	return;
}  

/** Function that notifies the dialog callback */
function notifyDialogCaller() {
	if (notifyDialogCaller.callback) {
		notifyDialogCaller.callback(notifyDialogCaller.resp);
	}
	gLastEventTime = new Date();
}
/** Thread that updates the clock */
function clockThread() {
	try {
		updateClock(new Date().toGMTString());
		window.setTimeout("clockThread()", 1000);
	} catch (ex) {fatalError(ex);}
}
/** Starts needed threads */
function initGuiThreads() {
	clockThread();
	screenTimeoutThread();
}
/** Caches some images */
function loadImages() {
	var imgs = new Array("btn-cancel.gif", "btni-cancel.gif", "btni-no.gif",
		"btni-ok.gif", "btni-print.gif", "btni-yes.gif", "btn-no.gif",
		"btn-ok.gif", "btn-print.gif", "btn-yes.gif", "btn-calendar.gif");
	for (var i = 0; i < imgs.length; i++) {
		var cache = document.createElement("img");
		cache.src = "img/"+imgs[i];
	}
}
/** Adjusts some sizes */
function ajustGuiSizes() {
	try {
		var border			= document.getElementById("outlineBorder");
		var listAndButtons	= document.getElementById("listAndButtons");
		
		var clientHeight	= document.body.clientHeight;
		var listStart		= calculateOffsetTop(listAndButtons);
		var listHeight		= (clientHeight - listStart) - (clientHeight/25);
		listAndButtons.style.height = listHeight + "px";
		ajustDialogSizes();
	} catch (ex) {fatalError(ex);}
}
/** Adjusts some sizes */
function ajustDialogSizes() {
	try {
		if (gModalVisible) {
			var dlg = document.getElementById(gDialogId + "Dialog");
			var dlgHeight	= dlg.offsetHeight;
			var attr		= document.all ? "className" : "class";
			var val			= gDialogId == "preview" ? "previewDialogMessage" : "dialogMessage";
			var message = findByPath(dlg, "*[@"+attr+"="+val+"]");
			if (message) {
				message.style.height = (dlgHeight - 65) + "px";
			}
		}
	} catch (ex) {fatalError(ex);}
}
/** Calculates a relative percentage in pixels */
function percentageAsPixels(percentage, relativeTo) {
	return parseInt((relativeTo*percentage)/100);
}
