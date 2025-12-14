// Booth Bookings Admin
import { auth, db, collection, getDocs, doc, updateDoc, query, orderBy, Timestamp, onAuthStateChanged } from '../../js/firebase-config.js';
import { logout } from './admin-auth.js';

let allBoothBookings = [];
let eventsMap = {};

// Check authentication
onAuthStateChanged(auth, async (user) => {
    const displayNameElement = document.querySelector('#wpadminbar .display-name');
    if (user) {
        if (displayNameElement) {
            displayNameElement.textContent = user.email || 'Admin';
        }
        await loadEvents();
        await loadBoothBookings();
    } else {
        window.location.href = '/admin/index.html';
    }
});

// Logout handler
document.getElementById('logout-link')?.addEventListener('click', async (e) => {
    e.preventDefault();
    await logout();
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
    renderBoothBookings(e.target.value);
});

// Load all booth bookings
async function loadBoothBookings() {
    try {
        const tbody = document.getElementById('booth-bookings-tbody');
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px;">Loading booth bookings...</td></tr>';
        
        const bookingsQuery = query(collection(db, 'boothBookings'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(bookingsQuery);
        
        allBoothBookings = [];
        snapshot.forEach((docSnapshot) => {
            allBoothBookings.push({ id: docSnapshot.id, ...docSnapshot.data() });
        });
        
        renderBoothBookings('');
        
    } catch (error) {
        console.error('Error loading booth bookings:', error);
        const tbody = document.getElementById('booth-bookings-tbody');
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 40px; color: var(--danger);">
            <p style="margin-bottom: 12px; font-weight: 600;">Error loading booth bookings</p>
            <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">${error.message || 'Please check your connection and try again.'}</p>
            <button onclick="location.reload()" style="padding: 8px 16px; background: var(--primary); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">Refresh Page</button>
        </td></tr>`;
    }
}

// Render booth bookings with optional filter
function renderBoothBookings(eventFilter) {
    const tbody = document.getElementById('booth-bookings-tbody');
    tbody.innerHTML = '';
    
    const filteredBookings = eventFilter 
        ? allBoothBookings.filter(b => b.eventId === eventFilter)
        : allBoothBookings;
    
    if (filteredBookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: var(--text-secondary);">No booth bookings found.</td></tr>';
        return;
    }
    
    filteredBookings.forEach((booking) => {
        const row = document.createElement('tr');
        
        let createdAt = 'N/A';
        if (booking.createdAt) {
            if (booking.createdAt.seconds) {
                createdAt = new Date(booking.createdAt.seconds * 1000).toLocaleDateString();
            } else if (booking.createdAt instanceof Date) {
                createdAt = booking.createdAt.toLocaleDateString();
            }
        }
        
        const statusClass = booking.status === 'confirmed' ? 'badge-success' 
            : booking.status === 'cancelled' ? 'badge-danger' 
            : 'badge-warning';
        
        row.innerHTML = `
            <td>
                <strong>${booking.company || 'N/A'}</strong>
            </td>
            <td>${booking.firstName} ${booking.lastName}</td>
            <td><a href="mailto:${booking.email}">${booking.email}</a></td>
            <td>${booking.eventTitle || 'N/A'}</td>
            <td>${booking.boothOption?.name || 'N/A'}</td>
            <td><strong>$${booking.boothOption?.price?.toLocaleString() || '0'}</strong></td>
            <td>${createdAt}</td>
            <td>
                <span class="badge ${statusClass}">${booking.status || 'pending'}</span>
                <div class="row-actions" style="margin-top: 6px;">
                    <select class="status-select" data-id="${booking.id}" style="font-size: 11px; padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border);">
                        <option value="pending" ${booking.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="confirmed" ${booking.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                        <option value="cancelled" ${booking.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Add status change listeners
    document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', async (e) => {
            const bookingId = e.target.dataset.id;
            const newStatus = e.target.value;
            await updateBookingStatus(bookingId, newStatus);
        });
    });
}

// Update booking status
async function updateBookingStatus(bookingId, status) {
    try {
        await updateDoc(doc(db, 'boothBookings', bookingId), {
            status: status,
            updatedAt: Timestamp.now()
        });
        
        // Update local data
        const booking = allBoothBookings.find(b => b.id === bookingId);
        if (booking) {
            booking.status = status;
        }
        
        // Re-render with current filter
        const currentFilter = document.getElementById('event-filter').value;
        renderBoothBookings(currentFilter);
    } catch (error) {
        console.error('Error updating status:', error);
        alert('Error updating status. Please try again.');
    }
}
