// Admin Authentication
import { auth } from '../../js/firebase-config.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is on login page
    const loginForm = document.getElementById('loginform');
    const errorDiv = document.getElementById('login-error');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const email = document.getElementById('user_login').value;
            const password = document.getElementById('user_pass').value;
            
            if (!email || !password) {
                errorDiv.style.display = 'block';
                errorDiv.textContent = 'Please enter both email and password.';
                return;
            }
            
            errorDiv.style.display = 'none';
            errorDiv.textContent = '';
            
            // Disable submit button
            const submitBtn = document.getElementById('wp-submit');
            submitBtn.disabled = true;
            submitBtn.value = 'Logging in...';
            
            try {
                await signInWithEmailAndPassword(auth, email, password);
                // Redirect to dashboard
                window.location.href = '/admin/dashboard.html';
            } catch (error) {
                errorDiv.style.display = 'block';
                // Show user-friendly error message
                if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                    errorDiv.textContent = 'Invalid email or password.';
                } else if (error.code === 'auth/too-many-requests') {
                    errorDiv.textContent = 'Too many failed attempts. Please try again later.';
                } else {
                    errorDiv.textContent = 'Login failed. Please try again.';
                }
                submitBtn.disabled = false;
                submitBtn.value = 'Log In';
            }
        });
    }
});

// Check auth state and redirect if needed
onAuthStateChanged(auth, (user) => {
    const currentPath = window.location.pathname;
    
    // If on admin pages (not login) and not logged in, redirect to login
    if ((currentPath.includes('dashboard.html') || currentPath.includes('events.html') || currentPath.includes('bookings.html')) && !user) {
        window.location.href = '/admin/index.html';
    }
    
    // If on login page and already logged in, redirect to dashboard
    if ((currentPath.includes('admin/index.html') || currentPath.endsWith('admin/') || currentPath.endsWith('admin')) && user) {
        window.location.href = '/admin/dashboard.html';
    }
});

// Export logout function
export async function logout() {
    try {
        await signOut(auth);
        window.location.href = '/admin/index.html';
    } catch (error) {
        console.error('Error signing out:', error);
    }
}
