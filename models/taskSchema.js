var mongoose = require('mongoose');
var taskCounter = require('./taskCounterSchema');


var taskSchema = new mongoose.Schema({
	_id: Number,
	// taskid: {type:Number, unique:true},
	name: {type:String, required:true},
	description: {type:String},
	deadline: {type:Date, required:true},
	completed: {type:Boolean, default: false},
	assignedUser: {type:String, default: ""},
	assignedUserName: {type:String, default:"unassigned"},
	dateCreated: {type:Date, default:Date.now}
});


taskSchema.pre('save', function(next) {
	var task = this;
	console.log(task);
    taskCounter.findByIdAndUpdate({_id: 'taskID'}, {$inc: { seq: 1} }, function(error, taskCounter) {
        if(error)
            return next(error);
		// task.taskid = taskCounter.seq;
		task._id = taskCounter.seq;
        next();
    });
});

module.exports = mongoose.model("Task", taskSchema);