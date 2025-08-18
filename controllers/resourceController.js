const asyncHandler = require('express-async-handler');
const Resource = require('../models/resourcesModel');

const resourceController={
    getResources : asyncHandler(async (req, res) => {
    const resources = await Resource.find().populate("addedBy", "name email");
    res.send(resources);
    }),

    addResource : asyncHandler(async (req, res) => {
      const { title, description, category } = req.body;
      console.log('Request Body:', { title, description, category });
      console.log('Uploaded File:', req.file);
    
      if (!req.file) {
        res.status(400);
        throw new Error('File upload is required');
      }
    
      // Append .pdf for PDF files
      const fileExtension = req.file.mimetype === 'application/pdf' ? '.pdf' : '';
      const resourceLink = `${req.file.path}${fileExtension}`;
    
      const resource = new Resource({
        title,
        description,
        category,
        link: resourceLink,
        addedBy: req.user.id,
      });
    
      const createdResource = await resource.save();
      console.log('Created Resource:', createdResource);
    
      res.status(201).json({
        message: 'Resource added successfully',
        resource: createdResource,
      });
    }),
    searchResources: asyncHandler(async (req, res) => {
      const { query } = req.query; // Changed from req.body
    
      if (!query) {
        throw new Error('Search query is required');
      }
    
      const resources = await Resource.find({
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { category: { $regex: query, $options: 'i' } },
        ],
      }).populate('addedBy', 'name email');
    
      res.send(resources || []);
    }),

      deleteResource : asyncHandler(async (req, res) => {
        const {id}=req.body
        const resource = await Resource.findById(id);
      
        if (!resource) {
          res.status(404);
          throw new Error("Resource not found");
        }
      
        await resource.deleteOne();
        res.send("Resource deleted successfully");
      })
}
module.exports =resourceController;
