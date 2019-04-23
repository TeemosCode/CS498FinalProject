var mongoose = require("mongoose");

var postSchema = new mongoose.Schema({
    title: String,
    contenxt: String,
    category: String,
    likeCount: Number,
    createdTime: {type: Date, default: Date.now},
    university: String,
    postedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    comments: [{
            type: mongoose.Schema.ObjectId,
            ref: 'Comment'
        }]
});

module.exports = mongoose.model("Post", postSchema);