flatpickr(".flatpickr");
/*
$("#colorpicker").spectrum({
    color: "#f00"
});
*/

fillSlug = function() {
	var name = document.getElementById("name-input");
	newSlug = checkSlug(name.value);
	slug = document.getElementById("slug-input");
	slug.value = newSlug;

}

checkSlug = function(slug) {
	slugChars = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-"]
	slug = slug.toLowerCase();
	newSlug = "";
	lastChar = "";
	for (c in slug) {
		char = slug[c];
		if (slugChars.indexOf(char) === -1 ){
			if (lastChar != "-") {
				newSlug += "-";
				lastChar = "-";
			}
		} else {
			newSlug += char;
			lastChar = char;
		}
	}
	return newSlug;
}

filterToggle = function(){
	filterToggleDiv = document.getElementById("filter-toggle");
	if (filterToggleDiv.innerHTML === "🔀 Filter") {
		filterToggleDiv.innerHTML = "❌ Filter";
	} else {
		filterToggleDiv.innerHTML = "🔀 Filter";
	}
	filter = document.getElementById("filter");
		if (filter.style.display === "block"){
			filter.style.display = "none";
		} else {
			filter.style.display = "block";
		}
	}
