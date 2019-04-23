var express = require('express'),
	router = express.Router(),
	users = require('../models/userSchema');
mongoose = require('mongoose');

userCounter = require('../models/userCounterSchema');
Task = require('../models/taskSchema');

var fakeDB = require('../models/fakeDB'); // Used for self testing on user apis first
router.use(express.json())


// initialize user counter
userCounterInit = new userCounter({
	_id : "userID",
});

userCounterInit.save().catch(error => {
	console.log("userID counter already Initiated. No need to worry!");
});



function appendStringParen(queryParam) {
	return '(' + queryParam + ')';
}


// Get all lists of users (So far in our fakeDB first)
router.get('/', function(req, res) {
	const query = req.query;

	const whereParam = query.where ? eval(appendStringParen(query.where)) : {};
	const selectParam = query.select ? eval(appendStringParen(query.select)) : {};
	const sortParam = query.sort ? eval(appendStringParen(query.sort)) : {};
	const skipParam = query.skip ? eval(appendStringParen(query.skip)) : 0;
	const limitParam = query.limit ? eval(appendStringParen(query.limit)) : 0;
	const countTrue = query.count ? eval(query.count) : false;

	users.find(whereParam).select(selectParam).sort(sortParam).skip(skipParam).limit(limitParam)
	.exec()
	.then((users_list) => {
		res.status(200).send({
			message: countTrue ? "OK. Returned total count of retrieved data." : "OK. List of Users.",
			data: countTrue ? users_list.length : users_list
		});
	}).catch((err) => {
		res.status(500).send({
			message: "Unable to retrieve user list",
			data: []
		});
	});
});


router.post('/', function(req, res) {
	// // Mongoose
	let user = new users(req.body);
	let userPendingTaskList = user.pendingTasks.map((id) => parseInt(id));
	Task.find({_id: {$in: userPendingTaskList}}).exec()
		.then((result) => {
			if (result.length != userPendingTaskList.length) {
				res.status(400).send({
					message: "Bad Request. Have tasks ID in the pendingTasks list that do not exist in tasks!",
					data: userPendingTaskList
				});
			} else {
				userCounter.findOne({_id: "userID"}).exec()
				.then( (userCounterObject) => 
					{
						Task.update({_id: { $in: userPendingTaskList }}, 
							{$set : {assignedUser: String(userCounterObject.seq), assignedUserName: user.name, completed: false} },
							{multi: true})
							.exec()
							.then((result) => {
								user.pendingTasks = !user.pendingTasks ? [] : user.pendingTasks;
								user.save()
								.then(result => {				
									return result;
								})
								.then(result => {
									console.log(result);
									res.status(201).send({
										message: "OK!",
										data: result
									});
								})
								.catch(err => {
									// console.log("Error:" + err.errmsg);
									res.status(500).send({
										error: err
									});
								});
							}).catch(err => {
								res.status(500).send({
									error: err
								});	
							})
					}
				)
			}
		});
});

// Get certain user based on user ID
router.get('/:id', function(req, res) {
	users.findOne({_id: req.params.id}).exec()
	.then((user) => {
		if (user) {
			res.status(200).send({
				message: `OK. User ID: ${req.params.id} found.`,
				data: user
			});
		} else {
			res.status(404).send({
				message: `Cannot Find User of ID: ${req.params.id}`,
				data:[]
			});
		}
	}).catch((error) => {
		res.status(500).send({
			message: `Server Error: ${error}`,
			data:[]
		})
	});
});

// Put for users/:id
router.put('/:id', function(req, res) {
	let updatedPendingTaskList = req.body.pendingTasks;
	users.findById({_id: req.params.id}).exec()
		.then((result) => {
			if (result) {
				let updatedUser = result;
				users.update({_id: req.params.id}, req.body, {runValidators: true})
				.exec()
					.then((result) => {
						let originalPendingTaskList = updatedUser.pendingTasks;
						let removedTasksList = originalPendingTaskList.filter((id) => !updatedPendingTaskList.includes(id));
						Task.update({_id: {$in: removedTasksList.map(idString => parseInt(idString))}},
							{assignedUser:"", assignedUserName: "unassigned"}, {multi: true}).exec()
							.then(result => {
								return Task.update({_id: {$in: updatedPendingTaskList.map(idString => parseInt(idString))}},
									{assignedUser:String(req.params.id), assignedUserName: updatedUser.name}, {multi: true}).exec();
							}).then(safelyReturn => {
								if (!safelyReturn) {
									res.status(400).send({
										message: `Bad, malformed syntax or request body. Error: ${error}`,
										data: req.body
									})
								} else {
									res.status(200).send({
										message: "OK. Data Updated Successfully! If ID does not exist. Number of data Modified would be 0!",
										data: {
											numberOfDataModified: result.nModified
										}
									});
								}
								
							})
					})
					.catch((error) => {
						res.status(400).send({
							message: `Bad, malformed syntax or request body. Error: ${error}`,
							data: req.body
						});
					}); 
			} else {
				res.status(404).send({
					message: `Cannot Find User of ID: ${req.params.id}`,
					data:[]
				});
			}
		})



	// // let removedTaksIdList = 
	// // if found update the object but with validation on the user info
	// users.update({_id: req.params.id}, req.body, {runValidators: true})
	// .exec()
	// 	.then((result) => {
	// 		res.status(200).send({
	// 			message: "OK. Data Updated Successfully! If ID does not exist. Number of data Modified would be 0!",
	// 			data: {
	// 				numberOfDataModified: result.nModified
	// 			}
	// 		});
	// 	})
	// 	.catch((error) => {
	// 		res.status(400).send({
	// 			message: `Bad, malformed syntax or request body. Error: ${error}`,
	// 			data: req.body
	// 		});
	// 	}); 
});


// Delete for user/:id
router.delete('/:id', function(req, res) {
	// look up user, if not exist return 404 error and message
	users.findById({_id: req.params.id}).exec(
	).then((result) => {
		if (result) {
			Task.update({_id: {$in : result.pendingTasks.map( idString => parseInt(idString))}},
					{assignedUser:"", assignedUserName: "unassigned"}, {multi: true}).exec()
					.then(result => {
						users.deleteOne({_id: req.params.id}).exec().then(result => {
							res.status(200).send({
								message: "OK. Operation Successful.",
								data: []
							});
						})
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