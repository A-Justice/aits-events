// Events Management
import { auth, db, storage } from '../../js/firebase-config.js';
import { collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, query, orderBy, Timestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';
import { logout } from './admin-auth.js';

let currentEventId = null;
let selectedImageFile = null;
let currentImageUrl = null;
let boothOptions = [];
let whatToExpect = [];
let whoShouldAttend = [];

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
    
    // Reset arrays for new event
    if (!currentEventId) {
        whatToExpect = [];
        whoShouldAttend = [];
        boothOptions = [];
        renderTagList('what-to-expect-list', whatToExpect);
        renderTagList('who-should-attend-list', whoShouldAttend);
        document.getElementById('booth-options-list').innerHTML = '';
    }
}

// Load all events
async function loadEvents() {
    try {
        const tbody = document.getElementById('events-tbody');
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">Loading events...</td></tr>';
        
        // Try to load events - handle case where startDate might not exist
        let snapshot;
        try {
            const eventsQuery = query(collection(db, 'events'), orderBy('startDate', 'desc'));
            snapshot = await getDocs(eventsQuery);
        } catch (orderError) {
            // If ordering fails, just get all events
            console.warn('Could not order by startDate, loading all events:', orderError);
            snapshot = await getDocs(collection(db, 'events'));
        }
        
        tbody.innerHTML = '';
        
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="5">No events found. <a href="/admin/events.html?action=add">Add your first event</a></td></tr>';
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
            
            let startDate = 'N/A';
            let endDate = 'N/A';
            
            if (event.startDate) {
                if (event.startDate.seconds) {
                    startDate = new Date(event.startDate.seconds * 1000).toLocaleDateString();
                } else if (event.startDate instanceof Date) {
                    startDate = event.startDate.toLocaleDateString();
                } else if (typeof event.startDate === 'string') {
                    startDate = new Date(event.startDate).toLocaleDateString();
                }
            }
            
            if (event.endDate) {
                if (event.endDate.seconds) {
                    endDate = new Date(event.endDate.seconds * 1000).toLocaleDateString();
                } else if (event.endDate instanceof Date) {
                    endDate = event.endDate.toLocaleDateString();
                } else if (typeof event.endDate === 'string') {
                    endDate = new Date(event.endDate).toLocaleDateString();
                }
            }
            
            const boothEnabled = event.boothBookingEnabled;
            const boothOptionsCount = event.boothOptions ? event.boothOptions.length : 0;
            
            row.innerHTML = `
                <td class="title column-title column-primary">
                    <strong><a href="/admin/events.html?action=edit&id=${docSnapshot.id}">${event.title || 'Untitled'}</a></strong>
                    <div class="row-actions">
                        <span class="edit"><a href="/admin/events.html?action=edit&id=${docSnapshot.id}">Edit</a> | </span>
                        <span class="trash"><a href="#" class="delete-event" data-id="${docSnapshot.id}">Delete</a></span>
                    </div>
                </td>
                <td>${startDate}</td>
                <td>${endDate}</td>
                <td>${event.venue || '—'}</td>
                <td>
                    ${boothEnabled 
                        ? `<span class="badge badge-success" title="${boothOptionsCount} option(s)">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            Enabled
                           </span>
                           <a href="/events/book-booth.html?event=${docSnapshot.id}" target="_blank" class="booth-link" title="View booking page">
                               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                   <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                   <polyline points="15 3 21 3 21 9"></polyline>
                                   <line x1="10" y1="14" x2="21" y2="3"></line>
                               </svg>
                           </a>`
                        : '<span class="badge badge-muted">—</span>'
                    }
                </td>
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
        const tbody = document.getElementById('events-tbody');
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 40px; color: var(--danger);">
            <p style="margin-bottom: 12px; font-weight: 600;">Error loading events</p>
            <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">${error.message || 'Please check your connection and try again.'}</p>
            <button onclick="location.reload()" style="padding: 8px 16px; background: var(--primary); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">Refresh Page</button>
        </td></tr>`;
    }
}

// Load single event for editing
async function loadEvent(id) {
    try {
        const eventDoc = await getDoc(doc(db, 'events', id));
        if (!eventDoc.exists()) {
            alert('Event not found');
            window.location.href = '/admin/events.html';
            return;
        }
        const eventData = eventDoc.data();
        
        if (!eventData) {
            alert('Event not found');
            window.location.href = '/admin/events.html';
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
        document.getElementById('event-capacity').value = eventData.capacity || '';
        document.getElementById('event-price').value = eventData.price || 0;
        
        // Handle existing image
        if (eventData.imageUrl) {
            currentImageUrl = eventData.imageUrl;
            document.getElementById('event-image-url').value = eventData.imageUrl;
            const imagePreviewEl = document.getElementById('image-preview');
            if (imagePreviewEl) {
                imagePreviewEl.innerHTML = `
                    <img src="${eventData.imageUrl}" alt="Current image">
                    <button type="button" class="remove-image" onclick="removeImage()">Remove Image</button>
                `;
            }
        }
        
        // Handle booth booking settings
        const boothEnabledEl = document.getElementById('booth-enabled');
        const boothContainerEl = document.getElementById('booth-options-container');
        if (boothEnabledEl && eventData.boothBookingEnabled) {
            boothEnabledEl.checked = true;
            boothContainerEl.style.display = 'block';
            if (eventData.boothOptions && eventData.boothOptions.length > 0) {
                loadBoothOptions(eventData.boothOptions);
            }
        }
        
        // Load What to Expect and Who Should Attend
        loadEventExtras(eventData);
        
        document.getElementById('form-title').textContent = 'Edit Event';
        document.getElementById('save-event-btn').textContent = 'Update';
    } catch (error) {
        console.error('Error loading event:', error);
        alert('Error loading event');
    }
}

// Image upload handling
const imageInput = document.getElementById('event-image');
const imagePreview = document.getElementById('image-preview');
const uploadProgress = document.getElementById('upload-progress');

imageInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image file is too large. Maximum size is 5MB.');
            imageInput.value = '';
            return;
        }
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file.');
            imageInput.value = '';
            return;
        }
        
        selectedImageFile = file;
        
        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.innerHTML = `
                <img src="${e.target.result}" alt="Preview">
                <button type="button" class="remove-image" onclick="removeImage()">Remove Image</button>
            `;
        };
        reader.readAsDataURL(file);
    }
});

// Remove image function
window.removeImage = function() {
    selectedImageFile = null;
    currentImageUrl = null;
    imageInput.value = '';
    imagePreview.innerHTML = '';
    document.getElementById('event-image-url').value = '';
};

// Upload image to Firebase Storage
async function uploadImage(file) {
    const fileName = `events/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const storageRef = ref(storage, fileName);
    
    return new Promise((resolve, reject) => {
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        uploadProgress.style.display = 'block';
        const progressFill = uploadProgress.querySelector('.progress-fill');
        const progressText = uploadProgress.querySelector('.progress-text');
        
        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                progressFill.style.width = progress + '%';
                progressText.textContent = `Uploading... ${Math.round(progress)}%`;
            },
            (error) => {
                console.error('Upload error:', error);
                uploadProgress.style.display = 'none';
                reject(error);
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                progressText.textContent = 'Upload complete!';
                setTimeout(() => {
                    uploadProgress.style.display = 'none';
                }, 1000);
                resolve(downloadURL);
            }
        );
    });
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
        
        // Handle image upload
        let imageUrl = currentImageUrl || document.getElementById('event-image-url').value || null;
        
        if (selectedImageFile) {
            statusDiv.innerHTML = '<span class="spinner"></span> Uploading image...';
            imageUrl = await uploadImage(selectedImageFile);
        }
        
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
            imageUrl: imageUrl,
            capacity: document.getElementById('event-capacity').value ? parseInt(document.getElementById('event-capacity').value) : null,
            price: parseFloat(document.getElementById('event-price').value) || 0,
            // Booth booking configuration
            boothBookingEnabled: document.getElementById('booth-enabled').checked,
            boothOptions: document.getElementById('booth-enabled').checked ? boothOptions.map(opt => ({
                id: opt.id,
                name: opt.name,
                price: opt.price,
                items: opt.items
            })) : [],
            // Event extras
            whatToExpect: whatToExpect,
            whoShouldAttend: whoShouldAttend,
            updatedAt: Timestamp.now()
        };
        
        if (!currentEventId) {
            formData.createdAt = Timestamp.now();
        }
        
        statusDiv.innerHTML = '<span class="spinner"></span> Saving event...';
        
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
            imagePreview.innerHTML = '';
            selectedImageFile = null;
        }
        
        setTimeout(() => {
            window.location.href = '/admin/events.html';
        }, 1500);
    } catch (error) {
        console.error('Error saving event:', error);
        statusDiv.innerHTML = '<span style="color: red;">✗ Error saving event. Please try again.</span>';
        saveBtn.disabled = false;
    }
});

// Cancel button
document.getElementById('cancel-btn')?.addEventListener('click', () => {
    window.location.href = '/admin/events.html';
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

// ==========================================
// BOOTH BOOKING CONFIGURATION
// ==========================================

// Toggle booth options visibility
const boothEnabledCheckbox = document.getElementById('booth-enabled');
const boothOptionsContainer = document.getElementById('booth-options-container');

boothEnabledCheckbox?.addEventListener('change', (e) => {
    boothOptionsContainer.style.display = e.target.checked ? 'block' : 'none';
});

// Add booth option button
document.getElementById('add-booth-option')?.addEventListener('click', () => {
    addBoothOption();
});

// Add a new booth option
function addBoothOption(optionData = null) {
    const optionId = Date.now();
    const option = optionData || {
        id: optionId,
        name: '',
        price: 0,
        items: []
    };
    
    if (!optionData) {
        boothOptions.push(option);
    }
    
    const optionHtml = `
        <div class="booth-option-card" data-option-id="${option.id}">
            <div class="option-header">
                <h5>Booth Option ${boothOptions.length}</h5>
                <button type="button" class="remove-option" onclick="removeBoothOption(${option.id})">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="option-fields">
                <div class="field-group">
                    <label>Option Name *</label>
                    <input type="text" class="booth-option-name" value="${option.name}" placeholder="e.g., Standard Booth" required>
                </div>
                <div class="field-group">
                    <label>Price (USD) *</label>
                    <input type="number" class="booth-option-price" value="${option.price}" min="0" step="0.01" required>
                </div>
                <div class="field-group full-width">
                    <label>Included Items</label>
                    <div class="booth-items-list" id="booth-items-${option.id}">
                        ${option.items.map(item => `
                            <span class="booth-item-tag">
                                ${item}
                                <button type="button" onclick="removeBoothItem(${option.id}, '${item}')">&times;</button>
                            </span>
                        `).join('')}
                    </div>
                    <div class="add-item-row">
                        <input type="text" id="new-item-${option.id}" placeholder="Add item (e.g., Exhibition Table)">
                        <button type="button" onclick="addBoothItem(${option.id})">Add</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('booth-options-list').insertAdjacentHTML('beforeend', optionHtml);
    
    // Add event listeners for input changes
    const card = document.querySelector(`[data-option-id="${option.id}"]`);
    card.querySelector('.booth-option-name').addEventListener('input', (e) => {
        const opt = boothOptions.find(o => o.id === option.id);
        if (opt) opt.name = e.target.value;
    });
    card.querySelector('.booth-option-price').addEventListener('input', (e) => {
        const opt = boothOptions.find(o => o.id === option.id);
        if (opt) opt.price = parseFloat(e.target.value) || 0;
    });
    
    // Enter key to add item
    document.getElementById(`new-item-${option.id}`)?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addBoothItem(option.id);
        }
    });
}

// Remove booth option
window.removeBoothOption = function(optionId) {
    boothOptions = boothOptions.filter(o => o.id !== optionId);
    document.querySelector(`[data-option-id="${optionId}"]`)?.remove();
    // Re-number the options
    document.querySelectorAll('.booth-option-card').forEach((card, index) => {
        card.querySelector('.option-header h5').textContent = `Booth Option ${index + 1}`;
    });
};

// Add item to booth option
window.addBoothItem = function(optionId) {
    const input = document.getElementById(`new-item-${optionId}`);
    const itemName = input.value.trim();
    
    if (!itemName) return;
    
    const option = boothOptions.find(o => o.id === optionId);
    if (option && !option.items.includes(itemName)) {
        option.items.push(itemName);
        
        const itemsContainer = document.getElementById(`booth-items-${optionId}`);
        itemsContainer.insertAdjacentHTML('beforeend', `
            <span class="booth-item-tag">
                ${itemName}
                <button type="button" onclick="removeBoothItem(${optionId}, '${itemName}')">&times;</button>
            </span>
        `);
        
        input.value = '';
    }
};

// Remove item from booth option
window.removeBoothItem = function(optionId, itemName) {
    const option = boothOptions.find(o => o.id === optionId);
    if (option) {
        option.items = option.items.filter(i => i !== itemName);
    }
    
    // Remove the tag from DOM
    const itemsContainer = document.getElementById(`booth-items-${optionId}`);
    const tags = itemsContainer.querySelectorAll('.booth-item-tag');
    tags.forEach(tag => {
        if (tag.textContent.trim().startsWith(itemName)) {
            tag.remove();
        }
    });
};

// Load booth options when editing
function loadBoothOptions(options) {
    boothOptions = [];
    document.getElementById('booth-options-list').innerHTML = '';
    
    if (options && options.length > 0) {
        options.forEach(opt => {
            const option = {
                id: opt.id || Date.now() + Math.random(),
                name: opt.name,
                price: opt.price,
                items: opt.items || []
            };
            boothOptions.push(option);
            addBoothOption(option);
        });
    }
}

// ==========================================
// WHAT TO EXPECT & WHO SHOULD ATTEND
// ==========================================

// Render tag list
function renderTagList(listId, items) {
    const container = document.getElementById(listId);
    if (!container) return;
    
    container.innerHTML = items.map(item => `
        <span class="tag-item">
            ${item}
            <button type="button" data-item="${item}">&times;</button>
        </span>
    `).join('');
    
    // Add click handlers
    container.querySelectorAll('.tag-item button').forEach(btn => {
        btn.addEventListener('click', () => {
            const itemToRemove = btn.dataset.item;
            if (listId === 'what-to-expect-list') {
                whatToExpect = whatToExpect.filter(i => i !== itemToRemove);
                renderTagList('what-to-expect-list', whatToExpect);
            } else if (listId === 'who-should-attend-list') {
                whoShouldAttend = whoShouldAttend.filter(i => i !== itemToRemove);
                renderTagList('who-should-attend-list', whoShouldAttend);
            }
        });
    });
}

// Add What to Expect item
document.getElementById('add-expect-item')?.addEventListener('click', () => {
    const input = document.getElementById('new-expect-item');
    const value = input.value.trim();
    if (value && !whatToExpect.includes(value)) {
        whatToExpect.push(value);
        renderTagList('what-to-expect-list', whatToExpect);
        input.value = '';
    }
});

document.getElementById('new-expect-item')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('add-expect-item')?.click();
    }
});

// Add Who Should Attend item
document.getElementById('add-attend-item')?.addEventListener('click', () => {
    const input = document.getElementById('new-attend-item');
    const value = input.value.trim();
    if (value && !whoShouldAttend.includes(value)) {
        whoShouldAttend.push(value);
        renderTagList('who-should-attend-list', whoShouldAttend);
        input.value = '';
    }
});

document.getElementById('new-attend-item')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('add-attend-item')?.click();
    }
});

// Load What to Expect and Who Should Attend when editing
function loadEventExtras(eventData) {
    whatToExpect = eventData.whatToExpect || [];
    whoShouldAttend = eventData.whoShouldAttend || [];
    
    renderTagList('what-to-expect-list', whatToExpect);
    renderTagList('who-should-attend-list', whoShouldAttend);
}

