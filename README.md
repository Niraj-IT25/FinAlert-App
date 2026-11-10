
# FinAlert

**Report ATM failures in seconds. Fix them faster.**

A React Native mobile app that connects bank customers and technicians through one live ATM failure board.

---

## Overview

When an ATM swallows a card or stops dispensing cash, the customer standing in front of it usually has no quick way to tell the bank. FinAlert closes that gap.

- **Customers** report a faulty ATM from their phone with no account needed.
- **Bank staff** sign in to see every report live, take ownership of a fix and close it out.
- **Admins** control who on the team can view, resolve or delete failures.

The mobile app (`app/`) talks to a Node.js + Express + MongoDB REST API (`backend/`).

## Features

| Area | What you get |
|------|--------------|
| **Report a failure** | Public form with ATM ID, name, 10-digit phone number and issue type (cash not dispensed, card stuck, screen not working, keypad not responding, network issue, other). Validated before it is sent. |
| **Live dashboard** | Counts for Pending, In Progress and Resolved, status filters, auto-refresh every 10 seconds and pull-to-refresh. |
| **Failure workflow** | **Start work** → **Mark resolved**, with a confirmation step. Resolution notes are saved on the record. |
| **One-tap call** | Tap the reporter's phone number to call them. |
| **Role-based access** | Four roles. Buttons and tabs appear only when the signed-in role is allowed to use them. |
| **User management** | Super admins can list users, add a user with a role, and delete a user. |
| **Secure sessions** | JWT stored in the device's secure storage (Keychain / Keystore). Expired sessions return to the sign-in screen. |
| **Cross-platform** | One codebase for Android, iOS and web. |

## Roles and permissions

| Role | View failures | Start / resolve | Delete failures | Manage users |
|------|:---:|:---:|:---:|:---:|
| Viewer | ✅ | | | |
| Technician | ✅ | ✅ | | |
| Admin | ✅ | ✅ | ✅ | |
| Super admin | ✅ | ✅ | ✅ | ✅ |

Reporting a failure needs no account at all.

## Tech stack

**Mobile app**
- React Native with [Expo](https://expo.dev)
- React Navigation (bottom tabs)
- Axios, `expo-secure-store`, `@expo/vector-icons`

**Backend**
- Node.js, Express
- MongoDB with Mongoose
- JSON Web Tokens, bcryptjs password hashing

## Project structure

```
FinAlert/
├── app/                    React Native app (Expo)
│   ├── App.js              Navigation and role-based tabs
│   └── src/
│       ├── api.js          Axios client, auth header, error messages
│       ├── config.js       Resolves the backend URL
│       ├── dialogs.js      Confirm / alert helpers (web + native)
│       ├── theme.js        Colors, status styles, issue types
│       ├── context/        AuthContext (login, logout, permissions)
│       ├── components/     Button, Field, FailureCard, badges, banners
│       └── screens/        Report, Login, Dashboard, Users, Account
└── backend/                Express + MongoDB REST API
    ├── controllers/
    ├── middleware/
    ├── models/
    └── routes/
```

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org) 18 or newer
- [MongoDB](https://www.mongodb.com/try/download/community) running locally, or a MongoDB Atlas connection string
- The **Expo Go** app on your phone, or an Android / iOS emulator

### 1. Run the backend

```bash
cd backend
cp .env.example .env      # then edit .env (see below)
npm install
npm start                 # API on http://localhost:5000
```

`backend/.env`

| Variable | Description |
|----------|-------------|
| `MONGO_URL` | MongoDB connection string (defaults to `mongodb://localhost:27017/bankSystem`) |
| `PORT` | API port (defaults to `5000`) |
| `JWT_SECRET` | Long random string used to sign tokens |
| `NODE_ENV` | `development` or `production` |

### 2. Run the app

```bash
cd app
npm install
npx expo start
```

Then choose how to open it:

- **Phone:** scan the QR code with Expo Go (phone and computer on the same Wi-Fi).
- **Android emulator:** press `a`.
- **iOS simulator:** press `i` (macOS only).
- **Browser:** press `w`.

### 3. Create the first staff account

The database starts empty, so create a super admin once. Pick your own email and password.

**macOS / Linux**

```bash
curl -X POST http://localhost:5000/admin/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"boss","email":"boss@bank.com","password":"Secret123","confirmPassword":"Secret123","role":"super_admin"}'
```

**Windows (PowerShell)**

```powershell
Invoke-RestMethod -Uri http://localhost:5000/admin/auth/register -Method Post -ContentType "application/json" -Body '{"username":"boss","email":"boss@bank.com","password":"Secret123","confirmPassword":"Secret123","role":"super_admin"}'
```

Open the **Staff** tab in the app and sign in with those details. From then on you can add technicians, admins and viewers from the **Users** tab.

## Configuration

### Pointing the app at your API

In development the app finds your computer automatically, using the same address Expo is served from on port `5000`. To use a different server, set either of these:

```bash
EXPO_PUBLIC_API_URL=https://api.yourbank.com npx expo start
```

or set `expo.extra.apiUrl` in `app/app.json`.

The URL is resolved in this order: `EXPO_PUBLIC_API_URL` → `app.json` extra → the Expo host machine → `10.0.2.2` (Android emulator) or `localhost`.

## API endpoints used

| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| `POST` | `/failures` | Public | Report a failure |
| `GET` | `/failures` | Public | List failures |
| `PUT` | `/failures/:id` | Technician and above | Update status and notes |
| `DELETE` | `/failures/:id` | Admin and above | Delete a failure |
| `POST` | `/admin/auth/login` | Public | Sign in |
| `POST` | `/admin/auth/logout` | Staff | Sign out |
| `POST` | `/admin/auth/register` | See security notes | Create a user |
| `GET` | `/admin/auth/all-admins` | Super admin | List users |
| `DELETE` | `/admin/auth/:id` | Super admin | Delete a user |

## Build an installable app

```bash
npm install -g eas-cli
cd app
eas login
eas build --platform android      # or ios
```

For a real release, host the backend over **HTTPS** and set `EXPO_PUBLIC_API_URL` to it. `app.json` currently allows plain HTTP on Android so local testing works. Remove the `usesCleartextTraffic` setting once you are on HTTPS.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Can't reach the server" | Phone and computer must share a network. Allow port `5000` through your firewall. Check the address shown on the **Account** tab. |
| Sign-in fails | Confirm the backend and MongoDB are running, and that the account exists (step 3 above). |
| "Username or email already exists" | The account is already created. Sign in with it or register a different one. |
| Buttons do nothing in the browser | Use the latest version of the app. Older builds used native-only pop-ups. |
| Changes don't show up | Stop Expo and run `npx expo start -c` to clear the cache. |

## Roadmap

- Push notifications when a new failure is reported
- ATM location and map view
- Failure history and per-ATM reliability stats
- Photo attachments on reports
- Assigning a failure to a specific technician


## License

Distributed under the MIT License. See `LICENSE` for details.
