const Report = require('../models/reportModel');
const Post = require('../models/postModel');
const Comment = require('../models/commentModel');
const asyncHandler = require('express-async-handler');

const reportController={
// Report a post
    reportPost : asyncHandler(async (req, res) => {
    const { id, reason } = req.body;
    const userId = req.user.id;

    const post = await Post.findById(id);
    if (!post) {
        throw new Error('Post not found');
    }


    const report = new Report({
        reportedBy: userId,
        type: 'Post',
        targetId: id,
        reason,
    });
    const reportCount = await Report.countDocuments({ targetId: id, type: 'Post' });

    // If the post has 500 or more reports, delete it
    if (reportCount >= 500) {
        await Post.findByIdAndDelete(id);
        await Report.deleteMany({ targetId: id, type: 'Post' }); // Optionally delete associated reports
        return res.send('Post deleted due to excessive reports');
    }
    await report.save();
    res.send(report);
}),


    reportComment :asyncHandler(async (req, res) => {
    const { id, reason } = req.body;
    const userId = req.user.id;

    const comment = await Comment.findById(id);
    if (!comment) {
        throw new Error('Comment not found');
    }

    const report = new Report({
        reportedBy: userId,
        type: 'Comment',
        targetId: id,
        reason,
    });

    await report.save();
    const reportCount = await Report.countDocuments({ targetId: id, type: 'Comment' });

    if (reportCount >= 500) {
        await Comment.findByIdAndDelete(id);
        await Report.deleteMany({ targetId: id, type: 'Comment' }); // Optionally delete associated reports
        return res.send('Comment deleted due to excessive reports');
    }
    res.send('Comment reported successfully');
}),
viewReports: asyncHandler(async (req, res) => {
    // Fetch all reports with populated fields
    const reports = await Report.find()
      .populate('reportedBy', 'name email') // User who reported
      .populate({
        path: 'targetId',
        select: 'content userId', // For posts/comments
        populate: { path: 'userId', select: 'name' }, // Author of post/comment
      })
      .populate('actionTakenBy', 'name'); // Moderator who took action

    if (!reports || reports.length === 0) {
      return res.status(404).json({ message: 'No reports found' });
    }

    // Format reports to match ModerationSection expectations
    const formattedReports = await Promise.all(
      reports.map(async (report) => {
        const isPost = report.type === 'Post';
        const target = report.targetId;

        return {
          id: report._id.toString(),
          content: target?.content || 'Content unavailable',
          type: report.type.toLowerCase(),
          author: target?.userId?.name || 'Unknown',
          reportReason: report.reason,
          status: report.status.toLowerCase(), // Matches 'pending', 'approved', 'rejected'
          flags: await Report.countDocuments({ targetId: report.targetId, type: report.type }),
          community: isPost ? 'Unknown Community' : 'N/A', // Add community to Post model if needed
          createdAt: report.createdAt.toISOString(),
          resolvedAt: report.actionTakenAt ? report.actionTakenAt.toISOString() : undefined,
          actionTaken: report.status === 'Approved' ? 'no_action' : report.status === 'Rejected' ? 'content_removed' : undefined,
        };
      })
    );

    res.status(200).json(formattedReports);
  }),

   

    deleteReport :asyncHandler(async (req, res) => {
    const { id } = req.body;

    const report = await Report.findById(id);
    if (!report) {
        throw new Error('Report not found');
    }

    await report.deleteOne();
    res.json({ message: 'Report deleted successfully' });
}),

getReportsByPost : asyncHandler(async (req, res) => {
    const { postId } = req.body;

    const reports = await Report.find({ type: 'Post', targetId: postId })
        .populate('reportedBy', 'name email');

    if (!reports || reports.length === 0) {
        return res.status(404).json({ message: 'No reports found for this post' });
    }

    res.send(reports);
}),

getReportsByComment :asyncHandler(async (req, res) => {
    const { id } = req.body;

    const reports = await Report.find({ type: 'Comment', targetId: id })
        .populate('reportedBy', 'name email');

    if (!reports || reports.length === 0) {
        res.send({ message: 'No reports found for this comment' });
    }

    res.send(reports);
})
}
module.exports=reportController