/**
 * wayMain.js
 * Start-point for WayStation front-end.
 * 
 * $Revision: 1.8 $
 * $Date: 2007/04/17 21:19:05 $
 * $Author: gfonseca $ (of revision)
 */t

var gNextRefresh = 0;
var gIdleMode = false;
/** This function must be called from HTML page. It starts all the way station engine */
function initWayStation() {
	try {
		initGui();
		startAjaxThreads();
	} catch (ex) {
		fatalError(ex);
	}
}

/** Thread that updates POS state. (Query the result of WAY_GetPosList) */
function posStateQueryThread(id) {
	if (gIdleMode) return;
	gNextRefresh = 0;
	asyncXmlRpc(buildQueryXml(id), posStateQueryCallBack);
	
	function posStateQueryCallBack(req) {
		try {
			if (isRequestOk(req)) {
				setErrorState(false);
				if (isUnderProcessing(req)) {
					window.setTimeout("posStateQueryThread(" + id + ")", 3000);
					return;
				} else if (isFault(req)) {
					showTextMessage("WayStation error #" + getFaultCode(req) + ": " + getFaultString(req));
				} else {
					var nodeValue = findByPath(req.responseXML, "methodResponse;params;param;value;struct;member[name=payload];value");
					var xml = getXmlRpcValue(nodeValue);
					var xmlNode = parseXmlText(xml);
					var posList = findByPath(xmlNode, "Data;PosList");
					if (posList) {
						updateNodesList(posList,"POS");
						updateNodesList(posList,"PROD");
					} else {
						fatalError("Could not find the pos-list on WayStation xml response.");
					}
				}
			} else {
				setErrorState(true);
			}
			gNextRefresh = window.setTimeout("posStateThread()", gConfig["REFRESH_INTERVAL"]);
		} catch (ex) {fatalError(ex);}
	}
}
/** Thread that updates POS state. (calls WAY_GetPosProductionList) */
function posStateThread() {
	if (gIdleMode) return;
	var xmlRequest = buildXmlMethodCall("ExecuteWorkflow", Array("WAY_GetPosProductionList"));
	asyncXmlRpc(xmlRequest, posStateCallBack);
	delete(xmlRequest);
	
	function posStateCallBack(req) {
		try {
			if (isRequestOk(req)) {
				setErrorState(false);
				var id = getResponseId(req.responseXML);
				// Starts the thread that will query the result
				posStateQueryThread(id);
			} else {
				setErrorState(true);
				setBusinessDate("unknown");
				gNextRefresh = window.setTimeout("posStateThread()", gConfig["REFRESH_INTERVAL"]);
			}
		} catch (ex) {fatalError(ex);}
	}
}


/** Thread that checks if we should enable "IDLE" mode */
function checkIdleThread() {
	try {
		var idle = getGuiIdleTime() > (10*60000);
		if (idle != gIdleMode) {
			gIdleMode = idle;
			if (idle) {
				window.clearTimeout(gNextRefresh); // Stops posStateThread
				showTextMessage("Operating on IDLE mode. Click anywere to leave IDLE mode.", true);
			} else {
				showTextMessage("Leaving IDLE mode.");
				window.clearTimeout(gNextRefresh);
				posStateThread();
			}
		}
		window.setTimeout("checkIdleThread()", 500);
	} catch (ex) {fatalError(ex);}
}
/** Starts Ajax threads */
function startAjaxThreads() {
	posStateThread();
	checkIdleThread();
}
/** Function called when "refresh" button is pressed */
function refreshPoslist() {
	if (gNextRefresh) {
		window.clearTimeout(gNextRefresh);
		posStateThread();
	}
}