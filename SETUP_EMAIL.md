# 🚗 AutoXpert - Configuración del Backend para Email

## Requisitos previos

- Node.js v22+ instalado
- Cuenta de Gmail
- Contraseña de aplicación de Gmail (no la contraseña normal)

## Pasos para configurar

### 1. Generar Contraseña de Aplicación de Gmail

1. Ve a https://myaccount.google.com/
2. Click en "Seguridad" en el lado izquierdo
3. Habilita "Verificación en dos pasos" (si no está habilitada)
4. Ve a "Contraseñas de aplicación"
5. Selecciona "Correo" y "Windows" (o tu SO)
6. Google generará una contraseña de 16 caracteres
7. Cópiala

### 2. Configurar el archivo .env

Abre el archivo `.env` en la raíz del proyecto y reemplaza:

```
EMAIL_USER=jordanpmrojasbazan@gmail.com
EMAIL_PASSWORD=tu_contraseña_de_16_caracteres_aqui
PORT=3000
```

### 3. Instalar dependencias (si no lo hiciste)

```bash
npm install
```

### 4. Iniciar el servidor

```bash
npm start
```

O en modo desarrollo:

```bash
npm run dev
```

Deberías ver:
```
✅ Servidor AutoXpert corriendo en http://localhost:3000
```

## Funcionalidades implementadas

✅ Formulario de contacto con selector de país/código
✅ Notificación visual al enviar mensaje (sin loader)
✅ Email profesional con HTML diseñado
✅ Validación de formulario en tiempo real
✅ Respuesta automática al correo del cliente

## Campos del formulario

- **Nombre**: Requerido
- **Email**: Requerido y validado
- **País**: Selector con códigos (Perú +51, México +52, etc.)
- **Teléfono**: Requerido
- **Tipo de Interés**: Compra, Servicio, Financiamiento, Otro
- **Mensaje**: Requerido

## Email que recibirás

El email incluye:
- Logo de AutoXpert
- Datos del cliente (nombre, email, teléfono, país)
- Tipo de interés del cliente
- Mensaje completo del cliente
- Botón para responder rápidamente
- Información de contacto de AutoXpert

## Troubleshooting

### Error: "Error de conexión"
- Asegúrate de que el servidor está corriendo: `npm start`
- Verifica que el puerto 3000 está libre

### Error: "Error al enviar el mensaje"
- Verifica que la contraseña de aplicación es correcta
- Abre tu Gmail para ver si hay alertas de seguridad
- Habilita acceso de aplicaciones menos seguras si es necesario

### Los emails no llegan
- Revisa la carpeta de SPAM
- Verifica el EMAIL_USER en el .env
- Asegúrate de haber generado la contraseña de aplicación correctamente

## Desplegar en Producción

Para desplegar a GitHub Pages con emails funcionales, necesitarás un backend externo como:

- Heroku (gratuito hasta cierto límite)
- Railway
- Render
- Vercel (con serverless functions)

Te ayudaré a configurar esto cuando estés listo.
