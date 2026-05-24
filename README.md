# DevPulse - Internal Tech Issue & Feature Tracker

**Live URL:** <https://devpulse-api.vercel.app> (Replace with your actual deployment URL)

A collaborative platform for software teams to report bugs, suggest features, and coordinate resolutions.

## 🌟 Features
- **User Authentication:** Registration and Login using JWT.
- **Role-Based Access Control (RBAC):** Roles include `contributor` and `maintainer`.
- **Issue Tracking:** Create, read, update, and delete issues (bugs or feature requests).
- **Advanced Filtering:** Dynamically filter issues by `type`, `status`, and `sort` by date.
- **Raw SQL Implementation:** Built completely without ORMs using raw PostgreSQL queries.

## 🛠 Tech Stack
- **Runtime:** Node.js
- **Language:** TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL (using `pg` driver)
- **Security:** `bcryptjs` for password hashing, `jsonwebtoken` for auth.

## 🗄️ Database Schema Summary
### 1. `users` Table
- `id` (SERIAL PRIMARY KEY)
- `name` (VARCHAR NOT NULL)
- `email` (VARCHAR UNIQUE NOT NULL)
- `password` (TEXT NOT NULL)
- `role` (VARCHAR CHECK 'contributor' or 'maintainer')
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### 2. `issues` Table
- `id` (SERIAL PRIMARY KEY)
- `title` (VARCHAR NOT NULL)
- `description` (TEXT NOT NULL)
- `type` (VARCHAR CHECK 'bug' or 'feature_request')
- `status` (VARCHAR CHECK 'open', 'in_progress', 'resolved')
- `reporter_id` (INT NOT NULL)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## 🚀 Setup Steps
1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Create a `.env` file in the root directory and add:
   ```env
   PORT=5000
   CONNECTION_STRING=your_postgresql_connection_string
   JWT_SECRET=your_jwt_secret_key
   ```
4. Run `npm run build` to compile TypeScript.
5. Run `npm start` to start the server, or `npm run dev` for development.

## 🌐 API Endpoints
### Authentication
- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - Authenticate and get JWT

### Issues
- `POST /api/issues` - Create an issue (Auth Required)
- `GET /api/issues` - Get all issues (Public, supports query params: `sort`, `type`, `status`)
- `GET /api/issues/:id` - Get a single issue (Public)
- `PATCH /api/issues/:id` - Update an issue (Auth Required)
- `DELETE /api/issues/:id` - Delete an issue (Auth Required: Maintainer Only)
