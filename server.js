const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('.'));

// Configuración de Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Función para generar HTML del email profesional
function generateEmailHTML(formData) {
    const countryNames = {
        'PE': 'Perú',
        'MX': 'México',
        'CO': 'Colombia',
        'CL': 'Chile',
        'AR': 'Argentina',
        'ES': 'España',
        'US': 'Estados Unidos',
        'BO': 'Bolivia',
        'EC': 'Ecuador'
    };

    const interestLabels = {
        'compra': 'Compra de vehículo',
        'servicio': 'Servicio técnico',
        'financiamiento': 'Financiamiento',
        'otro': 'Otro'
    };

    const countryName = countryNames[formData.country] || formData.country;
    const interestText = interestLabels[formData.interest] || formData.interest;

    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: 'Poppins', sans-serif;
                background-color: #f5f5f5;
                padding: 20px;
            }
            .email-container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 10px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
                color: white;
                padding: 30px 20px;
                text-align: center;
            }
            .header-icon {
                font-size: 48px;
                margin-bottom: 10px;
            }
            .header h1 {
                font-size: 28px;
                margin-bottom: 5px;
                font-weight: 700;
            }
            .header p {
                font-size: 14px;
                opacity: 0.9;
            }
            .content {
                padding: 30px;
            }
            .greeting {
                font-size: 18px;
                color: #333;
                margin-bottom: 20px;
                font-weight: 600;
            }
            .intro-text {
                color: #666;
                margin-bottom: 25px;
                line-height: 1.6;
            }
            .info-section {
                background-color: #f8f9fa;
                border-left: 4px solid #00d4ff;
                padding: 20px;
                margin-bottom: 20px;
                border-radius: 5px;
            }
            .info-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 12px;
                align-items: flex-start;
            }
            .info-label {
                font-weight: 600;
                color: #333;
                min-width: 120px;
            }
            .info-value {
                color: #666;
                word-break: break-word;
                flex: 1;
            }
            .message-section {
                background-color: #ffffff;
                border: 2px solid #e9ecef;
                padding: 15px;
                margin: 20px 0;
                border-radius: 5px;
            }
            .message-label {
                font-weight: 600;
                color: #333;
                margin-bottom: 10px;
                font-size: 14px;
                text-transform: uppercase;
            }
            .message-text {
                color: #555;
                line-height: 1.6;
                white-space: pre-wrap;
                word-wrap: break-word;
            }
            .cta-section {
                background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
                color: white;
                padding: 25px;
                text-align: center;
                margin: 25px 0;
                border-radius: 5px;
            }
            .cta-text {
                font-size: 16px;
                margin-bottom: 15px;
            }
            .cta-button {
                display: inline-block;
                background-color: white;
                color: #0099cc;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 5px;
                font-weight: 600;
                transition: all 0.3s ease;
            }
            .cta-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            .footer {
                background-color: #f8f9fa;
                padding: 20px;
                text-align: center;
                border-top: 1px solid #e9ecef;
            }
            .footer-text {
                color: #999;
                font-size: 12px;
                margin: 5px 0;
            }
            .footer-social {
                margin-top: 15px;
            }
            .social-link {
                display: inline-block;
                width: 35px;
                height: 35px;
                background-color: #00d4ff;
                border-radius: 50%;
                text-align: center;
                line-height: 35px;
                color: white;
                text-decoration: none;
                margin: 0 5px;
                font-size: 16px;
            }
            .highlight {
                color: #00d4ff;
                font-weight: 600;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <!-- Header -->
            <div class="header">
                <div class="header-icon"></div>
                <h1>AutoXpert</h1>
                <p>La experiencia definitiva en vehículos de lujo</p>
            </div>

            <!-- Content -->
            <div class="content">
                <div class="greeting">¡Hola Jordan!</div>
                
                <div class="intro-text">
                    Has recibido un nuevo mensaje de contacto desde tu sitio web de <span class="highlight">AutoXpert</span>. Un cliente interesado se ha comunicado contigo con información detallada. Aquí están los detalles:
                </div>

                <!-- Información del Cliente -->
                <div class="info-section">
                    <div class="info-row">
                        <div class="info-label">Nombre:</div>
                        <div class="info-value"><strong>${formData.name}</strong></div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Email:</div>
                        <div class="info-value"><strong>${formData.email}</strong></div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Teléfono:</div>
                        <div class="info-value"><strong>${formData.countryCode} ${formData.phone}</strong></div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">País:</div>
                        <div class="info-value"><strong>${countryName}</strong></div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Interés:</div>
                        <div class="info-value"><strong>${interestText}</strong></div>
                    </div>
                </div>

                <!-- Mensaje del Cliente -->
                <div>
                    <div class="message-label">Mensaje del Cliente:</div>
                    <div class="message-section">
                        <div class="message-text">${formData.message}</div>
                    </div>
                </div>

                <!-- CTA Section -->
                <div class="cta-section">
                    <div class="cta-text">Responde pronto a este cliente para no perder esta oportunidad</div>
                    <a href="mailto:${formData.email}" class="cta-button">Responder al Cliente</a>
                </div>

                <div class="intro-text">
                    Este es un cliente potencial interesado en tus servicios. Te recomendamos contactarlo lo antes posible para maximizar la oportunidad de venta.
                </div>
            </div>

            <!-- Footer -->
            <div class="footer">
                <div class="footer-text"><strong>AutoXpert</strong></div>
                <div class="footer-text">La experiencia definitiva en vehículos de lujo</div>
                <div class="footer-text">Teléfono: +51 986182856</div>
                <div class="footer-text">Email: jordanpmrojasbazan@gmail.com</div>
                <div class="footer-social">
                    <a href="https://wa.me/51986182856" class="social-link">WhatsApp</a>
                </div>
                <div class="footer-text" style="margin-top: 15px; font-size: 11px; color: #ccc;">
                    Este es un email automático del sistema de contacto de AutoXpert
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
}

// Ruta para recibir formularios
app.post('/api/send-contact', async (req, res) => {
    try {
        const { name, email, phone, country, countryCode, interest, message } = req.body;

        // Validación
        if (!name || !email || !phone || !country || !interest || !message) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        const formData = {
            name,
            email,
            phone,
            country,
            countryCode,
            interest,
            message
        };

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: `Nuevo Mensaje de Contacto - ${name} (AutoXpert)`,
            html: generateEmailHTML(formData),
            replyTo: email
        };

        // Enviar email
        await transporter.sendMail(mailOptions);

        res.json({ 
            success: true, 
            message: 'Mensaje enviado exitosamente' 
        });

    } catch (error) {
        console.error('Error al enviar email:', error);
        res.status(500).json({ error: 'Error al enviar el mensaje' });
    }
});

// Ruta de prueba
app.get('/test', (req, res) => {
    res.json({ message: 'Servidor funcionando correctamente' });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor AutoXpert corriendo en http://localhost:${PORT}`);
});
