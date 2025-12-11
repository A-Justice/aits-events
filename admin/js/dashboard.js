// Dashboard functionality
import { auth, db } from '../../js/firebase-config.js';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { logout } from './admin-auth.js';

// Check authentication
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    // Load dashboard data
    await loadDashboardData();
});

// Logout functionality
document.getElementById('logout-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
});

// Load dashboard statistics
async function loadDashboardData() {
    try {
        // Get events count
        const eventsQuery = query(collection(db, 'events'));
        const eventsSnapshot = await getDocs(eventsQuery);
        document.getElementById('events-count').textContent = eventsSnapshot.size;
        
        // Get bookings count
        const bookingsQuery = query(collection(db, 'bookings'));
        const bookingsSnapshot = await getDocs(bookingsQuery);
        document.getElementById('bookings-count').textContent = bookingsSnapshot.size;
        
        // Get recent events
        const recentEventsQuery = query(
            collection(db, 'events'),
            orderBy('startDate', 'desc'),
            limit(5)
        );
        const recentEventsSnapshot = await getDocs(recentEventsQuery);
        
        const recentEventsDiv = document.getElementById('recent-events');
        if (recentEventsSnapshot.empty) {
            recentEventsDiv.innerHTML = '<p>No events yet. <a href="events.html?action=add">Add your first event</a></p>';
        } else {
            const ul = document.createElement('ul');
            recentEventsSnapshot.forEach((doc) => {
                const event = doc.data();
                const li = document.createElement('li');
                li.innerHTML = `<a href="events.html?action=edit&id=${doc.id}">${event.title}</a>`;
                ul.appendChild(li);
            });
            recentEventsDiv.innerHTML = '';
            recentEventsDiv.appendChild(ul);
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

