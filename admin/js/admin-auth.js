// Admin Authentication
import { auth } from '../../js/firebase-config.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

// Check if user is on login page
if (window.location.pathname.includes('admin/index.html') || window.location.pathname.endsWith('admin/')) {
    const loginForm = document.getElementById('loginform');
    const errorDiv = document.getElementById('login-error');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('user_login').value;
        const password = document.getElementById('user_pass').value;
        
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
        
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Redirect to dashboard
            window.location.href = 'dashboard.html';
        } catch (error) {
            errorDiv.style.display = 'block';
            errorDiv.textContent = error.message || 'Invalid username or password.';
        }
    });
}

// Check auth state and redirect if needed
onAuthStateChanged(auth, (user) => {
    const currentPath = window.location.pathname;
    
    // If on dashboard and not logged in, redirect to login
    if (currentPath.includes('dashboard.html') && !user) {
        window.location.href = 'index.html';
    }
    
    // If on login page and already logged in, redirect to dashboard
    if ((currentPath.includes('admin/index.html') || currentPath.endsWith('admin/')) && user) {
        window.location.href = 'dashboard.html';
    }
});

// Export logout function
export async function logout() {
    try {
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error signing out:', error);
    }
}

