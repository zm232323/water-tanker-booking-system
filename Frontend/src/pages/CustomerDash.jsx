import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import API from '../services/api';
import MapTracker from '../components/MapTracker';
import { 
  Droplet, Truck, Navigation, Calendar, DollarSign, 
  MapPin, Plus, CheckCircle, Clock, AlertCircle, X, Phone 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CustomerDash = () => {
  const { user } = useAuth();
  const { socket, joinBookingRoom, leaveBookingRoom } = useSocket();

  const [bookings, setBookings] = useState([]);
  const [activeTrackingBooking, setActiveTrackingBooking] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  
  // New booking form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [capacity, setCapacity] = useState(5000); // default 5KL
  const [date, setDate] = useState('');
  const [price, setPrice] = useState(150); // default $150
  
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // Fetch Bookings
  const fetchBookings = async () => {
    try {
      const res = await API.get('/bookings');
      if (res.data.success) {
        setBookings(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error.message);
    }
  };

  useEffect(() => {
    fetchBookings();
    
    // Set up polling for booking state updates
    const interval = setInterval(fetchBookings, 8000);
    return () => clearInterval(interval);
  }, []);

  // Monitor socket connections for active tracking
  useEffect(() => {
    if (!socket || !activeTrackingBooking) return;

    const bookingId = activeTrackingBooking._id;
    joinBookingRoom(bookingId);
    console.log(`Subscribed to real-time events for booking: ${bookingId}`);

    // Listen for live driver location broadcasts
    socket.on('location_updated', (data) => {
      if (data.bookingId === bookingId) {
        console.log('Live tracking GPS received:', data.coordinates);
        setDriverLocation(data.coordinates);
      }
    });

    // Listen for status changes
    socket.on('booking_updated', (updatedBooking) => {
      if (updatedBooking._id === bookingId) {
        console.log('Booking status updated via socket:', updatedBooking.status);
        setActiveTrackingBooking(updatedBooking);
        
        // Refresh full list too
        fetchBookings();
        
        // Clear driver marker if delivered or cancelled
        if (['delivered', 'cancelled'].includes(updatedBooking.status)) {
          setDriverLocation(null);
        }
      }
    });

    return () => {
      leaveBookingRoom(bookingId);
      socket.off('location_updated');
      socket.off('booking_updated');
    };
  }, [socket, activeTrackingBooking]);

  // Handle capacity-price calculations
  useEffect(() => {
    if (capacity === 5000) setPrice(150);
    else if (capacity === 10000) setPrice(280);
    else setPrice(Math.round(capacity * 0.03)); // Custom math formula
  }, [capacity]);

  const handleOpenTracking = (booking) => {
    setActiveTrackingBooking(booking);
    setDriverLocation(null); // Reset driver location marker initially
  };

  const handleCloseTracking = () => {
    if (activeTrackingBooking) {
      leaveBookingRoom(activeTrackingBooking._id);
    }
    setActiveTrackingBooking(null);
    setDriverLocation(null);
  };

  // Submit Booking Flow
  const handleCreateBooking = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess(false);

    if (!street || !city || !date) {
      return setFormError('Please enter delivery address and schedule date');
    }

    // Mock Coordinates generation centered in NY
    const randomOffsetLat = (Math.random() - 0.5) * 0.04;
    const randomOffsetLng = (Math.random() - 0.5) * 0.04;
    const lat = 40.7128 + randomOffsetLat;
    const lng = -74.0060 + randomOffsetLng;

    setLoading(true);
    try {
      const res = await API.post('/bookings', {
        deliveryAddress: {
          street,
          city,
          coordinates: { lat, lng }
        },
        capacityRequired: Number(capacity),
        deliveryDate: new Date(date).toISOString(),
        price
      });

      if (res.data.success) {
        setFormSuccess(true);
        setStreet('');
        setCity('');
        setDate('');
        fetchBookings();
        
        // Auto-close modal after delay
        setTimeout(() => {
          setIsModalOpen(false);
          setFormSuccess(false);
        }, 1500);
      }
    } catch (error) {
      setFormError(error.response?.data?.message || 'Error submitting booking request');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-300 border-yellow-500/25';
      case 'assigned': return 'bg-purple-500/10 text-purple-300 border-purple-500/25';
      case 'dispatched': return 'bg-blue-500/10 text-blue-300 border-blue-500/25 animate-pulse';
      case 'delivered': return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25';
      case 'cancelled': return 'bg-rose-500/10 text-rose-300 border-rose-500/25';
      default: return 'bg-gray-500/10 text-gray-300 border-white/5';
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Client Portal</h1>
          <p className="text-gray-400 mt-1">Hello, {user.name}. Book water tankers and monitor active dispatches.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold glass-btn-primary self-start md:self-auto"
        >
          <Plus className="h-5 w-5" />
          Request Tanker
        </button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-12 items-start">
        {/* Bookings List Panel */}
        <div className={`lg:col-span-6 ${activeTrackingBooking ? 'lg:col-span-5' : 'lg:col-span-12'} transition-all`}>
          <div className="rounded-2xl border border-white/5 bg-gray-900/10 p-6 glass-panel">
            <h2 className="text-lg font-bold text-white mb-4">Request Log</h2>
            
            {bookings.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Droplet className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <p>No tanker requests found.</p>
                <button onClick={() => setIsModalOpen(true)} className="mt-4 text-indigo-400 text-sm font-semibold hover:underline">Book your first tanker</button>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div 
                    key={booking._id} 
                    onClick={() => handleOpenTracking(booking)}
                    className={`rounded-xl p-4 border text-left cursor-pointer transition-all ${
                      activeTrackingBooking?._id === booking._id 
                        ? 'border-indigo-500 bg-indigo-500/5' 
                        : 'border-white/5 bg-gray-950/20 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-400">Order ID: #{booking._id.slice(-6).toUpperCase()}</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border ${getStatusBadgeClass(booking.status)}`}>
                        {booking.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-1.5 text-gray-300">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="truncate">{booking.deliveryAddress.street}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-300 justify-end">
                        <Droplet className="h-4 w-4 text-indigo-400" />
                        <span>{booking.capacityRequired.toLocaleString()} L</span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3 text-xs text-gray-400">
                      <span>Scheduled: {new Date(booking.deliveryDate).toLocaleDateString()}</span>
                      <span className="font-semibold text-white">${booking.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Live Tracking Map Panel */}
        <AnimatePresence>
          {activeTrackingBooking && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="lg:col-span-7 rounded-2xl border border-white/5 bg-gray-900/10 p-6 glass-panel relative"
            >
              <button 
                onClick={handleCloseTracking}
                className="absolute top-4 right-4 text-gray-400 hover:text-white rounded-lg p-1 hover:bg-white/5"
              >
                <X className="h-5 w-5" />
              </button>

              <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Navigation className="h-5 w-5 text-indigo-400" />
                Live Dispatch Map
              </h2>
              <p className="text-xs text-gray-400 mb-4">
                Booking Reference: #{activeTrackingBooking._id.toUpperCase()}
              </p>

              {/* Status Banner */}
              <div className="mb-4 rounded-xl border border-white/5 bg-gray-950/40 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">Status</span>
                    <span className="text-sm font-bold text-indigo-400 uppercase">{activeTrackingBooking.status}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">Payment</span>
                    <span className="text-sm font-bold text-emerald-400 uppercase">{activeTrackingBooking.paymentStatus}</span>
                  </div>
                </div>

                {/* Driver information */}
                {activeTrackingBooking.driver ? (
                  <div className="mt-3 border-t border-white/5 pt-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="text-gray-400 font-medium">Assigned Driver</p>
                      <p className="font-semibold text-white mt-0.5">{activeTrackingBooking.driver.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 font-medium">Contact Number</p>
                      <a href={`tel:${activeTrackingBooking.driver.phone}`} className="font-semibold text-indigo-400 flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3" />
                        {activeTrackingBooking.driver.phone}
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 mt-2 italic">Awaiting driver and tanker assignment from dispatch control.</p>
                )}
              </div>

              {/* Leaflet Map Integration */}
              <MapTracker 
                customerLocation={activeTrackingBooking.deliveryAddress.coordinates}
                driverLocation={driverLocation} 
                height="320px"
              />

              {activeTrackingBooking.status === 'dispatched' && !driverLocation && (
                <div className="mt-3 flex items-center gap-2 text-xs text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 p-2.5 rounded-lg">
                  <Clock className="h-4 w-4 animate-spin text-indigo-400" />
                  <span>Tanker dispatched. Waiting for driver's GPS coordinates lock...</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Request Modal Wizard */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl p-6 glass-panel border border-white/10 shadow-2xl relative"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white rounded-lg p-1 hover:bg-white/5"
              >
                <X className="h-5 w-5" />
              </button>

              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Droplet className="h-5 w-5 text-indigo-400 fill-indigo-400/20" />
                Book Tanker Delivery
              </h2>
              <p className="text-xs text-gray-400 mb-5">Fill in your delivery address and tanker details.</p>

              {formError && (
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-300">
                  <AlertCircle className="h-4 w-4 text-rose-400" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-300">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <span>Tanker request registered successfully!</span>
                </div>
              )}

              <form onSubmit={handleCreateBooking} className="space-y-4">
                {/* Street Address */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">Street Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="e.g. 100 Broadway St"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm glass-input"
                      required
                    />
                  </div>
                </div>

                {/* City */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">City</label>
                  <input
                    type="text"
                    placeholder="e.g. New York"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm glass-input"
                    required
                  />
                </div>

                {/* Capacity Select */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">Water Volume</label>
                  <select
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full rounded-xl px-3 py-2.5 text-sm glass-input"
                  >
                    <option value={5000}>5,000 Liters (Residential - $150)</option>
                    <option value={10000}>10,000 Liters (Commercial - $280)</option>
                  </select>
                </div>

                {/* Scheduled Date */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">Schedule Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="datetime-local"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm glass-input"
                      required
                    />
                  </div>
                </div>

                {/* Summary Box */}
                <div className="rounded-xl bg-gray-950/40 p-4 border border-white/5 flex items-center justify-between text-sm">
                  <div>
                    <span className="text-xs text-gray-400 uppercase font-semibold">Total Price</span>
                    <p className="text-lg font-bold text-white mt-0.5">${price}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-400 uppercase font-semibold block">Billing Method</span>
                    <span className="text-xs font-medium text-indigo-400">Cash on Delivery</span>
                  </div>
                </div>

                {/* Submit Booking */}
                <button
                  type="submit"
                  disabled={loading || formSuccess}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold glass-btn-primary disabled:opacity-50 mt-4"
                >
                  {loading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      Confirm Booking Request
                      <CheckCircle className="h-4 w-4" />
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

export default CustomerDash;
