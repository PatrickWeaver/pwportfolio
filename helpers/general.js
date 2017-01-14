findCover = function(project) {
	for (i in project.images) {
		if (project.images[i].cover) {
			return project.images[i].url;
		}
	}
}