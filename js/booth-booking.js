// Booth Booking Page
import { db } from './firebase-config.js';
import { doc, getDoc, collection, addDoc, Timestamp } from 'firebase/firestore';

let selectedOption = null;
let currentEvent = null;

// Get event ID from URL
const urlParams = new URLSearchParams(window.location.search);
const eventId = urlParams.get('event');

if (!eventId) {
    document.getElementById('content').innerHTML = `
        <div class="error-message">
            <h3>Event not specified</h3>
            <p>Please select an event to book a booth.</p>
        </div>
    `;
} else {
    loadEventBoothOptions(eventId);
}

// Load event and booth options
async function loadEventBoothOptions(id) {
    try {
        const eventDoc = await getDoc(doc(db, 'events', id));
        
        if (!eventDoc.exists()) {
            document.getElementById('content').innerHTML = `
                <div class="error-message">
                    <h3>Event not found</h3>
                    <p>The requested event could not be found.</p>
                </div>
            `;
            return;
        }
        
        currentEvent = { id: eventDoc.id, ...eventDoc.data() };
        
        // Update event name in header
        document.getElementById('event-name').textContent = currentEvent.title;
        document.title = `Book a Booth - ${currentEvent.title}`;
        
        // Check if booth booking is enabled
        if (!currentEvent.boothBookingEnabled || !currentEvent.boothOptions || currentEvent.boothOptions.length === 0) {
            document.getElementById('content').innerHTML = `
                <div class="not-available">
                    <h3>Booth Booking Not Available</h3>
                    <p>Booth booking is not available for this event at this time.</p>
                </div>
            `;
            return;
        }
        
        // Render booth options
        renderBoothOptions(currentEvent.boothOptions);
        
    } catch (error) {
        console.error('Error loading event:', error);
        document.getElementById('content').innerHTML = `
            <div class="error-message">
                <h3>Error loading event</h3>
                <p>Please try again later.</p>
            </div>
        `;
    }
}

// Render booth option cards
function renderBoothOptions(options) {
    const html = `
        <div class="booth-options">
            ${options.map((option, index) => `
                <div class="booth-card" data-option-id="${option.id}" onclick="selectOption(${option.id})">
                    <h3 class="option-name">${option.name}</h3>
                    <div class="option-price">
                        $${option.price.toLocaleString()}
                        <span>per booth</span>
                    </div>
                    <ul class="items-list">
                        ${option.items.map(item => `
                            <li>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                ${item}
                            </li>
                        `).join('')}
                    </ul>
                    <button class="select-btn">Select This Option</button>
                </div>
            `).join('')}
        </div>
    `;
    
    document.getElementById('content').innerHTML = html;
}

// Select a booth option
window.selectOption = function(optionId) {
    // Find the option
    selectedOption = currentEvent.boothOptions.find(opt => opt.id === optionId);
    
    if (!selectedOption) return;
    
    // Update UI to show selected
    document.querySelectorAll('.booth-card').forEach(card => {
        card.classList.remove('selected');
    });
    document.querySelector(`[data-option-id="${optionId}"]`).classList.add('selected');
    
    // Update modal with selected option
    document.getElementById('selected-option-name').textContent = `${selectedOption.name} - $${selectedOption.price.toLocaleString()}`;
    
    // Open modal
    document.getElementById('booking-modal').classList.add('active');
};

// Close modal
window.closeModal = function() {
    document.getElementById('booking-modal').classList.remove('active');
};

// Close modal on overlay click
document.getElementById('booking-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'booking-modal') {
        closeModal();
    }
});

// Handle form submission
document.getElementById('booking-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Submitting...';
    
    try {
        const bookingData = {
            eventId: currentEvent.id,
            eventTitle: currentEvent.title,
            boothOption: {
                id: selectedOption.id,
                name: selectedOption.name,
                price: selectedOption.price,
                items: selectedOption.items
            },
            firstName: document.getElementById('first-name').value,
            lastName: document.getElementById('last-name').value,
            email: document.getElementById('email').value,
            company: document.getElementById('company').value,
            position: document.getElementById('position').value || null,
            phone: document.getElementById('phone').value || null,
            status: 'pending',
            createdAt: Timestamp.now()
        };
        
        await addDoc(collection(db, 'boothBookings'), bookingData);
        
        // Show success message
        document.getElementById('modal-body').innerHTML = `
            <div class="success-message">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="16 8 10 14 8 12"></polyline>
                </svg>
                <h3>Booking Request Submitted!</h3>
                <p>Thank you for your interest in ${currentEvent.title}. We will contact you shortly at ${bookingData.email} to confirm your booth booking.</p>
                <button onclick="window.location.href='/events/'" class="submit-btn">Back to Events</button>
            </div>
        `;
        
    } catch (error) {
        console.error('Error submitting booking:', error);
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
            Submit Booking Request
        `;
        alert('Error submitting booking. Please try again.');
    }
});

// Escape key to close modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

