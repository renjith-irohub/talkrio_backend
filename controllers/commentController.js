const Post = require('../models/postModel');
const Comment = require('../models/commentModel');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');

const inappropriateWords = [
    "bitch", "hoe", "nigga", "shit", "fuck", "pussy", "dick",
    "tranny", "hoes", "bitches", "slut", "whore", "cunt",
    "suck dick", "pussy lips", "cock", "fag", "retard", "bastard",
    "asshole", "dumbass", "jackass", "motherfucker", "dipshit",
    "broke bitch", "cancel that bitch", "fuck no", "dickhead",
    "skank", "twat", "moron"
];


const commentController={
    
    createComment : asyncHandler(async (req, res) => {
        const { postId, content } = req.body;
        const userId = req.user.id;
    
        // Check if the comment contains inappropriate words
        const containsInappropriateWords = inappropriateWords.some(word =>
            content.toLowerCase().includes(word)
        );
    
        if (containsInappropriateWords) {
            return res.status(400).json({ message: "Your comment contains inappropriate content and cannot be posted." });
        }
    
        const comment = new Comment({
            userId,
            postId,
            content,
        });
    
        await comment.save();
        await Post.findByIdAndUpdate(postId, { $push: { comments: comment._id } });
        await User.findByIdAndUpdate(userId, {
            $push: {
                recentActivity: {
                    postId,
                    action: "comment",
                    timestamp: new Date()
                }
            }
        });
        res.send("Comment added successfully");
    }),

    getCommentsByPost : asyncHandler(async (req, res) => {
        const {id}=req.params
    const comments = await Comment.find({ postId: id });
    if(!comments){
        res.send("No comments for this post")
    }
    res.send(comments);
}),

    updateComment : asyncHandler(async (req, res) => {
    const { content } = req.body;
    const {id}=req.body
    const comment = await Comment.findById(id);    
    if (!comment) {
        throw new Error('Comment not found');
    }    
    comment.content = content || comment.content;
    await comment.save();
    res.send("Comment updated");
}),

    deleteComment : asyncHandler(async (req, res) => {
        const {id}=req.body
    const comment = await Comment.findById(id);
    
    if (!comment) {
        res.status(404);
        throw new Error('Comment not found');
    }
    
    await comment.deleteOne();
    await Post.findByIdAndUpdate(comment.postId, { $pull: { comments: comment._id } });
    res.json({ message: 'Comment removed' });
})
}
module.exports = commentController

