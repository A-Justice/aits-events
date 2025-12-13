// Contacts Admin
import { auth, db } from '../../js/firebase-config.js';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { logout } from './admin-auth.js';

let allContacts = [];
let currentContactId = null;

// Check authentication
onAuthStateChanged(auth, async (user) => {
    const displayNameElement = document.querySelector('#wpadminbar .display-name');
    if (user) {
        if (displayNameElement) {
            displayNameElement.textContent = user.email || 'Admin';
        }
        await loadContacts();
    } else {
        window.location.href = '/admin/index.html';
    }
});

// Logout handler
document.getElementById('logout-link')?.addEventListener('click', async (e) => {
    e.preventDefault();
    await logout();
});

// Status filter change handler
document.getElementById('status-filter')?.addEventListener('change', (e) => {
    renderContacts(e.target.value);
});

// Load all contacts
async function loadContacts() {
    try {
        const tbody = document.getElementById('contacts-tbody');
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">Loading contact submissions...</td></tr>';
        
        const contactsQuery = query(collection(db, 'contacts'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(contactsQuery);
        
        allContacts = [];
        snapshot.forEach((docSnapshot) => {
            allContacts.push({ id: docSnapshot.id, ...docSnapshot.data() });
        });
        
        renderContacts('');
        
    } catch (error) {
        console.error('Error loading contacts:', error);
        const tbody = document.getElementById('contacts-tbody');
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--danger);">
            <p style="margin-bottom: 12px; font-weight: 600;">Error loading contacts</p>
            <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">${error.message || 'Please check your connection and try again.'}</p>
            <button onclick="location.reload()" style="padding: 8px 16px; background: var(--primary); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">Refresh Page</button>
        </td></tr>`;
    }
}

// Render contacts with optional filter
function renderContacts(statusFilter) {
    const tbody = document.getElementById('contacts-tbody');
    tbody.innerHTML = '';
    
    const filteredContacts = statusFilter 
        ? allContacts.filter(c => c.status === statusFilter)
        : allContacts;
    
    if (filteredContacts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--text-secondary);">No contact submissions found.</td></tr>';
        return;
    }
    
    filteredContacts.forEach((contact) => {
        const row = document.createElement('tr');
        
        let createdAt = 'N/A';
        if (contact.createdAt) {
            if (contact.createdAt.seconds) {
                createdAt = new Date(contact.createdAt.seconds * 1000).toLocaleString();
            } else if (contact.createdAt instanceof Date) {
                createdAt = contact.createdAt.toLocaleString();
            }
        }
        
        const statusClass = contact.status === 'new' ? 'badge-warning' 
            : contact.status === 'replied' ? 'badge-success' 
            : 'badge-muted';
        
        const isNew = contact.status === 'new';
        
        row.innerHTML = `
            <td>
                <strong style="${isNew ? 'color: var(--primary);' : ''}">${contact.name || 'N/A'}</strong>
                ${isNew ? '<span class="new-indicator" style="display: inline-block; width: 8px; height: 8px; background: var(--primary); border-radius: 50%; margin-left: 6px;"></span>' : ''}
            </td>
            <td><a href="mailto:${contact.email}">${contact.email || 'N/A'}</a></td>
            <td>${contact.phone || 'N/A'}</td>
            <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${contact.subject || 'N/A'}</td>
            <td>${createdAt}</td>
            <td>
                <span class="badge ${statusClass}">${contact.status || 'new'}</span>
            </td>
            <td>
                <button class="button button-small view-contact" data-id="${contact.id}" style="margin-right: 4px;">
                    View
                </button>
                <button class="button button-small button-link-delete delete-contact" data-id="${contact.id}">
                    Delete
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Add event listeners
    document.querySelectorAll('.view-contact').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const contactId = e.target.dataset.id;
            openContactModal(contactId);
        });
    });
    
    document.querySelectorAll('.delete-contact').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const contactId = e.target.dataset.id;
            if (confirm('Are you sure you want to delete this contact submission?')) {
                await deleteContact(contactId);
            }
        });
    });
}

// Open contact modal
async function openContactModal(contactId) {
    const contact = allContacts.find(c => c.id === contactId);
    if (!contact) return;
    
    currentContactId = contactId;
    
    // Mark as read if new
    if (contact.status === 'new') {
        await updateContactStatus(contactId, 'read');
    }
    
    // Populate modal
    document.getElementById('modal-subject').textContent = contact.subject || 'No Subject';
    document.getElementById('modal-name').textContent = contact.name || 'N/A';
    document.getElementById('modal-email').textContent = contact.email || 'N/A';
    document.getElementById('modal-email').href = `mailto:${contact.email}`;
    document.getElementById('modal-phone').textContent = contact.phone || 'N/A';
    document.getElementById('modal-message').textContent = contact.message || 'No message provided.';
    
    let createdAt = 'N/A';
    if (contact.createdAt) {
        if (contact.createdAt.seconds) {
            createdAt = new Date(contact.createdAt.seconds * 1000).toLocaleString();
        }
    }
    document.getElementById('modal-date').textContent = createdAt;
    
    // Set reply email link
    const replyBtn = document.getElementById('modal-reply-btn');
    const emailSubject = encodeURIComponent(`Re: ${contact.subject || 'Your inquiry'}`);
    replyBtn.href = `mailto:${contact.email}?subject=${emailSubject}`;
    
    // Show modal
    document.getElementById('message-modal').style.display = 'flex';
}

// Close modal
document.getElementById('modal-close')?.addEventListener('click', () => {
    document.getElementById('message-modal').style.display = 'none';
    currentContactId = null;
});

// Close modal on outside click
document.getElementById('message-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'message-modal') {
        document.getElementById('message-modal').style.display = 'none';
        currentContactId = null;
    }
});

// Mark as replied
document.getElementById('mark-replied-btn')?.addEventListener('click', async () => {
    if (currentContactId) {
        await updateContactStatus(currentContactId, 'replied');
        document.getElementById('message-modal').style.display = 'none';
        currentContactId = null;
    }
});

// Update contact status
async function updateContactStatus(contactId, status) {
    try {
        await updateDoc(doc(db, 'contacts', contactId), {
            status: status,
            updatedAt: Timestamp.now()
        });
        
        // Update local data
        const contact = allContacts.find(c => c.id === contactId);
        if (contact) {
            contact.status = status;
        }
        
        // Re-render with current filter
        const currentFilter = document.getElementById('status-filter').value;
        renderContacts(currentFilter);
    } catch (error) {
        console.error('Error updating status:', error);
        alert('Error updating status. Please try again.');
    }
}

// Delete contact
async function deleteContact(contactId) {
    try {
        await deleteDoc(doc(db, 'contacts', contactId));
        
        // Remove from local data
        allContacts = allContacts.filter(c => c.id !== contactId);
        
        // Re-render with current filter
        const currentFilter = document.getElementById('status-filter').value;
        renderContacts(currentFilter);
    } catch (error) {
        console.error('Error deleting contact:', error);
        alert('Error deleting contact. Please try again.');
    }
}

