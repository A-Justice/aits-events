// Dashboard functionality
import { auth, db } from '../../js/firebase-config.js';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { logout } from './admin-auth.js';

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    // Logout functionality
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
});

// Check authentication
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = '/admin/index.html';
        return;
    }
    
    // Update user display name
    const displayNameEl = document.querySelector('.display-name');
    if (displayNameEl) {
        // Show email username part or full email
        const emailName = user.email.split('@')[0];
        displayNameEl.textContent = emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    
    // Load dashboard data
    await loadDashboardData();
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
            recentEventsDiv.innerHTML = '<p>No events yet. <a href="/admin/events.html?action=add">Add your first event</a></p>';
        } else {
            const ul = document.createElement('ul');
            recentEventsSnapshot.forEach((doc) => {
                const event = doc.data();
                const li = document.createElement('li');
                li.innerHTML = `<a href="/admin/events.html?action=edit&id=${doc.id}">${event.title}</a>`;
                ul.appendChild(li);
            });
            recentEventsDiv.innerHTML = '';
            recentEventsDiv.appendChild(ul);
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        
        // Show user-friendly error message
        const recentEventsDiv = document.getElementById('recent-events');
        if (recentEventsDiv) {
            if (error.code === 'permission-denied') {
                recentEventsDiv.innerHTML = '<p class="error-text">Database access denied. Please check Firebase rules.</p>';
            } else {
                recentEventsDiv.innerHTML = '<p class="error-text">Error loading data. Please refresh the page.</p>';
            }
        }
    }
}
