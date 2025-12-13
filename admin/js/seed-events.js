// Seed Past Events to Firebase
import { db } from '../../js/firebase-config.js';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

// Past events data from the screenshots
const pastEvents = [
    {
        title: "Manufacturing Competitiveness Workshop",
        description: "Details Start: 20th November 2025 Time: All day Venue Addis Ababa – Ethiopia Phone: +233 55 203 0000, +233 20 19 111 91 Organizer Economic Zones Chamber Manufacturing Competitiveness Workshop is a comprehensive event bringing together industry leaders, manufacturers, and policymakers to discuss strategies for enhancing manufacturing competitiveness across Africa.",
        startDate: new Date('2025-11-20T00:00:00'),
        startTime: "All day",
        endDate: new Date('2025-11-20T23:59:59'),
        endTime: null,
        venue: "Addis Ababa",
        location: "Ethiopia",
        organizer: "Economic Zones Chamber",
        phone: "+233 55 203 0000, +233 20 19 111 91",
        imageUrl: "/wp-content/uploads/2025/03/Manufacturing-Competitiveness-Workshop-New.jpg",
        capacity: null,
        price: 0
    },
    {
        title: "Policy Round Table 2.0",
        description: "Details Start: 21st August 2025 Time: 9am to 3pm each day Venue Nairobi - Kenya Phone: +233 55 203 0000, +233 20 19 111 91 Organizer Economic Zones Chamber Policy Roundtable 2.0 is a strategic gathering of policymakers, industry leaders, and stakeholders to discuss and shape policies that drive industrial growth and economic development across Africa.",
        startDate: new Date('2025-08-21T09:00:00'),
        startTime: "9:00 AM",
        endDate: new Date('2025-08-21T15:00:00'),
        endTime: "3:00 PM",
        venue: "Nairobi",
        location: "Kenya",
        organizer: "Economic Zones Chamber",
        phone: "+233 55 203 0000, +233 20 19 111 91",
        imageUrl: "/wp-content/uploads/2025/03/Policy-Round-Table-Kenya-Edition.jpg",
        capacity: null,
        price: 0
    },
    {
        title: "Skills for Jobs - Training for Employment",
        description: "Details Start: 1st May 2025 Time: All day Venue Ghana, Nigeria, Kenya, Botswana, Ethiopia, DRC and Namibia Phone: +233 55 203 0000, +233 20 19 111 91 Organizer Economic Zones Academy SEZs - TFE 2025: Pharma, Agro & Textiles Module. Objective: to create up to 105,000 sustainable jobs in special economic zones, with improved working conditions and social protection across 7 countries in SSA.",
        startDate: new Date('2025-05-01T00:00:00'),
        startTime: "All day",
        endDate: new Date('2025-05-01T23:59:59'),
        endTime: null,
        venue: "Multiple Locations",
        location: "Ghana, Nigeria, Kenya, Botswana, Ethiopia, DRC and Namibia",
        organizer: "Economic Zones Academy",
        phone: "+233 55 203 0000, +233 20 19 111 91",
        imageUrl: "/wp-content/uploads/2025/03/Skills-for-Jobs-TFE-2025.jpg",
        capacity: null,
        price: 0
    }
];

// Function to seed events
async function seedEvents() {
    const statusDiv = document.getElementById('seed-status');
    
    try {
        statusDiv.innerHTML = '<p>Seeding events...</p>';
        
        for (const event of pastEvents) {
            const eventData = {
                ...event,
                startDate: Timestamp.fromDate(event.startDate),
                endDate: Timestamp.fromDate(event.endDate),
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            };
            
            const docRef = await addDoc(collection(db, 'events'), eventData);
            console.log('Added event:', event.title, 'with ID:', docRef.id);
            statusDiv.innerHTML += `<p>✓ Added: ${event.title}</p>`;
        }
        
        statusDiv.innerHTML += '<p style="color: green; font-weight: bold;">All events seeded successfully!</p>';
    } catch (error) {
        console.error('Error seeding events:', error);
        statusDiv.innerHTML += `<p style="color: red;">Error: ${error.message}</p>`;
    }
}

// Expose function globally
window.seedEvents = seedEvents;

