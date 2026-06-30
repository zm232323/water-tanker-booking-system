import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import API from '../services/api';
import MapTracker from '../components/MapTracker';
import { 
  Truck, Navigation, CheckCircle, Clock, MapPin, 
  Phone, User, AlertCircle, Play, Square, Compass 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DriverDash = () => {
  const { user } = useAuth();
  const { socket, joinBookingRoom, leaveBookingRoom, emitLocationUpdate } = useSocket();

  const [bookings, setBookings] = useState([]);
  const [activeBooking, setActiveBooking] = useState(null);
  
  // GPS Simulator State
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentCoords, setCurrentCoords] = useState(null);
  const simulationInterval = useRef(null);

  const fetchDriverBookings = async () => {
    try {
      const res = await API.get('/bookings');
      if (res.data.success) {
        setBookings(res.data.data);
        
        // Auto-select first active booking (assigned or dispatched) as focal point
        const active = res.data.data.find(b => ['assigned', 'dispatched'].includes(b.status));
        setActiveBooking(active || null);
      }
    } catch (error) {
      console.error('Error loading driver assignments:', error.message);
    }
  };

  useEffect(() => {
    fetchDriverBookings();
    
    // Poll for list updates
    const interval = setInterval(fetchDriverBookings, 8000);
    return () => clearInterval(interval);
  }, []);

  // Listen for socket events to update driver view reactively
  useEffect(() => {
    if (!socket) return;

    socket.on('booking_updated', (updatedBooking) => {
      if (activeBooking && updatedBooking._id === activeBooking._id) {
        console.log('Fulfillment status changed:', updatedBooking.status);
        setActiveBooking(updatedBooking);
        fetchDriverBookings();

        if (['delivered', 'cancelled'].includes(updatedBooking.status)) {
          stopLocationSimulation();
        }
      }
    });

    return () => {
      socket.off('booking_updated');
    };
  }, [socket, activeBooking]);

  // Connect to booking room when active assignment changes
  useEffect(() => {
    if (!socket || !activeBooking) return;

    const bookingId = activeBooking._id;
    joinBookingRoom(bookingId);
    console.log(`Driver entered socket room: booking_${bookingId}`);

    return () => {
      leaveBookingRoom(bookingId);
      stopLocationSimulation();
    };
  }, [socket, activeBooking]);

  // Start route simulator (moves coordinates from a starting point toward the customer)
  const startLocationSimulation = () => {
    if (!activeBooking || isSimulating) return;

    setIsSimulating(true);
    const dest = activeBooking.deliveryAddress.coordinates;
    
    // Start coordinates slightly offset (about 1km away)
    let startLat = dest.lat - 0.015;
    let startLng = dest.lng - 0.015;
    
    setCurrentCoords({ lat: startLat, lng: startLng });
    console.log('GPS simulation started towards:', dest);

    simulationInterval.current = setInterval(() => {
      // Step closer to destination
      const step = 0.0015;
      
      startLat += (dest.lat - startLat) * 0.15;
      startLng += (dest.lng - startLng) * 0.15;

      const newCoords = { lat: startLat, lng: startLng };
      setCurrentCoords(newCoords);

      // Emit live GPS coordinates via Socket.io to listeners (Customer / Admin)
      emitLocationUpdate(activeBooking._id, newCoords);
      console.log(`GPS Ping sent to customer: [Lat: ${startLat.toFixed(5)}, Lng: ${startLng.toFixed(5)}]`);

      // Auto stop simulation if close enough (under ~10 meters)
      const dist = Math.sqrt(Math.pow(dest.lat - startLat, 2) + Math.pow(dest.lng - startLng, 2));
      if (dist < 0.0002) {
        console.log('Destination reached in simulation.');
        stopLocationSimulation();
      }
    }, 3000);
  };

  const stopLocationSimulation = () => {
    if (simulationInterval.current) {
      clearInterval(simulationInterval.current);
      simulationInterval.current = null;
    }
    setIsSimulating(false);
    setCurrentCoords(null);
  };

  // Change Booking Status REST Action
  const handleUpdateStatus = async (status) => {
    if (!activeBooking) return;
    try {
      const res = await API.put(`/bookings/${activeBooking._id}/status`, { status });
      if (res.data.success) {
        fetchDriverBookings();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating dispatch status');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      {/* Header */}
      <div className="border-b border-white/5 pb-6 mb-8">
        <h1 className="text-3xl font-extrabold text-white">Driver Console</h1>
        <p className="text-gray-400 mt-1">Manage active route tasks and broadcast live delivery telemetrics.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Active Route Panel */}
        <div className="lg:col-span-8 space-y-6">
          {activeBooking ? (
            <div className="rounded-2xl border border-white/5 bg-gray-900/10 p-6 glass-panel">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-4">
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest block">Active Assignment</span>
                  <span className="text-xl font-bold text-white mt-1 block">Order ID: #{activeBooking._id.toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-2">
                  {activeBooking.status === 'assigned' && (
                    <button
                      onClick={() => handleUpdateStatus('dispatched')}
                      className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold glass-btn-primary"
                    >
                      <Play className="h-4 w-4" />
                      Start Delivery Run
                    </button>
                  )}
                  {activeBooking.status === 'dispatched' && (
                    <button
                      onClick={() => handleUpdateStatus('delivered')}
                      className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Confirm Delivered
                    </button>
                  )}
                  <span className="text-xs px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-300 font-semibold uppercase">
                    {activeBooking.status}
                  </span>
                </div>
              </div>

              {/* Delivery Details Card */}
              <div className="grid gap-4 md:grid-cols-2 mb-6">
                <div className="rounded-xl bg-gray-950/40 p-4 border border-white/5">
                  <span className="text-xs text-gray-400 font-semibold block mb-1">Customer Profile</span>
                  <p className="text-sm font-bold text-white">{activeBooking.customer.name}</p>
                  <a href={`tel:${activeBooking.customer.phone}`} className="text-xs text-indigo-400 font-medium flex items-center gap-1 mt-1">
                    <Phone className="h-3 w-3" />
                    {activeBooking.customer.phone}
                  </a>
                </div>

                <div className="rounded-xl bg-gray-950/40 p-4 border border-white/5">
                  <span className="text-xs text-gray-400 font-semibold block mb-1">Drop-off Address</span>
                  <p className="text-sm font-bold text-white flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-emerald-400" />
                    {activeBooking.deliveryAddress.street}, {activeBooking.deliveryAddress.city}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Capacity Required: {activeBooking.capacityRequired.toLocaleString()} Liters</p>
                </div>
              </div>

              {/* Map Container */}
              <div className="mb-4 relative">
                <MapTracker 
                  customerLocation={activeBooking.deliveryAddress.coordinates} 
                  driverLocation={currentCoords}
                  height="340px"
                />

                {/* GPS Simulator Panel */}
                {activeBooking.status === 'dispatched' && (
                  <div className="absolute bottom-4 left-4 z-[1000] p-4 rounded-xl glass-panel border border-white/10 max-w-sm">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Compass className="h-4 w-4 text-indigo-400 animate-spin" />
                      GPS Route Simulator
                    </h4>
                    
                    {isSimulating ? (
                      <div className="space-y-3">
                        <p className="text-xs text-emerald-300 bg-emerald-500/10 p-2 rounded border border-emerald-500/10">
                          Broadcasting live coordinates coordinates to customer...
                        </p>
                        <button
                          onClick={stopLocationSimulation}
                          className="flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/25 hover:bg-rose-500/20"
                        >
                          <Square className="h-3 w-3" />
                          Pause Simulator
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-gray-400">
                          Simulate vehicle movement to let customer track tanker progress on their screen.
                        </p>
                        <button
                          onClick={startLocationSimulation}
                          className="flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold glass-btn-primary"
                        >
                          <Play className="h-3 w-3" />
                          Start Route Simulation
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/5 bg-gray-900/10 p-12 glass-panel text-center">
              <Truck className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white">No Active Runs</h3>
              <p className="text-gray-400 mt-1 max-w-md mx-auto">
                You are currently offline or have no active routes. Go to dispatch records below to review completed trips.
              </p>
            </div>
          )}
        </div>

        {/* History / Assignments Log */}
        <div className="lg:col-span-4">
          <div className="rounded-2xl border border-white/5 bg-gray-900/10 p-6 glass-panel">
            <h2 className="text-lg font-bold text-white mb-4">Route Assignment Log</h2>
            
            {bookings.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">No historical runs recorded.</p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {bookings.map(b => (
                  <div
                    key={b._id}
                    onClick={() => {
                      if (!isSimulating) setActiveBooking(b);
                    }}
                    className={`rounded-xl p-3 border text-left text-xs transition-all ${
                      isSimulating 
                        ? 'pointer-events-none opacity-60' 
                        : activeBooking?._id === b._id 
                          ? 'border-indigo-500 bg-indigo-500/5' 
                          : 'border-white/5 bg-gray-950/20 hover:bg-white/5 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-300">ID: #{b._id.slice(-6).toUpperCase()}</span>
                      <span className="font-bold text-indigo-400 uppercase">{b.status}</span>
                    </div>
                    <p className="text-gray-400 mt-2 truncate font-medium">{b.deliveryAddress.street}</p>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5 text-[10px] text-gray-500">
                      <span>Volume: {b.capacityRequired}L</span>
                      <span>Scheduled: {new Date(b.deliveryDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverDash;
