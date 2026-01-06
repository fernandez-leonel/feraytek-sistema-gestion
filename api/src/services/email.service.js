const nodemailer = require('nodemailer');

function createTransportFromEnv() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE, SMTP_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    throw new Error('Configuración SMTP incompleta. Verifique variables SMTP_* en .env');
  }

  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE ? SMTP_SECURE === 'true' : Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return { transport, from: SMTP_FROM };
}

async function sendEmail({ to, subject, text, html, attachments }) {
  try {
    const { transport, from } = createTransportFromEnv();

    const mailOptions = {
      from,
      to,
      subject,
      text,
      html,
      attachments,
    };

    console.log(`📧 Enviando email a: ${to}`);
    console.log(`📧 Asunto: ${subject}`);
    
    const result = await transport.sendMail(mailOptions);
    
    console.log(`✅ Email enviado exitosamente. MessageId: ${result.messageId}`);
    
    return result;
  } catch (error) {
    console.error('❌ Error enviando email:', error.message);
    throw new Error(`Error enviando email: ${error.message}`);
  }
}

function renderFacturaHtml({ numero_factura, fecha, total, cliente }) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #333; margin: 0;">FERAYTEK</h1>
        <p style="color: #666; margin: 5px 0;">Factura Electrónica</p>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <h2 style="color: #333; margin: 0 0 10px 0;">Factura ${numero_factura}</h2>
        <p style="margin: 5px 0;"><strong>Fecha de emisión:</strong> ${fecha}</p>
        <p style="margin: 5px 0;"><strong>Cliente:</strong> ${cliente?.nombre_usuario || cliente?.email || 'Cliente'}</p>
      </div>
      
      <div style="margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Concepto</td>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; text-align: right;">Importe</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;">Productos y servicios</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">$${Number(total).toFixed(2)}</td>
          </tr>
        </table>
      </div>
      
      <div style="text-align: right; margin: 20px 0;">
        <h3 style="color: #333; margin: 0;">Total: $${Number(total).toFixed(2)}</h3>
      </div>
      
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;"/>
      
      <div style="text-align: center; color: #666; font-size: 14px;">
        <p>Gracias por su compra en Feraytek.</p>
        <p>Para cualquier consulta, no dude en contactarnos.</p>
      </div>
    </div>
  `;
}

async function enviarFacturaCliente({ factura, usuario, adjuntoPdfBuffer, adjuntoNombre }) {
  const html = renderFacturaHtml({
    numero_factura: factura.numero_factura,
    fecha: factura.fecha_emision || new Date().toISOString().slice(0, 19).replace('T', ' '),
    total: factura.total,
    cliente: usuario,
  });

  const attachments = adjuntoPdfBuffer
    ? [{ filename: adjuntoNombre || `Factura-${factura.numero_factura}.pdf`, content: adjuntoPdfBuffer }]
    : undefined;

  return await sendEmail({
    to: usuario.email,
    subject: `Factura ${factura.numero_factura} - Feraytek`,
    text: `Estimado/a ${usuario.nombre_usuario || 'Cliente'},\n\nAdjuntamos su factura ${factura.numero_factura}.\nTotal: $${Number(factura.total).toFixed(2)}\n\nGracias por su compra.\n\nSaludos,\nEquipo Feraytek`,
    html,
    attachments,
  });
}

// Función específica para el servicio de facturas
async function enviarFactura(factura) {
  // Obtener datos del usuario desde la factura
  const usuario = {
    email: factura.email,
    nombre_usuario: factura.nombre_usuario
  };

  return await enviarFacturaCliente({
    factura,
    usuario,
    // Por ahora sin PDF, se puede agregar después
    adjuntoPdfBuffer: null,
    adjuntoNombre: null
  });
}

module.exports = {
  sendEmail,
  enviarFacturaCliente,
  enviarFactura,
};