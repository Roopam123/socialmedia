import sharp from 'sharp';
import cloudinary from 'cloudinary';
import Post from '../models/Post.js';
import User from '../models/User.js';

const addNewPost = async (req, res) => {
    try {
        const { caption } = req.body;
        const image = req.file;
        if (!image) {
            return res.status(400).json(
                {
                    message: "Image is required for the add a new post",
                    success: false
                }
            );
        }
        const authorId = req.userId;

        // Image optimization and upload logic here (e.g., using Sharp and Cloudinary)
        // sharp(image.path)
        const optimizedImageBuffer = await sharp(image.buffer).resize(800, 800, {
            fit: "inside"
        }).toFormat("jpeg").toBuffer();

        // change in data uri
        const optimizedImageDataUri = `data:image/jpeg;base64,${optimizedImageBuffer.toString('base64')}`;
        const cloudResponse = await cloudinary.v2.uploader.upload(optimizedImageDataUri);

        const newPost = await Post.create({
            caption,
            imageUrl: cloudResponse.secure_url,
            author: authorId
        });

        // push post on the user model
        const user = await User.findById(authorId);
        if (!user) {
            return res.status(404).json({ message: "User not found", success: false });
        }
        await user.posts.push(newPost._id);
        await user.save();
        await newPost.populate({ path: "author", select: "-password" });
        return res.status(201).json({ message: "Post added successfully", success: true, post: newPost });

    } catch (error) {
        console.log("Error in addNewPost controller:", error);
        res.status(500).json({ message: "Something went wrong while adding the post", success: false });
    }
}


const getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 })
            .populate({ path: "author", select: "-password" })
            .populate({ path: "likes", select: "-password" })
            .populate({ path: "comments", populate: { path: "author", select: "-password" } });
        return res.status(200).json(
            {
                message: "Posts fetched successfully",
                success: true,
                data: posts
            });
    } catch (error) {
        console.log("Error in getAllPosts controller:", error);
        res.status(500).json({ message: "Something went wrong while fetching the posts", success: false });
    }
}

const getUserPosts = async (req, res) => {
    try {
        const userId = req.params.userId;
        const posts = await Post.find({ author: userId }).sort({ createdAt: -1 }).populate({ path: "author", select: "-password" })
            .populate({ path: "likes", select: "-password" })
            .populate({ path: "comments", populate: { path: "author", select: "-password" } });
        return res.status(200).json(
            {
                message: "User's posts fetched successfully",
                success: true,
                data: posts
            });
    } catch (error) {
        console.log("Error in getUserPosts controller:", error);
        res.status(500).json({ message: "Something went wrong while fetching the user's posts", success: false });
    }
}


const likePost = async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.userId;
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found", success: false });
        }
        const isLiked = post.likes.includes(userId);
        if (isLiked) {
            await post.likes.pull(userId);
            await post.save();
            return res.status(200).json({ message: "Post unliked successfully", success: true });
        } else {
            await post.likes.push(userId);
            await post.save();
            return res.status(200).json({ message: "Post liked successfully", success: true });
        }
    } catch (error) {
        console.log("Error in likePost controller:", error);
        res.status(500).json({ message: "Something went wrong while liking the post", success: false });
    }
};


const commentOnPost = async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.userId;
        const { comment } = req.body;
        const post = await Post.findById(postId);
        if (!comment) {
            return res.status(400).json({ message: "Comment text is required", success: false });
        }
        if (!post) {
            return res.status(404).json({ message: "Post not found", success: false });
        }
        const newComment = await Comment.create({
            text: comment,
            author: userId,
            post: postId
        }).populate({ path: "author", select: "-password" });
        await post.comments.push(newComment._id);
        await post.save();
        return res.status(201).json({ message: "Comment added successfully", success: true, comment: newComment });

    } catch (error) {
        console.log("Error in commentOnPost controller:", error);
        res.status(500).json({ message: "Something went wrong while commenting on the post", success: false });
    }
}

const commentOfPost = async (req, res) => {
    try {
        const postId = req.params.postId;
        const comments = await Comment.find({ post: postId }).populate({ path: "author", select: "-password" });
        if (!comments) {
            return res.status(404).json({ message: "No comments found for this post", success: false });
        }
        return res.status(200).
            json({
                message: "Comments fetched successfully",
                success: true,
                data: comments
            });
    } catch (error) {
        console.log("Error in commentOfPost controller:", error);
        res.status(500).json({
            message: "Something went wrong while fetching the comments of the post",
            success: false
        });
    }
}

const deletePost = async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.userId;
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found", success: false });
        }
        if (post.author.toString() !== userId) {
            return res.status(403).json(
                {
                    message: "You are not authorized to delete this post",
                    success: false
                });
        }
        await Post.findByIdAndDelete(postId);
        // remove post from the user model
        const user = await User.findById(userId);
        if (user) {
            await user.posts.pull(postId);
            await user.save();
        }
        // delete all comments of the post
        await Comment.deleteMany({ post: postId });
        return res.status(200).json({ message: "Post deleted successfully", success: true });
    } catch (error) {
        console.log("Error in deletePost controller:", error);
        res.status(500).json({
            message: "Something went wrong while deleting the post",
            success: false
        });
    }
}


const addBookmarkPost = async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.userId;
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found", success: false });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found", success: false });
        }
        const isBookmarked = user.bookmarks.includes(postId);
        if (isBookmarked) {
            await user.bookmarks.pull(postId);
            await user.save();
            return res.status(200).json({ message: "Post removed from bookmarks successfully", success: true });
        } else {
            await user.bookmarks.push(postId);
            await user.save();
            return res.status(200).json({ message: "Post added to bookmarks successfully", success: true });
        }
    } catch (error) {
        console.log("Error in addBookmarkPost controller:", error);
        res.status(500).json({
            message: "Something went wrong while adding the post to bookmarks",
            success: false
        });
    }
}





export { addNewPost, getAllPosts, getUserPosts, likePost, commentOnPost, commentOfPost, commentOfPost, deletePost, addBookmarkPost };