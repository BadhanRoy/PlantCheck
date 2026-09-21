import fs from "fs";
import path from "path";
import { Post, POST_TAGS } from "../models/post.model.js";
import { Comment } from "../models/comment.model.js";
import { UPLOADS_DIR } from "../middleware/upload.js";

// ===== LIST POSTS =====
export const listPosts = async (req, res) => {
    try {
        const { tag, page = 1, limit = 10 } = req.query;
        const filter = {};
        if (tag && POST_TAGS.includes(tag)) {
            filter.tags = tag;
        }

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));

        const posts = await Post.find(filter)
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .populate("author", "name");

        const total = await Post.countDocuments(filter);

        res.status(200).json({
            success: true,
            posts,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum)
        });
    } catch (error) {
        console.error("List posts error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ===== CREATE POST =====
export const createPost = async (req, res) => {
    try {
        const { title, body } = req.body;
        let { tags } = req.body;

        if (!title || !title.trim() || !body || !body.trim()) {
            return res.status(400).json({ success: false, message: "Title and body are required" });
        }

        if (tags && !Array.isArray(tags)) {
            tags = [tags];
        }
        if (tags && tags.length > 0) {
            const invalid = tags.filter((t) => !POST_TAGS.includes(t));
            if (invalid.length > 0) {
                return res.status(400).json({ success: false, message: `Invalid tags: ${invalid.join(", ")}` });
            }
        } else {
            tags = [POST_TAGS[0]];
        }

        const post = new Post({
            author: req.userId,
            title: title.trim(),
            body: body.trim(),
            tags,
            image: req.file ? `/uploads/${req.file.filename}` : null
        });

        await post.save();
        await post.populate("author", "name");

        res.status(201).json({ success: true, post });
    } catch (error) {
        console.error("Create post error:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// ===== GET POST DETAIL =====
export const getPost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).populate("author", "name");
        if (!post) {
            return res.status(404).json({ success: false, message: "Post not found" });
        }

        const comments = await Comment.find({ post: post._id })
            .sort({ createdAt: -1 })
            .populate("author", "name");

        res.status(200).json({ success: true, post, comments });
    } catch (error) {
        console.error("Get post error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ===== UPDATE POST =====
export const updatePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ success: false, message: "Post not found" });
        }

        if (post.author.toString() !== req.userId) {
            return res.status(403).json({ success: false, message: "Not authorized to edit this post" });
        }

        const { title, body } = req.body;
        let { tags } = req.body;

        if (!title || !title.trim() || !body || !body.trim()) {
            return res.status(400).json({ success: false, message: "Title and body are required" });
        }

        if (tags && !Array.isArray(tags)) {
            tags = [tags];
        }
        if (tags && tags.length > 0) {
            const invalid = tags.filter((t) => !POST_TAGS.includes(t));
            if (invalid.length > 0) {
                return res.status(400).json({ success: false, message: `Invalid tags: ${invalid.join(", ")}` });
            }
        } else {
            tags = [POST_TAGS[0]];
        }

        post.title = title.trim();
        post.body = body.trim();
        post.tags = tags;

        if (req.file) {
            if (post.image) {
                const oldFilePath = path.join(UPLOADS_DIR, path.basename(post.image));
                fs.unlink(oldFilePath, () => {});
            }
            post.image = `/uploads/${req.file.filename}`;
        }

        await post.save();
        await post.populate("author", "name");

        res.status(200).json({ success: true, post });
    } catch (error) {
        console.error("Update post error:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// ===== DELETE POST =====
export const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ success: false, message: "Post not found" });
        }

        if (post.author.toString() !== req.userId) {
            return res.status(403).json({ success: false, message: "Not authorized to delete this post" });
        }

        if (post.image) {
            const filePath = path.join(UPLOADS_DIR, path.basename(post.image));
            fs.unlink(filePath, () => {});
        }

        await Comment.deleteMany({ post: post._id });
        await post.deleteOne();

        res.status(200).json({ success: true, message: "Post deleted" });
    } catch (error) {
        console.error("Delete post error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ===== TOGGLE LIKE POST =====
export const toggleLikePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ success: false, message: "Post not found" });
        }

        const userId = req.userId;
        const index = post.likes.findIndex((id) => id.toString() === userId);
        let liked;
        if (index === -1) {
            post.likes.push(userId);
            liked = true;
        } else {
            post.likes.splice(index, 1);
            liked = false;
        }

        await post.save();

        res.status(200).json({ success: true, liked, likeCount: post.likes.length });
    } catch (error) {
        console.error("Toggle like post error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ===== ADD COMMENT =====
export const addComment = async (req, res) => {
    try {
        const { body, parentId } = req.body;
        if (!body || !body.trim()) {
            return res.status(400).json({ success: false, message: "Comment body is required" });
        }

        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ success: false, message: "Post not found" });
        }

        let parent = null;
        if (parentId) {
            const parentComment = await Comment.findOne({ _id: parentId, post: post._id });
            if (!parentComment) {
                return res.status(404).json({ success: false, message: "Parent comment not found" });
            }
            // Flatten to a single nesting level: replying to a reply attaches to its top-level parent.
            parent = parentComment.parent || parentComment._id;
        }

        const comment = new Comment({
            post: post._id,
            author: req.userId,
            parent,
            body: body.trim()
        });
        await comment.save();
        await comment.populate("author", "name");

        post.commentCount += 1;
        await post.save();

        res.status(201).json({ success: true, comment });
    } catch (error) {
        console.error("Add comment error:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// ===== DELETE COMMENT =====
export const deleteComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) {
            return res.status(404).json({ success: false, message: "Comment not found" });
        }

        if (comment.author.toString() !== req.userId) {
            return res.status(403).json({ success: false, message: "Not authorized to delete this comment" });
        }

        const { deletedCount: repliesDeleted } = await Comment.deleteMany({ parent: comment._id });
        await comment.deleteOne();
        await Post.findByIdAndUpdate(comment.post, { $inc: { commentCount: -(1 + repliesDeleted) } });

        res.status(200).json({ success: true, message: "Comment deleted" });
    } catch (error) {
        console.error("Delete comment error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ===== TOGGLE LIKE COMMENT =====
export const toggleLikeComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) {
            return res.status(404).json({ success: false, message: "Comment not found" });
        }

        const userId = req.userId;
        const index = comment.likes.findIndex((id) => id.toString() === userId);
        let liked;
        if (index === -1) {
            comment.likes.push(userId);
            liked = true;
        } else {
            comment.likes.splice(index, 1);
            liked = false;
        }

        await comment.save();

        res.status(200).json({ success: true, liked, likeCount: comment.likes.length });
    } catch (error) {
        console.error("Toggle like comment error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
