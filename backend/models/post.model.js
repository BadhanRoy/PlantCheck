import mongoose from "mongoose";

export const POST_TAGS = ["Potato", "Corn", "Wheat", "Rice", "Tomato", "Soybean", "Cotton", "Sugarcane"];

const postSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    title: {
        type: String,
        required: [true, "Title is required"],
        trim: true,
        maxlength: 150
    },
    body: {
        type: String,
        required: [true, "Body is required"],
        trim: true,
        maxlength: 5000
    },
    image: {
        type: String,
        default: null
    },
    tags: {
        type: [String],
        enum: POST_TAGS,
        default: [POST_TAGS[0]]
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    commentCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

postSchema.index({ createdAt: -1 });
postSchema.index({ tags: 1 });

export const Post = mongoose.model("Post", postSchema);
