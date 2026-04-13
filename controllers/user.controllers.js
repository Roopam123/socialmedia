import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import getDataUri from "../utils/datauri.js";
import jwt from "jsonwebtoken";
import cloudinary from "../utils/cloudinary.js";


const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // check all fields is present
        if (!username || !email || !password) {
            return res.status(400).json(
                {
                    message: "All fields are required",
                    success: false
                }
            );
        }

        // check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json(
                {
                    message: "User already exists with this email!! please login",
                    success: false
                }
            );
        }

        // hash the password        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, 10);
        // create new user
        await User.create(
            {
                username,
                email,
                password: hashedPassword
            });
        return res.status(201).json(
            {
                message: "User registered successfully",
                success: true
            }
        );
    } catch (error) {
        console.log("Error in resgisterUser controller: ", error);
        res.status(500).json(
            {
                message: "Something went wrong while registering user",
                success: false
            }
        );
    }
}

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("Login request received with email: ", email);
        console.log("Login request received with password: ", password);
        // check all fields is present
        if (!email || !password) {
            return res.status(400).json(
                {
                    message: "All fields are required",
                    success: false
                }
            );
        }
        // check if user exists
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.status(400).json(
                {
                    message: "User does not exist with this email!! please register",
                    success: false
                }
            );
        }
        // compare password
        const isPasswordMatch = await bcrypt.compare(password, existingUser.password);
        if (!isPasswordMatch) {
            return res.status(400).json(
                {
                    message: "Invalid credentials!!",
                    success: false
                }
            );
        }
        const token = await jwt.sign({ userId: existingUser._id }, process.env.secretKey, { expiresIn: "1d" });
        const { password: _, ...userData } = existingUser._doc;
        userData.accessToken = token;
        return res.cookie("token", token, {
            httpOnly: true,
            sameSite: "strict",
            maxAge: 24 * 60 * 60 * 1000,
        }).status(200).json({
            message: "User logged in successfully",
            success: true,
            user: userData,
        });
    } catch (error) {
        console.log("Error in loginUser controller: ", error);
        res.status(500).json(
            {
                message: "Something went wrong while logging in user",
                success: false
            }
        );
    }
}

const logoutUser = async (req, res) => {
    try {
        res.clearCookie("token").status(200).json(
            {
                message: "User logged out successfully",
                success: true
            }
        );
    } catch (error) {
        console.log("Error in logoutUser controller: ", error);
        res.status(500).json(
            {
                message: "Something went wrong while logging out user",
                success: false
            }
        );
    }
}

const getProfile = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId).select("-password");
        if (!user) {
            return res.status(404).json(
                {
                    message: "User not found",
                    success: false
                }
            );
        }
        return res.status(200).json(
            {
                message: "User profile fetched successfully",
                success: true,
                user
            }
        );
    } catch (error) {
        console.log("Error in getProfile controller: ", error);
        res.status(500).json(
            {
                message: "Something went wrong while fetching user profile",
                success: false
            }
        );
    }
};

const editProfile = async (req, res) => {
    try {
        const userId = req.userId;
        const { gender, bio } = req.body;
        const profilePicture = req.file;
        if (!profilePicture) {
            return res.status(400).json(
                {
                    message: "Profile picture is required",
                    success: false
                }
            );
        }

        let cloudinaryResult;
        if (profilePicture) {
            const fileUri = getDataUri(profilePicture);
            cloudinaryResult = await cloudinary.uploader.upload(fileUri);
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json(
                {
                    message: "User not found",
                    success: false
                }
            );
        };

        if (bio) user.bio = bio;
        if (gender) user.gender = gender;
        if (cloudinaryResult) user.profilePicture = cloudinaryResult.secure_url;
        await user.save();

        user.password = undefined;
        return res.status(200).json(
            {
                message: "User profile updated successfully",
                success: true,
                data: user
            }
        );
    } catch (error) {
        console.log("Error in editProfile controller: ", error);
        res.status(500).json(
            {
                message: "Something went wrong while editing user profile",
                success: false
            }
        );
    }
};

const suggestedUsers = async (req, res) => {
    try {
        const userId = req.userId;
        const suggestedUsers = await User.find({ _id: { $ne: userId } }).select("-password").limit(10);
        if (!suggestedUsers || suggestedUsers.length === 0) {
            return res.status(404).json(
                {
                    message: "No suggested users found",
                    success: false
                }
            );
        }
        return res.status(200).json(
            {
                message: "Suggested users fetched successfully",
                success: true,
                data: suggestedUsers
            }
        );
    } catch (error) {
        console.log("Error in suggestedUsers controller: ", error);
        res.status(500).json(
            {
                message: "Something went wrong while fetching suggested users",
                success: false
            }
        );
    }
};


const followAndUnfollowUser = async (req, res) => {
    try {
        const followKarneWala = req.userId;
        const followKiyaJaneWala = req.params.id;

        if (followKarneWala === followKiyaJaneWala) {
            return res.status(400).json(
                {
                    message: "You cannot follow/unfollow yourself",
                    success: false
                }
            );
        }

        const userToFollowOrUnfollow = await User.findById(followKiyaJaneWala);
        const currentUser = await User.findById(followKarneWala);

        if (!userToFollowOrUnfollow || !currentUser) {
            return res.status(404).json(
                {
                    message: "User not found",
                    success: false
                }
            );
        };

        // check if already following
        if (currentUser.following.includes(followKiyaJaneWala)) {
            // unfollow logic
            userToFollowOrUnfollow.followers = userToFollowOrUnfollow.followers.filter(
                (followerId) => followerId.toString() !== followKarneWala
            );
            currentUser.following = currentUser.following.filter(
                (followingId) => followingId.toString() !== followKiyaJaneWala
            );
        } else {
            // follow logic
            userToFollowOrUnfollow.followers.push(followKarneWala);
            currentUser.following.push(followKiyaJaneWala);
        }

        await userToFollowOrUnfollow.save();
        await currentUser.save();

        return res.status(200).json(
            {
                message: "User followed/unfollowed successfully",
                success: true
            }
        );
    } catch (error) {
        console.log("Error in followAndUnfollowUser controller: ", error);
        res.status(500).json(
            {
                message: "Something went wrong while following/unfollowing user",
                success: false
            }
        );
    }
}



export {
    registerUser,
    loginUser,
    logoutUser,
    getProfile,
    editProfile,
    suggestedUsers,
    followAndUnfollowUser
};