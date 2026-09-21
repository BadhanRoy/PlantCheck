import { create } from 'zustand';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003';

export const POST_TAGS = ["Potato", "Corn", "Wheat", "Rice", "Tomato", "Soybean", "Cotton", "Sugarcane"];

export const useCommunityStore = create((set, get) => ({
  posts: [],
  currentPost: null,
  comments: [],
  activeTag: null,
  isLoading: false,
  isPosting: false,

  // ===== FETCH POSTS =====
  fetchPosts: async (tag = null) => {
    set({ isLoading: true, activeTag: tag });
    try {
      const query = tag ? `?tag=${encodeURIComponent(tag)}` : '';
      const response = await fetch(`${API_URL}/api/community/posts${query}`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        set({ posts: data.posts, isLoading: false });
      } else {
        toast.error(data.message || 'Failed to load posts');
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Fetch posts error:', error);
      toast.error('Something went wrong loading the community feed.');
      set({ isLoading: false });
    }
  },

  // ===== CREATE POST =====
  createPost: async ({ title, body, tags, image }) => {
    set({ isPosting: true });
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('body', body);
      (tags && tags.length > 0 ? tags : [POST_TAGS[0]]).forEach((t) => formData.append('tags', t));
      if (image) {
        formData.append('image', image);
      }

      const response = await fetch(`${API_URL}/api/community/posts`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        set({ posts: [data.post, ...get().posts], isPosting: false });
        toast.success('Post created!');
        return { success: true };
      } else {
        toast.error(data.message || 'Failed to create post');
        set({ isPosting: false });
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Create post error:', error);
      toast.error('Something went wrong. Please try again.');
      set({ isPosting: false });
      return { success: false, error: error.message };
    }
  },

  // ===== UPDATE POST =====
  updatePost: async (id, { title, body, tags, image }) => {
    set({ isPosting: true });
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('body', body);
      (tags && tags.length > 0 ? tags : [POST_TAGS[0]]).forEach((t) => formData.append('tags', t));
      if (image) {
        formData.append('image', image);
      }

      const response = await fetch(`${API_URL}/api/community/posts/${id}`, {
        method: 'PUT',
        credentials: 'include',
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        set({
          posts: get().posts.map((p) => (p._id === id ? data.post : p)),
          currentPost: get().currentPost?._id === id ? data.post : get().currentPost,
          isPosting: false,
        });
        toast.success('Post updated!');
        return { success: true };
      } else {
        toast.error(data.message || 'Failed to update post');
        set({ isPosting: false });
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Update post error:', error);
      toast.error('Something went wrong. Please try again.');
      set({ isPosting: false });
      return { success: false, error: error.message };
    }
  },

  // ===== DELETE POST =====
  deletePost: async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/community/posts/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        set({ posts: get().posts.filter((p) => p._id !== id) });
        toast.success('Post deleted');
        return { success: true };
      } else {
        toast.error(data.message || 'Failed to delete post');
        return { success: false };
      }
    } catch (error) {
      console.error('Delete post error:', error);
      toast.error('Something went wrong. Please try again.');
      return { success: false };
    }
  },

  // ===== FETCH SINGLE POST + COMMENTS =====
  fetchPost: async (id) => {
    set({ isLoading: true, currentPost: null, comments: [] });
    try {
      const response = await fetch(`${API_URL}/api/community/posts/${id}`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        set({ currentPost: data.post, comments: data.comments, isLoading: false });
      } else {
        toast.error(data.message || 'Failed to load post');
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Fetch post error:', error);
      toast.error('Something went wrong loading the post.');
      set({ isLoading: false });
    }
  },

  // ===== TOGGLE LIKE POST =====
  toggleLikePost: async (id, currentUserId) => {
    const applyLikeState = (post) => {
      if (!post || post._id !== id) return post;
      const alreadyLiked = post.likes?.includes(currentUserId);
      const likes = alreadyLiked
        ? post.likes.filter((u) => u !== currentUserId)
        : [...(post.likes || []), currentUserId];
      return { ...post, likes };
    };

    set({
      posts: get().posts.map(applyLikeState),
      currentPost: applyLikeState(get().currentPost),
    });

    try {
      const response = await fetch(`${API_URL}/api/community/posts/${id}/like`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await response.json();
      if (!data.success) {
        toast.error(data.message || 'Failed to update like');
      }
    } catch (error) {
      console.error('Toggle like post error:', error);
      toast.error('Something went wrong. Please try again.');
    }
  },

  // ===== ADD COMMENT =====
  addComment: async (postId, body, parentId = null) => {
    try {
      const response = await fetch(`${API_URL}/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ body, parentId }),
      });
      const data = await response.json();

      if (data.success) {
        set({ comments: [data.comment, ...get().comments] });
        const currentPost = get().currentPost;
        if (currentPost) {
          set({ currentPost: { ...currentPost, commentCount: (currentPost.commentCount || 0) + 1 } });
        }
        return { success: true };
      } else {
        toast.error(data.message || 'Failed to add comment');
        return { success: false };
      }
    } catch (error) {
      console.error('Add comment error:', error);
      toast.error('Something went wrong. Please try again.');
      return { success: false };
    }
  },

  // ===== DELETE COMMENT =====
  deleteComment: async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/community/comments/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        const removedCount = get().comments.filter((c) => c._id === id || c.parent === id).length;
        set({ comments: get().comments.filter((c) => c._id !== id && c.parent !== id) });
        const currentPost = get().currentPost;
        if (currentPost) {
          set({ currentPost: { ...currentPost, commentCount: Math.max(0, (currentPost.commentCount || 0) - removedCount) } });
        }
        toast.success('Comment deleted');
      } else {
        toast.error(data.message || 'Failed to delete comment');
      }
    } catch (error) {
      console.error('Delete comment error:', error);
      toast.error('Something went wrong. Please try again.');
    }
  },

  // ===== TOGGLE LIKE COMMENT =====
  toggleLikeComment: async (id, currentUserId) => {
    set({
      comments: get().comments.map((c) => {
        if (c._id !== id) return c;
        const alreadyLiked = c.likes?.includes(currentUserId);
        const likes = alreadyLiked
          ? c.likes.filter((u) => u !== currentUserId)
          : [...(c.likes || []), currentUserId];
        return { ...c, likes };
      }),
    });

    try {
      const response = await fetch(`${API_URL}/api/community/comments/${id}/like`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await response.json();
      if (!data.success) {
        toast.error(data.message || 'Failed to update like');
      }
    } catch (error) {
      console.error('Toggle like comment error:', error);
      toast.error('Something went wrong. Please try again.');
    }
  },
}));
