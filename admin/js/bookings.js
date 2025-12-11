// Bookings Management
import { auth, db } from '../../js/firebase-config.js';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { logout } from './admin-auth.js';

// Check authentication
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    await loadBookings();
});

// Logout functionality
document.getElementById('logout-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
});

// Load all bookings
async function loadBookings() {
    try {
        const bookingsQuery = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(bookingsQuery);
        
        const tbody = document.getElementById('bookings-tbody');
        tbody.innerHTML = '';
        
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="7">No bookings found.</td></tr>';
            return;
        }
        
        // Get all events for lookup
        const eventsSnapshot = await getDocs(collection(db, 'events'));
        const eventsMap = {};
        eventsSnapshot.forEach((doc) => {
            eventsMap[doc.id] = doc.data();
        });
        
        snapshot.forEach((doc) => {
            const booking = doc.data();
            const event = eventsMap[booking.eventId];
            const eventTitle = event ? event.title : 'Unknown Event';
            
            const createdAt = booking.createdAt ? new Date(booking.createdAt.seconds * 1000).toLocaleString() : 'N/A';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${booking.name || '—'}</strong></td>
                <td>${booking.email || '—'}</td>
                <td>${booking.phone || '—'}</td>
                <td>${eventTitle}</td>
                <td>${booking.tickets || 1}</td>
                <td>${createdAt}</td>
                <td><span class="status-${booking.status || 'pending'}">${(booking.status || 'pending').toUpperCase()}</span></td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading bookings:', error);
        document.getElementById('bookings-tbody').innerHTML = '<tr><td colspan="7">Error loading bookings. Please refresh the page.</td></tr>';
    }
}

