import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Droplet, Shield, Truck, Compass, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
  const { user } = useAuth();

  const getStartedLink = () => {
    if (!user) return '/register';
    if (user.role === 'admin') return '/admin-dashboard';
    if (user.role === 'driver') return '/driver-dashboard';
    return '/customer-dashboard';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-76px)] overflow-hidden bg-[#030712] px-6 py-12 md:py-20 aurora-bg">
      {/* Visual decorative auroras */}
      <div className="absolute top-10 left-1/4 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="absolute bottom-10 right-1/4 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        {/* Hero Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center text-center"
        >
          <motion.div
            variants={itemVariants}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/5 px-4 py-1.5 text-sm font-medium text-indigo-300 backdrop-blur-md"
          >
            <Droplet className="h-4 w-4 animate-bounce text-indigo-400" />
            Seamless Water Logistics Platform
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="max-w-4xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
          >
            On-Demand Water Supply,{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Tracked in Real Time
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mt-6 max-w-2xl text-lg text-gray-400 md:text-xl"
          >
            Book premium-grade water tankers for commercial, residential, or industrial operations. Watch your delivery arrive step-by-step with GPS maps.
          </motion.p>

          <motion.div variants={itemVariants} className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              to={getStartedLink()}
              className="flex items-center gap-2 rounded-xl px-6 py-3.5 text-base font-semibold shadow-lg glass-btn-primary"
            >
              Get Started Now
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#features"
              className="rounded-xl px-6 py-3.5 text-base font-semibold glass-btn-secondary"
            >
              Explore Features
            </a>
          </motion.div>
        </motion.div>

        {/* Feature Cards Grid */}
        <div id="features" className="mt-28 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Card 1 */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl p-6 glass-card"
          >
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Truck className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Automated Dispatch</h3>
            <p className="text-gray-400">
              System algorithm dynamically maps pending customer requests to active tankers and available drivers.
            </p>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-2xl p-6 glass-card"
          >
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Compass className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Live GPS Tracking</h3>
            <p className="text-gray-400">
              Observe driver telemetry in real time. Accurate status updates broadcast via low-latency Socket.io pings.
            </p>
          </motion.div>

          {/* Card 3 */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-2xl p-6 glass-card"
          >
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Quality Enforced</h3>
            <p className="text-gray-400">
              Licensed driver profiles and verified tankers ensuring delivery speed and safety compliance.
            </p>
          </motion.div>
        </div>

        {/* Pricing Segment */}
        <div className="mt-32 rounded-3xl border border-white/5 bg-gray-900/25 p-8 md:p-12 glass-panel text-center">
          <h2 className="text-3xl font-bold text-white">Simple, Volume-Based Pricing</h2>
          <p className="text-gray-400 mt-2">No subscription required. Pay only for the volume you require.</p>
          
          <div className="mt-10 grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            {/* Standard 5KL */}
            <div className="rounded-2xl border border-white/5 bg-gray-950/40 p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Residential Tanker</h3>
                <span className="text-4xl font-extrabold text-indigo-400 mt-4 block">$150 <span className="text-sm font-medium text-gray-500">/ trip</span></span>
                <p className="text-sm text-gray-500 mt-1">Ideal for standard homes & pools</p>
                <div className="h-[1px] bg-white/5 my-6" />
                <ul className="text-left space-y-3 mx-auto max-w-xs text-sm text-gray-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-indigo-400" /> 5,000 Liter Capacity</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-indigo-400" /> Live driver tracking</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-indigo-400" /> Dispatch notification</li>
                </ul>
              </div>
              <Link to={getStartedLink()} className="mt-8 rounded-xl py-2.5 w-full glass-btn-secondary text-sm font-semibold block text-center">Book 5K Liters</Link>
            </div>

            {/* Industrial 10KL */}
            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/10 p-6 flex flex-col justify-between relative">
              <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500 px-3 py-0.5 text-xs font-semibold text-white uppercase tracking-wider">Popular</div>
              <div>
                <h3 className="text-lg font-bold text-white">Commercial Tanker</h3>
                <span className="text-4xl font-extrabold text-indigo-400 mt-4 block">$280 <span className="text-sm font-medium text-gray-500">/ trip</span></span>
                <p className="text-sm text-gray-500 mt-1">Best for warehouses & operations</p>
                <div className="h-[1px] bg-white/5 my-6" />
                <ul className="text-left space-y-3 mx-auto max-w-xs text-sm text-gray-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-indigo-400" /> 10,000 Liter Capacity</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-indigo-400" /> Dedicated industrial driver</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-indigo-400" /> Priority fast-track routing</li>
                </ul>
              </div>
              <Link to={getStartedLink()} className="mt-8 rounded-xl py-2.5 w-full glass-btn-primary text-sm font-semibold block text-center">Book 10K Liters</Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Landing;
