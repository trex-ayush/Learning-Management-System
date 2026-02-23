import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext, lazy, Suspense } from 'react';
import AuthContext, { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { Toaster } from 'react-hot-toast';

// Lazy load all pages for better performance (code splitting)
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const CourseManage = lazy(() => import('./pages/CourseManage'));
const CourseView = lazy(() => import('./pages/CourseView'));
const StudentDetail = lazy(() => import('./pages/StudentDetail'));
const StudentCourseDetails = lazy(() => import('./pages/StudentCourseDetails'));
const Profile = lazy(() => import('./pages/Profile'));
const CourseSettings = lazy(() => import('./pages/CourseSettings'));
const GlobalActivity = lazy(() => import('./pages/GlobalActivity'));
const CourseAnalytics = lazy(() => import('./pages/CourseAnalytics'));
const QuizManage = lazy(() => import('./pages/QuizManage'));
const QuizTake = lazy(() => import('./pages/QuizTake'));
const QuizAnalytics = lazy(() => import('./pages/QuizAnalytics'));
const StudentProgressDetail = lazy(() => import('./pages/StudentProgressDetail'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Marketplace pages
const Marketplace = lazy(() => import('./pages/Marketplace'));
const CourseLanding = lazy(() => import('./pages/CourseLanding'));
const InstructorDashboard = lazy(() => import('./pages/InstructorDashboard'));
const CreateMarketplaceCourse = lazy(() => import('./pages/CreateMarketplaceCourse'));
const ManageCoupons = lazy(() => import('./pages/ManageCoupons'));
const InstructorCoupons = lazy(() => import('./pages/InstructorCoupons'));
const BecomeInstructor = lazy(() => import('./pages/BecomeInstructor'));
const CheckoutSuccess = lazy(() => import('./pages/CheckoutSuccess'));
const MyPurchases = lazy(() => import('./pages/MyPurchases'));


// Loading spinner component for Suspense fallback
const PageLoader = () => (
  <div className="flex h-screen items-center justify-center dark:bg-slate-950">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-3 border-slate-200 dark:border-slate-700 border-t-slate-600 dark:border-t-slate-400 rounded-full animate-spin"></div>
      <p className="text-slate-500 dark:text-slate-400 font-medium">Loading...</p>
    </div>
  </div>
);

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return children;
};

// Route for course owners (admin OR course owner - verified by backend)
const CourseOwnerRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Backend will verify ownership, frontend just ensures user is logged in
  return children;
};

// Route for instructors only
const InstructorRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (user.role !== 'instructor' && user.role !== 'admin') {
    return <Navigate to="/become-instructor" />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300 flex flex-col">
            <Navbar />
            <div className="flex-1">
              <Toaster position="top-right" toastOptions={{
                duration: 3000,
                style: {
                  background: '#333',
                  color: '#fff',
                },
                success: {
                  style: {
                    background: '#10B981', // green-500
                    color: '#fff',
                  },
                },
                error: {
                  style: {
                    background: '#EF4444', // red-500
                    color: '#fff',
                  },
                },
              }} />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                  {/* Admin-only routes */}
                  <Route path="/admin/activities" element={<ProtectedRoute adminOnly={true}><GlobalActivity /></ProtectedRoute>} />

                  {/* Course owner routes (admin OR course owner - backend verifies ownership) */}
                  <Route path="/admin/course/:id" element={<CourseOwnerRoute><CourseManage /></CourseOwnerRoute>} />
                  <Route path="/admin/course/:id/settings" element={<CourseOwnerRoute><CourseSettings /></CourseOwnerRoute>} />
                  <Route path="/admin/course/:id/analytics" element={<CourseOwnerRoute><CourseAnalytics /></CourseOwnerRoute>} />
                  <Route path="/admin/course/:courseId/student/:studentId" element={<CourseOwnerRoute><StudentDetail /></CourseOwnerRoute>} />
                  <Route path="/admin/course/:courseId/student/:studentId/progress" element={<CourseOwnerRoute><StudentProgressDetail /></CourseOwnerRoute>} />
                  <Route path="/admin/course/:courseId/quizzes" element={<CourseOwnerRoute><QuizManage /></CourseOwnerRoute>} />
                  <Route path="/admin/course/:courseId/quiz/:quizId/analytics" element={<CourseOwnerRoute><QuizAnalytics /></CourseOwnerRoute>} />

                  {/* Home - Marketplace */}
                  <Route path="/" element={<Marketplace />} />
                  <Route path="/marketplace" element={<Marketplace />} />
                  <Route path="/marketplace/course/:id" element={<CourseLanding />} />

                  {/* My Learning & My Courses - tabs on StudentDashboard */}
                  <Route path="/my-learning" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
                  <Route path="/my-courses" element={<ProtectedRoute><StudentDashboard defaultTab="created" /></ProtectedRoute>} />

                  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/course/:id" element={<ProtectedRoute><StudentCourseDetails /></ProtectedRoute>} />
                  {/* Public route for lecture view - checks preview status internally */}
                  <Route path="/course/:id/lecture/:lectureId" element={<CourseView />} />
                  <Route path="/course/:courseId/quiz/:quizId" element={<ProtectedRoute><QuizTake /></ProtectedRoute>} />

                  {/* Marketplace routes - protected */}
                  <Route path="/checkout/success" element={<ProtectedRoute><CheckoutSuccess /></ProtectedRoute>} />
                  <Route path="/my-purchases" element={<ProtectedRoute><MyPurchases /></ProtectedRoute>} />


                  {/* Instructor routes */}
                  <Route path="/become-instructor" element={<ProtectedRoute><BecomeInstructor /></ProtectedRoute>} />
                  <Route path="/instructor/dashboard" element={<InstructorRoute><InstructorDashboard /></InstructorRoute>} />
                  <Route path="/instructor/create-course" element={<InstructorRoute><CreateMarketplaceCourse /></InstructorRoute>} />
                  <Route path="/instructor/courses" element={<InstructorRoute><InstructorDashboard /></InstructorRoute>} />
                  <Route path="/instructor/course/:id/edit" element={<InstructorRoute><CourseManage /></InstructorRoute>} />
                  <Route path="/instructor/course/:id/coupons" element={<InstructorRoute><InstructorCoupons /></InstructorRoute>} />

                  {/* 404 Not Found - Catch all undefined routes */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </div>
            <Footer />
          </div>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
