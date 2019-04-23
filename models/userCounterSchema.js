var mongoose = require("mongoose");

var userCounterSchema = new mongoose.Schema({
	_id: {type: String, required: true},
	seq: {type: Number, default: 0}
});

module.exports = mongoose.model('userCounter', userCounterSchema);