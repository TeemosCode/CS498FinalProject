// Load required packages
var mongoose = require('mongoose');
var userCounter = require('./userCounterSchema');

// Define our user schema in mongoose
var UserSchema = new mongoose.Schema({
    _id: Number,
	// userid: {type:Number, unique:true},
	name: {type:String, required:true},
	email: {type:String, required:true, unique:true},
	pendingTasks: [String],
	dateCreated: {type:Date, default:Date.now}
}, {versionKey: false});



UserSchema.pre('save', function(next) {
	var user = this;
	console.log(user);
    userCounter.findByIdAndUpdate({_id: 'userID'}, {$inc: { seq: 1} }, function(error, userCounter) {
        if(error)
            return next(error);
        // user.userid = userCounter.seq;
        user._id = userCounter.seq;
        next();
    });
});


// Export the Mongoose model
module.exports = mongoose.model("User", UserSchema);