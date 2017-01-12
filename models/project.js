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
	sourceURL: String,
	images: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: "Image"
	}],
	cover: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Image"
	},
	active: { type: Boolean, required: true, default: true }

});

module.exports = mongoose.model("Project", Project);