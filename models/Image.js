var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var Image = new Schema({
	project: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Project"
	},
	caption: String,
	order: Number,
	url: String

});

module.exports = mongoose.model("Image", Image);