/*
 * check_install.js of pp-authorizer
 *
 * Time-stamp: <2017-12-26T00:05:14Z>
 */

var installing;

function $ (aSelector, aNode) {
  return (aNode || document).querySelector(aSelector);
}

function escapeHTML (s) {
  return s.replace(/\&/g, "&amp;")
    .replace(/\"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function addStyle (css) {
  var head = document.getElementsByTagName('head')[0];
  if (head) {
    var style = document.createElement('style');
    style.type = 'text/css';
    style.textContent = css;
    head.appendChild(style);
    return style;
  } else {
    return null;
  }
}

function checkInstall () {
  let json;
  let r = {};
  let pre = document.getElementsByTagName("pre")[0];
  chrome.runtime.sendMessage({type: "pre-install"});

  if ('ERROR' in window) {
    errorOverlay(window['ERROR']);
    return;
  }

  try {
    json = JSON.parse(pre.textContent);
  } catch (e) {
    errorOverlay("Syntax error to parse JSON.");
    return;
  }
  
  if (! ('name' in json) || typeof json.name !== 'string' || json.name == "") {
    errorOverlay("JSON doesn't have a 'name' string.");
    return;
  }
  if (json.name.length > 127) {
    errorOverlay("The name is too long.");
    return;
  }
  r.name = json.name;
  if (! ('url' in json) || typeof json.url !== 'string' || json.url == "") {
    errorOverlay("JSON doesn't have a 'url' string.");
    return;
  }
  r.url = json.url;
  if ('iconUrl' in json) {
    if (! json.iconUrl.match(/^data\:(?:image\/|application\/ico\;)/)) {
      errorOverlay("The iconUrl needs to be a data URL image.");
      return;
    }
    r.iconUrl = json.iconUrl;
  }

  normalOverlay(r);
}

var GREY_OVERLAY_CSS = '\
#grey-overlay {\
  position: fixed;\
  z-index: 2001;\
  top: 0px;\
  left: 0px;\
  height: 100%;\
  width: 100%;\
  background: black;\
  opacity: 0.8;\
  display: none;\
}\
\
#grey-overlay-form {\
  position: fixed;\
  z-index: 2002;\
  top: 10%;\
  left: 10%;\
  text-align: center;\
  background: white;\
  opacity: 1.0;\
  width: 80%;\
  height: 80%;\
}\
\
#grey-overlay-form table {\
  text-align: center;\
  padding: 3em;\
}\
\
#grey-overlay-form td {\
  text-align: left;\
}\
\
#grey-overlay-form h1 {\
  text-align: center;\
}\
\
#grey-overlay-form table {\
  text-align: center;\
}\
';

function popupGreyOverlay () {
  var d;
  d = $("#grey-overlay");
  if (! d) {
    addStyle(GREY_OVERLAY_CSS);
    d = document.createElement("div");
    d.id = "grey-overlay";
    d.className = "grey-overlay";
    document.body.appendChild(d);
  }
  d.style.display = "block";
  d = $("#grey-overlay-form");
  if (! d) {
    d = document.createElement("form");
    d.id = "grey-overlay-form";
    document.body.appendChild(d);
  }
  d.style.display = "block";
}

function closeGreyOverlay () {
  var f = $("#grey-overlay-form");
  if (f) {
    f.style.display = "none";
  }
  var d = $("#grey-overlay");
  if (d) {
    d.style.display = "none";
  }
}

function errorOverlay (message) {
  popupGreyOverlay();
  $("#grey-overlay-form").innerHTML = '<h1>PP Authorizer Error</h1>\n'
    + '<div class="error">' + escapeHTML(message) + '</div>\n'
    + '<input type="button" id="grey-overlay-cancel" value="Cancel" />\n';
  $('#grey-overlay-cancel')
    .addEventListener('click', cancel, false);
}

function normalOverlay (r) {
  popupGreyOverlay();
  var t = '<h1>PP Authorizer</h1>\n<table>\n';
  t += '<tr><td>name</td><td>' + escapeHTML(r.name) + '</td></tr>\n';
  t += '<tr><td>url</td><td>' + escapeHTML(r.url) + '</td></tr>\n';
  if ('iconUrl' in r) {
    t += '<tr><td>iconUrl</td><td><img id="grey-overlay-icon"/></td></tr>\n';
  }
  t += '</table>\n';
  t += '<input type="button" id="grey-overlay-cancel" value="Cancel" />\n';
  t += '<input type="button" id="grey-overlay-install" value="Install" />\n';
  $("#grey-overlay-form").innerHTML = t;
  if ('iconUrl' in r) {
    $('#grey-overlay-icon').src = r.iconUrl;
  }
  $('#grey-overlay-cancel')
    .addEventListener('click', cancel, false);
  $('#grey-overlay-install')
    .addEventListener('click', install, false);

  installing = r;
}

function install (e) {
  chrome.runtime.sendMessage({type: "install", data: installing});
  $('#grey-overlay-form').innerHTML = '<h1>PP Authorizer</h1>\n'
    + '<div class="done">Installation was done.</div>\n';
}

function cancel (e) {
  closeGreyOverlay();
  chrome.runtime.sendMessage({type: "clear-notification"});
}

//console.log("check_install.js: ok");
checkInstall();
