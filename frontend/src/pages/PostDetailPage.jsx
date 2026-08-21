import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useCommunityStore, POST_TAGS } from '../store/communityStore';
import { useAuthStore } from '../store/authStore';
import { formatDate } from '../utils/date';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003';

function EditPostForm({ post, onClose }) {
  const { updatePost, isPosting } = useCommunityStore();
  const [title, setTitle] = useState(post.title);
  const [body, setBody] = useState(post.body);
  const [tags, setTags] = useState(post.tags?.length ? post.tags : [POST_TAGS[0]]);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(post.image ? `${API_URL}${post.image}` : null);

  const toggleTag = (tag) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] || null;
    setImage(file);
    setPreview(file ? URL.createObjectURL(file) : (post.image ? `${API_URL}${post.image}` : null));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    const result = await updatePost(post._id, { title, body, tags, image });
    if (result.success) {
      onClose();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#1a2a20] border border-white/10 rounded-xl p-6 mb-6 space-y-4"
    >
      <h2 className="text-lg font-semibold text-white">Edit Post</h2>

      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={150}
        className="w-full bg-[#0a0f0d] border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#a3cf8b]/50"
      />

      <textarea
        placeholder="Body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={5000}
        rows={4}
        className="w-full bg-[#0a0f0d] border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#a3cf8b]/50 resize-none"
      />

      <div className="flex flex-wrap gap-2">
        {POST_TAGS.map((tag) => (
          <button
            type="button"
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
              tags.includes(tag)
                ? 'bg-[#a3cf8b]/20 text-[#a3cf8b] border-[#a3cf8b]/40'
                : 'bg-transparent text-gray-400 border-white/10 hover:border-white/20'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <label className="text-sm text-gray-400 cursor-pointer bg-[#0a0f0d] border border-white/10 rounded-lg px-4 py-2 hover:border-white/20 transition-all">
          {image ? 'Change Image' : 'Replace Image'}
          <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
        </label>
        {preview && (
          <img src={preview} alt="Preview" className="h-14 w-14 object-cover rounded-lg border border-white/10" />
        )}
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 rounded-lg font-medium text-gray-400 hover:text-white transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPosting || !title.trim() || !body.trim()}
          className="bg-gradient-to-r from-[#a3cf8b] to-[#7fb46a] text-[#0a0f0d] px-6 py-2.5 rounded-lg font-semibold hover:shadow-[0_8px_30px_rgba(163,207,139,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPosting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

function CommentItem({ comment, postId, isReply = false, replies = [] }) {
  const { user } = useAuthStore();
  const { toggleLikeComment, deleteComment, addComment } = useCommunityStore();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const liked = comment.likes?.includes(user?._id);
  const isOwner = comment.author?._id === user?._id;

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyBody.trim()) return;
    setIsSubmittingReply(true);
    // A reply to a reply flattens onto the same top-level parent (one nesting level only).
    const parentId = comment.parent || comment._id;
    const result = await addComment(postId, replyBody, parentId);
    if (result.success) {
      setReplyBody('');
      setShowReplyForm(false);
    }
    setIsSubmittingReply(false);
  };

  return (
    <div className="bg-[#0a0f0d] border border-white/5 rounded-lg p-4">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-sm text-gray-400">
          <span className="text-[#a3cf8b]">{comment.author?.name || 'Unknown'}</span> · {formatDate(comment.createdAt)}
        </p>
        {isOwner && (
          <button
            onClick={() => deleteComment(comment._id)}
            className="text-xs text-[#ff6a45] hover:text-[#ff6a45]/80 transition-colors"
          >
            Delete
          </button>
        )}
      </div>
      <p className="text-white text-sm mb-2 whitespace-pre-wrap">{comment.body}</p>
      <div className="flex items-center gap-4">
        <button
          onClick={() => toggleLikeComment(comment._id, user?._id)}
          className={`flex items-center gap-1.5 text-xs transition-colors ${
            liked ? 'text-[#a3cf8b]' : 'text-gray-400 hover:text-[#a3cf8b]'
          }`}
        >
          <span>{liked ? '❤️' : '🤍'}</span>
          <span>{comment.likes?.length || 0}</span>
        </button>
        <button
          onClick={() => setShowReplyForm((prev) => !prev)}
          className="text-xs text-gray-400 hover:text-white transition-colors"
        >
          Reply
        </button>
      </div>

      {showReplyForm && (
        <form onSubmit={handleReplySubmit} className="mt-3">
          <textarea
            placeholder={`Reply to ${comment.author?.name || 'this comment'}...`}
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            maxLength={2000}
            rows={2}
            autoFocus
            className="w-full bg-[#1a2a20] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#a3cf8b]/50 resize-none mb-2"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowReplyForm(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingReply || !replyBody.trim()}
              className="bg-gradient-to-r from-[#a3cf8b] to-[#7fb46a] text-[#0a0f0d] px-4 py-1.5 rounded-lg text-xs font-semibold hover:shadow-[0_8px_30px_rgba(163,207,139,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmittingReply ? 'Posting...' : 'Reply'}
            </button>
          </div>
        </form>
      )}

      {!isReply && replies.length > 0 && (
        <div className="mt-3 ml-6 pl-4 border-l-2 border-white/10 space-y-3">
          {replies.map((reply) => (
            <CommentItem key={reply._id} comment={reply} postId={postId} isReply />
          ))}
        </div>
      )}
    </div>
  );
}

function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentPost, comments, isLoading, fetchPost, toggleLikePost, addComment, deletePost } = useCommunityStore();
  const [commentBody, setCommentBody] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchPost(id);
  }, [id, fetchPost]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentBody.trim()) return;
    setIsSubmittingComment(true);
    const result = await addComment(id, commentBody);
    if (result.success) {
      setCommentBody('');
    }
    setIsSubmittingComment(false);
  };

  const handleDeletePost = async () => {
    const result = await deletePost(id);
    if (result.success) {
      navigate('/community');
    }
  };

  if (isLoading || !currentPost) {
    return (
      <div className="min-h-screen bg-[#0a0f0d] flex items-center justify-center">
        <p className="text-gray-400">Loading post...</p>
      </div>
    );
  }

  const liked = currentPost.likes?.includes(user?._id);
  const isOwner = currentPost.author?._id === user?._id;

  const topLevelComments = comments
    .filter((c) => !c.parent)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const repliesByParent = comments
    .filter((c) => c.parent)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .reduce((acc, reply) => {
      (acc[reply.parent] = acc[reply.parent] || []).push(reply);
      return acc;
    }, {});

  return (
    <div className="min-h-screen bg-[#0a0f0d] p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <Link to="/community" className="text-gray-400 hover:text-white transition-colors mb-6 inline-block">
          ← Back to Community
        </Link>

        {isEditing ? (
          <EditPostForm post={currentPost} onClose={() => setIsEditing(false)} />
        ) : (
          <div className="bg-[#1a2a20] border border-white/5 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-400">
                <span className="text-[#a3cf8b]">{currentPost.author?.name || 'Unknown'}</span> · {formatDate(currentPost.createdAt)}
              </p>
              {isOwner && (
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDeletePost}
                    className="text-sm text-[#ff6a45] hover:text-[#ff6a45]/80 transition-colors"
                  >
                    Delete Post
                  </button>
                </div>
              )}
            </div>

            <h1 className="text-2xl font-bold text-white mb-3">{currentPost.title}</h1>
            <p className="text-gray-300 whitespace-pre-wrap mb-4">{currentPost.body}</p>

            {currentPost.image && (
              <img
                src={`${API_URL}${currentPost.image}`}
                alt={currentPost.title}
                className="w-full max-h-[420px] object-cover rounded-lg border border-white/5 mb-4"
              />
            )}

            <div className="flex flex-wrap gap-2 mb-4">
              {currentPost.tags?.map((tag) => (
                <span key={tag} className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/5 text-gray-300">
                  {tag}
                </span>
              ))}
            </div>

            <button
              onClick={() => toggleLikePost(currentPost._id, user?._id)}
              className={`flex items-center gap-1.5 transition-colors ${
                liked ? 'text-[#a3cf8b]' : 'text-gray-400 hover:text-[#a3cf8b]'
              }`}
            >
              <span>{liked ? '❤️' : '🤍'}</span>
              <span>{currentPost.likes?.length || 0} likes</span>
            </button>
          </div>
        )}

        <h2 className="text-lg font-semibold text-white mb-4">
          {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
        </h2>

        <form onSubmit={handleAddComment} className="mb-6">
          <textarea
            placeholder="Share your advice or ask a follow-up..."
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            maxLength={2000}
            rows={3}
            className="w-full bg-[#1a2a20] border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#a3cf8b]/50 resize-none mb-3"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmittingComment || !commentBody.trim()}
              className="bg-gradient-to-r from-[#a3cf8b] to-[#7fb46a] text-[#0a0f0d] px-6 py-2.5 rounded-lg font-semibold hover:shadow-[0_8px_30px_rgba(163,207,139,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmittingComment ? 'Posting...' : 'Comment'}
            </button>
          </div>
        </form>

        <div className="space-y-3">
          {topLevelComments.length === 0 ? (
            <p className="text-gray-400 text-center py-6">No comments yet. Be the first to answer!</p>
          ) : (
            topLevelComments.map((comment) => (
              <CommentItem
                key={comment._id}
                comment={comment}
                postId={id}
                replies={repliesByParent[comment._id] || []}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default PostDetailPage;
