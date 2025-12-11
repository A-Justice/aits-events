# Setup Guide - AITS Events Management System

## Quick Start

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or use existing project `aitsevents-69178`
3. Enable **Firestore Database**:
   - Go to Firestore Database
   - Click "Create database"
   - Start in **test mode** (for development)
   - Choose a location

4. Enable **Authentication**:
   - Go to Authentication
   - Click "Get started"
   - Enable "Email/Password" sign-in method
   - Save

5. Create your first admin user:
   - Go to Authentication > Users
   - Click "Add user"
   - Enter email and password
   - Save the credentials

### 2. Install Dependencies

```bash
npm install
```

This will install:
- Firebase SDK
- Vite (for development server)

### 3. Start Development Server

```bash
npm run dev
```

Or use any static file server:
- Python: `python -m http.server 8000`
- Node: `npx http-server`
- VS Code: Use Live Server extension

### 4. Access the Application

- **Public Site**: `http://localhost:8000/`
- **Events Page**: `http://localhost:8000/events/`
- **Admin Login**: `http://localhost:8000/admin/`

### 5. First Login

1. Go to `http://localhost:8000/admin/`
2. Use the email/password you created in Firebase
3. You'll be redirected to the dashboard

## Firestore Security Rules (Development)

For development, use these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Events - readable by all, writable by authenticated users
    match /events/{eventId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Bookings - readable/writable by authenticated users only
    match /bookings/{bookingId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Important**: For production, implement proper security rules based on your needs.

## Creating Your First Event

1. Log in to admin panel
2. Go to **Events** > **Add New**
3. Fill in the event details:
   - Title (required)
   - Description
   - Start Date & Time
   - End Date & Time
   - Venue & Location
   - Organizer
   - Phone
   - Image URL (optional)
   - Capacity (optional)
   - Price (0 for free events)
4. Click **Publish**

## Testing the Booking System

1. Create an event in the admin panel
2. Go to the public events page
3. Click on an event
4. Fill in the booking form
5. Submit the booking
6. Check the admin panel > Bookings to see the booking

## Troubleshooting

### "Module not found" errors
- Make sure you're serving the files through a web server (not file://)
- Check that all import paths are correct

### Firebase authentication errors
- Verify Firebase config in `js/firebase-config.js`
- Check that Authentication is enabled in Firebase Console
- Ensure you've created a user in Firebase Authentication

### Events not showing
- Check browser console for errors
- Verify Firestore database is created
- Check that events collection exists in Firestore

### CORS errors
- Make sure you're using a local web server
- Check Firebase project settings

## Production Deployment

1. Update Firestore security rules for production
2. Build the project (if using a build tool)
3. Deploy to your hosting service
4. Update Firebase config if needed
5. Test all functionality

## Support

For issues or questions, check:
- Firebase Documentation: https://firebase.google.com/docs
- Firestore Documentation: https://firebase.google.com/docs/firestore

