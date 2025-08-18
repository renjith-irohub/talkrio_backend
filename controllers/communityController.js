const Community = require('../models/communityModel')
const asyncHandler = require('express-async-handler');

const communityController={
// Create a new community
    createCommunity : asyncHandler(async (req, res) => {
    const { name, description, symptomsDiscussed, urls } = req.body;

    const communityExists = await Community.findOne({ name });
    if (communityExists) {
        res.status(400);
        throw new Error("Community with this name already exists.");
    }

    const community = await Community.create({
        name,
        description,
        symptomsDiscussed,
        urls
    });

    res.send({ message: "Community created successfully", community });
}),

 getAllCommunities : asyncHandler(async (req, res) => {
    const communities = await Community.find({});
    console.log('Fetched communities:', communities); // Log for debugging
    if (!communities || communities.length === 0) {
      return res.status(200).json([]); // Return empty array instead of a string message
    }
    res.json(communities);
  }),

    getCommunityById : asyncHandler(async (req, res) => {
        const {id}=req.body
        const community = await Community.findById(id).populate("members");
    if (!community) {
        throw new Error("Community not found.");
    }
    res.send(community);
}),

    joinCommunity : asyncHandler(async (req, res) => {
    const { name } = req.body;
    const community = await Community.findOne({name});
        const userId=req.user.id
    if (!community) {
        throw new Error("Community not found.");
    }

    if (community.members.includes(userId)) {
        throw new Error("User already a member.");
    }

    community.members.push(userId);
    await community.save();

    res.send({ message: "Joined community successfully", community });
}),

    leaveCommunity : asyncHandler(async (req, res) => {
    const { userId } = req.user.id;
    const {name}=req.body
    const community = await Community.findOne({name});

    if (!community) {
        throw new Error("Community not found.");
    }

    community.members = community.members.filter(member => member.toString() !== userId);
    await community.save();

    res.send({ message: "Left community successfully", community });
}),

    updateCommunityUrls : asyncHandler(async (req, res) => {
    const { name, urls } = req.body;
    const community = await Community.findOne({ name });

    if (!community) {
        throw new Error("Community not found.");
    }

    community.urls = urls;
    await community.save();

    res.send({ message: "Community URLs updated successfully", community });
}),

    deleteCommunity : asyncHandler(async (req, res) => {
        const {name}=req.body
    const community = await Community.findOne({name});

    if (!community) {
        throw new Error("Community not found.");
    }

    await community.deleteOne();
    res.send({ message: "Community deleted successfully" });
})
}
module.exports=communityController
