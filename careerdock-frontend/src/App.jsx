import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Landing from './pages/Landing/Landing';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import Applications from './pages/Applications/Applications';
import Tracker from './pages/Tracker/Tracker';
import Resumes from './pages/Resumes/Resumes';
import Chat from './pages/Chat/Chat';
import Planner from './pages/Planner/Planner';
import Account from './pages/Account/Account';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/"         element={<Landing />} />
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />
            {/* Protected app routes */}
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/dashboard"    element={<Dashboard />} />
              <Route path="/applications" element={<Applications />} />
              <Route path="/tracker"      element={<Tracker />} />
              <Route path="/resumes"      element={<Resumes />} />
              <Route path="/chat"         element={<Chat />} />
              <Route path="/planner"      element={<Planner />} />
              <Route path="/account"      element={<Account />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
