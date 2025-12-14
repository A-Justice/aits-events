// Bookings Management
import { auth, db, collection, getDocs, query, orderBy, onAuthStateChanged } from '../../js/firebase-config.js';
import { logout } from './admin-auth.js';

let allBookings = [];
let eventsMap = {};

// Check authentication
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = '/admin/index.html';
        return;
    }
    
    // Update user display name
    const displayNameEl = document.querySelector('.display-name');
    if (displayNameEl) {
        const emailName = user.email.split('@')[0];
        displayNameEl.textContent = emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    
    await loadEvents();
    await loadBookings();
});

// Logout functionality
document.getElementById('logout-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
});

// Load events for filter dropdown
async function loadEvents() {
    try {
        const eventsSnapshot = await getDocs(query(collection(db, 'events'), orderBy('startDate', 'desc')));
        const filterSelect = document.getElementById('event-filter');
        
        eventsSnapshot.forEach((doc) => {
            const event = doc.data();
            eventsMap[doc.id] = event;
            
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = event.title || 'Untitled Event';
            filterSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading events:', error);
    }
}

// Event filter change handler
document.getElementById('event-filter')?.addEventListener('change', (e) => {
    renderBookings(e.target.value);
});

// Load all bookings
async function loadBookings() {
    try {
        const tbody = document.getElementById('bookings-tbody');
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">Loading bookings...</td></tr>';
        
        const bookingsQuery = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(bookingsQuery);
        
        allBookings = [];
        snapshot.forEach((doc) => {
            allBookings.push({ id: doc.id, ...doc.data() });
        });
        
        renderBookings('');
    } catch (error) {
        console.error('Error loading bookings:', error);
        document.getElementById('bookings-tbody').innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--danger);">Error loading bookings. Please refresh the page.</td></tr>';
    }
}

// Render bookings with optional filter
function renderBookings(eventFilter) {
    const tbody = document.getElementById('bookings-tbody');
    tbody.innerHTML = '';
    
    const filteredBookings = eventFilter 
        ? allBookings.filter(b => b.eventId === eventFilter)
        : allBookings;
    
    if (filteredBookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--text-secondary);">No bookings found.</td></tr>';
        return;
    }
    
    filteredBookings.forEach((booking) => {
        const event = eventsMap[booking.eventId];
        const eventTitle = event ? event.title : (booking.eventTitle || 'Unknown Event');
        
        const createdAt = booking.createdAt ? new Date(booking.createdAt.seconds * 1000).toLocaleString() : 'N/A';
        
        const statusClass = booking.status === 'confirmed' ? 'badge-success' 
            : booking.status === 'cancelled' ? 'badge-danger' 
            : 'badge-warning';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${booking.name || '—'}</strong></td>
            <td><a href="mailto:${booking.email}">${booking.email || '—'}</a></td>
            <td>${booking.phone || '—'}</td>
            <td>${eventTitle}</td>
            <td>${booking.tickets || 1}</td>
            <td>${createdAt}</td>
            <td><span class="badge ${statusClass}">${booking.status || 'pending'}</span></td>
        `;
        tbody.appendChild(row);
    });
}
