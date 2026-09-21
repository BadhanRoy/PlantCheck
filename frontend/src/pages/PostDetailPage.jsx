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
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6 space-y-4 transition-colors duration-200"
    >
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Post</h2>

      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={150}
        className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-900 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 dark:focus:border-green-400 transition-colors"
      />

      <textarea
        placeholder="Body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={5000}
        rows={4}
        className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-900 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 dark:focus:border-green-400 resize-none transition-colors"
      />

      <div className="flex flex-wrap gap-2">
        {POST_TAGS.map((tag) => (
          <button
            type="button"
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              tags.includes(tag)
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700'
                : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <label className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          {image ? 'Change Image' : 'Replace Image'}
          <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
        </label>
        {preview && (
          <img src={preview} alt="Preview" className="h-14 w-14 object-cover rounded-md border border-gray-200 dark:border-gray-700" />
        )}
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2 rounded-md font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPosting || !title.trim() || !body.trim()}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
    const parentId = comment.parent || comment._id;
    const result = await addComment(postId, replyBody, parentId);
    if (result.success) {
      setReplyBody('');
      setShowReplyForm(false);
    }
    setIsSubmittingReply(false);
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-colors duration-200">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium text-gray-900 dark:text-white">{comment.author?.name || 'Unknown'}</span> · {formatDate(comment.createdAt)}
        </p>
        {isOwner && (
          <button
            onClick={() => deleteComment(comment._id)}
            className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
          >
            Delete
          </button>
        )}
      </div>
      <p className="text-gray-900 dark:text-white text-sm mb-2 whitespace-pre-wrap">{comment.body}</p>
      <div className="flex items-center gap-4">
        <button
          onClick={() => toggleLikeComment(comment._id, user?._id)}
          className={`flex items-center gap-1.5 text-xs transition-colors ${
            liked ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400'
          }`}
        >
          <span>{liked ? '❤️' : '🤍'}</span>
          <span>{comment.likes?.length || 0}</span>
        </button>
        <button
          onClick={() => setShowReplyForm((prev) => !prev)}
          className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
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
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-900 text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 dark:focus:border-green-400 resize-none mb-2 transition-colors"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowReplyForm(false)}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingReply || !replyBody.trim()}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-md text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmittingReply ? 'Posting...' : 'Reply'}
            </button>
          </div>
        </form>
      )}

      {!isReply && replies.length > 0 && (
        <div className="mt-3 ml-6 pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-3">
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
    if (window.confirm('Are you sure you want to delete this post?')) {
      const result = await deletePost(id);
      if (result.success) {
        navigate('/community');
      }
    }
  };

  if (isLoading || !currentPost) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <div className="inline-block animate-spin text-3xl">⏳</div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Loading post...</p>
        </div>
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
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-sans transition-colors duration-200">
      {/* ===== NAVBAR ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 md:px-8 h-16 flex items-center transition-colors duration-200">
        <div className="max-w-6xl w-full mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl">🌱</span>
            <span className="font-semibold text-lg text-gray-900 dark:text-white">PlantCheck</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              to="/community"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors text-sm"
            >
              Community
            </Link>
          </div>
        </div>
      </nav>

      {/* ===== MAIN CONTENT ===== */}
      <div className="pt-24 pb-16 px-4 md:px-8 max-w-3xl mx-auto">
        <Link
          to="/community"
          className="inline-block text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors mb-6"
        >
          ← Back to Community
        </Link>

        {isEditing ? (
          <EditPostForm post={currentPost} onClose={() => setIsEditing(false)} />
        ) : (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6 transition-colors duration-200">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium text-gray-900 dark:text-white">{currentPost.author?.name || 'Unknown'}</span> · {formatDate(currentPost.createdAt)}
              </p>
              {isOwner && (
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={handleDeletePost}
                    className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                  >
                    🗑️ Delete
                  </button>
                </div>
              )}
            </div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{currentPost.title}</h1>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-4">{currentPost.body}</p>

            {currentPost.image && (
              <img
                src={`${API_URL}${currentPost.image}`}
                alt={currentPost.title}
                className="w-full max-h-[420px] object-cover rounded-md border border-gray-200 dark:border-gray-700 mb-4"
              />
            )}

            <div className="flex flex-wrap gap-2 mb-4">
              {currentPost.tags?.map((tag) => (
                <span key={tag} className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  {tag}
                </span>
              ))}
            </div>

            <button
              onClick={() => toggleLikePost(currentPost._id, user?._id)}
              className={`flex items-center gap-1.5 transition-colors ${
                liked ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400'
              }`}
            >
              <span>{liked ? '❤️' : '🤍'}</span>
              <span>{currentPost.likes?.length || 0} likes</span>
            </button>
          </div>
        )}

        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
        </h2>

        <form onSubmit={handleAddComment} className="mb-6">
          <textarea
            placeholder="Share your advice or ask a follow-up..."
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            maxLength={2000}
            rows={3}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white bg-white dark:bg-gray-900 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 dark:focus:border-green-400 resize-none mb-3 transition-colors"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmittingComment || !commentBody.trim()}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-md font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmittingComment ? 'Posting...' : 'Comment'}
            </button>
          </div>
        </form>

        <div className="space-y-3">
          {topLevelComments.length === 0 ? (
            <div className="text-center py-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors duration-200">
              <p className="text-gray-600 dark:text-gray-400">No comments yet. Be the first to answer!</p>
            </div>
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

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-gray-200 dark:border-gray-700 py-8 px-4 md:px-8 max-w-6xl mx-auto transition-colors duration-200">
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <span>&copy; {new Date().getFullYear()} PlantCheck. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}

export default PostDetailPage;