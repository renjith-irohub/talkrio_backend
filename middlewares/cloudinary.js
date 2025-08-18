const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folderName = "resources"; // Default folder

    if (req.body.category) {
      folderName = `resources/${req.body.category}`;
    }

    return {
      folder: folderName,
      resource_type: file.mimetype === "application/pdf" 
        ? "raw" // Explicitly set PDFs as raw
        : file.mimetype.startsWith("image")
        ? "image"
        : file.mimetype.startsWith("video")
        ? "video"
        : file.mimetype.startsWith("audio")
        ? "raw"
        : "auto",
      allowed_formats: ["jpeg", "png", "jpg", "mp4", "avi", "mp3", "wav", "pdf", "epub", "webp"],
    };
  },
});

const upload = multer({ storage });

module.exports = upload;
