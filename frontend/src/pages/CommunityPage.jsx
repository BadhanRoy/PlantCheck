import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useCommunityStore, POST_TAGS } from '../store/communityStore';
import { useAuthStore } from '../store/authStore';
import { formatDate } from '../utils/date';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003';

function NewPostForm({ onClose }) {
  const { createPost, isPosting } = useCommunityStore();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState([POST_TAGS[0]]);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const toggleTag = (tag) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] || null;
    setImage(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    const result = await createPost({ title, body, tags, image });
    if (result.success) {
      onClose();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6 space-y-4 transition-colors duration-200"
    >
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">New Post</h2>

      <input
        type="text"
        placeholder="Title (e.g. Yellow spots on my tomato leaves)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={150}
        className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-900 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 dark:focus:border-green-400 transition-colors"
      />

      <textarea
        placeholder="Describe what you're seeing, what you've tried, growing conditions, etc."
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
          {image ? 'Change Image' : 'Add Image (optional)'}
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
          {isPosting ? 'Posting...' : 'Post'}
        </button>
      </div>
    </form>
  );
}

function PostCard({ post }) {
  const { user } = useAuthStore();
  const { toggleLikePost } = useCommunityStore();
  const liked = post.likes?.includes(user?._id);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-sm transition-all hover:border-gray-300 dark:hover:border-gray-600">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium text-gray-900 dark:text-white">{post.author?.name || 'Unknown'}</span> · {formatDate(post.createdAt)}
        </p>
      </div>

      <Link to={`/community/${post._id}`}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 hover:text-green-600 dark:hover:text-green-400 transition-colors">
          {post.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">{post.body}</p>
      </Link>

      {post.image && (
        <Link to={`/community/${post._id}`}>
          <img
            src={`${API_URL}${post.image}`}
            alt={post.title}
            className="w-full max-h-64 object-cover rounded-md border border-gray-200 dark:border-gray-700 mb-3"
          />
        </Link>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        {post.tags?.map((tag) => (
          <span key={tag} className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-5 text-sm">
        <button
          onClick={() => toggleLikePost(post._id, user?._id)}
          className={`flex items-center gap-1.5 transition-colors ${
            liked ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400'
          }`}
        >
          <span>{liked ? '❤️' : '🤍'}</span>
          <span>{post.likes?.length || 0}</span>
        </button>
        <Link to={`/community/${post._id}`} className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <span>💬</span>
          <span>{post.commentCount || 0}</span>
        </Link>
      </div>
    </div>
  );
}

function CommunityPage() {
  const { posts, isLoading, activeTag, fetchPosts } = useCommunityStore();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

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
              to="/dashboard"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors text-sm"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* ===== MAIN CONTENT ===== */}
      <div className="pt-24 pb-16 px-4 md:px-8 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Community</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Ask questions, share advice, help other growers.</p>
          </div>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-semibold transition-colors"
          >
            {showForm ? 'Close' : 'New Post'}
          </button>
        </div>

        {showForm && <NewPostForm onClose={() => setShowForm(false)} />}

        {/* Filter Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => fetchPosts(null)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              !activeTag
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            All
          </button>
          {POST_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => fetchPosts(tag)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                activeTag === tag
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Posts List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin text-3xl">⏳</div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors duration-200">
            <p className="text-gray-600 dark:text-gray-400">No posts yet. Be the first to ask a question!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>
        )}
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

export default CommunityPage;