import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@context/AuthContext'
import MainLayout from '@layouts/MainLayout'
import LessonLayout from '@layouts/LessonLayout'
import AdminRoute from '@components/admin/AdminRoute'
import PageLoader from '@components/PageLoader'

const Home = lazy(() => import('@pages/Home'))
const Login = lazy(() => import('@pages/Login'))
const Register = lazy(() => import('@pages/Register'))
const Dashboard = lazy(() => import('@pages/Dashboard'))
const Cours = lazy(() => import('@pages/Cours'))
const Lecon = lazy(() => import('@pages/Lecon'))
const Sprechen = lazy(() => import('@pages/Sprechen'))
const Communaute = lazy(() => import('@pages/Communaute'))
const Guide = lazy(() => import('@pages/Guide'))
const MonProfil = lazy(() => import('@pages/MonProfil'))
const Admin = lazy(() => import('@pages/Admin'))
const NotFound = lazy(() => import('@pages/NotFound'))

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />

  return children
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <PageLoader />
  if (user) return <Navigate to="/dashboard" replace />

  return children
}

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<LessonLayout />}>
          <Route
            path="/cours/:niveau/lecon/:leconId"
            element={
              <PrivateRoute>
                <Lecon />
              </PrivateRoute>
            }
          />
        </Route>

        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />

          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />

          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <Register />
              </PublicOnlyRoute>
            }
          />

          <Route path="/guide" element={<Guide />} />
          <Route path="/guide/:section" element={<Guide />} />

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/cours"
            element={
              <PrivateRoute>
                <Cours />
              </PrivateRoute>
            }
          />

          <Route
            path="/cours/:niveau"
            element={
              <PrivateRoute>
                <Cours />
              </PrivateRoute>
            }
          />

          <Route
            path="/sprechen"
            element={
              <PrivateRoute>
                <Sprechen />
              </PrivateRoute>
            }
          />

          <Route
            path="/communaute"
            element={
              <PrivateRoute>
                <Communaute />
              </PrivateRoute>
            }
          />

          <Route
            path="/communaute/:canal"
            element={
              <PrivateRoute>
                <Communaute />
              </PrivateRoute>
            }
          />

          <Route
            path="/mon-profil"
            element={
              <PrivateRoute>
                <MonProfil />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            }
          />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}

export default App
