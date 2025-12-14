// Partners Admin (Sponsors, Speakers, Volunteers)
import { auth, db } from '../../js/firebase-config.js';
import { collection, getDocs, doc, updateDoc, deleteDoc, Timestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { logout } from './admin-auth.js';

let allPartners = [];
let eventsMap = {};
let currentPartnerId = null;
let partnerType = '';

// Determine partner type from URL
if (window.location.pathname.includes('sponsors')) {
    partnerType = 'sponsor';
} else if (window.location.pathname.includes('speakers')) {
    partnerType = 'speaker';
} else if (window.location.pathname.includes('volunteers')) {
    partnerType = 'volunteer';
}

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
    
    await loadAllData();
});

// Logout functionality
document.getElementById('logout-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
});

// Load all partners and events
async function loadAllData() {
    try {
        // Fetch all events
        const eventsSnapshot = await getDocs(collection(db, 'events'));
        eventsMap = {};
        eventsSnapshot.forEach((doc) => {
            eventsMap[doc.id] = doc.data();
        });
        populateEventFilter();

        // Fetch all partners and filter client-side (avoids composite index requirement)
        const partnersSnapshot = await getDocs(collection(db, 'partners'));
        
        allPartners = [];
        partnersSnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.type === partnerType) {
                allPartners.push({ id: doc.id, ...data });
            }
        });
        
        // Sort by createdAt descending
        allPartners.sort((a, b) => {
            const aTime = a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.seconds || 0;
            return bTime - aTime;
        });
        
        filterPartners(); // Initial render
        
    } catch (error) {
        console.error('Error loading partners:', error);
        document.getElementById('partners-tbody').innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 40px;">Error loading data. Please refresh the page.</td></tr>`;
    }
}

// Populate event filter dropdown
function populateEventFilter() {
    const filterSelect = document.getElementById('event-filter');
    filterSelect.innerHTML = '<option value="">All Events</option>';
    
    const sortedEvents = Object.entries(eventsMap).sort(([, a], [, b]) => a.title.localeCompare(b.title));

    sortedEvents.forEach(([id, event]) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = event.title;
        filterSelect.appendChild(option);
    });
}

// Filter and render partners
function filterPartners() {
    const selectedEventId = document.getElementById('event-filter').value;
    const selectedStatus = document.getElementById('status-filter').value;
    const tbody = document.getElementById('partners-tbody');
    tbody.innerHTML = '';
    
    let filtered = allPartners;
    
    if (selectedEventId) {
        filtered = filtered.filter(p => p.eventId === selectedEventId);
    }
    
    if (selectedStatus) {
        filtered = filtered.filter(p => p.status === selectedStatus);
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 40px;">No ${partnerType}s found.</td></tr>`;
        return;
    }
    
    filtered.forEach((partner) => {
        const eventTitle = partner.eventTitle || eventsMap[partner.eventId]?.title || 'Unknown Event';
        const createdAt = partner.createdAt ? new Date(partner.createdAt.seconds * 1000).toLocaleDateString() : 'N/A';

        const row = document.createElement('tr');
        
        if (partnerType === 'sponsor') {
            row.innerHTML = `
                <td><strong>${partner.name || '—'}</strong></td>
                <td>${partner.organization || '—'}</td>
                <td><a href="mailto:${partner.email}">${partner.email || '—'}</a></td>
                <td>${eventTitle}</td>
                <td>${formatSponsorshipLevel(partner.sponsorshipLevel)}</td>
                <td>${createdAt}</td>
                <td><span class="status-badge ${partner.status || 'pending'}">${(partner.status || 'pending').toUpperCase()}</span></td>
                <td>
                    <button class="button-view" onclick="openPartnerModal('${partner.id}')">View</button>
                    <button class="button-delete" onclick="deletePartner('${partner.id}')">Delete</button>
                </td>
            `;
        } else if (partnerType === 'speaker') {
            row.innerHTML = `
                <td><strong>${partner.name || '—'}</strong></td>
                <td>${partner.organization || '—'}</td>
                <td><a href="mailto:${partner.email}">${partner.email || '—'}</a></td>
                <td>${eventTitle}</td>
                <td>${truncate(partner.talkTitle, 30)}</td>
                <td>${createdAt}</td>
                <td><span class="status-badge ${partner.status || 'pending'}">${(partner.status || 'pending').toUpperCase()}</span></td>
                <td>
                    <button class="button-view" onclick="openPartnerModal('${partner.id}')">View</button>
                    <button class="button-delete" onclick="deletePartner('${partner.id}')">Delete</button>
                </td>
            `;
        } else if (partnerType === 'volunteer') {
            const services = Array.isArray(partner.services) ? partner.services.join(', ') : '—';
            row.innerHTML = `
                <td><strong>${partner.name || '—'}</strong></td>
                <td>${partner.organization || '—'}</td>
                <td><a href="mailto:${partner.email}">${partner.email || '—'}</a></td>
                <td>${eventTitle}</td>
                <td>${truncate(services, 25)}</td>
                <td>${formatAvailability(partner.availability)}</td>
                <td><span class="status-badge ${partner.status || 'pending'}">${(partner.status || 'pending').toUpperCase()}</span></td>
                <td>
                    <button class="button-view" onclick="openPartnerModal('${partner.id}')">View</button>
                    <button class="button-delete" onclick="deletePartner('${partner.id}')">Delete</button>
                </td>
            `;
        }
        
        tbody.appendChild(row);
    });
}

// Helper functions
function truncate(str, maxLength) {
    if (!str) return '—';
    return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
}

function formatSponsorshipLevel(level) {
    if (!level) return '—';
    return level.charAt(0).toUpperCase() + level.slice(1);
}

function formatAvailability(avail) {
    if (!avail) return '—';
    const map = {
        'full-event': 'Full Event',
        'day-1': 'Day 1',
        'day-2': 'Day 2',
        'day-3': 'Day 3',
        'multiple-days': 'Multiple Days',
        'flexible': 'Flexible'
    };
    return map[avail] || avail;
}

// Event listeners for filters
document.getElementById('event-filter')?.addEventListener('change', filterPartners);
document.getElementById('status-filter')?.addEventListener('change', filterPartners);

// Open partner detail modal
window.openPartnerModal = function(id) {
    currentPartnerId = id;
    const partner = allPartners.find(p => p.id === id);
    if (!partner) return;

    const modalBody = document.getElementById('modal-body');
    const eventTitle = partner.eventTitle || eventsMap[partner.eventId]?.title || 'Unknown Event';
    const createdAt = partner.createdAt ? new Date(partner.createdAt.seconds * 1000).toLocaleString() : 'N/A';

    let detailsHtml = `
        <div class="contact-detail-item"><strong>Event:</strong> <span>${eventTitle}</span></div>
        <div class="contact-detail-item"><strong>Name:</strong> <span>${partner.name || 'N/A'}</span></div>
        <div class="contact-detail-item"><strong>Email:</strong> <span><a href="mailto:${partner.email}">${partner.email || 'N/A'}</a></span></div>
        <div class="contact-detail-item"><strong>Phone:</strong> <span>${partner.phone || 'N/A'}</span></div>
        <div class="contact-detail-item"><strong>Organization:</strong> <span>${partner.organization || 'N/A'}</span></div>
        <div class="contact-detail-item"><strong>Position:</strong> <span>${partner.position || 'N/A'}</span></div>
        <div class="contact-detail-item"><strong>Submitted:</strong> <span>${createdAt}</span></div>
    `;

    if (partnerType === 'sponsor') {
        detailsHtml += `
            <hr style="margin: 15px 0; border-color: var(--border);">
            <div class="contact-detail-item"><strong>Sponsorship Level:</strong> <span>${formatSponsorshipLevel(partner.sponsorshipLevel)}</span></div>
            <div class="contact-detail-item"><strong>Website:</strong> <span>${partner.website ? `<a href="${partner.website}" target="_blank">${partner.website}</a>` : 'N/A'}</span></div>
            <p style="margin-top: 15px;"><strong>Company Description:</strong></p>
            <p style="background: var(--bg-secondary); padding: 12px; border-radius: 8px; margin-top: 5px;">${partner.companyDescription || 'No description provided.'}</p>
        `;
    } else if (partnerType === 'speaker') {
        detailsHtml += `
            <hr style="margin: 15px 0; border-color: var(--border);">
            <div class="contact-detail-item"><strong>LinkedIn:</strong> <span>${partner.linkedIn ? `<a href="${partner.linkedIn}" target="_blank">View Profile</a>` : 'N/A'}</span></div>
            <div class="contact-detail-item"><strong>Expertise:</strong> <span>${partner.expertise || 'N/A'}</span></div>
            <p style="margin-top: 15px;"><strong>Talk Title:</strong></p>
            <p style="background: var(--bg-secondary); padding: 12px; border-radius: 8px; margin-top: 5px; font-weight: 600;">${partner.talkTitle || 'No title provided.'}</p>
            <p style="margin-top: 15px;"><strong>Talk Description:</strong></p>
            <p style="background: var(--bg-secondary); padding: 12px; border-radius: 8px; margin-top: 5px;">${partner.talkDescription || 'No description provided.'}</p>
            <p style="margin-top: 15px;"><strong>Previous Speaking Experience:</strong></p>
            <p style="background: var(--bg-secondary); padding: 12px; border-radius: 8px; margin-top: 5px;">${partner.previousSpeaking || 'None provided.'}</p>
        `;
    } else if (partnerType === 'volunteer') {
        const services = Array.isArray(partner.services) ? partner.services.join(', ') : 'None selected';
        detailsHtml += `
            <hr style="margin: 15px 0; border-color: var(--border);">
            <div class="contact-detail-item"><strong>Services:</strong> <span>${services}</span></div>
            <div class="contact-detail-item"><strong>Availability:</strong> <span>${formatAvailability(partner.availability)}</span></div>
            <p style="margin-top: 15px;"><strong>Experience:</strong></p>
            <p style="background: var(--bg-secondary); padding: 12px; border-radius: 8px; margin-top: 5px;">${partner.experience || 'None provided.'}</p>
        `;
    }

    // Bio file
    if (partner.bioUrl) {
        detailsHtml += `
            <div class="contact-detail-item" style="margin-top: 15px;"><strong>Bio/CV:</strong> <span><a href="${partner.bioUrl}" target="_blank" class="button button-primary" style="padding: 5px 10px;">Download File</a></span></div>
        `;
    }

    // Additional message
    if (partner.message) {
        detailsHtml += `
            <p style="margin-top: 15px;"><strong>Additional Message:</strong></p>
            <p style="background: var(--bg-secondary); padding: 12px; border-radius: 8px; margin-top: 5px;">${partner.message}</p>
        `;
    }

    modalBody.innerHTML = detailsHtml;
    
    // Set current status in dropdown
    document.getElementById('modal-status-select').value = partner.status || 'pending';

    document.getElementById('partner-detail-modal').classList.add('active');
};

// Close modal
window.closePartnerModal = function() {
    document.getElementById('partner-detail-modal').classList.remove('active');
    currentPartnerId = null;
};

// Update status
document.getElementById('update-status-btn')?.addEventListener('click', async () => {
    if (!currentPartnerId) return;
    
    const newStatus = document.getElementById('modal-status-select').value;
    
    try {
        await updateDoc(doc(db, 'partners', currentPartnerId), { 
            status: newStatus, 
            updatedAt: Timestamp.now() 
        });
        
        // Update local state
        const index = allPartners.findIndex(p => p.id === currentPartnerId);
        if (index !== -1) {
            allPartners[index].status = newStatus;
        }
        
        filterPartners();
        closePartnerModal();
        alert('Status updated successfully!');
        
    } catch (error) {
        console.error('Error updating status:', error);
        alert('Error updating status. Please try again.');
    }
});

// Delete partner
window.deletePartner = async function(id) {
    if (!confirm(`Are you sure you want to delete this ${partnerType} application?`)) {
        return;
    }
    
    try {
        await deleteDoc(doc(db, 'partners', id));
        allPartners = allPartners.filter(p => p.id !== id);
        filterPartners();
        alert('Application deleted successfully!');
    } catch (error) {
        console.error('Error deleting partner:', error);
        alert('Error deleting application. Please try again.');
    }
};

// Modal close handlers
document.getElementById('partner-detail-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'partner-detail-modal') {
        closePartnerModal();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closePartnerModal();
    }
});

