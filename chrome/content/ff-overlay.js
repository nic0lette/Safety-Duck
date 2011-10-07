safetyduck.onFirefoxLoad = function(event) {
  document.getElementById("contentAreaContextMenu")
          .addEventListener("popupshowing", function (e){ safetyduck.showFirefoxContextMenu(e); }, false);
};

safetyduck.showFirefoxContextMenu = function(event) {
  // show or hide the menuitem based on what the context menu is on
  document.getElementById("context-safetyduck").hidden = gContextMenu.onImage;
};

window.addEventListener("load", function () { safetyduck.onFirefoxLoad(); }, false);
