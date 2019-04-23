var express = require('express'),
	router = express.Router(),
	User = require('../models/userSchema');
mongoose = require('mongoose');

Post = require('../models/postSchema');

var fakeDB = require('../models/fakeDB'); // Used for self testing on user apis first
router.use(express.json())



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

	User.find(whereParam).select(selectParam).sort(sortParam).skip(skipParam).limit(limitParam)
	.exec()
	.then((users_list) => {
		res.status(200).send({
			message: countTrue ? "OK. Returned total count of retrieved data." : "OK. List of Users. Wha?",
			data: countTrue ? users_list.length : users_list
		});
	}).catch((err) => {
		res.status(500).send({
			message: "Unable to retrieve user list",
			data: []
		});
	});
});

// Get certain user based on user ID
router.get('/:id', function(req, res) {
	User.findOne({_id: req.params.id}).exec()
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

module.exports = router;