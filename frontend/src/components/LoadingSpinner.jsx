const LoadingSpinner = () => {
  return (
    <div className="min-h-screen bg-[#0a0f0d] flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-[#a3cf8b] mx-auto"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl">🌱</span>
          </div>
        </div>
        <p className="text-[#a3cf8b] mt-4 font-mono text-sm animate-pulse">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;