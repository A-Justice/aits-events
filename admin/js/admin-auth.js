// Admin Authentication
import { auth } from '../../js/firebase-config.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    console.log('Admin auth script loaded');
    // Check if user is on login page
    const loginForm = document.getElementById('loginform');
    const errorDiv = document.getElementById('login-error');

    console.log('Login form found:', loginForm);

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            console.log('Form submitted');
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
                errorDiv.textContent = error.message || 'Invalid username or password.';
                submitBtn.disabled = false;
                submitBtn.value = 'Log In';
            }
        });
    }
});

// Check auth state and redirect if needed
onAuthStateChanged(auth, (user) => {
    const currentPath = window.location.pathname;
    
    // If on dashboard and not logged in, redirect to login
    if (currentPath.includes('dashboard.html') && !user) {
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

