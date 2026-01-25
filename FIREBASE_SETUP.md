# 🔥 Configuración de Firebase para AutoXpert

## Pasos para configurar Firebase:

### 1. Crear proyecto en Firebase
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Crear un proyecto"
3. Nombra tu proyecto: `AutoXpert`
4. Habilita Google Analytics (opcional)

### 2. Configurar Authentication
1. En el panel de Firebase, ve a **Authentication**
2. Haz clic en **Comenzar**
3. Ve a la pestaña **Sign-in method**
4. Habilita los siguientes proveedores:
   - **Email/Password** ✅
   - **Google** ✅

### 3. Configurar Firestore Database
1. Ve a **Firestore Database**
2. Haz clic en **Crear base de datos**
3. Selecciona **Modo de prueba** (por ahora)
4. Elige una ubicación cercana

### 4. Obtener configuración
1. Ve a **Configuración del proyecto** (ícono de engranaje)
2. Baja hasta **Tus aplicaciones**
3. Haz clic en **Web** (`</>`)
4. Registra tu app: `AutoXpert Web`
5. Copia la configuración que aparece

### 5. Actualizar script.js
Reemplaza la configuración en `script.js` línea 8:

```javascript
const firebaseConfig = {
    apiKey: "tu-api-key-aqui",
    authDomain: "tu-proyecto.firebaseapp.com",
    projectId: "tu-proyecto-id",
    storageBucket: "tu-proyecto.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};
```

### 6. Configurar reglas de Firestore
Ve a **Firestore Database > Reglas** y usa estas reglas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuarios pueden leer/escribir sus propios datos
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Todos pueden leer vehículos (catálogo público)
    match /vehicles/{vehicleId} {
      allow read: if true;
      allow write: if request.auth != null; // Solo usuarios autenticados pueden escribir
    }
  }
}
```

### 7. Configurar dominio autorizado
1. Ve a **Authentication > Settings**
2. En **Authorized domains**, agrega tu dominio
3. Para desarrollo local: `localhost` ya está incluido

## 🎯 Funcionalidades implementadas:

### ✅ Autenticación
- Login con email/contraseña
- Registro con email/contraseña  
- Login/registro con Google
- Recuperación de contraseña
- Verificación de email
- Logout

### ✅ Notificaciones por email
- Email de bienvenida al registrarse
- Email de verificación de cuenta
- Email de recuperación de contraseña
- Notificaciones automáticas de Firebase

### ✅ UI/UX
- Modales elegantes y responsivos
- Indicador de fuerza de contraseña
- Notificaciones de éxito/error
- Perfil de usuario en navbar
- Menú desplegable de usuario

### ✅ Seguridad
- Validación de contraseñas
- Verificación de email obligatoria
- Reglas de seguridad en Firestore
- Manejo de errores completo

## 🚀 Próximos pasos:
1. Configurar Firebase según estas instrucciones
2. Personalizar emails de Firebase (opcional)
3. Agregar más campos al perfil de usuario
4. Implementar sistema de favoritos
5. Historial de compras/consultas

## 📧 Emails automáticos que se envían:
- ✅ Verificación de cuenta
- ✅ Recuperación de contraseña  
- ✅ Notificación de cambio de contraseña
- ✅ Bienvenida (automático de Firebase)

¡Tu sistema de autenticación profesional está listo! 🎉