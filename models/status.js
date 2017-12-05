var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var Status = new Schema({
	name: { type: String, required: true },
	color: { type: String, required: true },
	slug: { type: String, required: false }
})

Status.pre("save", function(next) {
	this.slug = updateSlug(this.get("name"));
	next();
});

Status.pre("update", function(next) {
	console.log("Updating status!");
	this.update(
		{},
		{
			$set: {
				slug: updateSlug(this.get("name"))
			}
		}
	);
});

function updateSlug(name) {
	return name.replace(/\s+/g, '-').toLowerCase();
}

module.exports = mongoose.model("Status", Status);
