// Include helper libraries
Components.utils.import("resource://gre/modules/FileUtils.jsm");
Components.utils.import("resource://gre/modules/NetUtil.jsm");

safetyduck.addBlock = function(url, category) {
	  // Check to see if the url is in the list already
	  var entry = this.mHashMap[url];
	  if (entry == null || !Array.isArray(entry)) {
		  // If it's not an array, or doesn't exist at all, make sure it does
		  entry = [];
	  }
	  // Add the category
	  entry.push(category);
	  
	  // Put it back into the hash
	  this.mHashMap[url] = entry;
};

safetyduck.removeBlock = function(img, category) {
	// Get the url
	var url = img.getAttribute("safetyduck-original-src");
	
	// Check to see if the url is in the list already
	var entry = this.mHashMap[url];
	if (entry == null || !Array.isArray(entry)) {
		// If it's not an array, or doesn't exist at all, make sure it does
		this.mHashMap[url] = [];
		  
		// If it's empty though, this can't be removed...
		return;
	}
	  
	// Find the index & remove it
	var catIndex = entry.indexOf(category);
	if (catIndex >= 0) {
		entry.splice(catIndex, 1);
	}
	
	// And remove the attribute from the object itself
	img.setAttribute(safetyduck.channelNameToAttribute(category), "false");
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
	// helpful short name
	const XUL_NAMESPACE = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
	
	// show or hide the menuitem based on what the context menu is on
	if (!gContextMenu.onImage) {
		// Not an image, hide and exit
		document.getElementById("safetyduck-menu").hidden = true;
		return;
	}
	
	// On an image, show the item
	document.getElementById("safetyduck-menu").hidden = false;
	
	// The image the context menu is for
	var contextImage = document.popupNode;
	
	// Get the menu
	var subMenuRoot = document.getElementById("safetyduck-popup");
	
	// Clear it
	while (subMenuRoot.hasChildNodes()) {
		subMenuRoot.removeChild(subMenuRoot.firstChild);
	}
	
	// Build the menu
	var channels = safetyduck.channels();
	var channel = channels.next();
	while (channel != null) {
		// Build a child element and set attributes
		var child = document.createElementNS(XUL_NAMESPACE, "menuitem");
		child.setAttribute("type", "checkbox");

		// Since text-transform is currently broken for XUL files (Bug 101800) do that transform here
		var channelLabel = channel.toLowerCase().replace(/^(.)|\s(.)/g, function($1) { return $1.toUpperCase(); });
		child.setAttribute("label", channelLabel);
		
		// Is this image blocked for this reason?
		var attr = safetyduck.channelNameToAttribute(channel);
		var value = contextImage.getAttribute(attr);
		child.setAttribute("checked", (value == "true"));
		
		// Attach the command
		child.addEventListener("command", function(cmd) { safetyduck.onMenuItemCommand(cmd.target.label.toLowerCase()); }, true);
		
		// Add it to the list
		subMenuRoot.appendChild(child);
		
		// Next
		channel = channels.next();
	}
};

safetyduck.showImage = function(img) {
	// Is the image blocked?
	if (img.src != "chrome://safetyduck/content/images/blank.png") {
		// No?
		return;
	}
	
	// Get the original image url
	var originalSrc = img.getAttribute("safetyduck-original-src");
	if (originalSrc == null || originalSrc.length == 0) {
		// ???
		return;
	}

	// Are there additional reasons for this image to be blocked?
	if (safetyduck.isBlocked(originalSrc)) {
		// Yes, don't show it
		Log("Image '" + originalSrc + "' is still blocked for: '" + JSON.stringify(safetyduck.mHashMap[originalSrc]));
		return;
	}
	
	// Save the height and width
	var height = img.height;
	var width = img.width;
	
	// Replace the image and reset the height & width
	img.src = originalSrc;
	img.width = width;
	img.height = height;
}

safetyduck.replaceImage = function(img) {
	// Save meta data to the img object as attributes
	var originalSrc = img.getAttribute("safetyduck-original-src");
	if (originalSrc == null || originalSrc.length == 0) {
		// Save the original source only... not the src to the image used as filler
		img.setAttribute("safetyduck-original-src", img.src);
		
		// Set the variable so it can be useful now
		originalSrc = img.src;
	}
	
	// Get the reasons why the image is blocked
	var reasons = safetyduck.getBlocks(originalSrc);
	if (reasons.length == 0) {
		// Image isn't blocked?
		return;
	}
	
	// Add block reasons
	for (var [key, value] in Iterator(reasons)) {
		img.setAttribute(safetyduck.channelNameToAttribute(value), "true");
		Log("Add block for: " + safetyduck.channelNameToAttribute(value))
	}
	
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
		Log("Check for block on: " + anImg.src);
		if (safetyduck.isBlocked(anImg.src)) {
			// Hide it
			Log("Image blocked: " + anImg.src);
			safetyduck.replaceImage(anImg);
		}
	}
}

safetyduck.onMenuItemCommand = function(category) {
	// The image
	var contextImage = document.popupNode;
	// And it's url
	var imageSrc = contextImage.src;
	
	// Is it blocked already?
	if (contextImage.getAttribute("safetyduck-original-src") != null) {
		// Yes.  So, don't use this url, use the original source
		imageSrc = contextImage.getAttribute("safetyduck-original-src");
	}
	
	Log("Command on '" + imageSrc + "' => :" + category + ":");
	
	// Is the item being blocked or unblocked?
	if (safetyduck.isBlockedFor(imageSrc, category)) {
		// Unblock the image (for this reason)
		this.removeBlock(contextImage, category);
		this.showImage(contextImage);
	} else {
		// Block the image
		this.addBlock(imageSrc, category);
		this.replaceImage(contextImage);
	}
}


window.addEventListener("load", function () { safetyduck.onFirefoxLoad(); }, false);
window.addEventListener("unload", function () { safetyduck.onFirefoxUnload(); }, false);
