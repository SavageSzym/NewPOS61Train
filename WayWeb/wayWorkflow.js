/**
 * wayWorkflow.js
 * Handles local and remote workflows.
 * 
 * $Revision: 1.10 $
 * $Date: 2007/01/09 17:43:47 $
 * $Author: gfonseca $ (of revision)
 */

// Maps local workflow handlers
var gLocalWorkflows = {
	WAY_ShowManagerMenu: wayShowManagerMenu,		// Does ask for password
	WAY_ShowScreen: wayShowScreen,
	WAY_Close: wayClose,
	WAY_DisplayManagerMenu: wayDisplayManagerMenu  	// Does not ask for password
};
var gMgrId = null;
var gMgrPwd = null;
var gWorkflowCallback = null;
var gLocalParameterCallback = null;
var gLocalYesNoCallback = null;

/** Executes the given action and calls the given callback with the result when it's done */
function executeAction(action, callBack) {
	try {
		if (action) {
			gWorkflowCallback = callBack;
			if (!runLocalWorkflow(action)) {
				runRemoteWorkflow(action);
			}
		} else {
			callBack(null);
		}
	} catch (ex) {
		workflowError("Internal error executing workflow.\n\nError message:\n" + ex.message);
	}
}

////////////////////
// Private functions
//////////////////// 

/** Executes a remote workflow */
function runRemoteWorkflow(action) {
	mountWorkflowParams(action, wfParametersCallback);
	
	function wfParametersCallback(parameters) {
		var xmlRequest = buildXmlMethodCall("ExecuteWorkflow", parameters);
		asyncXmlRpc(xmlRequest, wfRequestCallback);
	}
	function wfRequestCallback(req) {
		try {
			if (isRequestOk(req)) {
				var id = getResponseId(req.responseXML);
				// Starts the thread that will query the result
				workflowQueryThread(id);
			} else {
				workflowError("Error contacting Way Station.\nThe workflow has NOT been executed.");
			}
		} catch (ex) {fatalError(ex);}
	}
}
/** Thread that waits for the workflow to finish executing */
function workflowQueryThread(id) {
	asyncXmlRpc(buildQueryXml(id), workflowQueryCallback);
	
	function workflowQueryCallback(req) {
		try {
			if (isRequestOk(req)) {
				if (isUnderProcessing(req)) {
					window.setTimeout("workflowQueryThread(" + id + ")", 500);
					return;
				} else if (isFault(req)) {
					var msg = "Received an error from Way Station.\n"
						+ "Error code: " + getFaultCode(req) + "\n\n"
						+ "Error message:\n" + getFaultString(req);
					workflowError(msg);
				} else {
					var data = getPayloadData(req.responseXML);
					if (/^\s*$/.test(data)) {
						data = null; // data is empty
					} else {
						data = parseXmlText(data); // Not empty, parse xml response
						if (data.parseError && data.parseError.errorCode != 0) {
							// For IE
							workflowError("Error parsing xml response.\n\n"
							+ "Error code: " + data.parseError.errorCode + "\n"
							+ "Error message: " + data.parseError.reason + "\n"
							+ "Line: " + data.parseError.line);
							return;
						} else if (data && data.firstChild && data.firstChild.tagName == "parsererror") {
							// For FireFox
							workflowError("Error parsing xml response.\n\nError message:\n" + data.firstChild.firstChild.data);
							return;
						}
					}
					gWorkflowCallback(findByPath(data, "Data"));
				}
			} else {
				workflowError("Error contacting Way Station.\nThe workflow has NOT been executed.");
			}
		} catch (ex) {fatalError(ex);}
	}
}
/** Mounts the list of parameters for an workflow action */
function mountWorkflowParams(action, callback) {
	var params = new Array();
	params.push(action.getAttribute("workflow"));
	var nodeParameter = firstChildElement(action);
	addParameters();
	
	function addParameters() {
		while (nodeParameter) {
			params.push(nodeParameter.getAttribute("name"));
			var val = nodeParameter.getAttribute("value");
			if (/^JS_.*\(.*\)/.test(val)) {
				gLocalParameterCallback = localParameterCallback;
				gLocalYesNoCallback = localYesNoCallback;
				eval(val); // May or not be async
				return;
			} else {
				params.push(val == null ? "" : val);
			}
			nodeParameter = nextElement(nodeParameter);
		}
		callback(params);
	}
	function localParameterCallback(value) {
		gLocalParameterCallback = null;
		if (value == null) {
			gWorkflowCallback(null);
		} else {
			params.push(value);
			nodeParameter = nextElement(nodeParameter);
			addParameters();
		}
	}
	
	function localYesNoCallback(confirmed) {
		gLocalYesNoCallback=null;
		if (!confirmed) {
			gWorkflowCallback(null);
		}
		else {
			params.push("");
			nodeParameter = nextElement(nodeParameter);
			addParameters();
		}
	}

}
/** Displays an workflow error */
function workflowError(message) {
	showMessageDialog(message, dialogCallback);
	function dialogCallback() {
		gWorkflowCallback(null);
	}
}
/** Executes a local workflow, returns false if the given action is not local */
function runLocalWorkflow(action) {
	var wfName = action.getAttribute("workflow");
	var wfHandler = gLocalWorkflows[wfName];
	if (wfHandler) {
		wfHandler(action);
		gWorkflowCallback(null);
		return true;
	}
	return false;
}
/** Validates manager authorization, calling "callback(boolean)" when done. */
function validateAuthorization(callback) {
	authQueryThread.callback = callback;
	var xmlRequest = buildXmlMethodCall("ExecuteWorkflow", ["WAY_GetAuthorization", "Level", "manager", "User", gMgrId, "Password", gMgrPwd]);
	asyncXmlRpc(xmlRequest, authCallBack);
	delete(xmlRequest);
	
	function authCallBack(req) {
		try {
			if (isRequestOk(req)) {
				var id = getResponseId(req.responseXML);
				authQueryThread(id);
			} else {
				workflowError("Error contacting WayStation");
			}
		} catch (ex) {fatalError(ex);}
	}
}
/** Thread that queries authorization result */
function authQueryThread(id) {
	asyncXmlRpc(buildQueryXml(id), authQueryCallBack);
	function authQueryCallBack(req) {
		try {
			if (isRequestOk(req)) {
				if (isUnderProcessing(req)) {
					window.setTimeout("authQueryThread(" + id + ")", 500);
					return;
				} else if (isFault(req)) {
					workflowError("WayStation error #" + getFaultCode(req) + ": " + getFaultString(req));
				} else {
					var data = getPayloadData(req.responseXML);
					var ok = data.indexOf("Okay") > 0;
					authQueryThread.callback(ok);
					authQueryThread.callback = null;
				}
			} else {
				workflowError("Error contacting WayStation");
			}
		} catch (ex) {fatalError(ex);}
	}
}
/** Gets the payload data from an XML response from WayStation*/
function getPayloadData(xmlResponse) {
	var nodeValue = findByPath(xmlResponse, "methodResponse;params;param;value;struct;member[name=payload];value");
	return getXmlRpcValue(nodeValue);
}

///// Local workflow handlers
function wayDisplayManagerMenu(action) {
	wayShowScreen(action);
}

function wayShowManagerMenu(action) {
	gMgrId = null;gMgrPwd = null;
	
	showInputDialog("Enter the manager id.", "", idCallBack);
	function idCallBack(mgrId) {
		if (mgrId == "") {
			showInputDialog("Enter the manager id.", "", idCallBack);
		} else if (mgrId) {
			gMgrId = mgrId;
			showPasswordDialog("Enter the password.", pwdCallBack);
		}
	}
	function pwdCallBack(pwd) {
		if (pwd == "") {
			showPasswordDialog("Enter the password.", pwdCallBack);
		} else if (pwd) {
			gMgrPwd = pwd;
			validateAuthorization(authCallBack);
		}
	}
	function authCallBack(isAuthorized) {
		if (isAuthorized) {
			wayShowScreen(action);
		} else {
			gMgrId = null;gMgrPwd = null;
			showMessageDialog("Wrong manager id and/or password", null);
		}
	}
}
function wayShowScreen(action) {
	var param = findByPath(action, "Parameter[@name=ScreenNumber]");
	var screenNumber = param.getAttribute("value");
	loadScreen(Number(screenNumber));
}
function wayClose(action) {
	var param = findByPath(action, "Parameter[@name=Message]");
	var msg = param.getAttribute("value");
	showYesNoDialog(msg, closeCallback);
	
	function closeCallback(confirmed) {
		if (confirmed) {
			requestKill();
		}
	}
}

// Local parameter handlers
function JS_GetManagerId() {
	gLocalParameterCallback(gMgrId);
}
function JS_GetManagerPwd() {
	gLocalParameterCallback(gMgrPwd);
}

// Shows an input field allowing the user to fill it by typing or by choosing a date from the calendar helper.
// Covers the feature SDO-469 - Enhance the date entry in the web browser front-end
function JS_GetInputDate(message, defaultVal) {
	showDateDialog(message, defaultVal, gLocalParameterCallback);
}

function JS_GetInput(message, defaultVal) {
	showInputDialog(message, defaultVal, gLocalParameterCallback);
}

function JS_GetConfirmation(msg, dummy) {
	showYesNoDialog(msg, gLocalYesNoCallback);
}

function JS_GetSelectedPos() {
	var list = getSelectedPosList();
	if (list.length == 0) {
		showMessageDialog("Please select at least one POS...", gLocalParameterCallback);
	} else {
		var resp = "";
		for (var i = 0; i < list.length; i++) {
			resp += list[i];
			if (i < list.length - 1) resp += "|";
		}
		gLocalParameterCallback(resp);
	}
}