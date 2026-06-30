import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import API from '../services/api';
import { 
  LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Shield, Truck, Droplet, User, Plus, Trash2, 
  CheckCircle, Clock, AlertCircle, RefreshCw, ClipboardList 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminDash = () => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [bookings, setBookings] = useState([]);
  const [tankers, setTankers] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);

  // Assignment Modal State
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [assignDriver, setAssignDriver] = useState('');
  const [assignTanker, setAssignTanker] = useState('');

  // Add Tanker Modal State
  const [isTankerModalOpen, setIsTankerModalOpen] = useState(false);
  const [tankerNumber, setTankerNumber] = useState('');
  const [capacity, setCapacity] = useState(5000);
  const [tankerStatus, setTankerStatus] = useState('active');

  const [loading, setLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Bookings
      const bookingsRes = await API.get('/bookings');
      if (bookingsRes.data.success) {
        setBookings(bookingsRes.data.data);
      }

      // 2. Fetch Tankers
      const tankersRes = await API.get('/tankers');
      if (tankersRes.data.success) {
        setTankers(tankersRes.data.data);
      }

      // 3. Fetch Available Drivers
      const driversRes = await API.get('/drivers/available');
      if (driversRes.data.success) {
        setAvailableDrivers(driversRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching admin dashboard data:', error.message);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Set up polling for admin dashboard updates
    const interval = setInterval(fetchDashboardData, 8000);
    return () => clearInterval(interval);
  }, []);

  // Socket notification hooks
  useEffect(() => {
    if (!socket) return;

    socket.on('new_booking_created', (booking) => {
      console.log('Real-time notification: New booking created!');
      fetchDashboardData();
    });

    socket.on('booking_cancelled_admin', (booking) => {
      console.log('Real-time notification: Booking cancelled.');
      fetchDashboardData();
    });

    return () => {
      socket.off('new_booking_created');
      socket.off('booking_cancelled_admin');
    };
  }, [socket]);

  // Handle Booking Assignment
  const handleAssignBooking = async (e) => {
    e.preventDefault();
    if (!assignDriver || !assignTanker || !selectedBooking) {
      return alert('Please select a driver and a tanker');
    }

    setLoading(true);
    try {
      const res = await API.put(`/bookings/${selectedBooking._id}/assign`, {
        driverId: assignDriver,
        tankerId: assignTanker
      });

      if (res.data.success) {
        setSelectedBooking(null);
        setAssignDriver('');
        setAssignTanker('');
        fetchDashboardData();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to assign booking');
    } finally {
      setLoading(false);
    }
  };

  // Add Tanker
  const handleCreateTanker = async (e) => {
    e.preventDefault();
    if (!tankerNumber || !capacity) return alert('Please enter plate number and capacity');

    setLoading(true);
    try {
      const res = await API.post('/tankers', {
        tankerNumber,
        capacity: Number(capacity),
        status: tankerStatus
      });

      if (res.data.success) {
        setTankerNumber('');
        setCapacity(5000);
        setIsTankerModalOpen(false);
        fetchDashboardData();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create tanker');
    } finally {
      setLoading(false);
    }
  };

  // Delete Tanker
  const handleDeleteTanker = async (id) => {
    if (!window.confirm('Are you sure you want to delete this tanker?')) return;
    try {
      const res = await API.delete(`/tankers/${id}`);
      if (res.data.success) {
        fetchDashboardData();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete tanker');
    }
  };

  // Analytics helper calculations
  const totalRevenue = bookings
    .filter(b => b.status === 'delivered' || b.paymentStatus === 'paid')
    .reduce((sum, b) => sum + b.price, 0);

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const activeBookings = bookings.filter(b => ['assigned', 'dispatched'].includes(b.status));

  // Graph Data generation: 1. Daily Volume
  const getGraphData = () => {
    const dates = {};
    bookings.forEach(b => {
      const day = new Date(b.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      dates[day] = (dates[day] || 0) + 1;
    });

    return Object.keys(dates).map(date => ({
      name: date,
      orders: dates[date]
    })).slice(-7); // last 7 days
  };

  // Graph Data generation: 2. Volume Demand Chart (5KL vs 10KL)
  const getPieData = () => {
    let count5k = 0;
    let count10k = 0;
    bookings.forEach(b => {
      if (b.capacityRequired === 5000) count5k++;
      else count10k++;
    });

    return [
      { name: '5,000L Capacity', value: count5k, color: '#6366f1' },
      { name: '10,000L Capacity', value: count10k, color: '#06b6d4' }
    ];
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Dispatch Control Center</h1>
          <p className="text-gray-400 mt-1">Global fleet status, booking allocation, and metrics logging.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsTankerModalOpen(true)}
            className="flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold glass-btn-primary"
          >
            <Plus className="h-4.5 w-4.5" />
            Add Tanker
          </button>
          <button
            onClick={fetchDashboardData}
            className="flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold glass-btn-secondary"
          >
            <RefreshCw className="h-4.5 w-4.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Metric 1 */}
        <div className="rounded-2xl border border-white/5 bg-gray-900/10 p-5 glass-panel">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Total Bookings</span>
          <span className="text-2xl font-bold text-white mt-1.5 block">{bookings.length}</span>
          <span className="text-xs text-gray-500 mt-1 block">{pendingBookings.length} Pending allocation</span>
        </div>
        {/* Metric 2 */}
        <div className="rounded-2xl border border-white/5 bg-gray-900/10 p-5 glass-panel">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Total Revenue</span>
          <span className="text-2xl font-bold text-emerald-400 mt-1.5 block">${totalRevenue}</span>
          <span className="text-xs text-gray-500 mt-1 block">From delivered deliveries</span>
        </div>
        {/* Metric 3 */}
        <div className="rounded-2xl border border-white/5 bg-gray-900/10 p-5 glass-panel">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Active Fleet</span>
          <span className="text-2xl font-bold text-white mt-1.5 block">{tankers.length}</span>
          <span className="text-xs text-gray-500 mt-1 block">
            {tankers.filter(t => t.status === 'active').length} active water tankers
          </span>
        </div>
        {/* Metric 4 */}
        <div className="rounded-2xl border border-white/5 bg-gray-900/10 p-5 glass-panel">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Available Drivers</span>
          <span className="text-2xl font-bold text-white mt-1.5 block">{availableDrivers.length}</span>
          <span className="text-xs text-gray-500 mt-1 block">Active on duty</span>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid gap-6 lg:grid-cols-12 mb-8">
        {/* Daily orders Line */}
        <div className="lg:col-span-8 rounded-2xl border border-white/5 bg-gray-900/10 p-6 glass-panel">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Weekly Delivery Request Volume</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getGraphData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="orders" stroke="#6366f1" strokeWidth={2.5} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Capacity pie */}
        <div className="lg:col-span-4 rounded-2xl border border-white/5 bg-gray-900/10 p-6 glass-panel flex flex-col justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Volume Demand Split</h3>
          <div className="h-56 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getPieData()}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {getPieData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-around text-xs text-gray-400 mt-2">
            <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-indigo-500 block" /> 5KL</div>
            <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-cyan-500 block" /> 10KL</div>
          </div>
        </div>
      </div>

      {/* Bookings Queue and Fleet Grid */}
      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Bookings Allocation Queue */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-white/5 bg-gray-900/10 p-6 glass-panel">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <ClipboardList className="h-4.5 w-4.5 text-indigo-400" />
              Allocation Pipeline
            </h3>

            {bookings.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">No active order records.</p>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {bookings.map(b => (
                  <div key={b._id} className="rounded-xl border border-white/5 bg-gray-950/30 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">ID: #{b._id.slice(-6).toUpperCase()}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full border border-indigo-500/10 bg-indigo-500/5 text-indigo-300">
                          {b.capacityRequired.toLocaleString()}L
                        </span>
                        <span className="text-[10px] uppercase font-bold text-yellow-400">{b.status}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1.5">Destination: {b.deliveryAddress.street}, {b.deliveryAddress.city}</p>
                      <p className="text-[10px] text-gray-500 mt-1">Client: {b.customer.name}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      {b.status === 'pending' ? (
                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold glass-btn-primary"
                        >
                          Dispatch Allocation
                        </button>
                      ) : (
                        <div className="text-right text-[10px] text-gray-500">
                          <p>Driver: {b.driver?.name || 'Unassigned'}</p>
                          <p className="mt-0.5">Tanker: {b.tanker?.tankerNumber || 'None'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Fleet Inventory */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-white/5 bg-gray-900/10 p-6 glass-panel">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Truck className="h-4.5 w-4.5 text-indigo-400" />
              Fleet Inventory
            </h3>

            {tankers.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">No tankers registered in fleet.</p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {tankers.map(t => (
                  <div key={t._id} className="rounded-xl border border-white/5 bg-gray-950/30 p-3 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <p className="font-bold text-white">{t.tankerNumber}</p>
                      <p className="text-gray-400 mt-1">Volume Capacity: {t.capacity.toLocaleString()}L</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        Driver: {t.assignedDriver ? t.assignedDriver.name : 'Unassigned'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] border ${
                        t.status === 'active' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                      }`}>
                        {t.status}
                      </span>
                      <button
                        onClick={() => handleDeleteTanker(t._id)}
                        className="rounded-lg p-1.5 text-rose-400 hover:bg-rose-500/10"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assignment Modal overlay */}
      <AnimatePresence>
        {selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl p-6 glass-panel border border-white/10 shadow-2xl relative"
            >
              <button
                onClick={() => setSelectedBooking(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white rounded-lg p-1 hover:bg-white/5"
              >
                <Plus className="h-5 w-5 rotate-45" />
              </button>

              <h3 className="text-lg font-bold text-white mb-2">Assign Tanker & Driver</h3>
              <p className="text-xs text-gray-400 mb-4">
                Booking ID: #{selectedBooking._id.toUpperCase()} ({selectedBooking.capacityRequired}L)
              </p>

              <form onSubmit={handleAssignBooking} className="space-y-4">
                {/* Driver select */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">Assign Driver</label>
                  <select
                    value={assignDriver}
                    onChange={(e) => setAssignDriver(e.target.value)}
                    className="w-full rounded-xl px-3 py-2.5 text-sm glass-input"
                    required
                  >
                    <option value="">Select an active driver...</option>
                    {availableDrivers.map(d => (
                      <option key={d._id} value={d._id}>{d.name} ({d.phone})</option>
                    ))}
                  </select>
                </div>

                {/* Tanker select */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">Assign Tanker</label>
                  <select
                    value={assignTanker}
                    onChange={(e) => setAssignTanker(e.target.value)}
                    className="w-full rounded-xl px-3 py-2.5 text-sm glass-input"
                    required
                  >
                    <option value="">Select active tanker...</option>
                    {tankers
                      .filter(t => t.status === 'active')
                      .map(t => (
                        <option key={t._id} value={t._id}>{t.tankerNumber} ({t.capacity}L)</option>
                      ))}
                  </select>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold glass-btn-primary disabled:opacity-50 mt-4"
                >
                  {loading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      Confirm Dispatch Assignment
                      <CheckCircle className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Tanker Modal overlay */}
      <AnimatePresence>
        {isTankerModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl p-6 glass-panel border border-white/10 shadow-2xl relative"
            >
              <button
                onClick={() => setIsTankerModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white rounded-lg p-1 hover:bg-white/5"
              >
                <Plus className="h-5 w-5 rotate-45" />
              </button>

              <h3 className="text-lg font-bold text-white mb-4">Add Fleet Tanker</h3>

              <form onSubmit={handleCreateTanker} className="space-y-4">
                {/* Plate Number */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">Tanker Plate / Number</label>
                  <input
                    type="text"
                    placeholder="e.g. TX-992-WT"
                    value={tankerNumber}
                    onChange={(e) => setTankerNumber(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm glass-input uppercase"
                    required
                  />
                </div>

                {/* Capacity */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">Tanker Capacity (Liters)</label>
                  <input
                    type="number"
                    placeholder="e.g. 5000"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm glass-input"
                    min={500}
                    required
                  />
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">Initial Status</label>
                  <select
                    value={tankerStatus}
                    onChange={(e) => setTankerStatus(e.target.value)}
                    className="w-full rounded-xl px-3 py-2.5 text-sm glass-input"
                  >
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold glass-btn-primary disabled:opacity-50 mt-4"
                >
                  {loading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      Register Tanker
                      <Truck className="h-4.5 w-4.5" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDash;
