// Load required packages
var mongoose = require('mongoose');

// Define our user schema in mongoose
var UserSchema = new mongoose.Schema({
	username: {type:String, required:true},
	email: {type:String, required:true, unique:true},
    university: {type:String, required:true},
    firstName: String,
    lastName: String,
    major: String,
    year: Number,
    expectedGraduation: Date,
	dateCreated: {type:Date, default:Date.now}
}, {versionKey: false});



// UserSchema.pre('save', function(next) {
// 	var user = this;
// 	console.log(user);
//     userCounter.findByIdAndUpdate({_id: 'userID'}, {$inc: { seq: 1} }, function(error, userCounter) {
//         if(error)
//             return next(error);
//         // user.userid = userCounter.seq;
//         user._id = userCounter.seq;
//         next();
//     });
// });



module.exports = mongoose.model("User", UserSchema);