var safetyduck = {
  // Object to be used for tracking images to replace in the DOM
  mHashMap : {},
  
  onLoad: function() {
    // initialization code
    this.initialized = true;
    this.strings = document.getElementById("safetyduck-strings");
    
    // Hook to page load events
    var appcontent = document.getElementById("appcontent");
    if (appcontent) {
    	appcontent.addEventListener("DOMContentLoaded", safetyduck.onPageLoad, true);
    }
  },
  
  isBlocked: function(url) {
	  // Simple check to see if the url is in the list of blocked items
	  return (url in this.mHashMap);
  }
};

window.addEventListener("load", function () { safetyduck.onLoad(); }, false);
