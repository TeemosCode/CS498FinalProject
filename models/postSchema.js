var mongoose = require("mongoose");

var postSchema = new mongoose.Schema({
    title: String,
    contenxt: String,
    category: String,
    likeCount: Number,
    createdTime: {type: Date, default: Date.now},
    university: String,
    postedBy: {
        type: mongoose.Types.ObjectId,
        ref: 'User'
    },
    comments: [
        {
            type: mongoose.Types.ObjectId,
            ref: 'Comment'
        }
    ]
});

module.exports = mongoose.model("Post", postSchema);