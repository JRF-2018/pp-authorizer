/*
 * popup.js of pp-authorizer
 *
 * Time-stamp: <2017-12-26T00:04:32Z>
 */

var currentTabId;
var auth = {};

function handleMessage (req) {
  if ('install' in req) {
    let panel = document.getElementById('panel-list');
    let div = document.createElement('div');
    div.className = 'panel-list-item disabled';
    let d = document.createElement('div');
    d.className = 'icon';
    div.appendChild(d);
    d = document.createElement('div');
    d.className = 'text';
    d.textContent = "Install?";
    div.appendChild(d);
    d = document.createElement('div');
    d.className = 'text-shortcut';
    div.appendChild(d);
    panel.appendChild(div);
  } else if ('authorities' in req) {
    let panel = document.getElementById('panel-list');
    for (let i = 0; i < req.authorities.length; i++) {
      let id = "authority-" + i;
      let a = req.authorities[i];
      auth[id] = a;
      let div = document.createElement('div');
      div.className = 'panel-list-item';
      div.id = id;
      let d = document.createElement('div');
      d.className = 'icon';
      if ('iconUrl' in a && a.iconUrl) {
	let img = document.createElement('img');
	img.src = a.iconUrl;
	d.appendChild(img);
      }
      div.appendChild(d);
      d = document.createElement('div');
      d.className = 'text';
      d.textContent = a.name;
      div.appendChild(d);
      d = document.createElement('div');
      d.className = 'text-shortcut';
      div.appendChild(d);
      panel.appendChild(div);
//      if (i != req.authorities.length - 1) {
//	div = document.createElement('div');
//	div.className = 'panel-section-separator';
//	panel.appendChild(div);
//      }
      document.getElementById(id).addEventListener('click', handleClick, false);
    }
  }
}

function handleClick (e) {
  let div = e.target;
  while (div.parentNode && ! div.classList.contains('panel-list-item')) {
    div = div.parentNode;
  }
  if (! div.classList.contains('panel-list-item')) return;
  chrome.runtime.sendMessage({type: "navigate", tabId: currentTabId,
			       url: auth[div.id].url});
  e.stopPropagation();
}

//console.log("popup.js: ok");
chrome.runtime.sendMessage({type: "clear-notification"});
document.addEventListener("click", handleClick, false);
chrome.tabs.query({currentWindow: true, active: true}, tabs => {
  currentTabId = tabs[0].id;
  chrome.runtime.sendMessage({type: "tab-info", tabId: currentTabId},
			     handleMessage);
});
