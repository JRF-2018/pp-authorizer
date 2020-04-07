/*
 * options.js of pp-authorizer
 *
 * Time-stamp: <2017-12-26T00:03:27Z>
 */

var selectedAuthority = null;
var authorities;
var settings;

//console.log("options.js: ok");

function $ (aSelector, aNode) {
  return (aNode || document).querySelector(aSelector);
}

function updateSettings () {
  return new Promise ((rs, rj) => {
    chrome.runtime.sendMessage({
      type: "update-settings",
      settings: settings,
      authorities: authorities
    }, rs);
  });
}

function redrawSettings () {
  chrome.runtime.sendMessage({type: "get-settings"}, res => {
    settings = res.settings;
    authorities = res.authorities;

    $('#choose-checkUrl').checked = settings.checkUrl;
    $('#choose-prohibitInstall').checked = settings.prohibitInstall;
    $('#choose-disableNotify').checked = settings.disableNotify;

    var list_div = $('#choose-list');
    list_div.innerHTML = "";
    for (let i = 0; i < authorities.length; i++) {
      let a = authorities[i];
      let div = document.createElement('div');
      div.id = 'authority-' + i;
      div.className = "authority";
      if (selectedAuthority !== null && selectedAuthority == i) {
	div.className = "authority selected";
      }
      if ('iconUrl' in a && a.iconUrl) {
	let img = document.createElement('img');
	img.src = a.iconUrl;
	div.appendChild(img);
      }
      let span = document.createElement('span');
      span.textContent = a.name;
      div.appendChild(span);
      list_div.appendChild(div);
    }
  });
}

$('#choose').addEventListener('click', e => {
  var div = e.target;
  if (e.target.tagName == 'INPUT') {
    return;
  }
  while (div.tagName != "DIV" && div.parentNode) {
    div = div.parentNode;
  }
  if (div.tagName != "DIV" || ! div.classList.contains("authority")) {
    selectedAuthority = null;
  } else {
    div.id.match(/^authority-([01-9]+)/);
    selectedAuthority = parseInt(RegExp.$1, 10);
  }
  $('#choose-error').textContent = "";
  redrawSettings();
  e.stopPropagation();
}, false);

$('#choose-checkUrl').addEventListener('click', e => {
  settings.checkUrl = $('#choose-checkUrl').checked;
  updateSettings().then(() => {
    redrawSettings();
  });
});

$('#choose-prohibitInstall').addEventListener('click', e => {
  settings.prohibitInstall = $('#choose-prohibitInstall').checked;
  updateSettings().then(() => {
    redrawSettings();
  });
});

$('#choose-disableNotify').addEventListener('click', e => {
  settings.disableNotify = $('#choose-disableNotify').checked;
  updateSettings().then(() => {
    redrawSettings();
  });
});

$('#choose-new').addEventListener('click', e => {
  selectedAuthority = null;
  $('#edit-name').value = "";
  $('#edit-url').value = "";
  $('#edit-iconUrl').value = "";
  $('#edit-error').textContent = "";
  $('#choose-error').textContent = "";
  $("#choose").style.display = "none";
  $("#edit").style.display = "block";
}, false);

$('#choose-edit').addEventListener('click', e => {
  if (selectedAuthority === null) {
    $('#choose-error').textContent = "Error: You must click an authority at first or click 'New'.";
    return;
  }
  var a = authorities[selectedAuthority];
  $('#edit-name').value = a.name;
  $('#edit-url').value = a.url;
  if ('iconUrl' in a) {
    $('#edit-iconUrl').value = a.iconUrl;
  } else {
    $('#edit-iconUrl').value = "";
  }
  $('#edit-error').textContent = "";
  $('#choose-error').textContent = "";
  $("#choose").style.display = "none";
  $("#edit").style.display = "block";
}, false);

$('#choose-up').addEventListener('click', e => {
  if (selectedAuthority === null) {
    $('#choose-error').textContent = "Error: You must click an authority at first.";
    return;
  }

  var l = [];
  for (let i = 0; i < authorities.length; i++) {
    l[i] = authorities[i];
  }
  if (selectedAuthority - 1 < 0) {
    return;
  }
  l[selectedAuthority - 1] = authorities[selectedAuthority];
  l[selectedAuthority] = authorities[selectedAuthority - 1];
  selectedAuthority = selectedAuthority - 1;
  authorities = l;
  $('#choose-error').textContent = "";
  updateSettings().then(() => {
    redrawSettings();
  });
}, false);

$('#choose-down').addEventListener('click', e => {
  if (selectedAuthority === null) {
    $('#choose-error').textContent = "Error: You must click an authority at first.";
    return;
  }

  var l = [];
  for (let i = 0; i < authorities.length; i++) {
    l[i] = authorities[i];
  }
  if (selectedAuthority + 1 >= authorities.length) {
    return;
  }
  l[selectedAuthority + 1] = authorities[selectedAuthority];
  l[selectedAuthority] = authorities[selectedAuthority + 1];
  selectedAuthority = selectedAuthority + 1;
  authorities = l;
  $('#choose-error').textContent = "";
  updateSettings().then(() => {
    redrawSettings();
  });
}, false);

$('#choose-delete').addEventListener('click', e => {
  if (selectedAuthority === null) {
    $('#choose-error').textContent = "Error: You must click an authority at first.";
    return;
  }

  var l = [];
  for (let i = 0; i < authorities.length; i++) {
    if (selectedAuthority != i) {
      l.push(authorities[i]);
    }
  }
  if (selectedAuthority >= l.length) {
    selectedAuthority = null;
  }
  authorities = l;
  $('#choose-error').textContent = "";
  updateSettings().then(() => {
    redrawSettings();
  });
}, false);

$('#choose-add-defaults').addEventListener('click', e => {
  chrome.runtime.sendMessage({type: 'add-defaults'}, () => {
    redrawSettings();
  });
}, false);

$('#edit-save').addEventListener('click', e => {
  let a = {};
  let name = $('#edit-name').value;
  let url = $('#edit-url').value;
  let iconUrl = $('#edit-iconUrl').value;
  name = name.replace(/^\s+/, "").replace(/\s+$/, "");
  url = url.replace(/^\s+/, "").replace(/\s+$/, "");
  iconUrl = iconUrl.replace(/^\s+/, "").replace(/\s+$/, "");

  if (name == "") {
    $('#edit-error').textContent = "Error: The name has no value.";
    return;
  }
  if (name.length > 127) {
    $('#edit-error').textContent = "Error: The name is too long.";
    return;
  }
  a.name = name;
  if (url == "") {
    $('#edit-error').textContent = "Error: The url has no value.";
    return;
  }
  a.url = url;
  if (iconUrl != "") {
    if (iconUrl.match(/^\/(icons\/.*)$/)) {
      let x = false;
      let y = RegExp.$1;
      let m = chrome.runtime.getManifest();
      if (m && 'web_accessible_resources' in m
	  && m.web_accessible_resources.length) {
	for (let i = 0; i < m.web_accessible_resources.length; i++) {
	  if (y == m.web_accessible_resources[i]) {
	    x = true;
	    break;
	  }
	}
      }
      if (x) {
	a.iconUrl = iconUrl;
      } else {
	$('#edit-error').textContent
	  = "Error: The iconUrl needs to be a data URL image or an XPI-bundled image.";
	return;
      }
    } else if (iconUrl.match(/^data\:(?:image\/|application\/ico\;)/)) {
      a.iconUrl = iconUrl;
    } else {
      $('#edit-error').textContent
	= "Error: The iconUrl needs to be a data URL image or an XPI-bundled image..";
      return;
    }
  }
  var l = [];
  for (let i = 0; i < authorities.length; i++) {
    l[i] = authorities[i];
  }
  if (selectedAuthority !== null) {
    l[selectedAuthority] = a;
  } else {
    l.push(a);
  }
  authorities = l;
  $('#choose-error').textContent = "";
  $('#edit-error').textContent = "";
  $("#edit").style.display = "none";
  $("#choose").style.display = "block";
  updateSettings().then(() => {
    redrawSettings();
  });
}, false);

$('#edit-cancel').addEventListener('click', e => {
  $('#choose-error').textContent = "";
  $('#edit-error').textContent = "";
  $("#edit").style.display = "none";
  $("#choose").style.display = "block";
  redrawSettings();
}, false);

$("#choose").style.display = "block";
$("#edit").style.display = "none";
redrawSettings();



