import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
        default: null
    },
    body: {
        type: String,
        required: [true, "Body is required"],
        trim: true,
        maxlength: 2000
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }]
}, {
    timestamps: true
});

commentSchema.index({ post: 1, createdAt: 1 });
commentSchema.index({ post: 1, parent: 1 });

export const Comment = mongoose.model("Comment", commentSchema);
