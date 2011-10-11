function Log(msg) {
	var aConsoleService = Components.classes["@mozilla.org/consoleservice;1"].
	getService(Components.interfaces.nsIConsoleService);
	aConsoleService.logStringMessage(msg);
}

var safetyduck = {
	// Object to be used for tracking images to replace in the DOM
	mHashMap: {},

	// List of "channels" - should be built from preferences
	mChannels: ["death", "personal"],

	channels: function () {
		for (var [key, value] in Iterator(safetyduck.mChannels)) {
			yield value;
		}
		throw StopIteration;
	},

	onLoad: function () {
		// initialization code
		this.initialized = true;
		this.strings = document.getElementById("safetyduck-strings");

		// Hook to page load events
		var appcontent = document.getElementById("appcontent");
		if (appcontent) {
			appcontent.addEventListener("DOMContentLoaded", safetyduck.onPageLoad, true);
		}
	},

	isBlocked: function (url) {
		// Simple check to see if the url is in the list of blocked items
		return (url in this.mHashMap && this.mHashMap[url].length > 0);
	},

	isBlockedFor: function (url, category) {
		return (this.isBlocked(url) ? this.mHashMap[url].indexOf(category) >= 0 : false);
	},

	getBlocks: function (url) {
		return (this.isBlocked(url)) ? this.mHashMap[url] : [];
	},

	/**
	 * Converts a blocked channel name to a attribute name
	 * @param name The name of the channel (ex: "injured wings")
	 * @return The attribute name (ex: safetyduck-block-injured-wings)
	 */
	channelNameToAttribute: function (name) {
		return "safetyduck-block-" + name.toLowerCase().replace(/ /g, '-');
	}
};

window.addEventListener("load", function () {
	safetyduck.onLoad();
}, false);