/*
 * check_class.js of pp-authorizer
 *
 * Time-stamp: <2017-12-26T00:04:49Z>
 */

function checkClass () {
  let l;
  let r = [];
  l = document.querySelectorAll(
    'a.pp-authorizer,'
//      + 'a[rel="pp-authorizer"],'
//      + 'link[rel="pp-authorizer"],'
      + 'input.pp-authorizer[type="hidden"]'
  );
  for (let i = 0; i < l.length; i++) {
    let node = l[i];
    if (node.nodeName == 'INPUT' && node.value) {
      r.push(node.value);
    } else if ((node.nodeName == 'A' || node.nodeName == 'LINK') && node.href) {
      r.push(node.href);
    }
  }
  chrome.runtime.sendMessage({type: "check", urls: Array.from(new Set(r))});
}

//console.log("check_class.js: ok");
checkClass();
