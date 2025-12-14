// Event Detail and Booking
import { db, doc, getDoc, collection, addDoc, Timestamp } from './firebase-config.js';

// Get event ID from URL
const urlParams = new URLSearchParams(window.location.search);
const eventId = urlParams.get('id');

if (!eventId) {
    document.getElementById('event-title').textContent = 'Event not found';
    document.getElementById('event-description').innerHTML = '<p>The requested event could not be found.</p>';
} else {
    loadEventDetail(eventId);
}

// Load event details
async function loadEventDetail(id) {
    try {
        const eventDoc = await getDoc(doc(db, 'events', id));
        
        if (!eventDoc.exists()) {
            document.getElementById('event-title').textContent = 'Event not found';
            document.getElementById('event-description').innerHTML = '<p>The requested event could not be found.</p>';
            return;
        }
        
        const event = eventDoc.data();
        renderEvent(event, id);
        setupBookingForm(id, event);
    } catch (error) {
        console.error('Error loading event:', error);
        document.getElementById('event-title').textContent = 'Error loading event';
        document.getElementById('event-description').innerHTML = '<p>Please try again later.</p>';
    }
}

// Render event details
function renderEvent(event, eventId) {
    // Update page title
    document.title = `${event.title || 'Event'} - AITS Events`;
    
    // Event title
    document.getElementById('event-title').textContent = event.title || 'Untitled Event';
    document.getElementById('event-main-title').textContent = event.title || 'About This Event';
    
    // Parse dates
    let startDate = null;
    let endDate = null;
    
    if (event.startDate) {
        if (event.startDate.seconds) {
            startDate = new Date(event.startDate.seconds * 1000);
        } else if (event.startDate.toDate) {
            startDate = event.startDate.toDate();
        } else if (typeof event.startDate === 'string') {
            startDate = new Date(event.startDate);
        }
    }
    
    if (event.endDate) {
        if (event.endDate.seconds) {
            endDate = new Date(event.endDate.seconds * 1000);
        } else if (event.endDate.toDate) {
            endDate = event.endDate.toDate();
        } else if (typeof event.endDate === 'string') {
            endDate = new Date(event.endDate);
        }
    }
    
    // Event date in header
    if (startDate) {
        const dateStr = formatDateRange(startDate, endDate, event.startTime, event.endTime);
        document.getElementById('event-date').textContent = dateStr;
    }
    
    // Price badge
    const priceBadge = document.getElementById('event-price-badge');
    const rsvpPrice = document.getElementById('rsvp-price');
    if (event.price === 0 || !event.price) {
        priceBadge.textContent = 'Free';
        rsvpPrice.textContent = 'Free';
    } else {
        priceBadge.textContent = `$${event.price}`;
        rsvpPrice.textContent = `$${event.price} per ticket`;
    }
    
    // Event image
    const imageContainer = document.getElementById('event-image-container');
    if (event.imageUrl) {
        const img = document.createElement('img');
        img.src = event.imageUrl;
        img.alt = event.title;
        img.className = 'event-image';
        imageContainer.appendChild(img);
    }
    
    // Description
    if (event.description) {
        document.getElementById('event-description').innerHTML = `<p>${event.description}</p>`;
    } else {
        document.getElementById('event-description').innerHTML = '<p>No description available.</p>';
    }
    
    // Sidebar - Date Details
    const detailDate = document.getElementById('detail-date');
    if (startDate) {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        let dateText = `${monthNames[startDate.getMonth()]} ${startDate.getDate()}, ${startDate.getFullYear()}`;
        if (endDate && endDate.getTime() !== startDate.getTime()) {
            dateText += ` - ${monthNames[endDate.getMonth()]} ${endDate.getDate()}, ${endDate.getFullYear()}`;
        }
        detailDate.querySelector('span').textContent = dateText;
    }
    
    // Sidebar - Time
    const detailTime = document.getElementById('detail-time');
    if (event.startTime) {
        let timeText = event.startTime;
        if (event.endTime) {
            timeText += ` - ${event.endTime}`;
        }
        detailTime.querySelector('span').textContent = timeText;
    } else {
        detailTime.style.display = 'none';
    }
    
    // Sidebar - Venue
    const detailVenue = document.getElementById('detail-venue');
    if (event.venue) {
        let venueText = event.venue;
        if (event.location) {
            venueText += `, ${event.location}`;
        }
        detailVenue.querySelector('span').textContent = venueText;
    } else {
        detailVenue.closest('.sidebar-box').style.display = 'none';
    }
    
    // Sidebar - Organizer
    const detailOrganizer = document.getElementById('detail-organizer');
    if (event.organizer) {
        detailOrganizer.querySelector('span').textContent = event.organizer;
    } else {
        document.getElementById('organizer-box').style.display = 'none';
    }
    
    // Sidebar - Phone
    const detailPhone = document.getElementById('detail-phone');
    if (event.phone) {
        detailPhone.querySelector('span').textContent = event.phone;
        detailPhone.style.display = 'block';
    }
    
    // What to Expect Section
    if (event.whatToExpect && event.whatToExpect.length > 0) {
        const expectSection = document.getElementById('expect-section');
        const expectCards = document.getElementById('expect-cards');
        expectSection.style.display = 'block';
        
        // Icons for different items
        const icons = [
            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>',
            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>',
            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>',
            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>'
        ];
        
        expectCards.innerHTML = event.whatToExpect.map((item, i) => `
            <div class="info-card">
                <div class="card-icon">${icons[i % icons.length]}</div>
                <h4>${item}</h4>
            </div>
        `).join('');
    }
    
    // Who Should Attend Section
    if (event.whoShouldAttend && event.whoShouldAttend.length > 0) {
        const attendSection = document.getElementById('attend-section');
        const attendCards = document.getElementById('attend-cards');
        attendSection.style.display = 'block';
        
        // Icons for different attendee types
        const attendIcons = [
            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>',
            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>',
            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>'
        ];
        
        attendCards.innerHTML = event.whoShouldAttend.map((item, i) => `
            <div class="info-card">
                <div class="card-icon">${attendIcons[i % attendIcons.length]}</div>
                <h4>${item}</h4>
            </div>
        `).join('');
    }
    
    // Booth Booking Section
    if (event.boothBookingEnabled && event.boothOptions && event.boothOptions.length > 0) {
        const boothSection = document.getElementById('booth-section');
        const boothLink = document.getElementById('booth-link');
        boothSection.style.display = 'block';
        boothLink.href = `/events/book-booth.html?event=${eventId}`;
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
    const submitBtn = document.getElementById('book-btn');
    const successMsg = document.getElementById('success-message');
    const errorMsg = document.getElementById('error-message');
    
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
        errorMsg.style.display = 'none';
        
        try {
            const bookingData = {
                eventId: eventId,
                eventTitle: event.title,
                name: document.getElementById('booking-name').value,
                email: document.getElementById('booking-email').value,
                phone: document.getElementById('booking-phone').value,
                tickets: parseInt(document.getElementById('booking-tickets').value),
                pricePerTicket: event.price || 0,
                totalPrice: (event.price || 0) * parseInt(document.getElementById('booking-tickets').value),
                status: 'confirmed',
                createdAt: Timestamp.now()
            };
            
            await addDoc(collection(db, 'bookings'), bookingData);
            
            form.style.display = 'none';
            successMsg.style.display = 'block';
            
        } catch (error) {
            console.error('Error submitting booking:', error);
            errorMsg.textContent = 'Error submitting booking. Please try again.';
            errorMsg.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit RSVP';
        }
    });
}
