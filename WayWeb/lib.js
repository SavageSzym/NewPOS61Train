function isElement(o, strict) {
    return o && isObject(o) && ((!strict && (o==window || o==document)) || o.nodeType == 1)
}
function filter(list, fn) {
    if (typeof(fn)=='string') return filter(list, __strfn('item,idx,list', fn));
    var result = [];
    fn = fn || function(v) {return v};
    map(list, function(item,idx,list) { if (fn(item,idx,list)) result.push(item) } );
    return result;
}
function getElemList(el) {
    if      (isElement(el)) return [el];
    else if (isString(el) ) return getElemList(el.split(/\s+/g)); 
    else if (isList(el)   ) {
        var r = map(el, getElem);
        return filter(r, isElement).length==r.length? r : null;
    }
    else return null;
}
function list(s, sep) {
    if (!isString(sep) && !isRegexp(sep))
        sep = sep? ',' : /\s*,\s*/;
    return s.split(sep);
}
function map(list, fn) {
    if (typeof(fn)=='string') return map(list, __strfn('item,idx,list', fn));

    var result = [];
    fn = fn || function(v) {return v};
    for (var i=0; i < list.length; i++) result.push(fn(list[i], i, list));
    return result;
}
Array.prototype.map = function(fn) { return map(this, fn) }

function isAlien(a)     { return isObject(a) && typeof a.constructor != 'function' }
function isArray(a)     { return isObject(a) && a.constructor == Array }
function isError(a)     { return a instanceof Error }
function isBoolean(a)   { return typeof a == 'boolean' }
function isFunction(a)  { return typeof a == 'function' }
function isNull(a)      { return typeof a == 'object' && !a }
function isNumber(a)    { return typeof a == 'number' && isFinite(a) }
function isInteger(a)   { return isNumber(a) && parseInt(a) == a}
function isObject(a)    { return (a && typeof a == 'object') || isFunction(a) }
function isRegexp(a)    { return a && a.constructor == RegExp }
function isString(a)    { return typeof a == 'string' }
function isUndefined(a) { return typeof a == 'undefined' }
function undef(v) { return  isUndefined(v) }
function isdef(v) { return !isUndefined(v) }
function isList(o) { return o && isObject(o) && (isArray(o) || o.item) }

var ALLOW_LEGACY_EVENTS = true;
function getEventModel() {
    var d = document;
    return d.addEventListener? 'DOM' :
           d.attachEvent     ? 'IE'  :
                               'legacy';
}
function IE_Event(currentTarget) {
    this.currentTarget   = currentTarget;
    this.preventDefault  = function() { window.event.returnValue  = false }
    this.stopPropagation = function() { window.event.cancelBubble = true }
    this.target  = window.event.srcElement;
    var self = this;
    
    list('altKey,ctrlKey,shiftKey,clientX,clientY').map(function(p){ self[p] = event[p] });
    return this;
}
function Legacy_Event(currentTarget) {
    this.currentTarget   = currentTarget;
    return this;
}
function addEvent(els, ev, fn, capture) {
	if (!ALLOW_LEGACY_EVENTS && getEventModel()=='legacy') return false;
    if (undef(capture)) capture = true;
    function DOM_addEvent   (el, ev, fn, capture) { el.addEventListener(ev, fn, capture) }
    function legacy_addEvent(el, ev, fn) {
        var evn = 'on'+ev;
        if (!el[evn] || undef(el[evn].handlers)) {
            el[evn] = function() {
                map(el[evn].handlers, function(h){  h( new (el.attachEvent?IE_Event:Legacy_Event)(el) ) });
            }
            el[evn].handlers = [];
        }
        el[evn].handlers.push(fn);
    }
    var addEventFn = getEventModel()=='DOM'? DOM_addEvent : legacy_addEvent;
    map(getElemList(els), function(el) { addEventFn(el, ev, fn, capture) });
}
function remEvent(els, ev, fn, capture) {
    if (!ALLOW_LEGACY_EVENTS && getEventModel()=='legacy') return false;
    if (undef(capture)) capture = true;
    map(getElemList(els), function(el) {
        if(getEventModel()=='DOM') el.removeEventListener(ev, fn, capture);
        else el['on'+ev].handlers.remove(fn);
    });
}
function addEventDict(els, evDict, capture) {
    for (ev in evDict) addEvent(els, ev, evDict[ev], capture);
}
function addLoadEvent(fn) {
    var w = getEventModel()=="DOM" && !window.addEventListener ? document : window;
    return addEvent(w, 'load', fn, true)
}