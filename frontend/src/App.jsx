import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { GoogleOAuthProvider } from '@react-oauth/google';

// Components
import FloatingShape from "./components/FloatingShape";
import LoadingSpinner from "./components/LoadingSpinner";

// Pages
import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import EmailVerificationPage from "./pages/EmailVerificationPage";
import DashboardPage from "./pages/DashboardPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import CommunityPage from "./pages/CommunityPage";
import PostDetailPage from "./pages/PostDetailPage";

// Store
import { useAuthStore } from "./store/authStore";

// ===== PROTECTED ROUTE =====
const ProtectedRoute = ({ children }) => {
	const { isAuthenticated, user } = useAuthStore();

	if (!isAuthenticated) {
		return <Navigate to='/login' replace />;
	}

	// Only check verification for email users, not Google users
	if (!user?.isVerified && !user?.googleId) {
		return <Navigate to='/verify-email' replace />;
	}

	return children;
};

// ===== REDIRECT AUTHENTICATED USERS =====
// Only bounce users who are fully authenticated AND verified away from
// login/signup - unverified users still need to reach these pages (e.g. to
// retry login, which the backend correctly rejects until they verify).
const RedirectAuthenticatedUser = ({ children }) => {
	const { isAuthenticated, user } = useAuthStore();

	if (isAuthenticated && (user?.isVerified || user?.googleId)) {
		return <Navigate to='/' replace />;
	}

	return children;
};

// ===== MAIN APP =====
function App() {
	const { isCheckingAuth, checkAuth } = useAuthStore();
	const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

	useEffect(() => {
		checkAuth();
	}, [checkAuth]);

	if (isCheckingAuth) return <LoadingSpinner />;

	if (!googleClientId) {
		console.warn('⚠️ VITE_GOOGLE_CLIENT_ID is not set in .env file');
	} else {
		console.log('✅ Google Client ID loaded');
	}

	return (
		<GoogleOAuthProvider clientId={googleClientId || "YOUR_GOOGLE_CLIENT_ID"}>
			<div className="min-h-screen bg-[#0a0f0d] relative overflow-hidden">
				{/* Background Effects */}
				<div className="fixed inset-0 z-0 pointer-events-none">
					<div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(163,207,139,0.15),transparent_70%)] animate-pulse-slow" />
					<div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(255,106,69,0.10),transparent_70%)] animate-pulse-slow" style={{ animationDelay: '2s' }} />
					<div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle,rgba(163,207,139,0.05),transparent_70%)]" />
				</div>

				{/* Floating Shapes */}
				<div className="fixed inset-0 pointer-events-none z-[1]">
					<FloatingShape color='bg-green-500/10' size='w-64 h-64' top='-5%' left='10%' delay={0} />
					<FloatingShape color='bg-emerald-500/10' size='w-48 h-48' top='70%' left='80%' delay={5} />
					<FloatingShape color='bg-lime-500/10' size='w-32 h-32' top='40%' left='-10%' delay={2} />
					<FloatingShape color='bg-teal-500/10' size='w-40 h-40' top='20%' right='-5%' delay={3} />
				</div>

				{/* Grain Texture */}
				<div className="fixed inset-0 pointer-events-none z-[2] opacity-[0.02] bg-[url('data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'120\' height=\'120\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'2\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E')]" />

				<Routes>
					{/* Home Page - Public */}
					<Route path='/' element={<HomePage />} />

					{/* Auth Pages */}
					<Route
						path='/signup'
						element={
							<RedirectAuthenticatedUser>
								<SignUpPage />
							</RedirectAuthenticatedUser>
						}
					/>
					<Route
						path='/login'
						element={
							<RedirectAuthenticatedUser>
								<LoginPage />
							</RedirectAuthenticatedUser>
						}
					/>
					
					{/* Email Verification - Only for email users */}
					<Route path='/verify-email' element={<EmailVerificationPage />} />
					
					<Route
						path='/forgot-password'
						element={
							<RedirectAuthenticatedUser>
								<ForgotPasswordPage />
							</RedirectAuthenticatedUser>
						}
					/>
					<Route
						path='/reset-password/:token'
						element={
							<RedirectAuthenticatedUser>
								<ResetPasswordPage />
							</RedirectAuthenticatedUser>
						}
					/>

					{/* Protected Routes */}
					<Route
						path='/dashboard'
						element={
							<ProtectedRoute>
								<DashboardPage />
							</ProtectedRoute>
						}
					/>

					<Route
						path='/community'
						element={
							<ProtectedRoute>
								<CommunityPage />
							</ProtectedRoute>
						}
					/>
					<Route
						path='/community/:id'
						element={
							<ProtectedRoute>
								<PostDetailPage />
							</ProtectedRoute>
						}
					/>

					{/* Catch all */}
					<Route path='*' element={<Navigate to='/' replace />} />
				</Routes>

				<Toaster 
					position="top-center"
					toastOptions={{
						duration: 4000,
						style: {
							background: '#1a2a20',
							color: '#fff',
							border: '1px solid rgba(255,255,255,0.1)',
							borderRadius: '12px',
						},
						success: {
							icon: '🌱',
						},
						error: {
							icon: '❌',
						},
					}}
				/>
			</div>
		</GoogleOAuthProvider>
	);
}

export default App;