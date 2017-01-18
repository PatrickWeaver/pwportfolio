var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var Status = new Schema({
	name: { type: String, required: true },
	color: { type: String, required: true}
})

module.exports = mongoose.model("Status", Status);