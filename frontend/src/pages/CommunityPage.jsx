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
      className="bg-[#1a2a20] border border-white/10 rounded-xl p-6 mb-8 space-y-4"
    >
      <h2 className="text-lg font-semibold text-white">New Post</h2>

      <input
        type="text"
        placeholder="Title (e.g. Yellow spots on my tomato leaves)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={150}
        className="w-full bg-[#0a0f0d] border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#a3cf8b]/50"
      />

      <textarea
        placeholder="Describe what you're seeing, what you've tried, growing conditions, etc."
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
          {image ? 'Change Image' : 'Add Image (optional)'}
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
    <div className="bg-[#1a2a20] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-400">
          <span className="text-[#a3cf8b]">{post.author?.name || 'Unknown'}</span> · {formatDate(post.createdAt)}
        </p>
      </div>

      <Link to={`/community/${post._id}`}>
        <h3 className="text-lg font-semibold text-white mb-1 hover:text-[#a3cf8b] transition-colors">
          {post.title}
        </h3>
        <p className="text-gray-400 text-sm line-clamp-2 mb-3">{post.body}</p>
      </Link>

      {post.image && (
        <Link to={`/community/${post._id}`}>
          <img
            src={`${API_URL}${post.image}`}
            alt={post.title}
            className="w-full max-h-64 object-cover rounded-lg border border-white/5 mb-3"
          />
        </Link>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        {post.tags?.map((tag) => (
          <span key={tag} className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/5 text-gray-300">
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-5 text-sm">
        <button
          onClick={() => toggleLikePost(post._id, user?._id)}
          className={`flex items-center gap-1.5 transition-colors ${
            liked ? 'text-[#a3cf8b]' : 'text-gray-400 hover:text-[#a3cf8b]'
          }`}
        >
          <span>{liked ? '❤️' : '🤍'}</span>
          <span>{post.likes?.length || 0}</span>
        </button>
        <Link to={`/community/${post._id}`} className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors">
          <span>💬</span>
          <span>{post.commentCount || 0}</span>
        </Link>
      </div>
    </div>
  );
}

function CommunityPage() {
  const navigate = useNavigate();
  const { posts, isLoading, activeTag, fetchPosts } = useCommunityStore();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return (
    <div className="min-h-screen bg-[#0a0f0d] p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">🌱 Community</h1>
            <p className="text-gray-400 mt-1">Ask questions, share advice, help other growers.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-400 hover:text-white transition-colors px-4 py-2.5"
            >
              ← Dashboard
            </button>
            <button
              onClick={() => setShowForm((s) => !s)}
              className="bg-gradient-to-r from-[#a3cf8b] to-[#7fb46a] text-[#0a0f0d] px-6 py-2.5 rounded-lg font-semibold hover:shadow-[0_8px_30px_rgba(163,207,139,0.3)] transition-all hover:-translate-y-0.5"
            >
              {showForm ? 'Close' : '+ New Post'}
            </button>
          </div>
        </div>

        {showForm && <NewPostForm onClose={() => setShowForm(false)} />}

        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => fetchPosts(null)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all ${
              !activeTag
                ? 'bg-[#a3cf8b]/20 text-[#a3cf8b] border-[#a3cf8b]/40'
                : 'bg-transparent text-gray-400 border-white/10 hover:border-white/20'
            }`}
          >
            All
          </button>
          {POST_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => fetchPosts(tag)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all ${
                activeTag === tag
                  ? 'bg-[#a3cf8b]/20 text-[#a3cf8b] border-[#a3cf8b]/40'
                  : 'bg-transparent text-gray-400 border-white/10 hover:border-white/20'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="text-gray-400 text-center py-12">Loading posts...</p>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 bg-[#1a2a20] border border-white/5 rounded-xl">
            <p className="text-gray-400">No posts yet. Be the first to ask a question!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CommunityPage;
