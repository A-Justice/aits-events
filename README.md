# AITS Events Management System

A Firebase-powered event management system with WordPress-style admin interface.

## Features

- **Admin Dashboard**: WordPress-style admin interface for managing events and bookings
- **Event Management**: Create, edit, and delete events
- **Booking System**: Public users can book tickets for events
- **Firebase Integration**: Real-time data storage and management

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Configuration

The Firebase configuration is already set up in `js/firebase-config.js`. Make sure you have:

- Firebase project created at https://console.firebase.google.com
- Firestore Database enabled
- Authentication enabled (Email/Password)

### 3. Create Admin User

1. Go to Firebase Console > Authentication
2. Enable Email/Password authentication
3. Add a user manually or use the admin login page to create one

### 4. Firestore Collections

The app uses two main collections:

- **events**: Stores event information
- **bookings**: Stores booking information

### 5. Running the Application

Since this uses ES6 modules, you'll need to serve it through a web server. Options:

#### Option 1: Using Vite (Recommended)
```bash
npm run dev
```

#### Option 2: Using Python
```bash
python -m http.server 8000
```

#### Option 3: Using Node.js http-server
```bash
npx http-server
```

Then access:
- Public site: `http://localhost:8000`
- Admin panel: `http://localhost:8000/admin/`

## File Structure

```
├── admin/
│   ├── index.html          # Admin login page
│   ├── dashboard.html      # Admin dashboard
│   ├── events.html          # Events management
│   ├── bookings.html       # Bookings management
│   ├── css/                # Admin styles
│   └── js/                 # Admin scripts
├── events/
│   ├── index.html          # Public events listing
│   └── event-detail.html   # Event detail & booking
├── js/
│   ├── firebase-config.js  # Firebase configuration
│   ├── events-public.js    # Public events loader
│   └── event-detail.js     # Event detail & booking
├── _original_reference/    # Original HTML files backup
└── package.json
```

## Admin Features

### Dashboard
- View event and booking statistics
- Quick access to recent events

### Events Management
- Create new events
- Edit existing events
- Delete events
- View booking counts per event

### Bookings Management
- View all bookings
- See booking details (name, email, phone, tickets, event)

## Public Features

### Events Listing
- View upcoming events
- View past events
- Click to view event details

### Event Booking
- View event details
- Book tickets
- Select number of tickets
- Automatic price calculation

## Security Notes

- Admin authentication is handled by Firebase Auth
- Make sure to set up proper Firestore security rules
- Consider adding role-based access control

## Original Files

Original HTML files are backed up in `_original_reference/` directory for reference.

