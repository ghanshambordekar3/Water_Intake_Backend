# 🌊 Water Intake Tracker - Backend API

A RESTful API built with **Node.js**, **Express.js**, and **MongoDB** (Mongoose) for logging daily water intake, tracking hydration goals, and managing users with **JWT Authentication** and **Role-Based Access Control (RBAC)**.

---

## 🚀 Key Features

- **JWT Authentication & Security**: Secure user registration and login with bcrypt password hashing and token verification.
- **Role-Based Access Control (RBAC)**: Distinct permissions for `user` and `admin` roles.
- **Water Intake Management**:
  - Log water intake in milliliters (ml) with validation (rejects 0 or negative values).
  - Calculate daily consumption vs. target goal (with fallback default of 2000 ml / 8 glasses).
  - Historical breakdown grouped by date with log deletion protection.
- **Admin Portal Endpoints**:
  - View all registered users and their daily hydration summary.
  - View any user's detailed intake history.
  - Set or update recommended daily water intake goals for users.
  - Delete user accounts (with guard against admin self-deletion).
- **Graceful Fallbacks & Edge Cases**:
  - Custom error handling middleware.
  - In-memory database fallback if a standalone MongoDB instance is not running locally.
  - Auto-seeder for demo admin and user credentials on initial setup.

---

## 🛠️ Tech Stack & Dependencies

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM (Optional: `mongodb-memory-server` fallback for dev)
- **Auth & Hashing**: `jsonwebtoken` (JWT), `bcryptjs`
- **Utilities**: `dotenv`, `cors`

---

## ⚙️ Environment Variables

Create a `.env` file in the root of the `/backend` directory based on `.env.example`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/water_intake_tracker
JWT_SECRET=super_secret_jwt_key_water_tracker_2026_change_in_production
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

---

## 📦 Installation & Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Seed Initial Demo Data (Optional)**:
   ```bash
   npm run seed
   ```
   *Note: The server also auto-seeds default credentials if the database is empty when started.*

4. **Start Development Server**:
   ```bash
   npm run dev
   # or
   npm start
   ```

The API will run on `http://localhost:5000`.

---

## 🔑 Default Credentials (Auto-Seeded)

| Role | Email | Password | Daily Goal |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@watertracker.com` | `admin123` | 2500 ml |
| **User** | `user@watertracker.com` | `user123` | 2000 ml |

---

## 📖 API Endpoints Reference

### 🔐 Auth Routes (`/api/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register a new user (`name`, `email`, `password`, `role` [optional]) |
| `POST` | `/api/auth/login` | Public | Login with `email` and `password`, returns JWT token |
| `GET` | `/api/auth/me` | Authenticated | Get current logged-in user profile |

---

### 👥 User & Admin Routes (`/api/users`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users` | Admin Only | View list of all registered users with today's intake stats |
| `GET` | `/api/users/:id` | Admin / Self | View user profile by ID |
| `PUT` | `/api/users/:id/goal` | Admin / Self | Update user's daily recommended water goal (in ml) |
| `DELETE` | `/api/users/:id` | Admin Only | Delete user account (**Checks**: Admin cannot delete self) |

---

### 💧 Water Intake Routes (`/api/intake`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/intake` | Authenticated | Log water intake (`amount` in ml > 0, `note`, `date`) |
| `GET` | `/api/intake/today` | Authenticated | Get today's total intake vs daily goal, % achieved, remaining ml |
| `GET` | `/api/intake/history` | Authenticated | Get logged-in user's past intake logs grouped by date |
| `GET` | `/api/intake/user/:userId` | Admin Only | View water intake history and summary for a specific user |
| `DELETE` | `/api/intake/:id` | Authenticated | Delete a logged entry (**Checks**: User can only delete own entry; Admin can delete any) |

---

## 🧪 Edge Cases Handled

1. **Invalid Intake Amount ($\le$ 0)**:
   - Returns `400 Bad Request` with error message: `"Validation Error: Water intake amount must be greater than 0 ml."`
2. **Unauthorized Deletion**:
   - User attempting to delete another user's intake log returns `403 Forbidden`.
3. **Admin Self-Deletion Protection**:
   - Admin attempting to delete their own user account returns `400 Bad Request` with message `"Action rejected: Admin cannot delete their own account."`
4. **Role-Based Access Violations**:
   - Standard user calling `/api/users` or `/api/intake/user/:userId` returns `403 Forbidden`.
5. **Missing Daily Goal**:
   - Automatically defaults to `2000 ml` (8 glasses of 250ml) gracefully.

---

## 📄 License
MIT License
