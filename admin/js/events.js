// Events Management
import { auth, db } from '../../js/firebase-config.js';
import { collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, query, orderBy, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { logout } from './admin-auth.js';

let currentEventId = null;

// Check authentication
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    const id = urlParams.get('id');
    
    if (action === 'add' || action === 'edit') {
        showEventForm();
        if (action === 'edit' && id) {
            currentEventId = id;
            await loadEvent(id);
        }
    } else {
        showEventList();
        await loadEvents();
    }
});

// Logout functionality
document.getElementById('logout-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
});

// Show event list view
function showEventList() {
    document.getElementById('events-list-view').style.display = 'block';
    document.getElementById('event-form-view').style.display = 'none';
}

// Show event form view
function showEventForm() {
    document.getElementById('events-list-view').style.display = 'none';
    document.getElementById('event-form-view').style.display = 'block';
}

// Load all events
async function loadEvents() {
    try {
        const eventsQuery = query(collection(db, 'events'), orderBy('startDate', 'desc'));
        const snapshot = await getDocs(eventsQuery);
        
        const tbody = document.getElementById('events-tbody');
        tbody.innerHTML = '';
        
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="5">No events found. <a href="events.html?action=add">Add your first event</a></td></tr>';
            return;
        }
        
        // Get all bookings for count
        const allBookingsSnapshot = await getDocs(collection(db, 'bookings'));
        const bookingsMap = {};
        allBookingsSnapshot.forEach((bookingDoc) => {
            const booking = bookingDoc.data();
            const eventId = booking.eventId;
            if (!bookingsMap[eventId]) {
                bookingsMap[eventId] = 0;
            }
            bookingsMap[eventId]++;
        });
        
        snapshot.forEach((docSnapshot) => {
            const event = docSnapshot.data();
            const row = document.createElement('tr');
            const bookingsCount = bookingsMap[docSnapshot.id] || 0;
            
            const startDate = event.startDate ? new Date(event.startDate.seconds * 1000).toLocaleDateString() : 'N/A';
            const endDate = event.endDate ? new Date(event.endDate.seconds * 1000).toLocaleDateString() : 'N/A';
            
            row.innerHTML = `
                <td class="title column-title column-primary">
                    <strong><a href="events.html?action=edit&id=${docSnapshot.id}">${event.title || 'Untitled'}</a></strong>
                    <div class="row-actions">
                        <span class="edit"><a href="events.html?action=edit&id=${docSnapshot.id}">Edit</a> | </span>
                        <span class="trash"><a href="#" class="delete-event" data-id="${docSnapshot.id}">Delete</a></span>
                    </div>
                </td>
                <td>${startDate}</td>
                <td>${endDate}</td>
                <td>${event.venue || '—'}</td>
                <td>${bookingsCount}</td>
            `;
            tbody.appendChild(row);
        });
        
        // Add delete event listeners
        document.querySelectorAll('.delete-event').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                if (confirm('Are you sure you want to delete this event?')) {
                    await deleteEvent(btn.dataset.id);
                }
            });
        });
    } catch (error) {
        console.error('Error loading events:', error);
        document.getElementById('events-tbody').innerHTML = '<tr><td colspan="5">Error loading events. Please refresh the page.</td></tr>';
    }
}

// Load single event for editing
async function loadEvent(id) {
    try {
        const eventDoc = await getDoc(doc(db, 'events', id));
        if (!eventDoc.exists()) {
            alert('Event not found');
            window.location.href = 'events.html';
            return;
        }
        const eventData = eventDoc.data();
        
        if (!eventData) {
            alert('Event not found');
            window.location.href = 'events.html';
            return;
        }
        
        // Populate form
        document.getElementById('event-title').value = eventData.title || '';
        document.getElementById('event-description').value = eventData.description || '';
        
        if (eventData.startDate) {
            const startDate = new Date(eventData.startDate.seconds * 1000);
            document.getElementById('event-start-date').value = startDate.toISOString().split('T')[0];
            if (eventData.startTime) {
                document.getElementById('event-start-time').value = eventData.startTime;
            }
        }
        
        if (eventData.endDate) {
            const endDate = new Date(eventData.endDate.seconds * 1000);
            document.getElementById('event-end-date').value = endDate.toISOString().split('T')[0];
            if (eventData.endTime) {
                document.getElementById('event-end-time').value = eventData.endTime;
            }
        }
        
        document.getElementById('event-venue').value = eventData.venue || '';
        document.getElementById('event-location').value = eventData.location || '';
        document.getElementById('event-organizer').value = eventData.organizer || '';
        document.getElementById('event-phone').value = eventData.phone || '';
        document.getElementById('event-image').value = eventData.imageUrl || '';
        document.getElementById('event-capacity').value = eventData.capacity || '';
        document.getElementById('event-price').value = eventData.price || 0;
        
        document.getElementById('form-title').textContent = 'Edit Event';
        document.getElementById('save-event-btn').textContent = 'Update';
    } catch (error) {
        console.error('Error loading event:', error);
        alert('Error loading event');
    }
}

// Save event
document.getElementById('event-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const saveBtn = document.getElementById('save-event-btn');
    const statusDiv = document.getElementById('save-status');
    
    saveBtn.disabled = true;
    statusDiv.innerHTML = '<span class="spinner"></span> Saving...';
    
    try {
        const startDateInput = document.getElementById('event-start-date').value;
        const endDateInput = document.getElementById('event-end-date').value;
        
        const formData = {
            title: document.getElementById('event-title').value,
            description: document.getElementById('event-description').value,
            startDate: Timestamp.fromDate(new Date(startDateInput)),
            startTime: document.getElementById('event-start-time').value || null,
            endDate: Timestamp.fromDate(new Date(endDateInput)),
            endTime: document.getElementById('event-end-time').value || null,
            venue: document.getElementById('event-venue').value,
            location: document.getElementById('event-location').value,
            organizer: document.getElementById('event-organizer').value,
            phone: document.getElementById('event-phone').value,
            imageUrl: document.getElementById('event-image').value,
            capacity: document.getElementById('event-capacity').value ? parseInt(document.getElementById('event-capacity').value) : null,
            price: parseFloat(document.getElementById('event-price').value) || 0,
            updatedAt: Timestamp.now()
        };
        
        if (!currentEventId) {
            formData.createdAt = Timestamp.now();
        }
        
        if (currentEventId) {
            // Update existing event
            const eventRef = doc(db, 'events', currentEventId);
            await updateDoc(eventRef, formData);
            statusDiv.innerHTML = '<span style="color: green;">✓ Event updated successfully!</span>';
        } else {
            // Create new event
            await addDoc(collection(db, 'events'), formData);
            statusDiv.innerHTML = '<span style="color: green;">✓ Event created successfully!</span>';
            // Reset form
            document.getElementById('event-form').reset();
        }
        
        setTimeout(() => {
            window.location.href = 'events.html';
        }, 1500);
    } catch (error) {
        console.error('Error saving event:', error);
        statusDiv.innerHTML = '<span style="color: red;">✗ Error saving event. Please try again.</span>';
        saveBtn.disabled = false;
    }
});

// Cancel button
document.getElementById('cancel-btn')?.addEventListener('click', () => {
    window.location.href = 'events.html';
});

// Delete event
async function deleteEvent(id) {
    try {
        await deleteDoc(doc(db, 'events', id));
        await loadEvents();
    } catch (error) {
        console.error('Error deleting event:', error);
        alert('Error deleting event');
    }
}

