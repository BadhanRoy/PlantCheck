import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-hot-toast';

function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [plants] = useState([
    { id: 1, name: 'Monstera', status: 'Healthy', lastChecked: '2 days ago' },
    { id: 2, name: 'Fiddle Leaf Fig', status: 'Needs Attention', lastChecked: '1 day ago' },
    { id: 3, name: 'Snake Plant', status: 'Healthy', lastChecked: '3 days ago' },
  ]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if API fails
      localStorage.removeItem('token');
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      navigate('/login');
      toast.success('Logged out successfully');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f0d] p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">🌱 My Plants</h1>
            <p className="text-gray-400 mt-1">
              Welcome back, <span className="text-[#a3cf8b]">{user?.name || 'User'}</span>! 👋
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/diagnose"
              className="bg-gradient-to-r from-[#a3cf8b] to-[#7fb46a] text-[#0a0f0d] px-6 py-2.5 rounded-lg font-semibold hover:shadow-[0_8px_30px_rgba(163,207,139,0.3)] transition-all hover:-translate-y-0.5"
            >
              + Add Plant
            </Link>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-6 py-2.5 rounded-lg font-semibold border border-red-500/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1a2a20] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all">
            <p className="text-gray-400 text-sm">Total Plants</p>
            <p className="text-2xl font-bold text-white">{plants.length}</p>
          </div>
          <div className="bg-[#1a2a20] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all">
            <p className="text-gray-400 text-sm">Healthy</p>
            <p className="text-2xl font-bold text-[#a3cf8b]">{plants.filter(p => p.status === 'Healthy').length}</p>
          </div>
          <div className="bg-[#1a2a20] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all">
            <p className="text-gray-400 text-sm">Needs Attention</p>
            <p className="text-2xl font-bold text-[#ff6a45]">{plants.filter(p => p.status === 'Needs Attention').length}</p>
          </div>
          <div className="bg-[#1a2a20] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all">
            <p className="text-gray-400 text-sm">Diagnoses Today</p>
            <p className="text-2xl font-bold text-white">0</p>
          </div>
        </div>

        {/* Plant List */}
        <div className="bg-[#1a2a20] border border-white/5 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Your Plants</h2>
          {plants.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No plants yet. Add your first plant!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {plants.map((plant) => (
                <div key={plant.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-[#0a0f0d] rounded-lg border border-white/5 hover:border-white/10 transition-all gap-3">
                  <div>
                    <p className="font-medium text-white">{plant.name}</p>
                    <p className="text-sm text-gray-400">Last checked: {plant.lastChecked}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      plant.status === 'Healthy' 
                        ? 'bg-green-500/20 text-[#a3cf8b]' 
                        : 'bg-red-500/20 text-[#ff6a45]'
                    }`}>
                      {plant.status}
                    </span>
                    <button className="text-gray-400 hover:text-white transition-colors text-sm">
                      View →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;