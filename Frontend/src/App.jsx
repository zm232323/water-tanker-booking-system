import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import CustomerDash from './pages/CustomerDash';
import DriverDash from './pages/DriverDash';
import AdminDash from './pages/AdminDash';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="min-h-screen bg-[#030712] text-gray-100 flex flex-col font-sans select-none antialiased">
            {/* Header */}
            <Navbar />

            {/* Main Content Router */}
            <main className="flex-grow">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected Customer Routes */}
                <Route
                  path="/customer-dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['customer']}>
                      <CustomerDash />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Driver Routes */}
                <Route
                  path="/driver-dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['driver']}>
                      <DriverDash />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Admin Routes */}
                <Route
                  path="/admin-dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDash />
                    </ProtectedRoute>
                  }
                />

                {/* Catch-all Redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
