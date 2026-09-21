
import { Link, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { getCrops, getRecommendation, getRecentDiagnoses, WATERING_REMINDER_STREAM_URL } from '../utils/cropCareApi';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003';

function DashboardPage() {
  const navigate = useNavigate();
  const { user, updateProfile, logout } = useAuthStore();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // =========================
  // FORM STATE
  // =========================

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    location: '',
    expertise: '',
    profileImage: null,
  });

  const [previewImage, setPreviewImage] = useState(null);

  // =========================
  // PLANTS STATE
  // =========================

  const [plants] = useState([
    {
      id: 1,
      name: 'Monstera Deliciosa',
      status: 'Healthy',
      lastChecked: '2024-01-15',
    },
    {
      id: 2,
      name: 'Fiddle Leaf Fig',
      status: 'Needs Attention',
      lastChecked: '2024-01-14',
    },
    {
      id: 3,
      name: 'Snake Plant',
      status: 'Healthy',
      lastChecked: '2024-01-13',
    },
    {
      id: 4,
      name: 'Peace Lily',
      status: 'Needs Attention',
      lastChecked: '2024-01-12',
    },
  ]);

  // =========================
  // DIAGNOSIS HISTORY
  // =========================

  const [diagnosisHistory, setDiagnosisHistory] = useState([]);

  const [cropCareSummary, setCropCareSummary] = useState({
    totalCrops: 0,
    needsWatering: 0,
    rainExpected: 0,
  });


  // =========================
  // LOAD USER DATA
  // =========================

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        location: user.location || '',
        expertise: user.expertise || '',
        profileImage: null,
      });

      setPreviewImage(
        user.profileImage
          ? `${API_URL}${user.profileImage}`
          : null
      );
    }
  }, [user]);

  const loadCropDashboardData = async () => {
    try {
      const cropResult = await getCrops();
      const crops = cropResult.crops || [];

      const cropsWithRecommendations = await Promise.all(
        crops.map(async (crop) => {
          try {
            const recommendationResult = await getRecommendation(crop.id);
            return {
              ...crop,
              recommendation: recommendationResult?.recommendation || null,
            };
          } catch {
            return {
              ...crop,
              recommendation: null,
            };
          }
        })
      );

      const summary = {
        totalCrops: cropsWithRecommendations.length,
        needsWatering: cropsWithRecommendations.filter(
          (crop) => crop.recommendation?.needsWater
        ).length,
        rainExpected: cropsWithRecommendations.filter(
          (crop) => crop.recommendation?.status === 'rain_expected'
        ).length,
      };

      setCropCareSummary(summary);
    } catch (error) {
      console.error('Failed to load crop dashboard summary:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadCropDashboardData();
      getRecentDiagnoses()
        .then((result) => setDiagnosisHistory(result.diagnoses || []))
        .catch((error) => console.error('Failed to load diagnosis history:', error));
    }
  }, [user]);

  useEffect(() => {
    if (!user || !('EventSource' in window)) {
      return undefined;
    }

    const reminderStream = new EventSource(WATERING_REMINDER_STREAM_URL, {
      withCredentials: true,
    });

    reminderStream.onmessage = (event) => {
      try {
        const reminder = JSON.parse(event.data);
        toast.success(reminder.title, {
          duration: 6000,
          description: reminder.message,
        });

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(reminder.title, {
            body: reminder.message,
            icon: '/favicon.ico',
          });
        }
      } catch (error) {
        console.error('Failed to read watering reminder:', error);
      }
    };

    return () => reminderStream.close();
  }, [user]);

  const enableWateringAlerts = async () => {
    if (!('Notification' in window)) {
      toast.error('This browser does not support system notifications.');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      toast.success('Hourly watering alerts enabled.');
    } else {
      toast.error('Browser notifications are blocked. In-app reminders will still appear.');
    }
  };

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = async () => {
    setIsLoggingOut(true);

    await logout();

    navigate('/login');

    setIsLoggingOut(false);
  };

  // =========================
  // INPUT CHANGE
  // =========================

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================
  // PROFILE IMAGE
  // =========================

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      setFormData((prev) => ({
        ...prev,
        profileImage: file,
      }));

      const reader = new FileReader();

      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };

      reader.readAsDataURL(file);
    }
  };

  // =========================
  // SAVE PROFILE
  // =========================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSaving(true);
    setUploadProgress(0);

    try {
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }

          return prev + 10;
        });
      }, 200);

      const result = await updateProfile(formData);

      clearInterval(interval);

      setUploadProgress(100);

      if (result.success) {
        setTimeout(() => {
          setIsEditing(false);
          setIsSaving(false);
          setUploadProgress(0);
        }, 500);
      } else {
        setIsSaving(false);
        setUploadProgress(0);

        alert(
          'Failed to update profile. Please try again.'
        );
      }
    } catch (error) {
      setIsSaving(false);
      setUploadProgress(0);

      alert(
        'An error occurred. Please try again.'
      );
    }
  };

  // =========================
  // CANCEL EDIT
  // =========================

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      bio: user?.bio || '',
      location: user?.location || '',
      expertise: user?.expertImage || '',
      profileImage: null,
    });

    setPreviewImage(
      user?.profileImage
        ? `${API_URL}${user.profileImage}`
        : null
    );

    setIsEditing(false);
    setUploadProgress(0);
  };


  // =========================
  // DATE FORMAT
  // =========================

  const formatDate = (dateString) => {
    const date = new Date(dateString);

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // =========================
  // STATUS COLOR
  // =========================

  const getStatusColor = (status) => {
    return status === 'Healthy'
      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
  };

  // =========================
  // STATUS ICON
  // =========================

  const getStatusIcon = (status) => {
    return status === 'Healthy'
      ? '✅'
      : '⚠️';
  };

  // =========================
  // RENDER
  // =========================

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-sans transition-colors duration-200">

      {/* =====================================================
          NAVBAR
      ====================================================== */}

      <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 md:px-8 h-16 flex items-center transition-colors duration-200">

        <div className="max-w-7xl w-full mx-auto flex justify-between items-center">

          {/* LOGO */}

          <Link
            to="/dashboard"
            className="flex items-center gap-2"
          >
            <span className="text-xl">🌱</span>

            <span className="font-semibold text-lg text-gray-900 dark:text-white">
              PlantCheck
            </span>
          </Link>

          {/* NAVIGATION */}

          <div className="flex items-center gap-3 md:gap-4">

            {/* CROP CARE BUTTON */}

            <Link
              to="/crop-care"
              className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 px-4 py-2 rounded-md transition-colors text-sm font-medium"
            >
              Crop Care
            </Link>

            {/* NEW DIAGNOSIS */}

            <Link
              to="/diagnose"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors text-sm"
            >
              New Diagnosis
            </Link>

            {/* COMMUNITY */}

            <Link
              to="/community"
              className="hidden sm:block text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors text-sm"
            >
              Community
            </Link>

          </div>
        </div>
      </nav>


      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <div className="pt-24 pb-16 px-4 md:px-8 max-w-7xl mx-auto">

        {/* =================================================
            PROFILE SECTION
        ================================================== */}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8 transition-colors duration-200 mb-6">

          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">

            {/* PROFILE IMAGE */}

            <div className="relative">

              <div
                className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-green-600 dark:border-green-400 overflow-hidden bg-gray-100 dark:bg-gray-700 cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center"
                onClick={
                  isEditing
                    ? handleImageClick
                    : undefined
                }
              >

                {previewImage ? (
                  <img
                    src={previewImage}
                    alt={formData.name || 'Profile'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl text-gray-400 dark:text-gray-500">
                    {formData.name
                      ? formData.name
                          .charAt(0)
                          .toUpperCase()
                      : '👤'}
                  </span>
                )}

                {isEditing && (
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all rounded-full flex items-center justify-center">
                    <span className="text-white opacity-0 hover:opacity-100 text-xs font-medium">
                      Change
                    </span>
                  </div>
                )}

              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />

              {isEditing && (
                <button
                  type="button"
                  onClick={handleImageClick}
                  className="absolute bottom-0 right-0 bg-green-600 hover:bg-green-700 text-white rounded-full p-1.5 shadow-lg transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke="currentColor"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />

                    <path
                      stroke="currentColor"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </button>
              )}

            </div>


            {/* USER INFO */}

            <div className="flex-1">

              <div className="flex flex-col md:flex-row md:items-center gap-4">

                <div>

                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formData.name || 'User'}
                  </h1>

                  <p className="text-gray-600 dark:text-gray-400">
                    {formData.email}
                  </p>

                  {formData.location && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      📍 {formData.location}
                    </p>
                  )}

                </div>


                {/* PROFILE BUTTONS */}

                <div className="flex flex-wrap gap-3">

                  {!isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors text-sm"
                      >
                        Edit Profile
                      </button>

                      <button
                        type="button"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 px-4 py-2 border border-red-300 dark:border-red-700 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoggingOut
                          ? 'Logging out...'
                          : 'Logout'}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving
                          ? 'Saving...'
                          : 'Save Changes'}
                      </button>

                      <button
                        type="button"
                        onClick={handleCancel}
                        disabled={isSaving}
                        className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                    </>
                  )}

                </div>

              </div>


              {formData.bio && (
                <p className="text-gray-700 dark:text-gray-300 mt-2">
                  {formData.bio}
                </p>
              )}

              {formData.expertise && (
                <div className="mt-2 flex flex-wrap gap-2">

                  <span className="text-xs font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full">
                    🌱 {formData.expertise}
                  </span>

                </div>
              )}

            </div>

          </div>


          {/* UPLOAD PROGRESS */}

          {isSaving &&
            uploadProgress > 0 &&
            uploadProgress < 100 && (
              <div className="mt-4">

                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">

                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${uploadProgress}%`,
                    }}
                  />

                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Uploading... {uploadProgress}%
                </p>

              </div>
            )}

        </div>


        {/* =================================================
            EDIT PROFILE
        ================================================== */}

        {isEditing && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200 mb-6">

            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Edit Profile
            </h2>

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* FULL NAME */}

                <div>

                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 transition-colors"
                    required
                  />

                </div>


                {/* EMAIL */}

                <div>

                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                    disabled
                  />

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Email cannot be changed
                  </p>

                </div>


                {/* BIO */}

                <div className="md:col-span-2">

                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bio
                  </label>

                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={3}
                    maxLength={500}
                    placeholder="Tell us about yourself and your plant growing experience..."
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 resize-none transition-colors"
                  />

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formData.bio?.length || 0}/500 characters
                  </p>

                </div>


                {/* LOCATION */}

                <div>

                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Location
                  </label>

                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g. Austin, TX"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 transition-colors"
                  />

                </div>


                {/* EXPERTISE */}

                <div>

                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Area of Expertise
                  </label>

                  <input
                    type="text"
                    name="expertise"
                    value={formData.expertise}
                    onChange={handleInputChange}
                    placeholder="e.g. Indoor Plants, Vegetable Gardening"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 transition-colors"
                  />

                </div>

              </div>

            </form>

          </div>
        )}


        {/* =================================================
            STATS
        ================================================== */}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

          {/* TOTAL PLANTS */}

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors duration-200">

            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {plants.length}
            </p>

            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total Plants
            </p>

          </div>


          {/* HEALTHY */}

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors duration-200">

            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {
                plants.filter(
                  (p) => p.status === 'Healthy'
                ).length
              }
            </p>

            <p className="text-sm text-gray-600 dark:text-gray-400">
              Healthy
            </p>

          </div>


          {/* NEEDS ATTENTION */}

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors duration-200">

            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {
                plants.filter(
                  (p) => p.status === 'Needs Attention'
                ).length
              }
            </p>

            <p className="text-sm text-gray-600 dark:text-gray-400">
              Needs Attention
            </p>

          </div>


          {/* DIAGNOSES */}

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors duration-200">

            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {diagnosisHistory.length}
            </p>

            <p className="text-sm text-gray-600 dark:text-gray-400">
              Diagnoses
            </p>

          </div>

        </div>


        {/* =================================================
            CROP CARE CARD
        ================================================== */}

        <div className="overflow-hidden rounded-[26px] border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-green-50 p-6 shadow-[0_20px_50px_-30px_rgba(16,185,129,0.4)] mb-6 transition-colors duration-200">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
                Crop Care
              </p>

              <h2 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                Smart watering overview
              </h2>

              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage your crops and receive weather-aware watering recommendations.
              </p>

            </div>


            <div className="flex flex-wrap items-center justify-end gap-2">
              {'Notification' in window && Notification.permission !== 'granted' && (
                <button
                  type="button"
                  onClick={enableWateringAlerts}
                  className="rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                >
                  Enable hourly alerts
                </button>
              )}
              <Link
                to="/crop-care"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:from-blue-700 hover:via-indigo-700 hover:to-sky-600"
              >
                Open Crop Care
                <span className="ml-2">→</span>
              </Link>
            </div>

          </div>


          {/* CROP CARE SUMMARY */}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">

            <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-500 p-4 text-white shadow-md shadow-blue-600/15">
              <p className="text-2xl font-bold">
                {cropCareSummary.totalCrops}
              </p>
              <p className="mt-1 text-sm text-blue-50">
                Registered Crops
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-500 via-sky-500 to-blue-600 p-4 text-white shadow-md shadow-cyan-500/15">
              <p className="text-2xl font-bold">
                {cropCareSummary.needsWatering}
              </p>
              <p className="mt-1 text-sm text-cyan-50">
                Need Watering
              </p>
            </div>

            <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-500 via-blue-500 to-sky-500 p-4 text-white shadow-md shadow-indigo-500/15">
              <p className="text-2xl font-bold">
                {cropCareSummary.rainExpected}
              </p>
              <p className="mt-1 text-sm text-indigo-50">
                Rain Expected
              </p>
            </div>

          </div>

        </div>


        {/* =================================================
            PLANT LIST & DIAGNOSIS HISTORY
        ================================================== */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* =================================================
              PLANT LIST
          ================================================== */}

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">

            <div className="flex items-center justify-between mb-4">

              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                My Plants
              </h2>

              <Link
                to="/diagnose"
                className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors font-medium"
              >
                + Add Plant
              </Link>

            </div>


            {plants.length === 0 ? (

              <div className="text-center py-8">

                <p className="text-gray-600 dark:text-gray-400">
                  No plants yet.
                </p>

              </div>

            ) : (

              <div className="space-y-3">

                {plants.map((plant) => (

                  <div
                    key={plant.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200"
                  >

                    <div>

                      <p className="font-medium text-gray-900 dark:text-white">
                        {plant.name}
                      </p>

                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Last checked: {formatDate(plant.lastChecked)}
                      </p>

                    </div>


                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        plant.status
                      )}`}
                    >
                      {getStatusIcon(plant.status)} {plant.status}
                    </span>

                  </div>

                ))}

              </div>

            )}

          </div>


          {/* =================================================
              DIAGNOSIS HISTORY
          ================================================== */}

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">

            <div className="flex items-center justify-between mb-4">

              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Diagnoses
              </h2>

              <Link
                to="/diagnose"
                className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors font-medium"
              >
                New Diagnosis →
              </Link>

            </div>


            <div className="space-y-3">

              {diagnosisHistory.length === 0 ? (

                <div className="text-center py-8">

                  <p className="text-gray-600 dark:text-gray-400">
                    No diagnoses yet.
                  </p>

                </div>

              ) : (

                diagnosisHistory.map((diagnosis) => (

                  <div
                    key={diagnosis._id || diagnosis.id}
                    className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200"
                  >

                    <div className="flex items-center justify-between">

                      <div>

                        <div className="flex items-center gap-2">

                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {diagnosis.plantName}
                          </h3>

                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              diagnosis.status
                            )}`}
                          >
                            {diagnosis.status}
                          </span>

                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {diagnosis.diagnosis}
                        </p>

                      </div>


                      <div className="text-right">

                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                          {diagnosis.confidence}% confidence
                        </span>

                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatDate(diagnosis.createdAt || diagnosis.date)}
                        </p>

                      </div>

                    </div>

                  </div>

                ))

              )}

            </div>

          </div>

        </div>

      </div>


      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer className="border-t border-gray-200 dark:border-gray-700 py-6 px-4 md:px-8 max-w-7xl mx-auto transition-colors duration-200">

        <div className="text-center text-sm text-gray-500 dark:text-gray-400">

          <span>
            &copy; {new Date().getFullYear()} PlantCheck. All rights reserved.
          </span>

        </div>

      </footer>

    </div>
  );
}

export default DashboardPage;

