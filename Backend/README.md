# Water Tanker Booking Platform Backend

This is the complete, modular backend API and real-time tracking engine for a Water Tanker Booking Platform built using Node.js, Express, MongoDB (Atlas), JWT authentication, and Socket.io.

## Features

- **Role-Based Access Control (RBAC)**: Support for `customer`, `driver`, and `admin` roles.
- **JWT Authentication**: Secure user registration, login, and route guards.
- **Tanker Fleet Management**: CRUD operations for administrative management of water tankers, including tanker capacity and driver assignments.
- **Booking Flow**: Complete workflow lifecycle tracking: `pending` -> `assigned` -> `dispatched` -> `delivered`.
- **Real-Time Integration (Socket.io)**:
  - Driver location tracking (broadcasting coordinates to monitoring customers/admins).
  - Instant dispatch alerts when bookings are assigned/updated.
  - Role-specific and booking-specific socket channels.
- **Robust Error Handling**: Centralized Express middleware transforming database validation, duplicate keys, and authentication errors into standardized JSON payloads.

---

## Folder Structure

```text
water-tanker-backend/
├── src/
│   ├── config/
│   │   ├── db.js                 # MongoDB connection logic
│   │   └── socket.js             # Place for socket configs (handled in server.js)
│   ├── controllers/
│   │   ├── authController.js     # Signup, Login, Profile
│   │   ├── bookingController.js  # Booking creation, assignments, transitions
│   │   ├── tankerController.js   # Fleet inventory management (Admin)
│   │   └── driverController.js   # Active drivers list query
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT guard + Role verification (RBAC)
│   │   └── errorMiddleware.js    # Global error formatter
│   ├── models/
│   │   ├── User.js               # Customers, Drivers, and Admins model
│   │   ├── Tanker.js             # Tanker capacity, status, driver link
│   │   └── Booking.js            # Customer, Driver, location, status, price
│   ├── routes/
│   │   ├── authRoutes.js         # Auth paths (/api/auth)
│   │   ├── bookingRoutes.js      # Booking paths (/api/bookings)
│   │   ├── tankerRoutes.js       # Fleet paths (/api/tankers)
│   │   └── driverRoutes.js       # Driver paths (/api/drivers)
│   ├── sockets/
│   │   └── socketHandler.js      # Socket.io auth handshake, rooms & real-time events
│   ├── app.js                    # Express middlewares mount point
│   └── server.js                 # Server listener & socket.io mount point
├── .env.example                  # Environment template file
├── .env                          # App configurations (ignored in git)
└── package.json                  # Dependencies & start scripts
```

---

## Prerequisites

- **Node.js** (v18.0.0 or higher)
- **MongoDB Atlas Account** (or a local MongoDB running instance)

---

## Getting Started

### 1. Configure Environment Variables
Open the `.env` file generated in the project root and replace the database URI with your actual MongoDB Atlas connection string:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/water-tanker?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_change_me_in_production
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

### 2. Install Dependencies
Run the package installation:
```bash
npm install
```

### 3. Run the Server
- **For Production Mode**:
  ```bash
  npm start
  ```
- **For Development Mode** (auto-restart on save using Nodemon):
  ```bash
  npm run dev
  ```

---

## REST API Reference

All requests must accept and send content-type `application/json`. Under protected routes, specify header: `Authorization: Bearer <jwt-token>`.

### Authentication API (`/api/auth`)
- `POST /register`: Registers a new user. Expects `name`, `email`, `password`, `phone`, and optional `role` ('customer' or 'driver').
- `POST /login`: Logs in a user. Expects `email` and `password`. Returns a signed JWT.
- `GET /me`: Returns details of the logged-in user. (Protected)

### Booking API (`/api/bookings`)
- `POST /`: Creates a booking. Expects `deliveryAddress` (`street`, `city`, `coordinates: { lat, lng }`), `capacityRequired` (in liters), `deliveryDate`, and `price`. (Customer Only)
- `GET /`: Lists bookings (Customers see their requests, Drivers see assignments, Admins see everything). (Protected)
- `GET /:id`: Retrieves details of a specific booking. (Protected)
- `PUT /:id/assign`: Assigns a driver and tanker to a booking. Expects `driverId` and `tankerId`. (Admin Only)
- `PUT /:id/status`: Updates booking status. Expects `status` (`assigned`, `dispatched`, `delivered`). (Admin/Driver Only)
- `PUT /:id/cancel`: Cancels the booking. (Customer/Admin Only)

### Tanker API (`/api/tankers`)
- `POST /`: Registers a new tanker. Expects `tankerNumber`, `capacity`, and optional `assignedDriver`. (Admin Only)
- `GET /`: Lists all tankers. (Admin/Driver Only)
- `PUT /:id`: Updates tanker details. (Admin Only)
- `DELETE /:id`: Removes a tanker from the fleet. (Admin Only)

### Driver API (`/api/drivers`)
- `GET /available`: Lists all active drivers available for booking assignments. (Admin Only)

---

## Real-Time Tracking & WebSockets (Socket.io)

The backend provides a real-time event mechanism using Socket.io. Clients must authenticate by sending a token during handshake connection:

```javascript
// Example Client Socket.io connection:
const socket = io('http://localhost:5000', {
  auth: {
    token: 'YOUR_JWT_BEARER_TOKEN'
  }
});
```

### Server Rooms
1. **Personal Room** (`user_{userId}`): Used to target specific users with direct system notifications (e.g., driver booking alerts).
2. **Role Rooms** (`admin`, `drivers`): Broad role notifications.
3. **Booking Rooms** (`booking_{bookingId}`): Room joined by customer, admin, and driver to listen to real-time status and driver geo-coordinates.

### Client-to-Server Events
- `join_booking` (Payload: `{ bookingId }`): Join room to monitor location/status.
- `leave_booking` (Payload: `{ bookingId }`): Leave tracking room.
- `update_location` (Payload: `{ bookingId, coordinates: { lat, lng } }`): Driver broadcasts live location coordinates.

### Server-to-Client Events (Broadcast)
- `location_updated` (Payload: `{ bookingId, driverId, coordinates, updatedAt }`): Received by clients in a booking room.
- `booking_updated` (Payload: Booking object): Emitted to booking room on status and assignment changes.
- `new_booking_assignment` (Payload: Booking object): Emitted directly to `user_{driverId}` when an admin assigns them a tanker.
- `new_booking_created` (Payload: Booking object): Emitted to `admin` room.
