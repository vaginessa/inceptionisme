
var shared = {
	isFree: true,
	advancedFunctions: true, 

	addDreamTokens: function(amount) {
	    var currDreamTokens = shared.getDreamTokensCount();
	    
	    currDreamTokens = parseInt(currDreamTokens)+parseInt(amount);
	    console.log("addDreamTokens setting: "+currDreamTokens);
	    window.localStorage.setItem("dreamTokens", currDreamTokens);

	    shared.updateDreamTokens();

	    if (amount > 0) {
	        navigator.notification.alert(
	            "Added "+amount+" Dream Tokens.", 
	            null,
	            "Deep Dream Photo Filter");
        }  
	},

	updateDreamTokens: function() {
		var currDreamTokens = shared.getDreamTokensCount();
		console.log("updateDreamTokens count: "+currDreamTokens);

		if (currDreamTokens <= 0)
		{
			var imagesDreamed = window.localStorage.getItem("imagesDreamed");
			var freeTokens = app.freeImageCount-imagesDreamed;
			if (freeTokens > 0) {
				console.log("updateDreamTokens override to free dreams: "+freeTokens);
				currDreamTokens = freeTokens;
			}
		}

		var el = document.getElementById("dream-tokens");
		if (el != null) {
	    	el.innerHTML = currDreamTokens;
		}
	},

	getDreamTokensCount: function() {
		var currDreamTokens = window.localStorage.getItem("dreamTokens");
		console.log("getDreamTokensCount: "+currDreamTokens);
	    if (currDreamTokens == null || isNaN(currDreamTokens)) {
	    	console.log("getDreamTokensCount null or NaN");
	    	currDreamTokens = 0;
	    }

		return parseInt(currDreamTokens);
	}

}