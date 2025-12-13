// Contact Form Firebase Integration
import { db } from './firebase-config.js';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

document.addEventListener('DOMContentLoaded', () => {
    // Find the contact form
    const form = document.querySelector('.wpcf7-form');
    if (!form) return;

    // Create success/error message containers
    const responseOutput = form.querySelector('.wpcf7-response-output');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form values
        const nameInput = form.querySelector('input[name="your-name"]');
        const emailInput = form.querySelector('input[name="your-email"]');
        const phoneInput = form.querySelector('input[name="phone"]');
        const subjectInput = form.querySelector('input[name="subject"]');
        const messageInput = form.querySelector('textarea[name="your-message"]');
        const acceptanceInput = form.querySelector('input[name="acceptance"]');
        
        // Validate required fields
        if (!nameInput?.value || !emailInput?.value || !phoneInput?.value || !subjectInput?.value || !messageInput?.value) {
            showMessage(responseOutput, 'Please fill in all required fields.', 'error');
            return;
        }
        
        // Validate acceptance
        if (!acceptanceInput?.checked) {
            showMessage(responseOutput, 'Please agree to the data collection terms.', 'error');
            return;
        }
        
        // Get submit button and disable it
        const submitBtn = form.querySelector('input[type="submit"]');
        const originalValue = submitBtn.value;
        submitBtn.value = 'Sending...';
        submitBtn.disabled = true;
        
        try {
            // Prepare data
            const contactData = {
                name: nameInput.value.trim(),
                email: emailInput.value.trim(),
                phone: phoneInput.value.trim(),
                subject: subjectInput.value.trim(),
                message: messageInput.value.trim(),
                status: 'new',
                createdAt: Timestamp.now()
            };
            
            // Save to Firebase
            await addDoc(collection(db, 'contacts'), contactData);
            
            // Show success message
            showMessage(responseOutput, 'Thank you for your message! We will get back to you soon.', 'success');
            
            // Reset form
            form.reset();
            
        } catch (error) {
            console.error('Error submitting contact form:', error);
            showMessage(responseOutput, 'There was an error sending your message. Please try again.', 'error');
        } finally {
            submitBtn.value = originalValue;
            submitBtn.disabled = false;
        }
    });
});

function showMessage(container, message, type) {
    if (!container) return;
    
    container.textContent = message;
    container.style.display = 'block';
    container.style.padding = '15px 20px';
    container.style.marginTop = '15px';
    container.style.borderRadius = '8px';
    container.style.fontWeight = '500';
    
    if (type === 'success') {
        container.style.backgroundColor = '#d1fae5';
        container.style.color = '#065f46';
        container.style.border = '1px solid #10b981';
    } else {
        container.style.backgroundColor = '#fee2e2';
        container.style.color = '#991b1b';
        container.style.border = '1px solid #ef4444';
    }
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        container.style.display = 'none';
    }, 5000);
}

