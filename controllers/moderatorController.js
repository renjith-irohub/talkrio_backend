const asyncHandler = require('express-async-handler');
const Report = require('../models/reportModel');
const Post = require('../models/postModel');
const Comment = require('../models/commentModel');
const User = require('../models/userModel');
const Notification = require('../models/notificationModel');

const moderatorController = {
  reviewReports: asyncHandler(async (req, res) => {
    const reports = await Report.find()
      .populate('reportedBy', 'username email')
      .populate({
        path: 'targetId',
        select: 'content userId',
        populate: { path: 'userId', select: 'username' },
      })
      .sort({ status: 1, createdAt: -1 });

    if (!reports || reports.length === 0) {
      return res.status(200).json({ message: 'No reports available at the moment. All content is looking great!' });
    }

    const formattedReports = await Promise.all(
      reports.map(async (report) => {
        const target = report.targetId || {};
        const isPost = report.type === 'Post';
        return {
          id: report._id.toString(),
          content: target.content || 'Content unavailable',
          type: report.type.toLowerCase(),
          author: target.userId?.username || 'Unknown',
          reportReason: report.reason,
          status: report.status.toLowerCase(),
          flags: await Report.countDocuments({ targetId: report.targetId, type: report.type }),
          community: isPost ? 'Unknown Community' : 'N/A',
          createdAt: report.createdAt.toISOString(),
          resolvedAt: report.actionTakenAt ? report.actionTakenAt.toISOString() : undefined,
          actionTaken: report.status === 'Approved' ? 'no_action' : report.status === 'Rejected' ? 'content_removed' : undefined,
        };
      })
    );
    res.status(200).json(formattedReports);
  }),

  viewallPsy:asyncHandler(async(req,res)=>{
    const users=await User.find({role:"psychiatrist"})
    res.send(users)
  }),

  verifyPsy:asyncHandler(async(req,res)=>{
    const {id}=req.params
    const user=await User.findById(id)
    if(!user)return res.status(404).json({message:'User not found'})
    user.verified=true
    await user.save()
    await Notification.create({
        user: id,
        message: `🎉You are verified .`,
    });
    res.send(user)
  }),

  takeActionOnReport: asyncHandler(async (req, res) => {
    const { id, action } = req.body;
    const moderatorId = req.user.id;

    const report = await Report.findById(id);
    if (!report) {
      res.status(404);
      throw new Error('Report not found');
    }

    let userId;
    let newStatus;
    switch (action) {
      case 'content_removed':
        newStatus = 'Rejected';
        if (report.type === 'Post') {
          const post = await Post.findByIdAndDelete(report.targetId);
          if (post) userId = post.userId;
        } else if (report.type === 'Comment') {
          const comment = await Comment.findByIdAndDelete(report.targetId);
          if (comment) userId = comment.userId;
        }
        await Report.findByIdAndDelete(id);
        break;
      case 'warning_issued':
      case 'no_action':
        newStatus = 'Approved';
        break;
      case 'reopen':
        newStatus = 'Pending';
        break;
      default:
        res.status(400);
        throw new Error('Invalid action');
    }

    report.status = newStatus;
    report.actionTakenBy = moderatorId;
    report.actionTakenAt = new Date();
    await report.save();

    if (userId && newStatus === 'Rejected') {
      const user = await User.findById(userId);
      if (user) {
        user.reports = (user.reports || 0) + 1;
        if (user.reports >= 10) user.blocked = true;
        await user.save();
      }
    }

    res.status(200).json({ message: `Report ${newStatus} successfully` });
  }),

  deletePost: asyncHandler(async (req, res) => {
    const { postId } = req.params;

    // Log incoming request
    console.log('Delete Post Request - Post ID:', postId, 'User:', req.user);

    // Check authentication
    if (!req.user || !req.user.id) {
      res.status(401);
      throw new Error('Unauthorized: No user authenticated');
    }

    const moderatorId = req.user.id;

    // Validate postId
    if (!postId.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400);
      throw new Error('Invalid post ID format');
    }

    // Check moderator role
    const user = await User.findById(moderatorId);
    if (!user) {
      res.status(404);
      throw new Error('Moderator not found');
    }
    if (!user.role || user.role !== 'moderator') {
      res.status(403);
      throw new Error('Only moderators can delete posts');
    }

    // Find and delete post
    const post = await Post.findById(postId);
    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    try {
      await Post.findByIdAndDelete(postId);
      const deletedReports = await Report.deleteMany({ targetId: postId, type: 'Post' });
      console.log('Deleted Reports Count:', deletedReports.deletedCount);
    } catch (error) {
      console.error('Database Error:', error);
      res.status(500);
      throw new Error('Failed to delete post or reports: ' + error.message);
    }

    res.status(200).json({ message: 'Post and associated reports deleted successfully' });
  }),
};

module.exports = moderatorController;