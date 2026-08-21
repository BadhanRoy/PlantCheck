import express from "express";
import {
    listPosts,
    createPost,
    getPost,
    updatePost,
    deletePost,
    toggleLikePost,
    addComment,
    deleteComment,
    toggleLikeComment
} from "../controllers/community.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.use(verifyToken);

// ===== POSTS =====
router.get("/posts", listPosts);
router.post("/posts", upload.single("image"), createPost);
router.get("/posts/:id", getPost);
router.put("/posts/:id", upload.single("image"), updatePost);
router.delete("/posts/:id", deletePost);
router.post("/posts/:id/like", toggleLikePost);
router.post("/posts/:id/comments", addComment);

// ===== COMMENTS =====
router.delete("/comments/:id", deleteComment);
router.post("/comments/:id/like", toggleLikeComment);

export default router;
