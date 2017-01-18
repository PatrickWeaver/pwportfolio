var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var Status = require("./status")

var Image = new Schema({
	order: { type: Number, required: true },
	cover: Boolean,
	caption: String,
	url: String
})

var Project = new Schema({
	name: { type: String, required: true, unique: true },
	slug: { type: String, required: true, unique: true },
	description: String,
	startDate: Date,
	endDate: Date,
	status: {type: Schema.Types.ObjectId, ref: "Status"},
	tags: [{
    type: String
	}],
	projectURL: String,
	sourceURL: String,
	images: [Image],
	active: { type: Boolean, required: true, default: true }

});

module.exports = mongoose.model("Project", Project);