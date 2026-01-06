const PasswordResetModel = require('../models/passwordReset.model');
const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('./email.service');

class PasswordResetService {
    // Generar código de 6 dígitos
    generateResetCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // Solicitar recuperación de contraseña
    async requestPasswordReset(email) {
        try {
            console.log('🔍 DEBUG PASSWORD RESET - Iniciando requestPasswordReset para:', email);
            
            // Verificar si el usuario existe
            const user = await User.getByEmail(email);
            console.log('🔍 DEBUG PASSWORD RESET - Usuario encontrado:', user ? 'SÍ' : 'NO');
            
            if (!user) {
                throw new Error('No existe una cuenta con este email');
            }

            console.log('🔍 DEBUG PASSWORD RESET - ID del usuario:', user.id_usuario);
            // Invalidar códigos anteriores del usuario
            await PasswordResetModel.markPreviousAsUsed(user.id_usuario);

            // Generar nuevo código
            const resetCode = this.generateResetCode();
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 15); // Expira en 15 minutos

            // Guardar código en la base de datos
            await PasswordResetModel.create({
                user_id: user.id_usuario,
                email: email,
                reset_code: resetCode,
                expires_at: expiresAt,
                used: false
            });

            // Enviar email con el código
            const emailSubject = 'Código de recuperación de contraseña - Feraytek';
            const emailBody = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Recuperación de Contraseña</h2>
                    <p>Hola <strong>${user.nombre} ${user.apellido}</strong>,</p>
                    <p>Has solicitado recuperar tu contraseña. Usa el siguiente código para continuar:</p>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                        <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${resetCode}</h1>
                    </div>
                    
                    <p><strong>Este código expira en 15 minutos.</strong></p>
                    <p>Si no solicitaste este cambio, puedes ignorar este email.</p>
                    
                    <hr style="margin: 30px 0;">
                    <p style="color: #666; font-size: 12px;">
                        Este es un email automático, por favor no respondas a este mensaje.
                    </p>
                </div>
            `;

            await sendEmail({
                to: user.email,
                subject: emailSubject,
                html: emailBody,
                text: `Código de recuperación de contraseña: ${resetCode}. Este código expira en 15 minutos.`
            });

            return {
                success: true,
                message: 'Código de recuperación enviado a tu email',
                email: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') // Ocultar parte del email
            };

        } catch (error) {
            console.error('Error en requestPasswordReset:', error);
            throw error;
        }
    }

    // Verificar código de recuperación
    async verifyResetCode(email, code) {
        try {
            // CÓDIGO TEMPORAL PARA PRUEBAS - Permitir código 123456 para desarrollo
            if (code === '123456' && process.env.NODE_ENV !== 'production') {
                console.log('🧪 USANDO CÓDIGO DE PRUEBA TEMPORAL');
                return {
                    success: true,
                    message: 'Código verificado correctamente (modo prueba)',
                    resetId: 'test-reset-id'
                };
            }

            const resetRecord = await PasswordResetModel.findByEmailAndCode(email, code);

            if (!resetRecord) {
                throw new Error('Código inválido o ya utilizado');
            }

            // Verificar si el código ha expirado
            if (new Date() > new Date(resetRecord.expires_at)) {
                throw new Error('El código ha expirado. Solicita uno nuevo');
            }

            return {
                success: true,
                message: 'Código verificado correctamente',
                resetId: resetRecord.id
            };

        } catch (error) {
            console.error('Error en verifyResetCode:', error);
            throw error;
        }
    }

    // Cambiar contraseña con código válido
    async resetPassword(email, code, newPassword, confirmPassword) {
        try {
            console.log('🔍 DEBUG RESET PASSWORD - Iniciando con:', { email, code, NODE_ENV: process.env.NODE_ENV });
            
            // Validar que las contraseñas coincidan
            if (newPassword !== confirmPassword) {
                throw new Error('Las contraseñas no coinciden');
            }

            // Validar fortaleza de la contraseña
            if (newPassword.length < 6) {
                throw new Error('La contraseña debe tener al menos 6 caracteres');
            }

            let resetRecord;
            let user;

            // Verificar código en base de datos
            resetRecord = await PasswordResetModel.findByEmailAndCode(email, code);

            if (!resetRecord) {
                throw new Error('Código inválido o ya utilizado');
            }

            if (new Date() > new Date(resetRecord.expires_at)) {
                throw new Error('El código ha expirado. Solicita uno nuevo');
            }

            // Obtener usuario
            user = await User.getById(resetRecord.user_id);
            if (!user) {
                throw new Error('Usuario no encontrado');
            }

            // Actualizar contraseña del usuario (sin hashear, el modelo lo hará)
            await User.updatePassword(user.id_usuario, newPassword);

            // Marcar código como usado
            await PasswordResetModel.markAsUsed(resetRecord.id);

            // Enviar email de confirmación (reutilizando el mismo que ya tienes)
            console.log('📧 Preparando envío de email de confirmación...');
            const emailSubject = 'Contraseña actualizada exitosamente - Feraytek';
            const emailBody = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #28a745;">¡Contraseña Actualizada!</h2>
                    <p>Hola <strong>${user.nombre} ${user.apellido}</strong>,</p>
                    <p>Tu contraseña ha sido cambiada exitosamente mediante el código de recuperación.</p>
                    
                    <div style="background-color: #d4edda; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; color: #155724;">
                            <strong>✓ Cambio realizado:</strong> ${new Date().toLocaleString('es-ES')}
                        </p>
                    </div>
                    
                    <p>Si no realizaste este cambio, contacta inmediatamente con nuestro soporte.</p>
                    
                    <hr style="margin: 30px 0;">
                    <p style="color: #666; font-size: 12px;">
                        Este es un email automático, por favor no respondas a este mensaje.
                    </p>
                </div>
            `;

            console.log('📧 Llamando a sendEmail con:', {
                to: user.email,
                subject: emailSubject,
                hasHtml: !!emailBody,
                hasText: true
            });

            try {
                await sendEmail({
                    to: user.email,
                    subject: emailSubject,
                    html: emailBody,
                    text: `Tu contraseña ha sido cambiada exitosamente. Cambio realizado: ${new Date().toLocaleString('es-ES')}`
                });

                console.log('✅ Email de confirmación enviado correctamente');
            } catch (error) {
                console.error('❌ Error al enviar email de confirmación:', error.message);
                // No lanzamos el error aquí porque el cambio de contraseña ya se realizó exitosamente
                console.log('⚠️ Contraseña cambiada pero email no enviado');
            }

            return {
                success: true,
                message: 'Contraseña actualizada exitosamente',
                user: {
                    id: user.id_usuario,
                    nombre: user.nombre_usuario,
                    email: user.email
                }
            };

        } catch (error) {
            console.error('Error en resetPassword:', error);
            throw error;
        }
    }

    // Limpiar códigos expirados (función de mantenimiento)
    async cleanExpiredCodes() {
        try {
            const result = await PasswordResetModel.cleanExpired();
            console.log(`Códigos expirados eliminados: ${result}`);
            return result;
        } catch (error) {
            console.error('Error limpiando códigos expirados:', error);
            throw error;
        }
    }
}

module.exports = new PasswordResetService();