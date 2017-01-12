var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var Project = new Schema({
	name: { type: String, required: true, unique: true },
	slug: { type: String, required: true, unique: true },
	startDate: Date,
	endDate: Date,
	status: String,
	tags: [{
    type: String
	}],
	projectURL: String,
	sourceURL: String

});

module.exports = mongoose.model("Project", Project);