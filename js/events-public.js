// Public Events Page - Fetch from Firebase
import { db, collection, getDocs, query, orderBy, where, Timestamp } from './firebase-config.js';

// Load events on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadEvents();
});

// Load events from Firebase
async function loadEvents() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTimestamp = Timestamp.fromDate(today);
        
        // Get all events and filter client-side (to avoid composite index requirements)
        const eventsQuery = query(collection(db, 'events'), orderBy('startDate', 'desc'));
        const allEventsSnapshot = await getDocs(eventsQuery);
        
        const upcomingEvents = [];
        const pastEvents = [];
        
        allEventsSnapshot.forEach((doc) => {
            const event = doc.data();
            const eventEndDate = event.endDate ? event.endDate : event.startDate;
            
            // Handle different date formats
            let endDate = null;
            if (eventEndDate) {
                if (eventEndDate.seconds) {
                    // Firebase Timestamp
                    endDate = new Date(eventEndDate.seconds * 1000);
                } else if (eventEndDate instanceof Date) {
                    endDate = eventEndDate;
                } else if (typeof eventEndDate === 'string') {
                    endDate = new Date(eventEndDate);
                } else if (eventEndDate.toDate) {
                    // Firebase Timestamp with toDate method
                    endDate = eventEndDate.toDate();
                }
            }
            
            if (endDate && !isNaN(endDate.getTime())) {
                if (endDate >= today) {
                    upcomingEvents.push({ id: doc.id, ...event });
                } else {
                    pastEvents.push({ id: doc.id, ...event });
                }
            } else {
                // If no valid date, treat as upcoming to not hide events
                upcomingEvents.push({ id: doc.id, ...event });
            }
        });
        
        // Sort upcoming events by start date ascending
        upcomingEvents.sort((a, b) => {
            const aDate = a.startDate?.seconds || 0;
            const bDate = b.startDate?.seconds || 0;
            return aDate - bDate;
        });
        
        // Sort past events by start date descending
        pastEvents.sort((a, b) => {
            const aDate = a.startDate?.seconds || 0;
            const bDate = b.startDate?.seconds || 0;
            return bDate - aDate;
        });
        
        const upcomingSnapshot = { forEach: (callback) => upcomingEvents.forEach(e => callback({ id: e.id, data: () => e })), empty: upcomingEvents.length === 0 };
        const pastSnapshot = { forEach: (callback) => pastEvents.forEach(e => callback({ id: e.id, data: () => e })), empty: pastEvents.length === 0 };
        
        // Render upcoming events
        const upcomingContainer = document.querySelector('.tribe-events-calendar-list');
        
        // Hide/show the static "no events" message from WordPress
        const headerMessages = document.querySelectorAll('.tribe-events-header__messages');
        
        if (upcomingContainer) {
            if (upcomingSnapshot.empty) {
                upcomingContainer.innerHTML = '<p>There are no upcoming events.</p>';
                // Show the static messages
                headerMessages.forEach(msg => msg.style.display = 'block');
            } else {
                // Hide the static "no events" messages
                headerMessages.forEach(msg => msg.style.display = 'none');
                renderEvents(upcomingSnapshot, upcomingContainer, 'upcoming');
            }
        }
        
        // Render past events
        const pastContainer = document.querySelector('.tribe-events-calendar-latest-past');
        if (pastContainer) {
            // Clear all static/hardcoded content first
            pastContainer.innerHTML = '<h2 class="tribe-events-calendar-latest-past__heading tribe-common-h5 tribe-common-h3--min-medium">Latest Past Events</h2>';
            
            if (pastSnapshot.empty) {
                pastContainer.innerHTML += '<p style="padding: 20px 0; color: #64748b;">No past events.</p>';
            } else {
                renderEvents(pastSnapshot, pastContainer, 'past');
            }
        }
    } catch (error) {
        console.error('Error loading events:', error);
    }
}

// Render events to the page
function renderEvents(snapshot, container, type) {
    const eventsList = document.createElement('div');
    eventsList.className = type === 'upcoming' ? 'tribe-events-list' : '';
    
    snapshot.forEach((doc) => {
        const event = doc.data();
        const eventElement = createEventElement(event, doc.id, type);
        eventsList.appendChild(eventElement);
    });
    
    // Clear existing content and add new events
    const existingContent = container.querySelector('.tribe-events-list, .tribe-common-g-row');
    if (existingContent) {
        existingContent.remove();
    }
    container.appendChild(eventsList);
}

// Create event HTML element
function createEventElement(event, eventId, type) {
    const startDate = event.startDate ? new Date(event.startDate.seconds * 1000) : new Date();
    const endDate = event.endDate ? new Date(event.endDate.seconds * 1000) : new Date();
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[startDate.getMonth()];
    const day = startDate.getDate();
    const year = startDate.getFullYear();
    
    const row = document.createElement('div');
    row.className = 'tribe-common-g-row tribe-events-calendar-' + (type === 'upcoming' ? 'list' : 'latest-past') + '__event-row';
    
    row.innerHTML = `
        <div class="tribe-events-calendar-${type === 'upcoming' ? 'list' : 'latest-past'}__event-date-tag tribe-common-g-col">
            <time class="tribe-events-calendar-${type === 'upcoming' ? 'list' : 'latest-past'}__event-date-tag-datetime" datetime="${startDate.toISOString().split('T')[0]}" aria-hidden="true">
                <span class="tribe-events-calendar-${type === 'upcoming' ? 'list' : 'latest-past'}__event-date-tag-month">${month}</span>
                <span class="tribe-events-calendar-${type === 'upcoming' ? 'list' : 'latest-past'}__event-date-tag-daynum tribe-common-h5 tribe-common-h4--min-medium">${day}</span>
                ${type === 'past' ? `<span class="tribe-events-calendar-latest-past__event-date-tag-year">${year}</span>` : ''}
            </time>
        </div>
        <div class="tribe-events-calendar-${type === 'upcoming' ? 'list' : 'latest-past'}__event-wrapper tribe-common-g-col">
            <article class="tribe-events-calendar-${type === 'upcoming' ? 'list' : 'latest-past'}__event tribe-common-g-row tribe-common-g-row--gutters">
                ${event.imageUrl ? `
                <div class="tribe-events-calendar-${type === 'upcoming' ? 'list' : 'latest-past'}__event-featured-image-wrapper tribe-common-g-col">
                    <a href="../events/event-detail.html?id=${eventId}" title="${event.title}" class="tribe-events-calendar-${type === 'upcoming' ? 'list' : 'latest-past'}__event-featured-image-link">
                        <img src="${event.imageUrl}" alt="${event.title}" class="tribe-events-calendar-${type === 'upcoming' ? 'list' : 'latest-past'}__event-featured-image">
                    </a>
                </div>
                ` : ''}
                <div class="tribe-events-calendar-${type === 'upcoming' ? 'list' : 'latest-past'}__event-details tribe-common-g-col">
                    <header class="tribe-events-calendar-${type === 'upcoming' ? 'list' : 'latest-past'}__event-header">
                        <div class="tribe-events-calendar-${type === 'upcoming' ? 'list' : 'latest-past'}__event-datetime-wrapper tribe-common-b2">
                            <time class="tribe-events-calendar-${type === 'upcoming' ? 'list' : 'latest-past'}__event-datetime" datetime="${startDate.toISOString()}">
                                <span class="tribe-event-date-start">${formatDate(startDate, event.startTime)}</span>
                                ${endDate.getTime() !== startDate.getTime() ? ` - <span class="tribe-event-date-end">${formatDate(endDate, event.endTime)}</span>` : ''}
                            </time>
                        </div>
                        <h3 class="tribe-events-calendar-${type === 'upcoming' ? 'list' : 'latest-past'}__event-title tribe-common-h6 tribe-common-h4--min-medium">
                            <a href="../events/event-detail.html?id=${eventId}" title="${event.title}" class="tribe-events-calendar-${type === 'upcoming' ? 'list' : 'latest-past'}__event-title-link">
                                ${event.title}
                            </a>
                        </h3>
                        ${event.venue ? `
                        <address class="tribe-events-calendar-${type === 'upcoming' ? 'list' : 'latest-past'}__event-venue tribe-common-b2">
                            <span class="tribe-events-calendar-${type === 'upcoming' ? 'list' : 'latest-past'}__event-venue-title tribe-common-b2--bold">${event.venue}</span>
                            ${event.location ? `<span class="tribe-events-calendar-${type === 'upcoming' ? 'list' : 'latest-past'}__event-venue-address">${event.location}</span>` : ''}
                        </address>
                        ` : ''}
                    </header>
                    ${event.description ? `
                    <div class="tribe-events-calendar-${type === 'upcoming' ? 'list' : 'latest-past'}__event-description tribe-common-b2">
                        <p>${truncateText(event.description, 150)}</p>
                    </div>
                    ` : ''}
                    ${type === 'upcoming' && event.price !== undefined ? `
                    <div class="tribe-events-c-small-cta tribe-common-b3 tribe-events-calendar-${type === 'upcoming' ? 'list' : 'latest-past'}__event-cost">
                        <span class="tribe-events-c-small-cta__price">${event.price === 0 ? 'Free' : '$' + event.price}</span>
                    </div>
                    ` : ''}
                </div>
            </article>
        </div>
    `;
    
    return row;
}

// Format date for display
function formatDate(date, time) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    let formatted = `${month} ${day}`;
    
    if (time) {
        formatted += ` @ ${time}`;
    }
    
    return formatted;
}

// Truncate text
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '&hellip;';
}

