var safetyduck = {
  onLoad: function() {
    // initialization code
    this.initialized = true;
    this.strings = document.getElementById("safetyduck-strings");
  },

  onMenuItemCommand: function(category) {
	  alert("Category: " + category);
  }
};

window.addEventListener("load", function () { safetyduck.onLoad(); }, false);
