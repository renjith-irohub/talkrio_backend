const Comment = require('../models/commentModel');
const Post = require('../models/postModel');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const Notification = require('../models/notificationModel'); // Assuming you have a notification model

const postController={
// Create a new post

createPost: asyncHandler(async (req, res) => {    const { content, taggedUsers } = req.body;
    const userId = req.user.id;

    let imageUrls = [];

    // Handle multiple image uploads
    if (req.files) {
        imageUrls = req.files.map(file => file.path); // Cloudinary returns `path`
    } else if (req.file) {
        imageUrls = [req.file.path]; // Single image case
    }

    console.log("Uploaded images:", imageUrls);

    let taggedUsersArray = [];

    if (Array.isArray(taggedUsers)) {
        taggedUsersArray = taggedUsers;
    } else if (typeof taggedUsers === "string") {
        try {
            taggedUsersArray = JSON.parse(taggedUsers);
            if (!Array.isArray(taggedUsersArray)) {
                throw new Error("Parsed value is not an array");
            }
        } catch (error) {
            console.warn("JSON.parse failed, trying comma-separated format...");
            taggedUsersArray = taggedUsers.split(",").map(user => user.trim());
        }
    }

    const post = new Post({
        userId,
        content,
        images: imageUrls, // Store Cloudinary URLs
        taggedUsers: taggedUsersArray
    });

    await post.save();

    // Save post creation in recent activity
    await User.findByIdAndUpdate(userId, {
        $push: {
            recentActivity: {
                postId: post._id,
                action: "post",
                timestamp: new Date()
            }
        }
    });
    await Notification.create({
        user: userId,
        message: `Post uploaded successfully`,
    });
    // Send notifications to tagged users
    if (taggedUsersArray.length > 0) {
        const notifications = taggedUsersArray.map(user => ({
            user,
            message: `You were tagged in a post.`
        }));

        await Notification.insertMany(notifications);
    }

    res.status(201).json({ message: "Post created successfully", post });
}),

suggestPosts :asyncHandler( async (req,res) => {
    const user = await User.findById(req.user.id).populate("recentActivity.postId");
    if (!user || !user.recentActivity || user.recentActivity.length === 0) {
        return res.send("No suggestions"); // No activity, return no suggestions
    }
    const keywords = user.recentActivity.map(activity => activity.postId.keywords).flat();
    const suggestedPosts = await Post.find({
        keywords: { $in: keywords },
        _id: { $nin: user.recentActivity.map(activity => activity.postId._id) }
    }).limit(10).sort({ createdAt: -1 });
    const postsWithCounts = suggestedPosts.map(post => ({
        _id: post._id,
        userId: post.userId,
        content: post.content,
        createdAt: post.createdAt,
        likesCount: post.likes ? post.likes.length : 0,  // Handle undefined likes
        commentsCount: post.comments ? post.comments.length : 0,  // Handle undefined comments
    }));    
    res.send(postsWithCounts);
}),

// Get all posts
getAllPosts: asyncHandler(async (req, res) => {

    const posts = await Post.find().sort({ createdAt: -1 }); 
    // const postsWithCounts = posts.map(post => ({
    //     _id: post._id,
    //     userId: post.userId,
    //     content: post.content,
    //     createdAt: post.createdAt,
    //     likesCount: post.likes.length,
    //     commentsCount: post.comments.length,
    // }));
    res.send(posts);
}),

updatePost: asyncHandler(async (req, res) => {
    const { content } = req.body;
    const { id } = req.params; // Get postId from URL
    const post = await Post.findById(id);

    if (!post) {
        res.status(404);
        throw new Error('Post not found');
    }

    if (post.userId.toString() !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to update this post');
    }

    post.content = content || post.content;
    await post.save();
    
    res.json({ message: "Post updated successfully", updatedPost: post });
}),


// Get a single post by ID
        getPostById :asyncHandler(async (req, res) => {
        const {id}=req.body
        const post = await Post.findById(id).populate('comments');
        
        if (!post) {
            throw new Error('Post not found');
        }
        
        res.send(post);
    }),

    getSinglePostById: asyncHandler(async (req, res) => {
        const { id } = req.params; // Use req.params instead of req.body
    
        const post = await Post.findById(id).populate("comments");
        
        if (!post) {
            throw new Error("Post not found");
        }
    
        res.json(post);
    }),
    

// Delete a post
deletePost: asyncHandler(async (req, res) => {
    const { id } = req.body;

    const post = await Post.findById(id);
    if (!post) {
        throw new Error('Post not found');
    }

    await Comment.deleteMany({ postId: id }); // Delete comments associated with the post
    await post.deleteOne(); // Delete the post itself

    res.json({ message: 'Post removed successfully' });
}),

    likePost : asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    
    const post = await Post.findById(id);
    
    if (!post) {
        throw new Error('Post not found');
    }    
    if (!post.likes.includes(userId)) {
        post.likes.push(userId);
        await post.save();
    }
    await User.findByIdAndUpdate(userId, {
        $push: {
            recentActivity: {
                postId:post._id,
                action: "like",
                timestamp: new Date()
            }
        }
    });
    res.send( 'Post liked');
}),

    unlikePost : asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    
    const post = await Post.findById(id);
    if (!post) {
        throw new Error('Post not found');
    }
    
    post.likes = post.likes.filter(like => like.toString() !== userId);
    await post.save();
    
    res.send('Post unliked');
}),
reportPost: asyncHandler(async (req, res) => {
    const { id, reason } = req.body;
    const userId = req.user.id;
  
    console.log("Starting reportPost:", { id, reason, userId });
  
    if (!id || !reason) {
      console.log("Validation failed");
      return res.status(400).json({ success: false, message: "Post ID and reason are required" });
    }
  
    console.log("Checking post...");
    const post = await Post.findById(id);
    if (!post) {
      console.log("Post not found");
      return res.status(404).json({ success: false, message: "Post not found" });
    }
  
    console.log("Saving report...");
    const report = new Report({
      postId: id,
      userId,
      reason,
    });
    await report.save();
    console.log("Report saved");
  
    console.log("Sending response...");
    return res.status(200).json({ success: true, message: "Post reported successfully" });
  }),

  // ... (rest of your existing functions: deletePost, likePost, etc.)
};

module.exports = postController;
