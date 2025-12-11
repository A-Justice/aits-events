// Event Detail and Booking
import { db } from './firebase-config.js';
import { doc, getDoc, collection, addDoc, Timestamp } from 'firebase/firestore';

// Get event ID from URL
const urlParams = new URLSearchParams(window.location.search);
const eventId = urlParams.get('id');

if (!eventId) {
    document.getElementById('event-content').innerHTML = '<p>Event not found.</p>';
} else {
    loadEventDetail(eventId);
}

// Load event details
async function loadEventDetail(id) {
    try {
        const eventDoc = await getDoc(doc(db, 'events', id));
        
        if (!eventDoc.exists()) {
            document.getElementById('event-content').innerHTML = '<p>Event not found.</p>';
            return;
        }
        
        const event = eventDoc.data();
        renderEvent(event);
        setupBookingForm(id, event);
    } catch (error) {
        console.error('Error loading event:', error);
        document.getElementById('event-content').innerHTML = '<p>Error loading event. Please try again.</p>';
    }
}

// Render event details
function renderEvent(event) {
    document.getElementById('event-title').textContent = event.title || 'Untitled Event';
    
    // Event image
    const imageContainer = document.getElementById('event-image-container');
    if (event.imageUrl) {
        const img = document.createElement('img');
        img.src = event.imageUrl;
        img.alt = event.title;
        img.className = 'event-image';
        imageContainer.appendChild(img);
    }
    
    // Event meta
    const metaContainer = document.getElementById('event-meta');
    const startDate = event.startDate ? new Date(event.startDate.seconds * 1000) : null;
    const endDate = event.endDate ? new Date(event.endDate.seconds * 1000) : null;
    
    if (startDate) {
        const dateItem = document.createElement('div');
        dateItem.className = 'event-meta-item';
        dateItem.innerHTML = `
            <strong>Date:</strong> 
            ${formatDateRange(startDate, endDate, event.startTime, event.endTime)}
        `;
        metaContainer.appendChild(dateItem);
    }
    
    if (event.venue) {
        const venueItem = document.createElement('div');
        venueItem.className = 'event-meta-item';
        venueItem.innerHTML = `<strong>Venue:</strong> ${event.venue}${event.location ? ', ' + event.location : ''}`;
        metaContainer.appendChild(venueItem);
    }
    
    if (event.organizer) {
        const orgItem = document.createElement('div');
        orgItem.className = 'event-meta-item';
        orgItem.innerHTML = `<strong>Organizer:</strong> ${event.organizer}`;
        metaContainer.appendChild(orgItem);
    }
    
    if (event.phone) {
        const phoneItem = document.createElement('div');
        phoneItem.className = 'event-meta-item';
        phoneItem.innerHTML = `<strong>Phone:</strong> ${event.phone}`;
        metaContainer.appendChild(phoneItem);
    }
    
    // Event description
    if (event.description) {
        document.getElementById('event-description').innerHTML = `<p>${event.description}</p>`;
    }
    
    // Event price
    const priceElement = document.getElementById('event-price');
    if (event.price === 0 || !event.price) {
        priceElement.textContent = 'Free';
    } else {
        priceElement.textContent = `$${event.price} per ticket`;
    }
}

// Format date range
function formatDateRange(startDate, endDate, startTime, endTime) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    let formatted = `${monthNames[startDate.getMonth()]} ${startDate.getDate()}, ${startDate.getFullYear()}`;
    
    if (startTime) {
        formatted += ` @ ${startTime}`;
    }
    
    if (endDate && endDate.getTime() !== startDate.getTime()) {
        formatted += ` - ${monthNames[endDate.getMonth()]} ${endDate.getDate()}, ${endDate.getFullYear()}`;
        if (endTime) {
            formatted += ` @ ${endTime}`;
        }
    } else if (endTime && endTime !== startTime) {
        formatted += ` - ${endTime}`;
    }
    
    return formatted;
}

// Setup booking form
function setupBookingForm(eventId, event) {
    const form = document.getElementById('booking-form');
    const bookBtn = document.getElementById('book-btn');
    const successMsg = document.getElementById('success-message');
    const errorMsg = document.getElementById('error-message');
    
    // Check capacity
    if (event.capacity) {
        // TODO: Check current bookings count
        // For now, just limit tickets dropdown
        const ticketsSelect = document.getElementById('booking-tickets');
        const maxTickets = Math.min(5, event.capacity);
        ticketsSelect.innerHTML = '';
        for (let i = 1; i <= maxTickets; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            ticketsSelect.appendChild(option);
        }
    }
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        bookBtn.disabled = true;
        bookBtn.textContent = 'Processing...';
        successMsg.style.display = 'none';
        errorMsg.style.display = 'none';
        
        try {
            const bookingData = {
                eventId: eventId,
                name: document.getElementById('booking-name').value,
                email: document.getElementById('booking-email').value,
                phone: document.getElementById('booking-phone').value,
                tickets: parseInt(document.getElementById('booking-tickets').value),
                totalPrice: (event.price || 0) * parseInt(document.getElementById('booking-tickets').value),
                status: 'pending',
                createdAt: Timestamp.now()
            };
            
            await addDoc(collection(db, 'bookings'), bookingData);
            
            successMsg.style.display = 'block';
            form.reset();
            bookBtn.disabled = false;
            bookBtn.textContent = 'Book Now';
            
            // Scroll to success message
            successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } catch (error) {
            console.error('Error creating booking:', error);
            errorMsg.textContent = 'Error processing booking. Please try again.';
            errorMsg.style.display = 'block';
            bookBtn.disabled = false;
            bookBtn.textContent = 'Book Now';
        }
    });
}

