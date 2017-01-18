flatpickr(".flatpickr");
/*
$("#colorpicker").spectrum({
    color: "#f00"
});
*/

fillSlug = function() {
	var name = document.getElementById("project-name-input");
	newSlug = checkSlug(name.value);
	slug = document.getElementById("project-slug-input");
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