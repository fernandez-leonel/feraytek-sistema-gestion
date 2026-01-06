const { sendEmail } = require('../services/email.service');

// POST /api/email/test
// Endpoint para probar la configuración SMTP
async function probarConfiguracionSMTP(req, res) {
  try {
    const { email_destino } = req.body;

    if (!email_destino) {
      return res.status(400).json({
        ok: false,
        message: 'Debe proporcionar un email_destino para la prueba.'
      });
    }

    // Enviar email de prueba
    const resultado = await sendEmail({
      to: email_destino,
      subject: 'Prueba de Configuración SMTP - Feraytek API',
      text: 'Este es un email de prueba para verificar la configuración SMTP.',
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Prueba de Configuración SMTP</h2>
          <p>Este es un email de prueba para verificar que la configuración SMTP está funcionando correctamente.</p>
          <p><strong>Sistema:</strong> Feraytek API</p>
          <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
          <hr/>
          <p>Si recibiste este email, la configuración SMTP está funcionando correctamente.</p>
        </div>
      `
    });

    return res.status(200).json({
      ok: true,
      message: 'Email de prueba enviado correctamente.',
      data: {
        messageId: resultado.messageId,
        email_destino,
        fecha_envio: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error en prueba SMTP:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al enviar email de prueba.',
      error: error.message
    });
  }
}

module.exports = {
  probarConfiguracionSMTP
};