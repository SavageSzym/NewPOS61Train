// Here, you shall to translate newPOS standard directives to desired language
// The value of variables are just an example and must be changed
var networkOn = "\u4E2D\u56FD";
var networkOff = "\u4E01\u4E03";
var stateClosed ="\u4E07\u4E08";
var stateOpened = "\u4E09\u4E0A";
var stateLogged = "\u4E0B\u4E0C";
var stateBlocked = "\u4E0D\u4E0E";
var stateBlockOp = "\u4E10\u4E11";
var podFC = "\u4E13\u4E14";
var podDT = "\u4E15\u4E16";
var podWT = "\u4E18\u4E19";

function getLanguageParam(param){
	switch(param)
	{
		case "networkOn":
			return(networkOn);
		case "networkOff":
			return(networkOff);
		case "Closed":
			return(stateClosed);
		case "Opened":
			return(stateOpened);
		case "Logged":
			return(stateLogged);
		case "Blocked":
			return(stateBlocked);
		case "BlockOp":
			return(stateBlockOp);
		case "FC":
			return(podFC);
		case "DT":
			return(podDT);
		case "WT":
			return(podWT);
		default:
			return("");
	}
}

