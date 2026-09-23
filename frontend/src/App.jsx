import { Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import Layout from './components/layout/Layout.jsx'
import RequireAuth from './components/layout/RequireAuth.jsx'
import ScrollToTop from './components/layout/ScrollToTop.jsx'
import Home from './pages/Home.jsx'
import FindWalker from './pages/FindWalker.jsx'
import WalkerProfile from './pages/WalkerProfile.jsx'
import BecomeWalker from './pages/BecomeWalker.jsx'
import Services from './pages/Services.jsx'
import HowItWorks from './pages/HowItWorks.jsx'
import About from './pages/About.jsx'
import Contact from './pages/Contact.jsx'
import Auth from './pages/Auth.jsx'
import Dashboard from './pages/Dashboard.jsx'
import OwnerDashboard from './pages/OwnerDashboard.jsx'
import WalkerDashboard from './pages/WalkerDashboard.jsx'
import Booking from './pages/Booking.jsx'
import Profile from './pages/Profile.jsx'
import Messages from './pages/Messages.jsx'
import NotFound from './pages/NotFound.jsx'

const OWNER = ['owner', 'both']
const WALKER = ['walker', 'both']

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ScrollToTop />
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="find-walker" element={<FindWalker />} />
            <Route path="walkers/:id" element={<WalkerProfile />} />
            <Route path="become-a-walker" element={<BecomeWalker />} />
            <Route path="services" element={<Services />} />
            <Route path="how-it-works" element={<HowItWorks />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="login" element={<Auth mode="login" />} />
            <Route path="signup" element={<Auth mode="signup" />} />

            <Route path="dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
            <Route path="dashboard/owner" element={<RequireAuth roles={OWNER}><OwnerDashboard /></RequireAuth>} />
            <Route path="dashboard/walker" element={<RequireAuth roles={WALKER}><WalkerDashboard /></RequireAuth>} />
            <Route path="book/:walkerId" element={<RequireAuth roles={OWNER}><Booking /></RequireAuth>} />
            <Route path="profile" element={<RequireAuth><Profile /></RequireAuth>} />
            <Route path="messages" element={<RequireAuth><Messages /></RequireAuth>} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </ToastProvider>
    </AuthProvider>
  )
}
