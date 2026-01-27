# AutoXpert - Gestor de Vehículos de Lujo

## Descripción General

AutoXpert es una aplicación web moderna para la gestión y venta de vehículos de lujo. Funciona como un catálogo interactivo donde los usuarios pueden explorar vehículos premium, consultar detalles técnicos, y realizar operaciones de compra con diferentes métodos de pago. La aplicación incluye un sistema de autenticación seguro y una experiencia de usuario pulida con animaciones y efectos visuales.

## Tecnologías y Librerías Utilizadas

### Frontend

**HTML5 y CSS3**
La estructura de la aplicación está construida con HTML5 semántico y estilos CSS3 modernos. Se utiliza CSS custom properties (variables) para mantener consistencia en colores, tipografía y espaciado. El diseño es responsive y se adapta a cualquier tamaño de pantalla mediante media queries.

**JavaScript Vanilla (ES6+)**
El código JavaScript no utiliza frameworks como React o Vue, sino que está escrito en vanilla JavaScript con características modernas de ES6 como clases, arrow functions, template literals y desestructuración. Esto mantiene la aplicación ligera sin dependencias innecesarias.

**Font Awesome**
Se utiliza la librería Font Awesome para iconos escalables. Se incluye mediante CDN y proporciona iconos para navegación, botones de acción y elementos de la interfaz.

**Google Fonts**
La tipografía utiliza la fuente "Poppins" desde Google Fonts, proporcionando una apariencia moderna y clara en toda la aplicación.

### Backend

**Node.js y Express**
El servidor backend se ejecuta en Node.js con Express como framework. Express maneja las rutas básicas, sirve los archivos estáticos y proporciona endpoints para operaciones específicas.

**Firebase (Google)**
Firebase es la plataforma de backend como servicio utilizada para:

- Autenticación de usuarios mediante correo electrónico y Google OAuth
- Base de datos Firestore para almacenar información de usuarios
- Analytics para rastrear el comportamiento de usuarios

## Funcionalidades Principales

### Sistema de Autenticación

La aplicación utiliza Firebase Authentication para gestionar el acceso de usuarios. Soporta dos métodos de autenticación:

1. Correo electrónico y contraseña
2. Inicio de sesión con Google

El proceso de registro requiere que los usuarios verifiquen su correo electrónico antes de acceder a la aplicación. Se implementa un flujo de restablecimiento de contraseña para usuarios que olviden su clave.

### Catálogo de Vehículos

El catálogo muestra una colección de vehículos de lujo con información detallada como precio, especificaciones técnicas, características, y galería de imágenes. Los usuarios pueden filtrar vehículos por categoría y buscar específicamente.

### Sistema de Pagos

La aplicación implementa un sistema de pagos con múltiples métodos:

1. Tarjeta de crédito/débito
2. Efectivo en agencia
3. Financiamiento

Cada método de pago tiene su propio flujo y formulario de confirmación. El sistema gestiona la información de pagos de forma segura.

### Servicios Adicionales

La aplicación ofrece servicios complementarios mediante WhatsApp:

- Mantenimiento especializado
- Planchado y pintura
- Mecánica
- Seguros
- Financiamiento

Los usuarios pueden solicitar cotizaciones y ser contactados por el equipo de ventas.

## Estructura de la Aplicación

### Carpeta de Proyecto

```
AutoXpert/
├── index.html           - Estructura HTML principal
├── script.js            - Lógica JavaScript de la aplicación
├── styles.css           - Estilos CSS de la aplicación
├── server.js            - Servidor Express
├── package.json         - Dependencias de Node.js
├── .env                 - Variables de entorno (incluida config de Firebase)
└── Nueva carpeta/       - Archivos de debugging
```

### Archivos Principales

**index.html**
Contiene la estructura completa de la aplicación, incluyendo la página de inicio de sesión, el catálogo de vehículos, y todos los modales de la aplicación. Utiliza meta tags para SEO y responsividad.

**script.js**
Archivo principal de lógica que incluye:
- Inicialización de Firebase
- Funciones de autenticación
- Gestión del catálogo de vehículos
- Animaciones de fondo
- Funciones de interacción del usuario
- Comunicación con la API de WhatsApp

**styles.css**
Archivo de estilos que define:
- Variables CSS para consistencia visual
- Estilos base y globales
- Componentes reutilizables (botones, tarjetas, modales)
- Animaciones y transiciones
- Estilos responsive

**server.js**
Servidor Express que sirve la aplicación. Escucha en un puerto específico y maneja las solicitudes HTTP estáticas.

## Configuración de Firebase

Firebase se configura mediante variables de entorno almacenadas en un archivo `.env`. La configuración incluye:

- API Key
- Auth Domain
- Project ID
- Storage Bucket
- Messaging Sender ID
- App ID
- Measurement ID

Estos valores se proporcionan en la consola de Firebase y se utilizan para inicializar la aplicación en tiempo de ejecución.

### Autenticación con Firebase

Firebase Authentication valida credenciales de usuarios y mantiene sesiones activas. La aplicación verifica el estado de autenticación al cargar y redirige a usuarios no autenticados a la página de inicio de sesión.

### Firestore Database

Firestore es la base de datos NoSQL utilizada para almacenar:
- Información de perfil de usuarios
- Timestamps de última actividad
- Datos de solicitudes de servicio

Los datos se organizan en colecciones y documentos, permitiendo consultas flexibles.

## Flujo de Navegación

1. **Página de Inicio de Sesión**: Los usuarios no autenticados ven un formulario de login con opciones de Google o correo.

2. **Verificación de Email**: Después del registro, se envía un email de verificación que el usuario debe confirmar.

3. **Dashboard**: Una vez autenticado, el usuario ve el catálogo de vehículos.

4. **Detalles del Vehículo**: Al hacer clic en un vehículo, se abre un modal con información detallada.

5. **Compra**: El usuario puede iniciar el proceso de compra seleccionando un método de pago.

6. **Servicios**: Los usuarios pueden solicitar servicios adicionales mediante formularios que envían mensajes a WhatsApp.

## Animaciones y Efectos Visuales

La aplicación incluye varias animaciones para mejorar la experiencia visual:

**Fondo Animado de Login**
Un canvas animado muestra un fondo dinámico con partículas flotantes y una malla interactiva que reacciona al movimiento del mouse. Esto proporciona una experiencia inmersiva sin afectar la funcionalidad del formulario.

**Transiciones de Modales**
Los modales utilizan transiciones suaves de opacidad y escala para entradas y salidas.

**Animaciones de Scroll**
Elementos se animan suavemente cuando se hacen visibles durante el scroll.

**Efectos Hover**
Botones y tarjetas tienen efectos hover que indican interactividad.

## Temas Visual

La aplicación soporta dos temas:

1. **Modo Claro**: Fondo blanco con colores primarios cyan y teal.
2. **Modo Oscuro**: Fondo oscuro con los mismos colores primarios.

Los temas se almacenan en localStorage y se aplican automáticamente al cargar la página.

## Seguridad

### Autenticación
Firebase maneja la autenticación de forma segura. Las contraseñas no se almacenan en la aplicación, sino que se validan mediante los servidores de Google.

### Variables de Entorno
Las credenciales de Firebase se almacenan en un archivo `.env` que no se incluye en el repositorio Git. Esto evita exponer información sensible.

### HTTPS
La aplicación está diseñada para funcionar únicamente sobre conexiones HTTPS en producción.

### Validación de Entrada
Los formularios validan entrada de usuario para prevenir inyección de SQL y otros ataques.

## Configuración Inicial

Para ejecutar la aplicación localmente:

1. Instalar Node.js en el sistema
2. Clonar el repositorio
3. Ejecutar `npm install` para instalar dependencias
4. Crear un archivo `.env` con las credenciales de Firebase
5. Ejecutar `npm start` para iniciar el servidor
6. Abrir `http://localhost:5000` en el navegador

## Integración con WhatsApp

Los usuarios pueden enviar mensajes a través de WhatsApp utilizando la API de WhatsApp Business. Los números de contacto y mensajes predefinidos se configuran en el código JavaScript.

## Mantenimiento y Extensión

El código está organizado en funciones modulares que facilitan el mantenimiento y la extensión. Para agregar nuevas funcionalidades:

1. Agregar HTML en `index.html`
2. Agregar estilos en `styles.css`
3. Agregar lógica en `script.js`

La separación de preocupaciones permite trabajar independientemente en cada aspecto de la aplicación.

## Conclusión

AutoXpert es una aplicación web completa que demuestra mejores prácticas modernas en desarrollo frontend y backend. Utiliza tecnologías probadas y confiables para proporcionar una experiencia segura y agradable a los usuarios.
