// ===== VARIABLES GLOBALES =====
let currentTheme = localStorage.getItem('theme') || 'light';
let isLoading = true;
let currentFilter = 'all';
let vehiclesData = [];
let currentUser = null;

// ===== CONFIGURACIÓN DE FIREBASE =====
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut, onAuthStateChanged, updateProfile, sendEmailVerification } from "firebase/auth";
import { getFirestore, collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAbdBUxV-ng53R5Aff0_HcP1Q9JelWzZvg",
    authDomain: "autoxpert-e3d12.firebaseapp.com",
    projectId: "autoxpert-e3d12",
    storageBucket: "autoxpert-e3d12.firebasestorage.app",
    messagingSenderId: "996463978771",
    appId: "1:996463978771:web:4f7cea4c811f7e510f92e6",
    measurementId: "G-BCJXM576VH"
};

// Initialize Firebase
let app, auth, db, analytics, googleProvider;

try {
    app = initializeApp(firebaseConfig);
    
    // Initialize Firebase Authentication and get a reference to the service
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.addScope('email');
    googleProvider.addScope('profile');
    
    // Initialize Cloud Firestore and get a reference to the service
    db = getFirestore(app);
    
    // Initialize Analytics (puede fallar si la API key no es válida)
    try {
        analytics = getAnalytics(app);
    } catch (analyticsError) {
        console.warn('Analytics no se pudo inicializar:', analyticsError);
        // No bloqueamos la app si Analytics falla
    }
    
    console.log('✅ Firebase inicializado correctamente');
} catch (firebaseError) {
    console.error('❌ Error al inicializar Firebase:', firebaseError);
    // Mostrar mensaje al usuario
    setTimeout(() => {
        if (typeof showAuthError === 'function') {
            showAuthError('Error de configuración de Firebase. Verifica tu API key en Firebase Console.');
        } else {
            alert('Error de configuración de Firebase. Por favor, verifica tu API key en Firebase Console.');
        }
    }, 1000);
}

// Detectar si estamos en modo demo (sin configuración real)
const isDemoMode = false; // Ahora tenemos Firebase real configurado

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar fondo animado del login
    initializeAuthBackground();
    
    // Limpiar campos inmediatamente cuando el DOM esté listo
    clearLoginFields();
    
    initializeAppUI();
    initializeAuth();
    
    // Limpiar campos nuevamente después de que todo esté cargado
    setTimeout(() => {
        clearLoginFields();
    }, 500);
});

function initializeAppUI() {
    // Aplicar tema guardado
    applyTheme(currentTheme);
    
    // Inicializar componentes
    initializeNavigation();
    initializeThemeToggle();
    initializeScrollEffects();
    initializeCatalogFilters();
    initializeAnimations();
    initializeForms();
    initializeTabs();
    initializeBackToTop();
    initializeModals();
    
    // Cargar datos del catálogo
    loadVehicleCatalog();
    
    // Limpiar campos una vez más después de inicializar todo
    setTimeout(() => {
        clearLoginFields();
    }, 200);
    
    console.log('🚗 AutoXpert - Aplicación inicializada correctamente');
}

function clearLoginFields() {
    // Limpiar campos de login en la landing page
    const loginEmail = document.getElementById('landing-login-email');
    const loginPassword = document.getElementById('landing-login-password');
    
    if (loginEmail) {
        // Truco para evitar autocompletado: cambiar temporalmente el tipo
        const originalType = loginEmail.type;
        loginEmail.type = 'text';
        
        // Remover cualquier valor prellenado
        loginEmail.value = '';
        loginEmail.setAttribute('autocomplete', 'off');
        loginEmail.removeAttribute('value');
        
        // Restaurar el tipo original
        setTimeout(() => {
            if (loginEmail) {
                loginEmail.type = originalType;
                loginEmail.setAttribute('autocomplete', 'new-password');
            }
        }, 50);
        
        // Agregar listener para prevenir autocompletado del navegador
        const clearOnFocus = function() {
            if (this.value && this.value.trim() !== '') {
                this.value = '';
            }
        };
        loginEmail.removeEventListener('focus', clearOnFocus);
        loginEmail.addEventListener('focus', clearOnFocus);
        
        // Forzar limpieza múltiples veces para asegurar
        [50, 100, 200, 300].forEach(delay => {
            setTimeout(() => {
                if (loginEmail && loginEmail.value) {
                    loginEmail.value = '';
                }
            }, delay);
        });
    }
    
    if (loginPassword) {
        // Truco para evitar autocompletado: cambiar temporalmente el tipo
        const originalType = loginPassword.type;
        loginPassword.type = 'text';
        
        // Remover cualquier valor prellenado
        loginPassword.value = '';
        loginPassword.setAttribute('autocomplete', 'off');
        loginPassword.removeAttribute('value');
        
        // Restaurar el tipo original
        setTimeout(() => {
            if (loginPassword) {
                loginPassword.type = originalType;
                loginPassword.setAttribute('autocomplete', 'new-password');
            }
        }, 50);
        
        // Agregar listener para prevenir autocompletado del navegador
        const clearOnFocus = function() {
            if (this.value && this.value.trim() !== '') {
                this.value = '';
            }
        };
        loginPassword.removeEventListener('focus', clearOnFocus);
        loginPassword.addEventListener('focus', clearOnFocus);
        
        // Forzar limpieza múltiples veces para asegurar
        [50, 100, 200, 300].forEach(delay => {
            setTimeout(() => {
                if (loginPassword && loginPassword.value) {
                    loginPassword.value = '';
                }
            }, delay);
        });
    }
}

// ===== AUTENTICACIÓN =====
function initializeAuth() {
    // Escuchar cambios en el estado de autenticación
    onAuthStateChanged(auth, (user) => {
        const authLanding = document.getElementById('auth-landing');
        const mainApp = document.getElementById('main-app');

        if (user) {
            currentUser = user;
            
            // Add logged-in class to body for CSS toggling
            document.body.classList.add('user-logged-in');
            
            // Hide landing, show app
            if (authLanding) authLanding.style.display = 'none';
            if (mainApp) {
                mainApp.style.display = 'block';
                // Trigger scroll animations for hero section since it's now visible
                setTimeout(triggerScrollAnimations, 500);
            }

            // showUserProfile is now handled by CSS via body class, but we keep it for avatar update if needed
            showUserProfile(user);
            
            // Si el usuario no ha verificado su email, mostrar modal
            if (!user.emailVerified && !user.providerData.some(p => p.providerId === 'google.com')) {
                showEmailVerificationModal(user.email);
            }
        } else {
            currentUser = null;
            
            // Remove logged-in class
            document.body.classList.remove('user-logged-in');
            
            // Show landing, hide app
            if (authLanding) authLanding.style.display = 'flex';
            if (mainApp) mainApp.style.display = 'none';

            showAuthButtons();
        }
        
        // Ocultar loader después de verificar autenticación
        if (isLoading) {
            setTimeout(() => {
                hideLoader();
            }, 1500);
        }
    });
    
    // Inicializar formularios de autenticación
    initializeAuthForms();
}

function showUserProfile(user) {
    const authButtons = document.getElementById('auth-buttons');
    const userProfile = document.getElementById('user-profile');
    
    // Hide auth buttons (Login/Register)
    if (authButtons) authButtons.style.display = 'none';
    
    // Show user profile section (which now contains only Logout button)
    if (userProfile) userProfile.style.display = 'block';
}

function showAuthButtons() {
    const authButtons = document.getElementById('auth-buttons');
    const userProfile = document.getElementById('user-profile');
    
    if (authButtons) authButtons.style.display = 'flex';
    if (userProfile) userProfile.style.display = 'none';
}

function hideLoader() {
    const loader = document.querySelector('.loader');
    if (loader) {
        loader.classList.add('hidden');
        isLoading = false;
        
        setTimeout(() => {
            triggerScrollAnimations();
        }, 500);
    }
}

// ===== FUNCIONES DE AUTENTICACIÓN =====

function initializeAuthForms() {
    // Formulario de login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Formulario de registro
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Formulario de recuperar contraseña
    const forgotForm = document.getElementById('forgot-password-form');
    if (forgotForm) {
        forgotForm.addEventListener('submit', handleForgotPassword);
    }
    
    // Validación de contraseña en tiempo real
    const registerPassword = document.getElementById('register-password');
    if (registerPassword) {
        registerPassword.addEventListener('input', checkPasswordStrength);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    try {
        showLoading(submitBtn);
        
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        showAuthSuccess('¡Bienvenido de vuelta!');
        closeModal('login-modal');
        
    } catch (error) {
        showAuthError(getAuthErrorMessage(error.code));
    } finally {
        hideLoading(submitBtn, '<i class="fas fa-sign-in-alt"></i> Iniciar Sesión');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('register-firstname').value;
    const lastName = document.getElementById('register-lastname').value;
    const email = document.getElementById('register-email').value;
    const phone = document.getElementById('register-phone').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Validaciones
    if (password !== confirmPassword) {
        showAuthError('Las contraseñas no coinciden');
        return;
    }
    
    if (password.length < 6) {
        showAuthError('La contraseña debe tener al menos 6 caracteres');
        return;
    }
    
    try {
        showLoading(submitBtn);
        
        // Crear usuario
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Actualizar perfil
        await updateProfile(user, {
            displayName: `${firstName} ${lastName}`
        });
        
        // Guardar datos adicionales en Firestore
        await setDoc(doc(db, 'users', user.uid), {
            firstName: firstName,
            lastName: lastName,
            email: email,
            phone: phone,
            createdAt: serverTimestamp(),
            newsletter: document.getElementById('accept-newsletter').checked
        });
        
        // Enviar email de verificación
        await sendEmailVerification(user, {
            url: window.location.origin
        });
        
        showAuthSuccess('¡Cuenta creada exitosamente! Revisa tu email para verificar tu cuenta.');
        closeModal('register-modal');
        showEmailVerificationModal(email);
        
    } catch (error) {
        showAuthError(getAuthErrorMessage(error.code));
    } finally {
        hideLoading(submitBtn, '<i class="fas fa-user-plus"></i> Crear Cuenta');
    }
}

async function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = document.getElementById('forgot-email').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    try {
        showLoading(submitBtn);
        
        await sendPasswordResetEmail(auth, email);
        
        showAuthSuccess('¡Enlace enviado! Revisa tu email para restablecer tu contraseña.');
        closeModal('forgot-password-modal');
        
    } catch (error) {
        showAuthError(getAuthErrorMessage(error.code));
    } finally {
        hideLoading(submitBtn, '<i class="fas fa-paper-plane"></i> Enviar Enlace');
    }
}

async function loginWithGoogle() {
    try {
        if (isDemoMode) {
            // Simular login con Google
            const mockUser = {
                uid: 'demo-google-user',
                email: 'demo@google.com',
                displayName: 'Demo User',
                photoURL: 'https://via.placeholder.com/150',
                emailVerified: true
            };
            sessionStorage.setItem('demoUser', JSON.stringify(mockUser));
            showAuthSuccess('¡Bienvenido (Modo Demo)!');
            setTimeout(() => location.reload(), 1000);
            return;
        }

        // Verificar que Firebase esté correctamente inicializado
        if (!auth || !googleProvider) {
            const errorMsg = 'Firebase no está correctamente configurado. Por favor:\n\n' +
                           '1. Ve a Firebase Console (https://console.firebase.google.com/)\n' +
                           '2. Selecciona tu proyecto\n' +
                           '3. Ve a Configuración del proyecto\n' +
                           '4. Verifica que la API key sea correcta\n' +
                           '5. Asegúrate de que Google Authentication esté habilitado';
            showAuthError(errorMsg);
            console.error('Firebase no inicializado:', { auth, googleProvider });
            return;
        }

        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        
        // Si es un nuevo usuario, guardar datos en Firestore
        if (result._tokenResponse?.isNewUser) {
            try {
                if (db) {
                    await setDoc(doc(db, 'users', user.uid), {
                        firstName: user.displayName?.split(' ')[0] || '',
                        lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
                        email: user.email,
                        photoURL: user.photoURL,
                        provider: 'google',
                        createdAt: serverTimestamp()
                    });
                }
            } catch (firestoreError) {
                console.warn('Error al guardar en Firestore:', firestoreError);
                // No bloqueamos el login si falla guardar en Firestore
            }
        }
        
        showAuthSuccess('¡Bienvenido!');
        closeModal('login-modal');
        closeModal('register-modal');
        
    } catch (error) {
        console.error('Google Auth Error:', error);
        
        // Mensajes de error más específicos y útiles
        let errorMessage = 'Error al iniciar sesión con Google';
        
        if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = 'Ventana de Google cerrada. Intenta nuevamente.';
        } else if (error.code === 'auth/cancelled-popup-request') {
            errorMessage = 'Solicitud cancelada. Intenta nuevamente.';
        } else if (error.code === 'auth/popup-blocked') {
            errorMessage = 'Ventana emergente bloqueada. Permite ventanas emergentes para este sitio.';
        } else if (error.code === 'auth/unauthorized-domain') {
            errorMessage = '⚠️ Dominio no autorizado para Google Auth\n\n' +
                          'Solución:\n' +
                          '1. Ve a Firebase Console: https://console.firebase.google.com/\n' +
                          '2. Selecciona tu proyecto "autoxpert-e3d12"\n' +
                          '3. Ve a Authentication > Settings\n' +
                          '4. Baja hasta "Authorized domains"\n' +
                          '5. Haz clic en "Add domain"\n' +
                          '6. Agrega: 127.0.0.1\n' +
                          '7. Si usas otro puerto, agrega: 127.0.0.1:puerto (ej: 127.0.0.1:3000)\n' +
                          '8. Guarda y recarga esta página';
        } else if (error.code === 'auth/api-key-not-valid' || 
                   error.code === 'auth/invalid-api-key' ||
                   error.message?.includes('API key not valid') ||
                   error.message?.includes('API_KEY_INVALID')) {
            errorMessage = '⚠️ API Key de Firebase inválida\n\n' +
                          'Solución:\n' +
                          '1. Ve a https://console.firebase.google.com/\n' +
                          '2. Selecciona tu proyecto "autoxpert-e3d12"\n' +
                          '3. Ve a ⚙️ Configuración del proyecto\n' +
                          '4. Copia la API key correcta\n' +
                          '5. Actualiza script.js línea 17\n' +
                          '6. Asegúrate de que Google Auth esté habilitado en Authentication > Sign-in method';
        } else {
            errorMessage = getAuthErrorMessage(error.code) || error.message || 'Error desconocido al iniciar sesión con Google';
        }
        
        showAuthError(errorMessage);
    }
}

async function registerWithGoogle() {
    await loginWithGoogle(); // Mismo proceso para registro
}

async function logout() {
    try {
        if (isDemoMode) {
            sessionStorage.removeItem('demoUser');
            currentUser = null;
            
            // Redirect to Auth Landing logic
            const authLanding = document.getElementById('auth-landing');
            const mainApp = document.getElementById('main-app');
            
            if (mainApp) mainApp.style.display = 'none';
            if (authLanding) authLanding.style.display = 'flex';
            
            showAuthSuccess('¡Hasta pronto!');
            
            // Reset forms if needed
            location.reload(); 
            return;
        }

        await signOut(auth);
        showAuthSuccess('¡Hasta pronto!');
        
        // UI updates handled by onAuthStateChanged, but force reload to ensure clean state
        location.reload();
        
    } catch (error) {
        showAuthError('Error al cerrar sesión');
    }
}

// Funciones auxiliares
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.parentElement.querySelector('.toggle-password i');
    
    if (input.type === 'password') {
        input.type = 'text';
        button.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        button.className = 'fas fa-eye';
    }
}

function checkPasswordStrength() {
    const password = document.getElementById('register-password').value;
    const strengthIndicator = document.getElementById('password-strength');
    
    if (!strengthIndicator) return;
    
    let strength = 0;
    
    if (password.length >= 6) strength++;
    if (password.match(/[a-z]/)) strength++;
    if (password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    
    strengthIndicator.className = 'password-strength';
    
    if (strength < 2) {
        strengthIndicator.classList.add('weak');
    } else if (strength < 4) {
        strengthIndicator.classList.add('medium');
    } else {
        strengthIndicator.classList.add('strong');
    }
}

function toggleUserMenu() {
    const userMenu = document.getElementById('user-menu');
    if (userMenu) {
        userMenu.classList.toggle('show');
    }
}

function showEmailVerificationModal(email) {
    const modal = document.getElementById('email-verification-modal');
    const emailSpan = document.getElementById('verification-email');
    
    if (emailSpan) {
        emailSpan.textContent = email;
    }
    
    openModal('email-verification-modal');
}

async function resendVerificationEmail() {
    try {
        const user = auth.currentUser;
        if (user) {
            await sendEmailVerification(user);
            showAuthSuccess('¡Email de verificación reenviado!');
        }
    } catch (error) {
        showAuthError('Error al reenviar email');
    }
}

function showLoading(button) {
    button.disabled = true;
    button.innerHTML = '<span class="auth-loading"></span> Procesando...';
}

function hideLoading(button, originalText) {
    button.disabled = false;
    button.innerHTML = originalText;
}

function showAuthSuccess(message) {
    // Crear notificación de éxito
    const notification = document.createElement('div');
    notification.className = 'auth-success';
    notification.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 4000);
}

function showAuthError(message) {
    // Crear notificación de error
    const notification = document.createElement('div');
    notification.className = 'auth-error';
    notification.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function getAuthErrorMessage(errorCode) {
    const errorMessages = {
        'auth/user-not-found': 'No existe una cuenta con este email',
        'auth/wrong-password': 'Contraseña incorrecta',
        'auth/invalid-credential': 'Email o contraseña incorrectos. Verifica tus credenciales.',
        'auth/email-already-in-use': 'Ya existe una cuenta con este email',
        'auth/weak-password': 'La contraseña es muy débil',
        'auth/invalid-email': 'Email inválido',
        'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
        'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
        'auth/popup-closed-by-user': 'Ventana cerrada por el usuario',
        'auth/cancelled-popup-request': 'Solicitud cancelada',
        'auth/popup-blocked': 'Ventana emergente bloqueada. Permite ventanas emergentes para este sitio.',
        'auth/unauthorized-domain': 'Este dominio no está autorizado. Agrega 127.0.0.1 en Firebase Console > Authentication > Settings > Authorized domains.',
        'auth/invalid-api-key': 'Configuración de Firebase inválida. Verifica tu API Key en Firebase Console.',
        'auth/api-key-not-valid': 'La API key de Firebase no es válida. Verifica la configuración en Firebase Console.',
        'auth/project-not-found': 'Proyecto de Firebase no encontrado. Verifica tu configuración.',
        'auth/network-request-failed': 'Error de conexión. Verifica tu internet.',
        'auth/internal-error': 'Error interno. Intenta nuevamente más tarde.'
    };
    
    return errorMessages[errorCode] || `Error: ${errorCode || 'Desconocido'}. Intenta nuevamente.`;
}

// Funciones del perfil de usuario
function showUserOrders() {
    console.log('Mostrar vehículos del usuario');
    // Aquí puedes agregar la lógica para mostrar los vehículos
}

function showUserSettings() {
    console.log('Mostrar configuración');
    // Aquí puedes agregar la lógica para mostrar configuración
}

// ===== NAVEGACIÓN =====
function initializeNavigation() {
    const navbar = document.querySelector('.navbar');
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Efecto scroll en navbar
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // Toggle menú móvil
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
    
    // Cerrar menú al hacer click en enlaces
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
    
    // Smooth scroll para enlaces internos
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const offsetTop = target.offsetTop - 70;
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
}

// ===== TOGGLE DE TEMA =====
function initializeThemeToggle() {
    const themeToggle = document.querySelector('.theme-toggle');
    
    themeToggle.addEventListener('click', () => {
        currentTheme = currentTheme === 'light' ? 'dark' : 'light';
        applyTheme(currentTheme);
        localStorage.setItem('theme', currentTheme);
        
        // Animación del botón
        themeToggle.style.transform = 'scale(0.8)';
        setTimeout(() => {
            themeToggle.style.transform = 'scale(1)';
        }, 150);
    });
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const themeToggle = document.querySelector('.theme-toggle i');
    
    if (theme === 'dark') {
        themeToggle.className = 'fas fa-sun';
    } else {
        themeToggle.className = 'fas fa-moon';
    }
}

// ===== EFECTOS DE SCROLL =====
function initializeScrollEffects() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-up');
            }
        });
    }, observerOptions);
    
    // Observar elementos para animaciones
    const animatedElements = document.querySelectorAll(
        '.vehicle-card, .workshop-card, .team-member, .contact-item, .section-header'
    );
    
    animatedElements.forEach(el => {
        observer.observe(el);
    });
}

function triggerScrollAnimations() {
    const elements = document.querySelectorAll('.hero-title, .hero-subtitle, .hero-description, .hero-buttons');
    elements.forEach((el, index) => {
        setTimeout(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, index * 200);
    });
}

// ===== FILTROS DEL CATÁLOGO =====
function initializeCatalogFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remover clase active de todos los botones
            filterButtons.forEach(b => b.classList.remove('active'));
            
            // Agregar clase active al botón clickeado
            btn.classList.add('active');
            
            // Obtener filtro seleccionado
            currentFilter = btn.getAttribute('data-filter');
            
            // Filtrar vehículos
            filterVehicles(currentFilter);
        });
    });
}

function filterVehicles(filter) {
    const vehicleCards = document.querySelectorAll('.vehicle-card');
    
    vehicleCards.forEach(card => {
        const category = card.getAttribute('data-category');
        
        if (filter === 'all' || category === filter) {
            card.style.display = 'block';
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 100);
        } else {
            card.style.opacity = '0';
            card.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                card.style.display = 'none';
            }, 300);
        }
    });
}

// ===== CATÁLOGO DE VEHÍCULOS =====
function loadVehicleCatalog() {
    vehiclesData = [
        {
            id: 1,
            name: 'Lamborghini Huracán',
            brand: 'lamborghini',
            price: 'S/ 1,195,000',
            image: 'https://static.motor.es/fotos-jato/lamborghini/uploads/lamborghini-huracan-6824e23712aaf.jpg',
            description: 'Superdeportivo italiano con motor V10 de 610 HP. Experiencia de conducción única.',
            specs: {
                engine: 'V10 5.2L',
                power: '610 HP',
                speed: '325 km/h',
                acceleration: '3.2s 0-100',
                fuel: 'Gasolina Premium 98',
                seats: 'Deportivos de cuero Alcántara',
                capacity: '2 personas',
                transmission: 'Automática 7 velocidades',
                tires: 'Pirelli P Zero 245/35 R19 (delanteras) - 305/30 R19 (traseras)'
            },
            badge: 'Nuevo',
            category: 'lamborghini'
        },
        {
            id: 2,
            name: 'Ferrari 488 GTB',
            brand: 'ferrari',
            price: 'S/ 1,320,000',
            image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Ferrari_488_GTB_%28cropped%29.jpg/1200px-Ferrari_488_GTB_%28cropped%29.jpg',
            description: 'El icónico Ferrari con motor V8 biturbo. Potencia y elegancia italiana.',
            specs: {
                engine: 'V8 3.9L Turbo',
                power: '661 HP',
                speed: '330 km/h',
                acceleration: '3.0s 0-100',
                fuel: 'Gasolina Premium 98',
                seats: 'Racing de fibra de carbono',
                capacity: '2 personas',
                transmission: 'Automática 7 velocidades',
                tires: 'Michelin Pilot Sport Cup 2 245/35 R20 (delanteras) - 305/30 R20 (traseras)'
            },
            badge: 'Exclusivo',
            category: 'ferrari'
        },
        {
            id: 3,
            name: 'Suzuki Swift Sport',
            brand: 'suzuki',
            price: 'S/ 100,000',
            image: 'https://www.autoindustriya.com/cdn-cgi/image/width=720,quality=60,format=auto/images/posts/post26650.jpg',
            description: 'Compacto deportivo con excelente relación precio-rendimiento.',
            specs: {
                engine: '1.4L Turbo',
                power: '140 HP',
                speed: '210 km/h',
                acceleration: '8.1s 0-100',
                fuel: 'Gasolina 95 octanos',
                seats: 'Deportivos de tela premium',
                capacity: '5 personas',
                transmission: 'Manual 6 velocidades',
                tires: 'Bridgestone Potenza 195/45 R17'
            },
            badge: 'Popular',
            category: 'suzuki'
        },
        {
            id: 4,
            name: 'Lamborghini Aventador',
            brand: 'lamborghini',
            price: 'S/ 1,800,000',
            image: 'https://fuelcarmagazine.com/wp-content/uploads/2021/07/%C2%A9-Lamborghini.jpg',
            description: 'El buque insignia de Lamborghini con motor V12 atmosférico.',
            specs: {
                engine: 'V12 6.5L',
                power: '730 HP',
                speed: '350 km/h',
                acceleration: '2.9s 0-100',
                fuel: 'Gasolina Premium 98',
                seats: 'Racing de Alcántara premium',
                capacity: '2 personas',
                transmission: 'Automática 7 velocidades',
                tires: 'Pirelli P Zero Corsa 255/35 R19 (delanteras) - 335/30 R20 (traseras)'
            },
            badge: 'Premium',
            category: 'lamborghini'
        },
        {
            id: 5,
            name: 'Ferrari F8 Tributo',
            brand: 'ferrari',
            price: 'S/ 1,520,000',
            image: 'https://assets.carandclassic.com/uploads/new/21677103/2022-ferrari-f8-tributo-683a4d8a51937.jpg?fit=fillmax&h=800&ixlib=php-4.1.0&q=85&w=800&s=ab32b1e2a93f0606ad62544235a5f374',
            description: 'La evolución del 488 con mejoras aerodinámicas y de potencia.',
            specs: {
                engine: 'V8 3.9L Turbo',
                power: '710 HP',
                speed: '340 km/h',
                acceleration: '2.9s 0-100',
                fuel: 'Gasolina Premium 98',
                seats: 'Racing de cuero premium italiano',
                capacity: '2 personas',
                transmission: 'Automática 7 velocidades',
                tires: 'Michelin Pilot Sport Cup 2 245/35 R20 (delanteras) - 305/30 R20 (traseras)'
            },
            badge: 'Nuevo',
            category: 'ferrari'
        },
        {
            id: 6,
            name: 'Suzuki Jimny',
            brand: 'suzuki',
            price: 'S/ 140,000',
            image: 'https://hips.hearstapps.com/hmg-prod/images/suzuki-jimny-sierra-4sport-1659104806.jpg?crop=0.973xw:1.00xh;0,0&resize=640:*',
            description: 'SUV compacto 4x4 perfecto para aventuras off-road.',
            specs: {
                engine: '1.5L',
                power: '102 HP',
                speed: '145 km/h',
                acceleration: '12.2s 0-100',
                fuel: 'Gasolina 95 octanos',
                seats: 'Resistentes al agua y barro',
                capacity: '4 personas',
                transmission: 'Manual 5 velocidades',
                tires: 'Bridgestone Dueler A/T 195/80 R15 (todo terreno)'
            },
            badge: 'Aventura',
            category: 'suzuki'
        },
        {
            id: 7,
            name: 'Porsche 911 Turbo S',
            brand: 'porsche',
            price: 'S/ 920,000',
            image: 'https://newsroom.porsche.com/.imaging/mte/porsche-templating-theme/image_1290x726/dam/ES-PLA-local/2022/Vehiculos/El-nuevo-Porsche-911-Turbo-S-llega-Ecuador/PLA22_1125_fine.jpg/jcr:content/PLA22_1125_fine.jpg',
            description: 'El icónico deportivo alemán con tracción integral y motor turbo.',
            specs: {
                engine: 'H6 3.8L Turbo',
                power: '640 HP',
                speed: '330 km/h',
                acceleration: '2.7s 0-100',
                fuel: 'Gasolina Premium 98',
                seats: 'Deportivos de cuero premium',
                capacity: '4 personas',
                transmission: 'Automática 8 velocidades PDK',
                tires: 'Michelin Pilot Sport 4S 255/35 R20 (delanteras) - 315/30 R21 (traseras)'
            },
            badge: 'Clásico',
            category: 'porsche'
        },
        {
            id: 8,
            name: 'Porsche Cayenne Turbo',
            brand: 'porsche',
            price: 'S/ 720,000',
            image: 'https://phantom-expansion.unidadeditorial.es/ecb9fcf90fb8046c8b12da54ded400c4/crop/200x0/1814x1050/resize/640/assets/multimedia/imagenes/2023/05/16/16842156795597.jpg',
            description: 'SUV deportivo de lujo con prestaciones excepcionales.',
            specs: {
                engine: 'V8 4.0L Turbo',
                power: '541 HP',
                speed: '286 km/h',
                acceleration: '3.9s 0-100',
                fuel: 'Gasolina Premium 98',
                seats: 'Cuero premium ventilados y calefaccionados',
                capacity: '5 personas',
                transmission: 'Automática 8 velocidades Tiptronic',
                tires: 'Continental SportContact 6 275/40 R21 (delanteras) - 315/35 R21 (traseras)'
            },
            badge: 'SUV Premium',
            category: 'porsche'
        },
        {
            id: 9,
            name: 'BMW M3 Competition',
            brand: 'bmw',
            price: 'S/ 340,000',
            image: 'https://acnews.blob.core.windows.net/imgnews/medium/NAZ_d3c8e7b3afba4241b4942daa12ff9bb1.jpg',
            description: 'Sedán deportivo de alto rendimiento con tecnología M.',
            specs: {
                engine: 'I6 3.0L Turbo',
                power: '503 HP',
                speed: '290 km/h',
                acceleration: '3.9s 0-100',
                fuel: 'Gasolina Premium 98',
                seats: 'M Sport de cuero Merino',
                capacity: '5 personas',
                transmission: 'Automática 8 velocidades M Steptronic',
                tires: 'Michelin Pilot Sport 4S 275/35 R19 (delanteras) - 285/30 R20 (traseras)'
            },
            badge: 'Deportivo',
            category: 'bmw'
        },
        {
            id: 10,
            name: 'BMW X5 M50i',
            brand: 'bmw',
            price: 'S/ 380,000',
            image: 'https://www.cnet.com/a/img/resize/626f36854325efe3bf412e5239ca9d291cb3a6ba/hub/2020/03/18/0b5422f2-9ebf-4868-9bf2-f93b5d2a1c4d/ogi-2020-bmw-x5-m50i-1.jpg?auto=webp&fit=crop&height=675&width=1200',
            description: 'SUV premium con motor V8 y tecnología de vanguardia.',
            specs: {
                engine: 'V8 4.4L Turbo',
                power: '523 HP',
                speed: '250 km/h',
                acceleration: '4.3s 0-100',
                fuel: 'Gasolina Premium 98',
                seats: 'Cuero Vernasca ventilados y calefaccionados',
                capacity: '7 personas',
                transmission: 'Automática 8 velocidades Steptronic',
                tires: 'Pirelli P Zero 275/45 R20 (delanteras) - 315/40 R20 (traseras)'
            },
            badge: 'Lujo',
            category: 'bmw'
        },
        // Nuevos Lamborghini
        {
            id: 11,
            name: 'Lamborghini Gallardo',
            brand: 'lamborghini',
            price: 'S/ 880,000',
            image: 'https://www.qonecta.com/documents/80345/93398/09-Lamborghini_Gallardo_LP570-4_Squadra_Corse.jpg/2626eb27-9f41-4a22-a701-2ac891dbf4d2',
            description: 'Deportivo clásico con motor V10 y diseño atemporal.',
            specs: {
                engine: 'V10 5.2L',
                power: '560 HP',
                speed: '315 km/h',
                acceleration: '3.4s 0-100',
                fuel: 'Gasolina Premium 98',
                seats: 'Deportivos de cuero italiano',
                capacity: '2 personas',
                transmission: 'Manual 6 velocidades e-gear',
                tires: 'Pirelli P Zero Corsa 235/35 R19 (delanteras) - 295/30 R19 (traseras)'
            },
            badge: 'Clásico',
            category: 'lamborghini'
        },
        {
            id: 12,
            name: 'Lamborghini Urus',
            brand: 'lamborghini',
            price: 'S/ 1,400,000',
            image: 'https://hips.hearstapps.com/hmg-prod/images/descarga-5-1576775899.jpg?crop=1.00xw:0.753xh;0,0.164xh&resize=640:*',
            description: 'Super SUV con alma de toro. Potencia y versatilidad extrema.',
            specs: {
                engine: 'V8 4.0L Turbo',
                power: '650 HP',
                speed: '305 km/h',
                acceleration: '3.6s 0-100',
                fuel: 'Gasolina Premium 98',
                seats: 'Cuero premium con calefacción y ventilación',
                capacity: '5 personas',
                transmission: 'Automática 8 velocidades Tiptronic',
                tires: 'Pirelli Scorpion Verde 285/40 R22 (delanteras) - 325/35 R22 (traseras)'
            },
            badge: 'Super SUV',
            category: 'lamborghini'
        },
        {
            id: 13,
            name: 'Lamborghini Revuelto',
            brand: 'lamborghini',
            price: 'S/ 2,400,000',
            image: 'https://static0.carbuzzimages.com/wordpress/wp-content/uploads/2025/06/mansory-lamborghini-revuelto-hollman-international-02.png?w=1600&h=900&fit=crop',
            description: 'El nuevo híbrido V12 de Lamborghini. Tecnología del futuro.',
            specs: {
                engine: 'V12 6.5L Híbrido',
                power: '1001 HP',
                speed: '350+ km/h',
                acceleration: '2.5s 0-100',
                fuel: 'Híbrido (Gasolina Premium 98 + Eléctrico)',
                seats: 'Deportivos de fibra de carbono con Alcántara',
                capacity: '2 personas',
                transmission: 'Automática 8 velocidades DCT',
                tires: 'Michelin Pilot Sport Cup 2 R 255/35 R20 (delanteras) - 345/30 R20 (traseras)'
            },
            badge: 'Híbrido',
            category: 'lamborghini'
        },
        // Nuevos Ferrari
        {
            id: 14,
            name: 'Ferrari Roma',
            brand: 'ferrari',
            price: 'S/ 1,120,000',
            image: 'https://www.meritpartners.com/images/vehicles/260912/RedFerrariRoma_04.jpg',
            description: 'Gran turismo moderno con elegancia italiana atemporal.',
            specs: {
                engine: 'V8 3.9L Turbo',
                power: '612 HP',
                speed: '320 km/h',
                acceleration: '3.4s 0-100',
                fuel: 'Gasolina Premium 98',
                seats: 'Cuero premium italiano con bordados',
                capacity: '2+2 personas',
                transmission: 'Automática 8 velocidades DCT',
                tires: 'Michelin Pilot Sport 4S 245/35 R20 (delanteras) - 285/35 R20 (traseras)'
            },
            badge: 'Gran Turismo',
            category: 'ferrari'
        },
        {
            id: 15,
            name: 'Ferrari SF90 Stradale',
            brand: 'ferrari',
            price: 'S/ 2,500,000',
            image: 'https://cdn.motor1.com/images/mgl/P3W9kW/s3/ferrari-sf90-xx-stradale-bianco-artico.jpg',
            description: 'Híbrido plug-in con tecnología de Fórmula 1.',
            specs: {
                engine: 'V8 4.0L Híbrido',
                power: '986 HP',
                speed: '340 km/h',
                acceleration: '2.5s 0-100',
                fuel: 'Híbrido plug-in (Gasolina Premium 98 + Eléctrico)',
                seats: 'Racing de fibra de carbono con Alcántara',
                capacity: '2 personas',
                transmission: 'Automática 8 velocidades DCT',
                tires: 'Michelin Pilot Sport Cup 2 R 245/35 R19 (delanteras) - 315/30 R20 (traseras)'
            },
            badge: 'Híbrido F1',
            category: 'ferrari'
        },
        {
            id: 16,
            name: 'Ferrari 812 Superfast',
            brand: 'ferrari',
            price: 'S/ 1,800,000',
            image: 'https://i.ytimg.com/vi/dsv3glaHLuA/sddefault.jpg',
            description: 'V12 atmosférico de Ferrari. Potencia pura sin compromisos.',
            specs: {
                engine: 'V12 6.5L',
                power: '789 HP',
                speed: '340 km/h',
                acceleration: '2.9s 0-100',
                fuel: 'Gasolina Premium 98',
                seats: 'Deportivos de cuero Alcántara premium',
                capacity: '2 personas',
                transmission: 'Automática 7 velocidades F1-DCT',
                tires: 'Michelin Pilot Super Sport 275/35 R20 (delanteras) - 315/35 R20 (traseras)'
            },
            badge: 'V12 Puro',
            category: 'ferrari'
        },
        // Nuevos Suzuki
        {
            id: 17,
            name: 'Suzuki Vitara',
            brand: 'suzuki',
            price: 'S/ 112,000',
            image: 'https://acnews.blob.core.windows.net/imgnews/large/NAZ_0995986671be4edaae4b5e2ecdf732b2.webp',
            description: 'SUV compacto versátil para ciudad y aventura.',
            specs: {
                engine: '1.4L Turbo',
                power: '129 HP',
                speed: '190 km/h',
                acceleration: '10.2s 0-100',
                fuel: 'Gasolina 95 octanos',
                seats: 'Tela premium resistente',
                capacity: '5 personas',
                transmission: 'Manual 6 velocidades',
                tires: 'Bridgestone Ecopia EP150 215/55 R17 (todas)'
            },
            badge: 'Versátil',
            category: 'suzuki'
        },
        {
            id: 18,
            name: 'Suzuki Baleno',
            brand: 'suzuki',
            price: 'S/ 88,000',
            image: 'https://www.suzukiglezgallo.com/modelos/baleno/banner.jpg',
            description: 'Hatchback espacioso con excelente eficiencia de combustible.',
            specs: {
                engine: '1.2L',
                power: '90 HP',
                speed: '175 km/h',
                acceleration: '11.5s 0-100',
                fuel: 'Gasolina 95 octanos',
                seats: 'Tela cómoda y duradera',
                capacity: '5 personas',
                transmission: 'Manual 5 velocidades',
                tires: 'Bridgestone Ecopia EP150 185/65 R15 (todas)'
            },
            badge: 'Eficiente',
            category: 'suzuki'
        },
        {
            id: 19,
            name: 'Suzuki S-Cross',
            brand: 'suzuki',
            price: 'S/ 128,000',
            image: 'https://www.suzuki.sk/automobily/sites/default/files/styles/large/public/2024-12/301.jpg?itok=sw0UYTyB',
            description: 'Crossover familiar con tecnología AllGrip.',
            specs: {
                engine: '1.4L Turbo',
                power: '129 HP',
                speed: '190 km/h',
                acceleration: '10.5s 0-100',
                fuel: 'Gasolina 95 octanos',
                seats: 'Tela premium con detalles deportivos',
                capacity: '5 personas',
                transmission: 'Automática CVT AllGrip',
                tires: 'Continental CrossContact LX2 215/60 R16 (todas)'
            },
            badge: 'Familiar',
            category: 'suzuki'
        },
        // Nuevos Porsche
        {
            id: 20,
            name: 'Porsche Panamera Turbo',
            brand: 'porsche',
            price: 'S/ 800,000',
            image: 'https://acnews.blob.core.windows.net/imgnews/medium/NAZ_7fd56f67ba704151bfe1c0e7f00d2f00.jpg',
            description: 'Sedán deportivo de lujo con 4 puertas y alma deportiva.',
            specs: {
                engine: 'V8 4.0L Turbo',
                power: '630 HP',
                speed: '315 km/h',
                acceleration: '3.1s 0-100',
                fuel: 'Gasolina Premium 98',
                seats: 'Cuero premium con masaje y ventilación',
                capacity: '4 personas',
                transmission: 'Automática 8 velocidades PDK',
                tires: 'Michelin Pilot Sport 4S 265/40 R20 (delanteras) - 295/35 R20 (traseras)'
            },
            badge: 'Sedán Deportivo',
            category: 'porsche'
        },
        {
            id: 21,
            name: 'Porsche Macan GTS',
            brand: 'porsche',
            price: 'S/ 340,000',
            image: 'https://www.williamscrawford.co.uk/wp-content/uploads/2023/08/porsche-macan-gts-for-sale-williams-crawford-9422.jpg',
            description: 'SUV compacto deportivo con ADN de 911.',
            specs: {
                engine: 'V6 2.9L Turbo',
                power: '434 HP',
                speed: '272 km/h',
                acceleration: '4.3s 0-100',
                fuel: 'Gasolina Premium 98',
                seats: 'Deportivos de cuero con soporte lateral',
                capacity: '5 personas',
                transmission: 'Automática 7 velocidades PDK',
                tires: 'Pirelli P Zero 265/40 R20 (delanteras) - 295/35 R20 (traseras)'
            },
            badge: 'SUV Deportivo',
            category: 'porsche'
        },
        {
            id: 22,
            name: 'Porsche Taycan Turbo S',
            brand: 'porsche',
            price: 'S/ 740,000',
            image: 'https://ev-database.org/img/auto/Porsche_Taycan_Turbo_S/Porsche_Taycan_Turbo_S-01@2x.jpg',
            description: 'Deportivo eléctrico de alto rendimiento. El futuro es ahora.',
            specs: {
                engine: 'Eléctrico Dual',
                power: '750 HP',
                speed: '260 km/h',
                acceleration: '2.8s 0-100',
                fuel: 'Eléctrico',
                seats: 'Deportivos de cuero premium',
                capacity: '4 personas',
                transmission: 'Automática 2 velocidades'
            },
            badge: 'Eléctrico',
            category: 'porsche'
        },
        // Más Lamborghini
        {
            id: 23,
            name: 'Lamborghini Gallardo LP 570-4',
            brand: 'lamborghini',
            price: 'S/ 740,000',
            image: 'https://static0.topspeedimages.com/wordpress/wp-content/uploads/jpg/201012/lamborghini-lp560-gt.jpg',
            description: 'Deportivo italiano con tracción integral y diseño agresivo.',
            specs: {
                engine: 'V10 5.2L',
                power: '570 HP',
                speed: '325 km/h',
                acceleration: '3.4s 0-100'
            },
            badge: 'Superdeportivo',
            category: 'lamborghini'
        },
        {
            id: 24,
            name: 'Lamborghini Veneno',
            brand: 'lamborghini',
            price: 'S/ 1,780,000',
            image: 'https://img.pikbest.com/wp/202408/spectacular-3d-render-of-lamborghini-veneno_9774697.jpg!w700wp',
            description: 'Super SUV con alma de toro. Potencia y lujo en un solo vehículo.',
            specs: {
                engine: 'V8 4.0L Turbo',
                power: '650 HP',
                speed: '305 km/h',
                acceleration: '3.6s 0-100'
            },
            badge: 'Super SUV',
            category: 'lamborghini'
        },
        {
            id: 25,
            name: 'Lamborghini Diablo',
            brand: 'lamborghini',
            price: 'S/ 1,500,000',
            image: 'https://www.turbo.com.pe/images/2024/10/09/La-replica-del-lamborghini-diablo-vt-de-john-cena-sale-a-la-venta.jpg',
            description: 'El nuevo flagship híbrido de Lamborghini. Tecnología del futuro.',
            specs: {
                engine: 'V12 6.5L + 3 Motores Eléctricos',
                power: '1015 HP',
                speed: '350 km/h',
                acceleration: '2.5s 0-100'
            },
            badge: 'Híbrido Flagship',
            category: 'lamborghini'
        },
        // Más Ferrari
        {
            id: 26,
            name: 'Ferrari 296 GTB',
            brand: 'ferrari',
            price: 'S/ 850,000',
            image: 'https://www.motor16.com/wp-content/uploads/2023/10/2023-Ferrari-296-GTB-Blu-12.webp',
            description: 'El V12 atmosférico más potente de Ferrari. Pura emoción italiana.',
            specs: {
                engine: 'V12 6.5L',
                power: '800 HP',
                speed: '340 km/h',
                acceleration: '2.9s 0-100'
            },
            badge: 'V12 Atmosférico',
            category: 'ferrari'
        },
        {
            id: 27,
            name: 'Ferrari Daytona SP3',
            brand: 'ferrari',
            price: 'S/ 1,500,000',
            image: 'https://i.ytimg.com/vi/nZtR8FFjfOA/hq720.jpg?sqp=-oaymwE7CK4FEIIDSFryq4qpAy0IARUAAAAAGAElAADIQj0AgKJD8AEB-AH-CYAC0AWKAgwIABABGEkgUShlMA8=&rs=AOn4CLBhDDzP_Vz4tRhpPDdmWMJUfRff-Q',
            description: 'Híbrido plug-in con tecnología de Fórmula 1. El Ferrari más potente.',
            specs: {
                engine: 'V8 4.0L Turbo + 3 Motores Eléctricos',
                power: '1000 HP',
                speed: '340 km/h',
                acceleration: '2.5s 0-100'
            },
            badge: 'Híbrido F1',
            category: 'ferrari'
        },
        {
            id: 28,
            name: 'Ferrari 812 Competizione A',
            brand: 'ferrari',
            price: '$230,000',
            image: 'https://en.wheelz.me/wp-content/uploads/2024/10/2023-Ferrari-812-Competizione_1276122.webp',
            description: 'Gran turismo moderno con elegancia atemporal y prestaciones deportivas.',
            specs: {
                engine: 'V8 3.9L Turbo',
                power: '620 HP',
                speed: '320 km/h',
                acceleration: '3.4s 0-100'
            },
            badge: 'Gran Turismo',
            category: 'ferrari'
        },
        // Más Suzuki
        {
            id: 29,
            name: 'Suzuki Capuccino',
            brand: 'suzuki',
            price: 'S/ 188,000',
            image: 'https://rhdspecialties.com/cdn/shop/products/DSC05135_1200x1200.jpg?v=1628558087',
            description: 'Motocicleta deportiva de alta gama con tecnología MotoGP.',
            specs: {
                engine: 'I4 1.0L',
                power: '202 HP',
                speed: '299 km/h',
                acceleration: '2.9s 0-100'
            },
            badge: 'Supercoche',
            category: 'suzuki'
        },
        {
            id: 30,
            name: 'Suzuki Vitara Hybrid',
            brand: 'suzuki',
            price: 'S/ 28,000',
            image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSO2yHQWOauXeVv96C060sRhSqFussXXomOxw&s',
            description: 'SUV compacto híbrido con eficiencia y versatilidad urbana.',
            specs: {
                engine: 'I4 1.4L Turbo + Motor Eléctrico',
                power: '129 HP',
                speed: '190 km/h',
                acceleration: '9.5s 0-100'
            },
            badge: 'SUV Híbrido',
            category: 'suzuki'
        },
        {
            id: 31,
            name: 'Suzuki Kizashi',
            brand: 'suzuki',
            price: 'S/ 25,000',
            image: 'https://i.blogs.es/5d1f33/suzuki_kizashi_1/450_1000.jpg',
            description: 'Crossover familiar con tracción integral y gran espacio interior.',
            specs: {
                engine: 'I4 1.4L Turbo',
                power: '140 HP',
                speed: '195 km/h',
                acceleration: '10.2s 0-100'
            },
            badge: 'Crossover',
            category: 'suzuki'
        },
        // Más Porsche
        {
            id: 32,
            name: 'Porsche Carrera GT',
            brand: 'porsche',
            price: 'S/ 180,000',
            image: 'https://cdn.rmsothebys.com/2/1/2/f/e/6/212fe6b1d5b38512564736ec7683363ed9690417.webp',
            description: 'El SUV más deportivo de Porsche. Prestaciones de superdeportivo.',
            specs: {
                engine: 'V8 4.0L Turbo',
                power: '640 HP',
                speed: '300 km/h',
                acceleration: '3.3s 0-100'
            },
            badge: 'SUV Extremo',
            category: 'porsche'
        },
        {
            id: 33,
            name: 'Porsche 718 Cayman GT4',
            brand: 'porsche',
            price: 'S/ 110,000',
            image: 'https://www.manthey-racing.com/sites/default/files/styles/header/public/2024-04/M01_TEQ_GT4Manthey_gesamt_wf03_RGB_neu.jpg.webp?itok=0anksIo4',
            description: 'Deportivo de motor central con ADN de competición.',
            specs: {
                engine: 'H6 4.0L',
                power: '420 HP',
                speed: '304 km/h',
                acceleration: '4.4s 0-100'
            },
            badge: 'Track Focus',
            category: 'porsche'
        },
        {
            id: 34,
            name: 'Porsche Panamera 4S E-Hybrid',
            brand: 'porsche',
            price: 'S/ 130,000',
            image: 'https://hips.hearstapps.com/hmg-prod/images/2021-porsche-panamara-e-hybrid-101-1600737383.jpg?crop=0.675xw:0.676xh;0.150xw,0.122xh&resize=640:',
            description: 'Sedán deportivo híbrido con lujo y eficiencia combinados.',
            specs: {
                engine: 'V6 2.9L Turbo + Motor Eléctrico',
                power: '560 HP',
                speed: '290 km/h',
                acceleration: '3.7s 0-100'
            },
            badge: 'Sedán Híbrido',
            category: 'porsche'
        },
        // Más BMW
        {
            id: 35,
            name: 'BMW i8',
            brand: 'bmw',
            price: 'S/ 1,880,000',
            image: 'https://assets.bwbx.io/images/users/iqjWHBFdfxIU/iDKbTZKuItWE/v1/-1x-1.webp',
            description: 'Deportivo híbrido con diseño futurista y puertas de tijera.',
            specs: {
                engine: 'I3 1.5L + Motor Eléctrico',
                power: '369 HP',
                speed: '250 km/h',
                acceleration: '4.4s 0-100'
            },
            badge: 'Híbrido',
            category: 'bmw'
        },
        {
            id: 36,
            name: 'BMW X6 M Competition',
            brand: 'bmw',
            price: 'S/ 1,425,000',
            image: 'https://pugachev.miami/wp-content/uploads/2023/09/bmw-x6-m-competition-graphite-1.jpg',
            description: 'SAC (Sports Activity Coupé) con prestaciones de superdeportivo.',
            specs: {
                engine: 'V8 4.4L Turbo',
                power: '617 HP',
                speed: '290 km/h',
                acceleration: '3.8s 0-100'
            },
            badge: 'SAC Performance',
            category: 'bmw'
        },
        {
            id: 37,
            name: 'BMW iX M60',
            brand: 'bmw',
            price: 'S/ 1,610,000',
            image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTXuBh54aKzPoidqJuv1G7YQxsznM3j_2FDSg&s',
            description: 'SUV eléctrico de lujo con tecnología de vanguardia.',
            specs: {
                engine: 'Eléctrico Dual',
                power: '610 HP',
                speed: '250 km/h',
                acceleration: '3.8s 0-100'
            },
            badge: 'Eléctrico Lujo',
            category: 'bmw'
        }
    ];
    
    renderVehicles(vehiclesData);
}

function renderVehicles(vehicles) {
    console.log('🚗 Renderizando vehículos:', vehicles.length);
    const vehiclesGrid = document.querySelector('.vehicles-grid');
    
    if (!vehiclesGrid) {
        console.error('❌ No se encontró el elemento vehicles-grid');
        return;
    }
    
    console.log('✅ Elemento vehicles-grid encontrado');
    
    vehiclesGrid.innerHTML = vehicles.map(vehicle => `
        <div class="vehicle-card" data-category="${vehicle.category}">
            <div class="vehicle-image">
                <img src="${vehicle.image}" alt="${vehicle.name}" loading="lazy">
                <div class="vehicle-badge">${vehicle.badge}</div>
            </div>
            <div class="vehicle-info">
                <h3 class="vehicle-name">${vehicle.name}</h3>
                <div class="vehicle-price">${vehicle.price}</div>
                <p class="vehicle-description">${vehicle.description}</p>
                <div class="vehicle-specs">
                    <div class="spec-item">
                        <i class="fas fa-cog"></i>
                        <span>${vehicle.specs.engine}</span>
                    </div>
                    <div class="spec-item">
                        <i class="fas fa-bolt"></i>
                        <span>${vehicle.specs.power}</span>
                    </div>
                    <div class="spec-item">
                        <i class="fas fa-tachometer-alt"></i>
                        <span>${vehicle.specs.speed}</span>
                    </div>
                    <div class="spec-item">
                        <i class="fas fa-rocket"></i>
                        <span>${vehicle.specs.acceleration}</span>
                    </div>
                </div>
                <div class="vehicle-actions">
                    <button class="btn btn-primary" onclick="showVehicleDetails(${vehicle.id})">
                        <i class="fas fa-info-circle"></i>
                        Detalles
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    console.log('✅ Vehículos renderizados correctamente');
    
    // Verificar que los botones se crearon correctamente
    const buttons = vehiclesGrid.querySelectorAll('.btn');
    console.log('🔘 Botones encontrados:', buttons.length);
}

// ===== FUNCIONES DE CONTACTO =====
function contactVehicle(vehicleName) {
    const message = `Hola! Estoy interesado en el ${vehicleName}. ¿Podrían darme más información?`;
    const whatsappUrl = `https://wa.me/51986182856?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

function showVehicleDetails(vehicleId) {
    const vehicle = vehiclesData.find(v => v.id == vehicleId);
    if (!vehicle) return;
    
    const modalContent = `
        <div class="vehicle-details-modal">
            <div class="vehicle-details-header" style="background: linear-gradient(135deg, #06b6d4, #14b8a6);">
                <div class="vehicle-header-content">
                    <div class="vehicle-image-wrapper">
                        <img src="${vehicle.image}" alt="${vehicle.name}" class="vehicle-detail-image">
                    </div>
                    <div class="vehicle-header-info">
                        <span class="vehicle-badge-detail">${vehicle.badge}</span>
                        <h2 class="vehicle-name-detail">${vehicle.name}</h2>
                        <p class="vehicle-price-detail">${vehicle.price}</p>
                    </div>
                </div>
            </div>
            <div class="vehicle-details-body">
                <p class="vehicle-description-detail">${vehicle.description}</p>
                
                <h3 class="specs-title"><i class="fas fa-cogs"></i> Especificaciones Técnicas</h3>
                <div class="specs-grid-detail">
                    <div class="spec-card">
                        <div class="spec-icon"><i class="fas fa-engine"></i></div>
                        <div class="spec-content">
                            <span class="spec-label">Motor</span>
                            <span class="spec-value">${vehicle.specs.engine}</span>
                        </div>
                    </div>
                    <div class="spec-card">
                        <div class="spec-icon"><i class="fas fa-bolt"></i></div>
                        <div class="spec-content">
                            <span class="spec-label">Potencia</span>
                            <span class="spec-value">${vehicle.specs.power}</span>
                        </div>
                    </div>
                    <div class="spec-card">
                        <div class="spec-icon"><i class="fas fa-tachometer-alt"></i></div>
                        <div class="spec-content">
                            <span class="spec-label">Velocidad Máxima</span>
                            <span class="spec-value">${vehicle.specs.speed}</span>
                        </div>
                    </div>
                    <div class="spec-card">
                        <div class="spec-icon"><i class="fas fa-rocket"></i></div>
                        <div class="spec-content">
                            <span class="spec-label">Aceleración 0-100</span>
                            <span class="spec-value">${vehicle.specs.acceleration}</span>
                        </div>
                    </div>
                    <div class="spec-card">
                        <div class="spec-icon"><i class="fas fa-gas-pump"></i></div>
                        <div class="spec-content">
                            <span class="spec-label">Combustible</span>
                            <span class="spec-value">${vehicle.specs.fuel}</span>
                        </div>
                    </div>
                    <div class="spec-card">
                        <div class="spec-icon"><i class="fas fa-chair"></i></div>
                        <div class="spec-content">
                            <span class="spec-label">Asientos</span>
                            <span class="spec-value">${vehicle.specs.seats}</span>
                        </div>
                    </div>
                    <div class="spec-card">
                        <div class="spec-icon"><i class="fas fa-users"></i></div>
                        <div class="spec-content">
                            <span class="spec-label">Capacidad</span>
                            <span class="spec-value">${vehicle.specs.capacity}</span>
                        </div>
                    </div>
                    <div class="spec-card">
                        <div class="spec-icon"><i class="fas fa-cog"></i></div>
                        <div class="spec-content">
                            <span class="spec-label">Transmisión</span>
                            <span class="spec-value">${vehicle.specs.transmission}</span>
                        </div>
                    </div>
                    ${vehicle.specs.tires ? `
                    <div class="spec-card spec-card-full">
                        <div class="spec-icon"><i class="fas fa-circle"></i></div>
                        <div class="spec-content">
                            <span class="spec-label">Llantas</span>
                            <span class="spec-value">${vehicle.specs.tires}</span>
                        </div>
                    </div>` : ''}
                </div>
                
                <div class="vehicle-actions-detail">
                    <button class="btn btn-primary btn-large" onclick="contactVehicle('${vehicle.name}')">
                        <i class="fab fa-whatsapp"></i> Consultar por WhatsApp
                    </button>
                    <button class="btn btn-secondary btn-large" onclick="openFinancingModal('${vehicle.name}', '${vehicle.price}')">
                        <i class="fas fa-credit-card"></i> Comprar Ahora
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Crear modal dinámico
    const existingModal = document.getElementById('vehicle-details-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = 'vehicle-details-modal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content vehicle-modal-content">
            <span class="close" onclick="closeVehicleModal()">&times;</span>
            ${modalContent}
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Usar requestAnimationFrame para mejor rendimiento
    requestAnimationFrame(() => {
        openModal('vehicle-details-modal');
    });
}

// ===== FORMULARIOS =====
function initializeForms() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }
    
    // Validación en tiempo real
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
    });
}

function handleContactSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        service: formData.get('service'),
        message: formData.get('message')
    };
    
    // Validar formulario
    if (validateForm(data)) {
        // Simular envío
        showFormSuccess();
        e.target.reset();
    }
}

function validateForm(data) {
    let isValid = true;
    
    // Validar campos requeridos
    Object.keys(data).forEach(key => {
        if (!data[key] && key !== 'phone') {
            showFieldError(key, 'Este campo es requerido');
            isValid = false;
        }
    });
    
    // Validar email
    if (data.email && !isValidEmail(data.email)) {
        showFieldError('email', 'Email inválido');
        isValid = false;
    }
    
    return isValid;
}

function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    
    if (field.required && !value) {
        showFieldError(field.name, 'Este campo es requerido');
    } else if (field.type === 'email' && value && !isValidEmail(value)) {
        showFieldError(field.name, 'Email inválido');
    } else {
        clearFieldError(field.name);
    }
}

function showFieldError(fieldName, message) {
    const field = document.querySelector(`[name="${fieldName}"]`);
    if (field) {
        field.style.borderColor = '#ff6b35';
        
        // Remover mensaje anterior
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Agregar nuevo mensaje
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.style.color = '#ff6b35';
        errorDiv.style.fontSize = '0.875rem';
        errorDiv.style.marginTop = '0.25rem';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
    }
}

function clearFieldError(fieldName) {
    const field = typeof fieldName === 'string' 
        ? document.querySelector(`[name="${fieldName}"]`)
        : fieldName.target;
        
    if (field) {
        field.style.borderColor = '';
        const errorDiv = field.parentNode.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showFormSuccess() {
    // Crear notificación de éxito elegante
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.innerHTML = `
        <div style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
            color: white;
            padding: 2rem 2.5rem;
            border-radius: 1rem;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: popIn 0.4s ease-out;
            text-align: center;
            max-width: 400px;
            backdrop-filter: blur(10px);
        ">
            <div style="
                font-size: 2.5rem;
                margin-bottom: 1rem;
                animation: scaleIn 0.6s ease-out;
            ">
                ✅
            </div>
            <div style="
                font-size: 1.3rem;
                font-weight: 700;
                margin-bottom: 0.5rem;
                letter-spacing: 0.5px;
            ">
                Mensaje Enviado Correctamente
            </div>
            <div style="
                font-size: 0.95rem;
                opacity: 0.95;
                line-height: 1.5;
            ">
                Hemos recibido tu mensaje. Nos pondremos en contacto con información detallada muy pronto.
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remover después de 4 segundos
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.4s ease-out';
        setTimeout(() => {
            notification.remove();
        }, 400);
    }, 4000);
}

// Agregar estilos de animación
if (!document.querySelector('style[data-custom-animations]')) {
    const style = document.createElement('style');
    style.setAttribute('data-custom-animations', '');
    style.innerHTML = `
        @keyframes popIn {
            0% {
                opacity: 0;
                transform: translate(-50%, -50%) scale(0.8);
            }
            100% {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
            }
        }
        
        @keyframes scaleIn {
            0% {
                opacity: 0;
                transform: scale(0);
            }
            100% {
                opacity: 1;
                transform: scale(1);
            }
        }
        
        @keyframes fadeOut {
            0% {
                opacity: 1;
            }
            100% {
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// ===== TABS =====
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            
            // Remover clases active
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Agregar clase active
            btn.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });
}

// ===== BACK TO TOP =====
function initializeBackToTop() {
    const backToTopBtn = document.querySelector('.back-to-top');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });
    
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ===== ANIMACIONES =====
function initializeAnimations() {
    // Animación de números (contador)
    const animateNumbers = () => {
        const numbers = document.querySelectorAll('[data-count]');
        numbers.forEach(num => {
            const target = parseInt(num.getAttribute('data-count'));
            const duration = 2000;
            const step = target / (duration / 16);
            let current = 0;
            
            const timer = setInterval(() => {
                current += step;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                num.textContent = Math.floor(current);
            }, 16);
        });
    };
    
    // Observar elementos para animaciones de números
    const numberObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateNumbers();
                numberObserver.unobserve(entry.target);
            }
        });
    });
    
    const statsSection = document.querySelector('.stats');
    if (statsSection) {
        numberObserver.observe(statsSection);
    }
}

// ===== UTILIDADES =====
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ===== FUNCIONES DE CONTACTO DIRECTO =====
function openWhatsApp() {
    const message = 'Hola! Me gustaría obtener más información sobre sus vehículos.';
    const whatsappUrl = `https://wa.me/51986182856?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

function openEmail() {
    const subject = 'Consulta sobre vehículos - AutoXpert';
    const body = 'Hola,\n\nMe gustaría obtener más información sobre sus vehículos.\n\nGracias.';
    const emailUrl = `mailto:jordanpmrojasbazan@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = emailUrl;
}

// ===== MANEJO DE ERRORES =====
window.addEventListener('error', (e) => {
    console.error('Error en AutoXpert:', e.error);
});

// ===== PERFORMANCE =====
window.addEventListener('load', () => {
    // Lazy loading para imágenes
    const images = document.querySelectorAll('img[loading="lazy"]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src || img.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    }
});

// ===== EXPORTAR FUNCIONES GLOBALES =====
// ===== FUNCIONES DE MODALES =====
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        // Resetear todos los estilos
        modal.style.opacity = '1';
        modal.style.visibility = 'visible';
        modal.style.display = 'flex';
        
        // Usar requestAnimationFrame para mejor rendimiento
        requestAnimationFrame(() => {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        });
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        // Remover inmediatamente la clase show y ocultar el modal
        modal.classList.remove('show');
        modal.style.display = 'none';
        modal.style.opacity = '0';
        modal.style.visibility = 'hidden';
        
        // Restaurar scroll en el body
        document.body.style.overflow = '';
        document.body.style.overflow = 'auto';
        
        // Para modales dinámicos (vehicle-details-modal), removerlos completamente del DOM
        if (modalId === 'vehicle-details-modal') {
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.remove();
                }
            }, 0);
        }
    }
}

// Función específica para cerrar el modal de vehículos instantáneamente
function closeVehicleModal() {
    const modal = document.getElementById('vehicle-details-modal');
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
        modal.style.opacity = '0';
        modal.style.visibility = 'hidden';
        document.body.style.overflow = '';
        document.body.style.overflow = 'auto';
        // Remover del DOM inmediatamente
        if (modal.parentNode) {
            modal.remove();
        }
    }
}

// Función para cerrar todos los modales abiertos
function closeAllModals() {
    // Cerrar modal de detalles del vehículo específicamente
    const vehicleModal = document.getElementById('vehicle-details-modal');
    if (vehicleModal) {
        vehicleModal.classList.remove('show');
        vehicleModal.style.display = 'none';
        vehicleModal.style.opacity = '0';
        vehicleModal.style.visibility = 'hidden';
        if (vehicleModal.parentNode) {
            vehicleModal.remove();
        }
    }
    
    // Cerrar todos los demás modales
    const openModals = document.querySelectorAll('.modal.show');
    openModals.forEach(modal => {
        modal.classList.remove('show');
        modal.style.display = 'none';
        modal.style.opacity = '0';
        modal.style.visibility = 'hidden';
    });
    
    // Restaurar scroll del body
    document.body.style.overflow = '';
    document.body.style.overflow = 'auto';
}


// Cerrar modal al hacer clic fuera del contenido
function initializeModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
    
    // Cerrar modal con tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal.show');
            if (openModal) {
                closeModal(openModal.id);
            }
        }
    });
    
    // Inicializar formularios de servicios
    initializeServiceForms();
}

function initializeServiceForms() {
    const serviceModals = ['maintenanceModal', 'bodyworkModal', 'mechanicsModal', 'salesModal', 'financingModal', 'insuranceModal'];
    
    serviceModals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
            const form = modal.querySelector('.service-form');
            if (form) {
                form.addEventListener('submit', handleServiceFormSubmit);
            }
        }
    });
}

function handleServiceFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const service = form.closest('.modal').id.replace('Modal', '').toLowerCase();
    
    // Validar formulario
    const isValid = validateServiceForm(formData);
    if (!isValid) return;
    
    // Simular envío
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Enviando...';
    submitBtn.disabled = true;
    
    setTimeout(() => {
        // Crear mensaje para WhatsApp
        const message = createServiceWhatsAppMessage(formData, service);
        const whatsappUrl = `https://wa.me/51986182856?text=${encodeURIComponent(message)}`;
        
        // Abrir WhatsApp
        window.open(whatsappUrl, '_blank');
        
        // Mostrar éxito
        showServiceSuccess(service);
        
        // Resetear formulario
        form.reset();
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        
        // Cerrar modal después de un momento
        setTimeout(() => {
            closeModal(form.closest('.modal').id);
        }, 2000);
    }, 1000);
}

function validateServiceForm(formData) {
    // Obtener nombre del campo (puede variar según el formulario)
    const name = formData.get('name') || formData.get('bodyworkName') || formData.get('mechanicsName') || 
                 formData.get('customerName') || formData.get('salesName') || formData.get('financingName') || 
                 formData.get('insuranceName');
    
    // Obtener teléfono del campo (puede variar según el formulario)
    const phone = formData.get('phone') || formData.get('bodyworkPhone') || formData.get('mechanicsPhone') || 
                  formData.get('customerPhone') || formData.get('salesPhone') || formData.get('financingPhone') || 
                  formData.get('insurancePhone');
    
    // El email solo es requerido en algunos formularios
    const email = formData.get('email') || formData.get('salesEmail');
    
    if (!name || name.trim().length < 2) {
        alert('Por favor, ingresa un nombre válido');
        return false;
    }
    
    if (!phone || phone.trim().length < 9) {
        alert('Por favor, ingresa un teléfono válido');
        return false;
    }
    
    // Solo validar email si existe el campo
    if (email && !isValidEmail(email)) {
        alert('Por favor, ingresa un email válido');
        return false;
    }
    
    return true;
}

function createServiceWhatsAppMessage(formData, service) {
    const serviceNames = {
        'maintenance': 'Mantenimiento',
        'bodywork': 'Planchado y Pintura',
        'mechanics': 'Mecánica',
        'sales': 'Venta de Vehículos',
        'financing': 'Financiamiento',
        'insurance': 'Seguros'
    };
    
    const serviceName = serviceNames[service] || service;
    
    // Obtener datos del formulario con nombres dinámicos
    const name = formData.get('name') || formData.get('bodyworkName') || formData.get('mechanicsName') || 
                 formData.get('customerName') || formData.get('salesName') || formData.get('financingName') || 
                 formData.get('insuranceName');
    
    const phone = formData.get('phone') || formData.get('bodyworkPhone') || formData.get('mechanicsPhone') || 
                  formData.get('customerPhone') || formData.get('salesPhone') || formData.get('financingPhone') || 
                  formData.get('insurancePhone');
    
    const email = formData.get('email') || formData.get('salesEmail');
    const message = formData.get('message') || formData.get('comments') || 'Sin mensaje adicional';
    
    let whatsappMessage = `🚗 *Solicitud de ${serviceName}*\n\n` +
                         `👤 *Nombre:* ${name}\n` +
                         `📱 *Teléfono:* ${phone}\n`;
    
    if (email) {
        whatsappMessage += `📧 *Email:* ${email}\n`;
    }
    
    whatsappMessage += `💬 *Mensaje:* ${message}\n\n` +
                      `Enviado desde AutoXpert`;
    
    return whatsappMessage;
}

function showServiceSuccess(service) {
    const serviceNames = {
        'maintenance': 'Mantenimiento',
        'bodywork': 'Planchado y Pintura',
        'mechanics': 'Mecánica',
        'sales': 'Venta de Vehículos',
        'financing': 'Financiamiento',
        'insurance': 'Seguros'
    };
    
    const serviceName = serviceNames[service] || service;
    
    // Crear notificación de éxito
    const notification = document.createElement('div');
    
    // Notificación especial para cotizaciones (bodywork)
    if (service === 'bodywork') {
        notification.className = 'quote-success-notification';
        notification.innerHTML = `
            <div class="quote-success-content">
                <div class="check-animation">
                    <i class="fas fa-check"></i>
                </div>
                <h3>¡Cotización Enviada Correctamente!</h3>
                <p>Tu solicitud de cotización ha sido procesada exitosamente.</p>
            </div>
        `;
    } else {
        notification.className = 'success-notification';
        notification.innerHTML = `
            <div class="success-content">
                <i class="fas fa-check-circle"></i>
                <h3>¡Solicitud Enviada!</h3>
                <p>Tu solicitud de ${serviceName} ha sido enviada correctamente. Te contactaremos pronto.</p>
            </div>
        `;
    }
    
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remover después de 4 segundos para cotizaciones, 3 para otros
    const removeTime = service === 'bodywork' ? 4000 : 3000;
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, removeTime);
}

// ===== SISTEMA DE PAGOS =====
let currentPayment = {
    vehicle: null,
    amount: null,
    method: null
};

// Función para abrir modal de métodos de pago
function openFinancingModal(vehicleName, vehiclePrice) {
    // Primero cerrar TODOS los modales abiertos
    closeAllModals();
    
    // Esperar un momento antes de abrir el modal de financiamiento
    setTimeout(() => {
        currentPayment = {
            vehicle: vehicleName,
            amount: vehiclePrice,
            method: null
        };
        
        const modal = document.getElementById('financing-modal');
        
        if (modal) {
            modal.style.display = 'flex';
            modal.style.visibility = 'visible';
            modal.style.opacity = '1';
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
            
            setTimeout(() => {
                const modalContent = modal.querySelector('.modal-content');
                if (modalContent) {
                    modalContent.style.transform = 'scale(1) translateY(0)';
                }
            }, 50);
        }
    }, 150); // Pausa más larga para asegurar que se cierren todos los modales
}

// Función para seleccionar método de pago
function selectPaymentMethod(method) {
    currentPayment.method = method;
    
    // Cerrar el modal de métodos de pago de forma limpia
    const financingModal = document.getElementById('financing-modal');
    if (financingModal) {
        financingModal.classList.remove('show');
        financingModal.style.display = 'none';
    }
    
    // Actualizar información del vehículo en todos los modales
    updatePaymentSummary();
    
    // Pequeña pausa antes de abrir el siguiente modal
    setTimeout(() => {
        // Abrir el modal correspondiente
        switch(method) {
            case 'card':
                openModal('card-payment-modal');
                break;
            case 'cash':
                openModal('cash-payment-modal');
                break;
        }
    }, 100);
}

// Función para actualizar el resumen de pago
function updatePaymentSummary() {
    const vehicleElements = [
        document.getElementById('cardVehicleName'),
        document.getElementById('yapeVehicleName'),
        document.getElementById('cashVehicleName')
    ];
    
    const amountElements = [
        document.getElementById('cardTotalAmount'),
        document.getElementById('yapeTotalAmount'),
        document.getElementById('cashTotalAmount')
    ];
    
    vehicleElements.forEach(el => {
        if (el) el.textContent = currentPayment.vehicle || '-';
    });
    
    amountElements.forEach(el => {
        if (el) el.textContent = currentPayment.amount || '-';
    });
}

// Función para procesar pago con tarjeta
function processCardPayment(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const cardData = {
        number: formData.get('cardNumber'),
        expiry: formData.get('cardExpiry'),
        cvv: formData.get('cardCVV'),
        name: formData.get('cardName')
    };
    
    // Simular procesamiento
    showLoadingMessage('Procesando pago...');
    
    setTimeout(() => {
        hideLoadingMessage();
        closeModal('card-payment-modal');
        showSuccessMessage('¡Pago procesado exitosamente! Recibirás un email de confirmación.');
        
        // Limpiar formulario
        event.target.reset();
    }, 2000);
}

// Función para procesar pago con Yape
function processYapePayment(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const yapeData = {
        phone: formData.get('yapePhone'),
        name: formData.get('yapeName')
    };
    
    // Simular envío de solicitud
    showLoadingMessage('Enviando solicitud de pago...');
    
    setTimeout(() => {
        hideLoadingMessage();
        closeModal('yape-payment-modal');
        showSuccessMessage(`¡Solicitud enviada! Revisa tu teléfono ${yapeData.phone} para completar el pago.`);
        
        // Limpiar formulario
        event.target.reset();
    }, 1500);
}

// Función para generar ticket de efectivo
function generateCashTicket(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const ticketData = {
        name: formData.get('cashName'),
        phone: formData.get('cashPhone'),
        email: formData.get('cashEmail'),
        vehicle: currentPayment.vehicle,
        amount: currentPayment.amount,
        date: new Date(),
        ticketId: generateUniqueTicketId()
    };
    
    // Generar contenido del ticket
    const ticketContent = generateTicketHTML(ticketData);
    document.getElementById('ticket-content').innerHTML = ticketContent;
    
    // Cerrar modal de efectivo y abrir modal de ticket
    closeModal('cash-payment-modal');
    openModal('ticket-modal');
    
    // Limpiar formulario
    event.target.reset();
}

// Función para generar ID único de ticket
function generateUniqueTicketId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `TK-${timestamp}-${random.toString().padStart(4, '0')}`;
}

// Función para generar HTML del ticket
function generateTicketHTML(data) {
    const formatDate = (date) => {
        return date.toLocaleDateString('es-PE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };
    
    const formatTime = (date) => {
        return date.toLocaleTimeString('es-PE', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };
    
    return `
        <div class="ticket-header">
            <h3>🚗 AUTOXPERT</h3>
            <p>Concesionaria de Vehículos</p>
            <p>Lima, Perú</p>
        </div>
        
        <div class="ticket-info">
            <div class="ticket-row">
                <span><strong>Ticket ID:</strong></span>
                <span>${data.ticketId}</span>
            </div>
            <div class="ticket-row">
                <span><strong>Fecha:</strong></span>
                <span>${formatDate(data.date)}</span>
            </div>
            <div class="ticket-row">
                <span><strong>Hora:</strong></span>
                <span>${formatTime(data.date)}</span>
            </div>
            <div class="ticket-row">
                <span><strong>Cliente:</strong></span>
                <span>${data.name}</span>
            </div>
            <div class="ticket-row">
                <span><strong>Teléfono:</strong></span>
                <span>${data.phone}</span>
            </div>
            <div class="ticket-row">
                <span><strong>Email:</strong></span>
                <span>${data.email}</span>
            </div>
            <div class="ticket-row">
                <span><strong>Vehículo:</strong></span>
                <span>${data.vehicle}</span>
            </div>
            <div class="ticket-row total">
                <span><strong>TOTAL A PAGAR:</strong></span>
                <span><strong>${data.amount}</strong></span>
            </div>
        </div>
        
        <div class="ticket-footer">
            <p><strong>INSTRUCCIONES:</strong></p>
            <p>1. Presente este ticket en nuestra concesionaria</p>
            <p>2. Horarios: Lun - Sáb 9:00 AM - 7:00 PM</p>
            <p>3. Traiga documento de identidad</p>
            <p>4. El ticket es válido por 30 días</p>
            <br>
            <p><em>¡Gracias por elegir AutoXpert!</em></p>
        </div>
    `;
}

// Función para imprimir ticket
function printTicket() {
    const ticketContent = document.getElementById('ticket-content').innerHTML;
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Ticket de Compra - AutoXpert</title>
            <style>
                body {
                    font-family: 'Courier New', monospace;
                    margin: 20px;
                    background: white;
                }
                .ticket-content {
                    max-width: 400px;
                    margin: 0 auto;
                    padding: 20px;
                    border: 2px dashed #000;
                }
                .ticket-header {
                    text-align: center;
                    border-bottom: 2px solid #000;
                    padding-bottom: 15px;
                    margin-bottom: 20px;
                }
                .ticket-header h3 {
                    margin: 0;
                    font-size: 1.5rem;
                }
                .ticket-row {
                    display: flex;
                    justify-content: space-between;
                    margin: 8px 0;
                    padding: 5px 0;
                }
                .ticket-row.total {
                    border-top: 2px solid #000;
                    font-weight: bold;
                    font-size: 1.2rem;
                    margin-top: 15px;
                    padding-top: 10px;
                }
                .ticket-footer {
                    text-align: center;
                    margin-top: 20px;
                    padding-top: 15px;
                    border-top: 1px dashed #000;
                    font-size: 0.9rem;
                }
                @media print {
                    body { margin: 0; }
                    .ticket-content { border: none; }
                }
            </style>
        </head>
        <body>
            <div class="ticket-content">
                ${ticketContent}
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
}

// Función para descargar ticket como PDF (simulado)
function downloadTicket() {
    // En una implementación real, aquí usarías una librería como jsPDF
    showSuccessMessage('Función de descarga PDF estará disponible próximamente.');
}

// Funciones auxiliares para mensajes
function showLoadingMessage(message) {
    // Crear overlay de carga
    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        color: white;
        font-size: 1.2rem;
    `;
    overlay.innerHTML = `
        <div style="text-align: center;">
            <div style="border: 4px solid #f3f3f3; border-top: 4px solid #ff6b35; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
            <p>${message}</p>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    document.body.appendChild(overlay);
}

function hideLoadingMessage() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.remove();
    }
}

function showSuccessMessage(message) {
    // Crear notificación de éxito
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #28a745, #20c997);
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
        z-index: 10001;
        max-width: 300px;
        font-size: 0.9rem;
        animation: slideIn 0.3s ease;
    `;
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-check-circle" style="font-size: 1.2rem;"></i>
            <span>${message}</span>
        </div>
        <style>
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        </style>
    `;
    
    document.body.appendChild(notification);
    
    // Remover después de 4 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Formatear campos de tarjeta
function formatCardNumber(input) {
    let value = input.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
    input.value = formattedValue;
}

function formatCardExpiry(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    input.value = value;
}

function formatCardCVV(input) {
    input.value = input.value.replace(/\D/g, '');
}

// Inicializar formateo de campos cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Formatear campos de tarjeta
    const cardNumberInput = document.getElementById('cardNumber');
    const cardExpiryInput = document.getElementById('cardExpiry');
    const cardCVVInput = document.getElementById('cardCVV');
    
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function() {
            formatCardNumber(this);
        });
    }
    
    if (cardExpiryInput) {
        cardExpiryInput.addEventListener('input', function() {
            formatCardExpiry(this);
        });
    }
    
    if (cardCVVInput) {
        cardCVVInput.addEventListener('input', function() {
            formatCardCVV(this);
        });
    }
});

window.AutoXpert = {
    contactVehicle,
    showVehicleDetails,
    openWhatsApp,
    openEmail,
    filterVehicles,
    openModal,
    closeModal,
    openFinancingModal,
    selectPaymentMethod,
    processCardPayment,
    processYapePayment,
    generateCashTicket,
    printTicket,
    downloadTicket
};

// Exponer funciones globalmente para compatibilidad
window.openModal = openModal;
window.closeModal = closeModal;
window.closeVehicleModal = closeVehicleModal;
window.closeAllModals = closeAllModals;
window.showVehicleDetails = showVehicleDetails;
window.contactVehicle = contactVehicle;
window.openFinancingModal = openFinancingModal;
window.selectPaymentMethod = selectPaymentMethod;
window.processCardPayment = processCardPayment;
window.processYapePayment = processYapePayment;
window.generateCashTicket = generateCashTicket;
window.printTicket = printTicket;
window.downloadTicket = downloadTicket;

// Funciones de autenticación
window.loginWithGoogle = loginWithGoogle;
window.registerWithGoogle = registerWithGoogle;
window.logout = logout;
window.togglePassword = togglePassword;
window.toggleUserMenu = toggleUserMenu;
window.resendVerificationEmail = resendVerificationEmail;
window.showUserProfile = showUserProfile;
window.showUserOrders = showUserOrders;
window.showUserSettings = showUserSettings;

// ===== LANDING PAGE AUTHENTICATION =====

function switchLandingView(view) {
    const loginView = document.getElementById('landing-login-view');
    const registerView = document.getElementById('landing-register-view');
    const forgotPasswordView = document.getElementById('landing-forgot-password-view');
    
    // Ocultar todas las vistas primero
    if (loginView) loginView.style.display = 'none';
    if (registerView) registerView.style.display = 'none';
    if (forgotPasswordView) forgotPasswordView.style.display = 'none';
    
    // Mostrar la vista correspondiente
    if (view === 'login') {
        if (loginView) {
            loginView.style.display = 'block';
            // Limpiar campos cuando se muestra la vista de login
            setTimeout(() => clearLoginFields(), 50);
        }
    } else if (view === 'register') {
        if (registerView) registerView.style.display = 'block';
    } else if (view === 'forgot-password') {
        if (forgotPasswordView) forgotPasswordView.style.display = 'block';
    }
}

async function handleLandingLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('landing-login-email').value;
    const password = document.getElementById('landing-login-password').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    try {
        showLoading(submitBtn);
        
        if (isDemoMode) {
            // Simular login exitoso
            await new Promise(resolve => setTimeout(resolve, 1500));
            const mockUser = {
                uid: 'demo-user-123',
                email: email,
                displayName: email.split('@')[0],
                photoURL: null,
                emailVerified: true
            };
            sessionStorage.setItem('demoUser', JSON.stringify(mockUser));
            
            // Forzar recarga de estado
            location.reload();
            return;
        }

        // Verificar que Firebase esté inicializado
        if (!auth) {
            showAuthError('Firebase no está configurado correctamente. Recarga la página.');
            hideLoading(submitBtn, 'Iniciar Sesión');
            return;
        }

        await signInWithEmailAndPassword(auth, email, password);
        
        showAuthSuccess('¡Bienvenido de vuelta!');
        
    } catch (error) {
        console.error('Login error:', error);
        let errorMsg = getAuthErrorMessage(error.code);
        
        // Mensaje más específico para credenciales inválidas
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
            errorMsg = 'Email o contraseña incorrectos. Verifica tus credenciales e intenta nuevamente.';
        }
        
        showAuthError(errorMsg);
    } finally {
        hideLoading(submitBtn, 'Iniciar Sesión');
    }
}

async function handleLandingRegister(e) {
    e.preventDefault();
    
    const email = document.getElementById('landing-register-email').value;
    const password = document.getElementById('landing-register-password').value;
    const confirmPassword = document.getElementById('landing-register-confirm-password').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
        showAuthError('Las contraseñas no coinciden');
        return;
    }
    
    if (password.length < 6) {
        showAuthError('La contraseña debe tener al menos 6 caracteres');
        return;
    }
    
    // Validar email
    if (!email || !email.includes('@')) {
        showAuthError('Por favor, ingresa un email válido');
        return;
    }
    
    try {
        showLoading(submitBtn);
        
        if (isDemoMode) {
            // Simular registro exitoso
            await new Promise(resolve => setTimeout(resolve, 1500));
            const mockUser = {
                uid: 'demo-user-123',
                email: email,
                displayName: email.split('@')[0],
                photoURL: null,
                emailVerified: true
            };
            sessionStorage.setItem('demoUser', JSON.stringify(mockUser));
            
            showAuthSuccess('¡Cuenta creada exitosamente (Modo Demo)!');
            
            // Forzar recarga de estado
            setTimeout(() => location.reload(), 1500);
            return;
        }

        // Verificar que Firebase esté inicializado
        if (!auth) {
            showAuthError('Firebase no está configurado correctamente. Verifica tu API key en Firebase Console.');
            hideLoading(submitBtn, 'Crear Cuenta');
            return;
        }

        // Crear usuario
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Usar el email como nombre por defecto
        const displayName = email.split('@')[0];
        
        // Actualizar perfil
        try {
            await updateProfile(user, {
                displayName: displayName
            });
        } catch (profileError) {
            console.warn('Error al actualizar perfil:', profileError);
            // No bloqueamos el registro si falla actualizar el perfil
        }
        
        // Guardar datos adicionales en Firestore
        try {
            if (db) {
                await setDoc(doc(db, 'users', user.uid), {
                    firstName: displayName,
                    lastName: '',
                    email: email,
                    createdAt: serverTimestamp(),
                    newsletter: false
                });
            }
        } catch (firestoreError) {
            console.warn('Error al guardar en Firestore:', firestoreError);
            // No bloqueamos el registro si falla guardar en Firestore
        }
        
        // Enviar email de verificación
        try {
            await sendEmailVerification(user, {
                url: window.location.origin
            });
        } catch (emailError) {
            console.warn('Error al enviar email de verificación:', emailError);
            // No bloqueamos el registro si falla el email
        }
        
        showAuthSuccess('¡Cuenta creada exitosamente! Revisa tu email para verificar tu cuenta.');
        
    } catch (error) {
        console.error('Register error:', error);
        let errorMsg = getAuthErrorMessage(error.code);
        
        // Mensaje más específico para errores de API key
        if (error.code === 'auth/api-key-not-valid' || 
            error.code === 'auth/invalid-api-key' ||
            error.message?.includes('API key not valid')) {
            errorMsg = '⚠️ API Key de Firebase inválida\n\n' +
                      'Solución:\n' +
                      '1. Ve a https://console.firebase.google.com/\n' +
                      '2. Selecciona tu proyecto\n' +
                      '3. Ve a ⚙️ Configuración del proyecto\n' +
                      '4. Copia la API key correcta\n' +
                      '5. Actualiza script.js línea 17';
        }
        
        showAuthError(errorMsg || 'Error al crear la cuenta. Intenta nuevamente.');
    } finally {
        hideLoading(submitBtn, 'Crear Cuenta');
    }
}

async function handleLandingForgotPassword(e) {
    e.preventDefault();
    
    const email = document.getElementById('landing-forgot-email').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    try {
        showLoading(submitBtn);
        
        if (isDemoMode) {
            // Simular envío exitoso
            await new Promise(resolve => setTimeout(resolve, 1500));
            showAuthSuccess('¡Enlace enviado (Modo Demo)! Revisa tu email.');
            return;
        }
        
        await sendPasswordResetEmail(auth, email);
        
        showAuthSuccess('¡Enlace enviado! Revisa tu email para restablecer tu contraseña.');
        
    } catch (error) {
        console.error('Forgot password error:', error);
        showAuthError(getAuthErrorMessage(error.code));
    } finally {
        hideLoading(submitBtn, 'Enviar Instrucciones');
    }
}

// Expose landing functions
window.switchLandingView = switchLandingView;
window.handleLandingLogin = handleLandingLogin;
window.handleLandingRegister = handleLandingRegister;
window.handleLandingForgotPassword = handleLandingForgotPassword;

// ===== FONDO ANIMADO DE LOGIN =====
class AuthBackgroundAnimation {
    constructor() {
        this.canvas = document.getElementById('authBackgroundCanvas');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.meshPoints = [];
        this.animationId = null;
        this.mouseX = 0;
        this.mouseY = 0;
        
        this.resizeCanvas();
        this.initializeParticles();
        this.initializeMeshPoints();
        this.animate();
        
        window.addEventListener('resize', () => this.resizeCanvas());
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    initializeParticles() {
        this.particles = [];
        const particleCount = Math.floor((this.canvas.width * this.canvas.height) / 10000);
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 1.5 + 0.5,
                opacity: Math.random() * 0.5 + 0.2,
                color: `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.1})`
            });
        }
    }
    
    initializeMeshPoints() {
        this.meshPoints = [];
        const cols = 8;
        const rows = 6;
        const cellW = this.canvas.width / cols;
        const cellH = this.canvas.height / rows;
        
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                this.meshPoints.push({
                    x: i * cellW + cellW / 2,
                    y: j * cellH + cellH / 2,
                    baseX: i * cellW + cellW / 2,
                    baseY: j * cellH + cellH / 2,
                    vx: 0,
                    vy: 0
                });
            }
        }
    }
    
    
    updateParticles() {
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            
            // Rebote en límites
            if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;
            
            // Mantener dentro del canvas
            p.x = Math.max(0, Math.min(this.canvas.width, p.x));
            p.y = Math.max(0, Math.min(this.canvas.height, p.y));
        });
    }
    
    updateMeshPoints() {
        const moveStrength = 20;
        
        this.meshPoints.forEach(point => {
            const dx = this.mouseX - point.x;
            const dy = this.mouseY - point.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 200) {
                const angle = Math.atan2(dy, dx);
                const force = (200 - distance) / 200;
                point.vx -= Math.cos(angle) * force * moveStrength;
                point.vy -= Math.sin(angle) * force * moveStrength;
            }
            
            // Damping
            point.vx *= 0.95;
            point.vy *= 0.95;
            
            point.x += point.vx;
            point.y += point.vy;
            
            // Volver al punto base lentamente
            point.x += (point.baseX - point.x) * 0.02;
            point.y += (point.baseY - point.y) * 0.02;
        });
    }
    
    
    drawMesh() {
        const cols = 8;
        const rows = 6;
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i < cols - 1; i++) {
            for (let j = 0; j < rows - 1; j++) {
                const p1 = this.meshPoints[i * rows + j];
                const p2 = this.meshPoints[(i + 1) * rows + j];
                const p3 = this.meshPoints[i * rows + (j + 1)];
                
                if (p1 && p2) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.stroke();
                }
                
                if (p1 && p3) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p3.x, p3.y);
                    this.ctx.stroke();
                }
            }
        }
    }
    
    drawParticles() {
        this.particles.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    animate = () => {
        // Limpiar canvas
        this.ctx.fillStyle = 'rgba(8, 145, 178, 0.01)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Actualizar y dibujar
        this.updateMeshPoints();
        this.drawMesh();
        
        this.updateParticles();
        this.drawParticles();
        
        this.animationId = requestAnimationFrame(this.animate);
    }
}

// Inicializar fondo animado
function initializeAuthBackground() {
    if (document.getElementById('authBackgroundCanvas')) {
        new AuthBackgroundAnimation();
    }
}

console.log('🚗 AutoXpert JavaScript cargado correctamente');