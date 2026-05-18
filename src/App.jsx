import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Toaster from './components/ui/Toaster'
import OnboardingWizard from './components/OnboardingWizard'
import Layout from './components/layout/Layout'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import RedeemKey from './pages/auth/RedeemKey'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import Listings from './pages/Listings'
import LeadPipeline from './pages/LeadPipeline'
import OpenHouses from './pages/OpenHouses'
import Commissions from './pages/Commissions'
import Documents from './pages/Documents'
import FollowUps from './pages/FollowUps'
import Transactions from './pages/Transactions'
import WeeklyReview from './pages/WeeklyReview'
import ShowingTracker from './pages/ShowingTracker'
import MarketAnalytics from './pages/MarketAnalytics'
import Settings from './pages/Settings'

function FullScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas">
      <Loader2 className="w-6 h-6 animate-spin text-brand" />
    </div>
  )
}

function RequireAuth({ children }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <FullScreenLoader />
  if (!user) return <Navigate to="/login" replace />
  return (
    <>
      {children}
      {profile && profile.onboarding_completed === false && <OnboardingWizard onDone={() => { /* state flips via refreshProfile */ }} />}
    </>
  )
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenLoader />
  if (user) return <Navigate to="/" replace />
  return children
}

function LegacyRedirect({ to }) {
  const { search } = useLocation()
  return <Navigate to={`${to}${search}`} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster />
        <Routes>
          <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
          <Route path="/signup" element={<PublicOnly><Signup /></PublicOnly>} />
          <Route path="/redeem" element={<PublicOnly><RedeemKey /></PublicOnly>} />

          <Route element={<RequireAuth><Layout /></RequireAuth>}>
            <Route index element={<Dashboard />} />
            <Route path="clients"      element={<Clients />} />
            <Route path="listings"     element={<Listings />} />
            <Route path="pipeline"     element={<LeadPipeline />} />
            <Route path="open-houses"  element={<OpenHouses />} />
            <Route path="commissions"  element={<Commissions />} />
            <Route path="documents"    element={<Documents />} />
            <Route path="follow-ups"   element={<FollowUps />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="weekly"       element={<WeeklyReview />} />
            <Route path="showings"     element={<ShowingTracker />} />
            <Route path="market"       element={<MarketAnalytics />} />
            <Route path="settings"     element={<Settings />} />

            {/* Legacy redirects from VA paths */}
            <Route path="accounts"     element={<LegacyRedirect to="/clients" />} />
            <Route path="packages"     element={<LegacyRedirect to="/listings" />} />
            <Route path="sops"         element={<LegacyRedirect to="/documents" />} />
            <Route path="invoices"     element={<LegacyRedirect to="/commissions" />} />
            <Route path="check-ins"    element={<LegacyRedirect to="/follow-ups" />} />
            <Route path="weekly-ops"   element={<LegacyRedirect to="/weekly" />} />
            <Route path="time"         element={<LegacyRedirect to="/showings" />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
