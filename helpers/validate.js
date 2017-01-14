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

checkDates = function(req, res, aDate) {
	if (aDate){
		newDate = new Date(String(aDate));
	} else {
		newDate = null;
	}

	if (newDate) {
		if (newDate.getDate() + 1) {
			aDate = newDate;
		} else {
			res.send("Provide Valid Start Date: " + newDate + " ** " + newDate.getDate());
			return;
		}
		aDate = newDate;
	} else {
		aDate = null;
	}

	return aDate;
}

tagify = function(tag) {
	tags = [""];
	incrementors = [",", "\n", "\r", "\t", ";", "#"];
	count = 0;
	tag = tag.toLowerCase();
	for (c in tag){
		char = tag[c];
		if (incrementors.indexOf(char) >= 0) {
			if (tags[count]) {
				if (tags[count][tags[count].length - 1] === " "){
					tags[count] = tags[count].slice(0, -1);
				}
				count++;
				tags[count] = "";
			}
		} else {
			if (tags[count] != "" || char != " "){
				tags[count] += char;
			}
		}
	}
	return tags;
}

formatURL = function(url) {
	newURL = "";
	url = url.toLowerCase();
	if (url.substring(0, 4) === "http"){
		newURL = url;
	} else if (url === ""){

	} else {
		newURL = "http://" + url;
	}
	return newURL;
}

checkProject = function(projectTemplate){
	// check slug for non valid characters and replace with '-'
	projectTemplate.slug = checkSlug(projectTemplate.slug);

	// Make sure Dates are valid:
	projectTemplate.startDate = checkDates(req, res, projectTemplate.startDate);
	projectTemplate.endDate = checkDates(req, res, projectTemplate.endDate);

	// Separate tags into array. Tags are separated using incrementor characters, spaces are ok in the middle of tags, but not at the beginning or the end:
	projectTemplate.tags = tagify(projectTemplate.tags);

	// Format projectUrl and sourceUrl correctly
	projectTemplate.projectURL = formatURL(projectTemplate.projectURL);
	projectTemplate.sourceURL = formatURL(projectTemplate.sourceURL);
}