// Partner Form JavaScript
import { db, storage, collection, getDocs, addDoc, query, orderBy, Timestamp, ref, uploadBytesResumable, getDownloadURL } from './firebase-config.js';

let selectedFile = null;
let uploadedFileUrl = null;

// Load upcoming events into dropdown
async function loadUpcomingEvents() {
    const eventSelect = document.getElementById('event-select');
    if (!eventSelect) return;
    
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const eventsQuery = query(collection(db, 'events'), orderBy('startDate', 'asc'));
        const snapshot = await getDocs(eventsQuery);
        
        const upcomingEvents = [];
        snapshot.forEach((doc) => {
            const event = doc.data();
            let endDate = null;
            
            if (event.endDate) {
                if (event.endDate.seconds) {
                    endDate = new Date(event.endDate.seconds * 1000);
                } else if (event.endDate.toDate) {
                    endDate = event.endDate.toDate();
                }
            } else if (event.startDate) {
                if (event.startDate.seconds) {
                    endDate = new Date(event.startDate.seconds * 1000);
                }
            }
            
            if (endDate && endDate >= today) {
                upcomingEvents.push({ id: doc.id, ...event });
            }
        });
        
        // Clear existing options
        eventSelect.innerHTML = '<option value="">Select an event...</option>';
        
        if (upcomingEvents.length === 0) {
            eventSelect.innerHTML = '<option value="">No upcoming events available</option>';
            return;
        }
        
        upcomingEvents.forEach((event, index) => {
            const option = document.createElement('option');
            option.value = event.id;
            option.textContent = event.title;
            option.dataset.eventTitle = event.title;
            
            // Auto-select first event
            if (index === 0) {
                option.selected = true;
            }
            
            eventSelect.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error loading events:', error);
        eventSelect.innerHTML = '<option value="">Error loading events</option>';
    }
}

// File upload handling
function setupFileUpload() {
    const fileUploadArea = document.getElementById('bio-upload-area');
    const fileInput = document.getElementById('bio-file');
    const filePreview = document.getElementById('file-preview');
    const fileName = document.getElementById('file-name');
    const removeFileBtn = document.getElementById('remove-file');
    
    if (!fileUploadArea || !fileInput) return;
    
    // Click to upload
    fileUploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Drag and drop
    fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadArea.classList.add('dragover');
    });
    
    fileUploadArea.addEventListener('dragleave', () => {
        fileUploadArea.classList.remove('dragover');
    });
    
    fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    });
    
    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });
    
    // Remove file
    removeFileBtn?.addEventListener('click', () => {
        selectedFile = null;
        uploadedFileUrl = null;
        fileInput.value = '';
        filePreview.classList.remove('active');
    });
}

function handleFileSelect(file) {
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
    
    if (!allowedTypes.includes(file.type)) {
        alert('Please upload a PDF, Word document, or image file.');
        return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB.');
        return;
    }
    
    selectedFile = file;
    
    const filePreview = document.getElementById('file-preview');
    const fileName = document.getElementById('file-name');
    
    fileName.textContent = file.name;
    filePreview.classList.add('active');
}

// Upload file to Firebase Storage
async function uploadFile(file, partnerType) {
    const storageRef = ref(storage, `partners/${partnerType}/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    return new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload progress:', progress + '%');
            },
            (error) => {
                reject(error);
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(downloadURL);
            }
        );
    });
}

// Form submission
function setupFormSubmission(partnerType) {
    const form = document.getElementById('partner-form');
    const submitBtn = document.getElementById('submit-btn');
    const formContent = document.getElementById('form-content');
    const successMessage = document.getElementById('success-message');
    
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<svg class="spinner" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="60" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/></circle></svg> Submitting...';
        
        try {
            // Upload bio file if selected
            if (selectedFile) {
                uploadedFileUrl = await uploadFile(selectedFile, partnerType);
            }
            
            // Get selected event
            const eventSelect = document.getElementById('event-select');
            const selectedOption = eventSelect.options[eventSelect.selectedIndex];
            
            // Build base data
            const formData = {
                type: partnerType,
                eventId: eventSelect.value,
                eventTitle: selectedOption?.dataset?.eventTitle || selectedOption?.textContent || '',
                name: document.getElementById('name').value.trim(),
                email: document.getElementById('email').value.trim(),
                phone: document.getElementById('phone')?.value?.trim() || null,
                organization: document.getElementById('organization').value.trim(),
                position: document.getElementById('position')?.value?.trim() || null,
                linkedIn: document.getElementById('linkedin')?.value?.trim() || null,
                website: document.getElementById('website')?.value?.trim() || null,
                bioUrl: uploadedFileUrl,
                message: document.getElementById('message')?.value?.trim() || null,
                status: 'pending',
                createdAt: Timestamp.now()
            };
            
            // Add type-specific fields
            if (partnerType === 'sponsor') {
                formData.sponsorshipLevel = document.getElementById('sponsorship-level')?.value || null;
                formData.companyDescription = document.getElementById('company-description')?.value?.trim() || null;
            } else if (partnerType === 'speaker') {
                formData.expertise = document.getElementById('expertise')?.value?.trim() || null;
                formData.talkTitle = document.getElementById('talk-title')?.value?.trim() || null;
                formData.talkDescription = document.getElementById('talk-description')?.value?.trim() || null;
                formData.previousSpeaking = document.getElementById('previous-speaking')?.value?.trim() || null;
            } else if (partnerType === 'volunteer') {
                // Get selected services
                const services = [];
                document.querySelectorAll('input[name="services"]:checked').forEach((checkbox) => {
                    services.push(checkbox.value);
                });
                const otherService = document.getElementById('other-service')?.value?.trim();
                if (otherService) {
                    services.push(otherService);
                }
                formData.services = services;
                formData.availability = document.getElementById('availability')?.value?.trim() || null;
                formData.experience = document.getElementById('experience')?.value?.trim() || null;
            }
            
            // Save to Firebase
            await addDoc(collection(db, 'partners'), formData);
            
            // Show success message
            formContent.style.display = 'none';
            successMessage.classList.add('active');
            
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('Error submitting form. Please try again.');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg> Submit Application';
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadUpcomingEvents();
    setupFileUpload();
    
    // Get partner type from page
    const partnerType = document.body.dataset.partnerType;
    if (partnerType) {
        setupFormSubmission(partnerType);
    }
});

