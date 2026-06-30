import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Droplet, Mail, Lock, User, Phone, AlertCircle, ArrowRight, Truck } from 'lucide-react';
import { motion } from 'framer-motion';

const Register = () => {
  const { register, user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('customer'); // Default role: customer
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') navigate('/admin-dashboard');
      else if (user.role === 'driver') navigate('/driver-dashboard');
      else navigate('/customer-dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!name || !email || !password || !phone) {
      return setErrorMsg('Please fill in all fields');
    }

    setLoading(true);
    const result = await register({ name, email, password, phone, role });
    setLoading(false);

    if (result.success) {
      if (result.role === 'admin') navigate('/admin-dashboard');
      else if (result.role === 'driver') navigate('/driver-dashboard');
      else navigate('/customer-dashboard');
    } else {
      setErrorMsg(result.message);
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-76px)] items-center justify-center bg-[#030712] px-6 py-12 aurora-bg">
      <div className="absolute top-1/4 left-1/3 h-64 w-64 rounded-full bg-indigo-500/5 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/3 h-64 w-64 rounded-full bg-cyan-500/5 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md rounded-2xl p-8 glass-panel border border-white/5 shadow-2xl relative z-10"
      >
        {/* Header brand logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-3">
            <Droplet className="h-5 w-5 text-indigo-500 fill-indigo-500/20 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white">Create Account</h2>
          <p className="text-sm text-gray-400 mt-1">Get started with on-demand water supply</p>
        </div>

        {errorMsg && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-sm text-rose-300">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User Role Selector */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block mb-1">Select Account Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('customer')}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 border text-sm font-medium transition-all ${
                  role === 'customer'
                    ? 'border-indigo-500 bg-indigo-500/10 text-white'
                    : 'border-white/5 bg-gray-950/20 text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <User className="h-4 w-4" />
                Customer
              </button>
              <button
                type="button"
                onClick={() => setRole('driver')}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 border text-sm font-medium transition-all ${
                  role === 'driver'
                    ? 'border-indigo-500 bg-indigo-500/10 text-white'
                    : 'border-white/5 bg-gray-950/20 text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Truck className="h-4 w-4" />
                Driver
              </button>
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm glass-input"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm glass-input"
                required
              />
            </div>
          </div>

          {/* Phone Number */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="123-456-7890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm glass-input"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm glass-input"
                minLength={6}
                required
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold glass-btn-primary disabled:opacity-50 disabled:pointer-events-none mt-4"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                Create Account
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
            Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
