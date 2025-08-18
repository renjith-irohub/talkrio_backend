const express = require("express");
const userAuthentication = require("../middlewares/userAuthentication");
const postController = require("../controllers/postController");
const upload = require("../middlewares/cloudinary");
const postRoutes = express.Router();

postRoutes.post("/create", userAuthentication, upload.array("images", 5), postController.createPost)
postRoutes.get("/viewall", userAuthentication,postController.getAllPosts);
postRoutes.get('/:id',userAuthentication,postController.getSinglePostById)  

postRoutes.get("/search", userAuthentication,postController.getPostById);
postRoutes.get("/suggestions", userAuthentication,postController.suggestPosts);
postRoutes.delete("/delete", userAuthentication, postController.deletePost);
postRoutes.put("/edit/:id", userAuthentication, postController.updatePost);
postRoutes.put("/like/:id", userAuthentication,postController.likePost);
postRoutes.put("/dislike/:id", userAuthentication,postController.unlikePost);


module.exports = postRoutes;