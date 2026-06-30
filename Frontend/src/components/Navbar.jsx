import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Droplet, LogOut, User, Menu, X, LayoutDashboard, Truck, ClipboardList } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    if (user.role === 'admin') return '/admin-dashboard';
    if (user.role === 'driver') return '/driver-dashboard';
    return '/customer-dashboard';
  };

  return (
    <nav className="sticky top-0 z-50 w-full px-6 py-4 glass-panel border-b border-white/5">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-wider text-white">
          <Droplet className="h-6 w-6 text-indigo-500 fill-indigo-500/30 animate-pulse" />
          <span className="bg-gradient-to-r from-white via-gray-200 to-indigo-400 bg-clip-text text-transparent">
            Qazi & Co
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          {user ? (
            <>
              <Link
                to={getDashboardLink()}
                className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                <LayoutDashboard className="h-4 w-4 text-indigo-400" />
                Dashboard
              </Link>
              
              {user.role === 'customer' && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                  Customer Account
                </span>
              )}
              {user.role === 'driver' && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                  Fleet Driver
                </span>
              )}
              {user.role === 'admin' && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                  Administrator
                </span>
              )}

              <div className="h-4 w-[1px] bg-white/10" />

              {/* User Profiler / Logout */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 text-sm font-semibold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-200">{user.name}</span>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all border border-rose-500/0 hover:border-rose-500/10"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="rounded-lg px-4 py-2 text-sm font-medium glass-btn-primary"
              >
                Register Account
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-white/5 hover:text-white md:hidden"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="mt-4 flex flex-col gap-4 rounded-xl border border-white/5 bg-gray-950/90 p-4 md:hidden">
          {user ? (
            <>
              <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500 text-white font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-white">{user.name}</div>
                  <div className="text-xs text-gray-400">{user.email}</div>
                </div>
              </div>

              <Link
                to={getDashboardLink()}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>

              <button
                onClick={() => {
                  setIsOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-rose-400 hover:bg-rose-500/10"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/5"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium glass-btn-primary"
              >
                Register Account
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
