var express = require('express'),
	router = express.Router(),
	tasks = require('../models/taskSchema'),
	mongoose = require('mongoose');

taskCounter = require('../models/taskCounterSchema');
User = require('../models/userSchema');

var fakeDB = require('../models/fakeDB'); // Used for self testing on task apis first
router.use(express.json())


// initialize tasks counter
taskCounterInit = new taskCounter({
	_id : "taskID",
});

taskCounterInit.save().catch(error => {
	console.log("taskID counter already Initiated. No need to worry!");
});



function appendStringParen(queryParam) {
	return '(' + queryParam + ')';
}

// Get all lists of tasks (So far in our fakeDB first)
router.get('/', function(req, res) {
	// Moongoose use...
	const query = req.query;
	console.log(req.query);
	console.log("(" + req.query.where + ")");
	console.log(req.query.sort);
	console.log(req.query.select);
	console.log(req.query.skip);
	console.log(req.query.limit);
	const whereParam = query.where ? eval(appendStringParen(query.where)) : {};
	const selectParam = query.select ? eval(appendStringParen(query.select)) : {};
	const sortParam = query.sort ? eval(appendStringParen(query.sort)) : {};
	const skipParam = query.skip ? eval(appendStringParen(query.skip)) : 0;
	const limitParam = query.limit ? eval(appendStringParen(query.limit)) : 0;
	const countTrue = query.count ? eval(query.count) : false;

	tasks.find(whereParam).select(selectParam).sort(sortParam).skip(skipParam).limit(limitParam)
		.exec()
		.then((tasks_list) => {
			res.status(200).send({
				message: countTrue? "OK. Returned total count of retrieved data." : "OK. List of tasks.",
				data: countTrue ? tasks_list.length : tasks_list
			});
		}).catch((err) => {
			res.status(500).send({
				message: "Unable to retrieve task list",
				data: []
			});
		});
});


router.post('/', function(req, res) {
	// Mongoose
	let task = new tasks(req.body);
	if (task.assignedUser) {
		taskCounter.findOne({_id: "taskID"})
			.exec()
			.then((taskCounterObject) => {
				User.findById({_id: task.assignedUser})
				.exec()
				.then((foundUser) => {
					console.log(foundUser);
					if (foundUser) {
						if (!task.completed) {
							User.findOneAndUpdate({_id: task.assignedUser}, { $push: {pendingTasks: String(taskCounterObject.seq)} }, 
								{runValidators: true}).exec()
							return task.save();
						} 
						return task.save();
					} else {
						return "No User ID Found!";
					}
				}).then((result) => {
					if (result === "No User ID Found!") {
						res.status(404).send({
							message: `No user's with ID ${task.assignedUser} found!`,
							data: result,
						});
					} else {
						res.status(201).send({
							message: "OK!",
							data: result,
						});
					}
				})
				.catch( err => {
					res.status(500).send({
						error: err
					});
				})
			})
			// .then((taskCounterObject) => {
				// User.findOneAndUpdate({_id: task.assignedUser}, { $push: {pendingTasks: String(taskCounterObject.seq)} }, 
				// 	{runValidators: true})
			// 	.exec()
			// 	.then((result) => {
			// 		return task.save();
			// 	}).then((result) => {
			// 		res.status(201).send({
			// 			message: "OK! If assigned User ID does not exist. Number of data Modified would be 0!",
			// 			data: result,
			// 			numberOfDataModified: result.nModified
			// 		});
			// 	})
			// 	.catch( err => {
			// 		res.status(500).send({
			// 			error: err
			// 		});
			// 	})
			// })
	} else {
		task
		.save()
		.then((result) => {
			res.status(201).send({
				message: "OK!",
				data: result,
			});
		})
		.catch(error => {
			res.status(500).send({
				error: error
			});
		});
	}
})

// Get certain task based on task ID
router.get('/:id', function(req, res) {
	tasks.findOne({_id: req.params.id}).exec()
	.then((task) => {
		if (task) {
			res.status(200).send({
				message: `OK. task ID: ${req.params.id} found.`,
				data:task
			});
		} else {
			res.status(404).send({
				message: `Cannot Find task of ID: ${req.params.id}`,
				data:[]
			});
		}
	}).catch((error) => {
		console.log(error);
		res.status(500).send({
			message: `Server Error: ${error.name}: Cast to number failed for value '${error.value}' at path '${error.path}' for model 'Task' `,
			data:[]
		})
	});
})

// Put for tasks/:id
router.put('/:id', function(req, res) {
	tasks.update({_id: req.params.id}, req.body, {runValidators: true}).exec(
		)
			.then((result) => {
				
				res.status(200).send({
					message: "OK. Data Updated Successfully! If ID does not exist. Number of data Modified would be 0!",
					data: {
						numberOfDataModified: result.nModified
					}
				});
			}).catch((error) => {
				res.status(400).send({
					message: `Bad, malformed syntax or request body. Error: ${error}`,
					data: req.body
				});
			}); 
	
});

// Delete for task/:id
router.delete('/:id', function(req, res) {
	tasks.findById({_id: req.params.id}).exec(
		).then((result) => {
			if (result) {
				User.update({_id: String(result.assignedUser)}, { $pull: { pendingTasks: String(result._id) }}).exec()
				.then((result) => {
					tasks.deleteOne({_id: String(req.params.id)}).exec()
					.then((result => {
						res.status(200).send({
							message: "OK. Operation Successful.",
							data: []
						});
					}))
				})
				.catch(err => {
					return err;
				})
			} else {
				res.status(404).send({
					message: "Cannot Find Object for deletion.",
					data: []
				});
			}
		}).catch((error) => {
			res.status(400).send({
				message: `Bad Request. Error : ${error}`
			});	
		});
});



module.exports = router;