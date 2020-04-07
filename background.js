/*
 * background.js of pp-authorizer
 *
 * Time-stamp: <2017-12-26T07:01:32Z>
 */

//console.log("background.js: ok");

var currentTabId;
var tabData = {};
var settings;
var authorities;
var extensions = INIT_EXTENSIONS;
var notificationShown = false;
const notificationId = "pp-authorizer-notification";
const myStorage = ('sync' in chrome.storage)?
  chrome.storage.sync : chrome.storage.local;

(async function () {
  let data = await (new Promise ((rs, rj) => {
    myStorage.get(null, x => {
      const e = chrome.runtime.lastError;
      if (e) rj(e);
      else rs(x);
    });
  }));
  if (! ('authorities' in data) && myStorage != chrome.storage.local) {
    data = await (new Promise ((rs, rj) => {
      chrome.storage.local.get(null, x => {
	const e = chrome.runtime.lastError;
	if (e) rj(e);
	else rs(x);
      });
    }));
    chrome.storage.local.clear();
  }
//  console.log('background.js: storage init(a).');
  if ('settings' in data) {
    settings = data.settings;
  } else {
    settings = {};
  }
  for (let k in INIT_SETTINGS) {
    if (! (k in settings)) {
      settings[k] = INIT_SETTINGS[k];
    }
  }
  let lv = settings.lastVersion || "0.1";
  let cv = chrome.runtime.getManifest().version;
  if ('authorities' in data) {
    authorities = data.authorities;
    if (lv != cv) {
      addDefaultAuthorities(lv);
    }
  } else {
    authorities = [];
    addDefaultAuthorities();
  }
  settings.lastVersion = cv;
  myStorage.set({
    authorities: authorities,
    settings: settings
  });
})().catch(e => {
//  console.log('background.js: storage init(b).');
  settings = INIT_SETTINGS;
  authorities = [];
  addDefaultAuthorities();
  settings.lastVersion = chrome.runtime.getManifest().version;
  myStorage.set({
    authorities: authorities,
    settings: settings
  });
});

chrome.runtime.onMessage.addListener(handleMessage);
chrome.runtime.onMessageExternal.addListener(handleExternalMessage);

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  if (tabId in tabData) {
    delete tabData[tabId];
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status == "loading" && ! ('url' in changeInfo)) return;
  if (! ('status' in changeInfo)) return;

  let x = "check_class.js";
  if (! ('url' in tab) || ! tab.url.match(/^(?:https?|file|ftp|app):/i)) {
    x = null;
  }
  if (x && tab.url.match(/\.ppauth\.js$/i)) {
    if (changeInfo.status != "complete") return;
    x = (settings.prohibitInstall)? null : "check_install.js";
  } else if (x && settings.checkUrl) {
    x = null;
    if (tab.url.match(/\/ppauth(?:$|\?)/i)
	|| tab.url.match(/\.ppauth\.html?(?:$|\?)/i)) {
      x = "check_class.js";
    }
  }
  if (x) {
    chrome.tabs.executeScript(tabId, {file: x}, x => {
      if (chrome.runtime.lastError) {
	hideIcon(tabId);
      }
    });
  } else {
    hideIcon(tabId);
  }
});

function handleMessage (req, sender, sendResponse) {
  const f = {
    "pre-install": handlePreInstall,
    "install": handleInstall,
    "clear-notification": handleClearNotification,
    "clear-storage": handleClearStorage,
    "get-settings": handleGetSettings,
    "update-settings": handleUpdateSettings,
    "add-defaults": handleAddDefaults,
    "tab-info": handleTabInfo,
    "check": handleCheck,
    "navigate": handleNavigate
  };

  if (req.type in f) {
    return f[req.type](req, sender, sendResponse);
  } else {
//    console.log("background.js: unreacheable code.");
  }
}

function handleExternalMessage (req, sender, sendResponse) {
  const f = {
    "get-settings": handleGetSettings
  };

  let x = false;
  for (let i = 0; i < extensions.length; i++) {
    if (extensions[i].id == sender.id) {
      x = true;
      break;
    }
  }
  if (! x) {
    return;
  }
  if (req.type in f) {
    return f[req.type](req, sender, sendResponse);
  } else {
//    console.log("background.js: unreacheable code.");
  }
}

function hideIcon (tab_id) {
  if ('setIcon' in chrome.pageAction) {
    chrome.pageAction.setIcon({
      tabId: tab_id, 
      path: { 32: "icons/pp-gray_32.png" }
    });
  }
  chrome.pageAction.setPopup({tabId: tab_id, popup: ""});
  chrome.pageAction.hide(tab_id);
}

function versionCompare (a, b) {
  let al = a.split(".");
  let bl = b.split(".");
  while (al.length < bl.length) al.push("0");
  while (bl.length < al.length) bl.push("0");
  for (let i = 0; i < al.length; i++) {
    let x = parseInt(al[i], 10) - parseInt(bl[i], 10);
    if (x != 0) return x;
  }
  return 0;
}

function addDefaultAuthorities (version) {
  let l = Object.assign([], authorities);
  let loc = chrome.i18n.getUILanguage().toLowerCase();
  let mloc = loc.split('-')[0];

  for (let i = 0; i < INIT_AUTHORITIES.length; i++) {
    let a = INIT_AUTHORITIES[i];
    let x = true;
    if ('locales' in a && a.locales.length) {
      x = false;
      for (let j = 0; j < a.locales.length; j++) {
	let y = a.locales[j].toLowerCase();
	if (y == loc || y == mloc) {
	  x = true;
	  break;
	}
      }
    }
    if (x && version) {
      if ('versionFrom' in a) {
	x = versionCompare(a.versionFrom, version) > 0;
      } else {
	x = false;
      }
    }
    if (x) {
      for (let j = 0; j < authorities.length; j++) {
	let b = authorities[j];
	if (a.name == b.name && a.url == b.url) {
	  x = false;
	  break;
	}
      }
    }
    if (x) {
      let b = {name: a.name, url: a.url};
      if ('iconUrl' in a) b.iconUrl = a.iconUrl;
      l.push(b);
    }
  }
  authorities = l;
}

function handleCheck (req, sender, sendResponse) {
//  console.log("background.js: check");
  let tab_id = sender.tab.id;
  let r = [];
  for (let i = 0; i < req.urls.length; i++) {
    let link = req.urls[i];
    for (let j = 0; j < authorities.length; j++) {
      let a = authorities[j];
      if (link == a.url
	  || (link.length > a.url.length && 
	      link.substr(0, a.url.length) == a.url
	      && link.substr(a.url.length, 1).match(/[\?\&\/]/))) {
	let obj = {name: a.name, url: link};
	if ('iconUrl' in a) {
	  obj.iconUrl = a.iconUrl;
	}
	r.push(obj);
      }
    }
  }
  tabData[tab_id] = {authorities: r};
  if (r.length == 0) {
    hideIcon(tab_id);
    return;
  }

  if ('setIcon' in chrome.pageAction) {
    chrome.pageAction.setIcon({
      tabId: tab_id,
      path: { 32: "icons/pp-green_32.png" }
    });
  }
  chrome.pageAction.setPopup({
    tabId: tab_id,
    popup: "popup.html"
  });
  chrome.pageAction.show(tab_id);
  if (! settings.disableNotify && ! notificationShown) {
    chrome.notifications.create(notificationId, {
      type: "basic",
      iconUrl: chrome.extension.getURL("icons/pp-yellow_48.png"),
      title: "PP Authorizer",
      message: "You are prompted to PP authorize."
    });
    notificationShown = true;
    setTimeout(() => { notificationShown = false; }, 10000);
  }
}

function handleNavigate (req, sender, sendResponse) {
//  console.log("background.js: navigate");
  let l = [];
  if (PP_INTERRUPTER_ID) {
    l.push(new Promise ((rs, rj) => {
      chrome.runtime.sendMessage(PP_INTERRUPTER_ID, {
	type: "permit",
	tabId: req.tabId,
	url: req.url
      }, x => {
	const e = chrome.runtime.lastError;
	rs(x);
      });
    }));
  }
  if (PP_INTERRUPTER_LITE_ID) {
    l.push(new Promise ((rs, rj) => {
      chrome.runtime.sendMessage(PP_INTERRUPTER_LITE_ID, {
	type: "permit",
	tabId: req.tabId,
	url: req.url
      }, x => {
	const e = chrome.runtime.lastError;
	rs(x);
      });
    }));
  }
  Promise.all(l).then(x => {
    chrome.tabs.update(req.tabId, {url: req.url, active: true});
  });
}

function handlePreInstall (req, sender, sendResponse) {
//  console.log("background.js: pre-install");
  let tab_id = sender.tab.id;

  tabData[tab_id] = {install: null};
  if ('setIcon' in chrome.pageAction) {
    chrome.pageAction.setIcon({
      tabId: tab_id,
      path: { 32: "icons/pp-yellow_32.png" }
    });
  }
  chrome.pageAction.setPopup({
    tabId: tab_id,
    popup: "popup.html"
  });
  chrome.pageAction.show(tab_id);
  if (! notificationShown) {
    chrome.notifications.create(notificationId, {
      type: "basic",
      iconUrl: chrome.extension.getURL("icons/pp-yellow_48.png"),
      title: "PP Authorizer",
      message: "You are attempted to install new PP authorizer."
    });
    notificationShown = true;
    setTimeout(() => { notificationShown = false; }, 10000);
  }
}

function handleInstall (req, sender, sendResponse) {
//  console.log("background.js: install");
  let data = req.data;
  let l = [];
  let added = false;
  for (let i = 0; i < authorities.length; i++) {
    let a = authorities[i];
    if (a.name == data.name) {
      l.push(data);
      added = true;
    } else {
      l.push(a);
    }
  }
  if (! added) {
    l.push(data);
  }
  authorities = l;
  myStorage.set({
    authorities: authorities,
    settings: settings
  });
  chrome.notifications.clear(notificationId);
}

function handleClearNotification (req, sender, sendResponse) {
//  console.log("background.js: clear-notification");
  chrome.notifications.clear(notificationId);
}

function handleGetSettings (req, sender, sendResponse) {
//  console.log("background: get-settings");
  sendResponse({authorities: authorities, settings: settings});
}

function handleUpdateSettings (req, sender, sendResponse) {
//  console.log("background: update-settings");
  authorities = req.authorities;
  settings = req.settings;
  myStorage.set({
    authorities: authorities,
    settings: settings
  }, x => {
    sendResponse();
  });
  return true;
}

function handleAddDefaults (req, sender, sendResponse) {
//  console.log("background: add-defaults");
  addDefaultAuthorities();
  myStorage.set({
    authorities: authorities,
    settings: settings
  }, x => {
    sendResponse();
  });
  return true;
}

function handleTabInfo (req, sender, sendResponse) {
//  console.log("background: tab-info");
  if (req.tabId in tabData) {
    sendResponse(tabData[req.tabId]);
  } else {
    sendResponse({type: "none"});
  }
}

function handleClearStorage (req, sender, sendResponse) {
//  console.log("background.js: clear-storage");
  authorities = [];
  settings = INIT_SETTINGS;
  myStorage.clear();
  chrome.notifications.clear(notificationId);
}
