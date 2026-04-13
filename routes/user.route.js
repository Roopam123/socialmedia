import express from 'express';
import {
    registerUser,
    loginUser,
    logoutUser,
    getProfile,
    editProfile,
    suggestedUsers,
    followAndUnfollowUser
} from '../controllers/user.controllers.js';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import upload from '../middleware/multer.middleware.js';

const router = express.Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(logoutUser);
router.route("/:id/profile").get(isAuthenticated, getProfile);
router.route("/profile/edit").put(isAuthenticated, upload.single("profilePicture"), editProfile);
router.route("/suggested").get(isAuthenticated, suggestedUsers);
router.route("/:id/followOrUnfollow").post(isAuthenticated, followAndUnfollowUser);


export default router;