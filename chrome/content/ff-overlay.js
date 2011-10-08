// Include helper libraries
Components.utils.import("resource://gre/modules/FileUtils.jsm");
Components.utils.import("resource://gre/modules/NetUtil.jsm");

safetyduck.addBlock = function(url, category) {
	  // Check to see if the url is in the list already
	  var entry = this.mHashMap[url];
	  if (entry == null || !isArray(entry)) {
		  // If it's not an array, or doesn't exist at all, make sure it does
		  entry = [];
	  }
	  // Add the category
	  entry.push(category);
	  
	  // Put it back into the hash
	  this.mHashMap[url] = entry;
};

safetyduck.loadBlacklist = function(source) {
	// Save "this"
	var thisSafetyDuck = this;
	
	// This will fetch from both a local file or a remote stream
	try {
		NetUtil.asyncFetch(source, function(inputStream, status) {
			if (!Components.isSuccessCode(status)) {  
				// Failed to load the file's contents...  
			    return;  
			}
			
			// Read the content and pull it into the hash
			var contents = NetUtil.readInputStreamToString(inputStream, inputStream.available());
			thisSafetyDuck.mHashMap = JSON.parse(contents);
		});
	} catch(ex) {
		// Couldn't load the list... oh well
	}
};

safetyduck.onFirefoxLoad = function(event) {
  // Setup the context menu
  document.getElementById("contentAreaContextMenu")
          .addEventListener("popupshowing", function (e){
        	  safetyduck.showFirefoxContextMenu(e);
          }, false);

  // Load the local list of blocked content
  var localList = FileUtils.getFile("ProfD", ["safetyduck-blacklist.txt"]);
  safetyduck.loadBlacklist(localList);
};

safetyduck.onFirefoxUnload = function(event) {
	try {
		// Get the name of the local list and rewrite it on exit
		var localList = FileUtils.getFile("ProfD", ["safetyduck-blacklist.txt"]);
		var ostream = FileUtils.openSafeFileOutputStream(localList);
		
		// get the data to write
		data = JSON.stringify(this.mHashMap);
		
		// Setup for the copy
		var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].  
	    createInstance(Components.interfaces.nsIScriptableUnicodeConverter);  
		converter.charset = "UTF-8";  
		var istream = converter.convertToInputStream(data);
		
		// Write the data before allowing the browser to finish closing
		NetUtil.asyncCopy(istream, ostream, function(status) {
			if (!Components.isSuccessCode(status)) {
				// Not sure what we could do... Firefox is exiting...
			    return;
			}  
		});  
	} catch(ex) {
	}
}

safetyduck.showFirefoxContextMenu = function(event) {
  // show or hide the menuitem based on what the context menu is on
  document.getElementById("safetyduck-menu").hidden = !gContextMenu.onImage;
};

safetyduck.replaceImage = function(img) {
	// Fetch the original URL and save it in the object for later
	img.safetyduck = {};
	img.safetyduck.src = img.src;
	
	// Save the height and width
	var height = img.height;
	var width = img.width;
	
	// Replace the image and reset the height & width
	img.src = "chrome://safetyduck/content/images/blank.png";
	img.width = width;
	img.height = height;
}

safetyduck.onPageLoad = function(loadEvent) {
	var doc = loadEvent.originalTarget;

	// For the initial version, only address img tags
	var docImages = doc.getElementsByTagName("img");
	
	// A for each loop will not work because it's a proxied array
	for (var i = 0; i < docImages.length; ++i) {
		// Pull off the current image
		var anImg = docImages[i];
		
		// Blocked?
		if (safetyduck.isBlocked(anImg.src)) {
			// Hide it
			safetyduck.replaceImage(anImg);
		}
	}
}

safetyduck.onMenuItemCommand = function(category) {
	// document.popupNode is the image element that was clicked
	this.addBlock(document.popupNode.src, category);
	this.replaceImage(document.popupNode);
}


window.addEventListener("load", function () { safetyduck.onFirefoxLoad(); }, false);
window.addEventListener("unload", function () { safetyduck.onFirefoxUnload(); }, false);
