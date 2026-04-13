import express from "express";
import {
    addNewPost,
    getAllPosts,
    getUserPosts,
    likePost,
    commentOnPost,
    commentOfPost,
    deletePost,
    addBookmarkPost
} from "../controllers/post.controllers.js";

import { isAuthenticated } from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.middleware.js";

const router = express.Router();

// Add new post
router.route("/addPost").post(isAuthenticated, upload.single("image"), addNewPost);
// Get all posts
router.route("/getAllPosts").get(isAuthenticated, getAllPosts);
router.route("/getUserPosts/:userId").get(isAuthenticated, getUserPosts);
router.route("/:postId/likePost").post(isAuthenticated, likePost);
router.route("/:postId/addComment").post(isAuthenticated, commentOnPost);
router.route("/:postId/commentsofpost").get(isAuthenticated, commentOfPost);
router.route("/:postId/deletePost").delete(isAuthenticated, deletePost);
router.route("/:postId/bookmarkPost").post(isAuthenticated, addBookmarkPost);

export default router;