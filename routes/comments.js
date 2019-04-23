var express = require('express'),
    router = express.Router(),
    Comment = require('../models/commentSchema'),
    User = require('../models/userSchema'),
    Post = require('../models/postSchema'),
    mongoose = require('mongoose');

router.use(express.json());


router.get('/', function(req, res) {

    Comment.find({}).then((comments) => {
        res.status(200).send({
            message: "OK!",
            data: comments
        });
    }).catch(err => {
        res.status(404).send({
            message: "Object Not FOUND!",
            data: []
        });
    })
});


module.exports = router;