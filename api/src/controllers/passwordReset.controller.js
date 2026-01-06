const passwordResetService = require('../services/passwordReset.service');

class PasswordResetController {
    // POST /forgot-password - Solicitar código de recuperación
    async requestPasswordReset(req, res) {
        try {
            console.log('🔍 [POSTMAN DEBUG] Request received:', {
                method: req.method,
                url: req.url,
                headers: req.headers,
                body: req.body
            });

            const { email } = req.body;

            // Validar que se proporcione el email
            if (!email) {
                console.log('❌ [POSTMAN DEBUG] Email missing');
                return res.status(400).json({
                    success: false,
                    message: 'El email es requerido'
                });
            }

            // Validar formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                console.log('❌ [POSTMAN DEBUG] Invalid email format:', email);
                return res.status(400).json({
                    success: false,
                    message: 'Formato de email inválido'
                });
            }

            console.log('✅ [POSTMAN DEBUG] Calling service with email:', email);
            const result = await passwordResetService.requestPasswordReset(email);

            console.log('✅ [POSTMAN DEBUG] Service response:', result);
            res.status(200).json({
                success: true,
                message: result.message,
                data: {
                    email: result.email
                }
            });

        } catch (error) {
            console.error('💥 [POSTMAN DEBUG] Error in requestPasswordReset:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            
            // Manejar errores específicos
            if (error.message === 'No existe una cuenta con este email') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // POST /verify-reset-code - Verificar código de recuperación
    async verifyResetCode(req, res) {
        try {
            const { email, code } = req.body;

            // Validar campos requeridos
            if (!email || !code) {
                return res.status(400).json({
                    success: false,
                    message: 'Email y código son requeridos'
                });
            }

            // Validar formato del código (6 dígitos)
            if (!/^\d{6}$/.test(code)) {
                return res.status(400).json({
                    success: false,
                    message: 'El código debe tener 6 dígitos'
                });
            }

            const result = await passwordResetService.verifyResetCode(email, code);

            res.status(200).json({
                success: true,
                message: result.message,
                data: {
                    verified: true,
                    resetId: result.resetId
                }
            });

        } catch (error) {
            console.error('Error en verifyResetCode:', error);
            
            // Manejar errores específicos
            if (error.message.includes('Código inválido') || error.message.includes('expirado')) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // POST /reset-password - Cambiar contraseña con código
    async resetPassword(req, res) {
        try {
            console.log('🔍 [POSTMAN DEBUG] Reset Password Request:', {
                method: req.method,
                url: req.url,
                headers: req.headers,
                body: req.body
            });

            const { email, code, newPassword, confirmPassword } = req.body;

            // Validar campos requeridos
            if (!email || !code || !newPassword || !confirmPassword) {
                console.log('❌ [POSTMAN DEBUG] Missing required fields:', {
                    email: !!email,
                    code: !!code,
                    newPassword: !!newPassword,
                    confirmPassword: !!confirmPassword
                });
                return res.status(400).json({
                    success: false,
                    message: 'Todos los campos son requeridos'
                });
            }

            // Validar formato del código
            if (!/^\d{6}$/.test(code)) {
                console.log('❌ [POSTMAN DEBUG] Invalid code format:', code);
                return res.status(400).json({
                    success: false,
                    message: 'El código debe tener 6 dígitos'
                });
            }

            console.log('✅ [POSTMAN DEBUG] Calling resetPassword service with:', {
                email,
                code,
                passwordLength: newPassword?.length,
                confirmPasswordLength: confirmPassword?.length
            });

            const result = await passwordResetService.resetPassword(email, code, newPassword, confirmPassword);

            console.log('✅ [POSTMAN DEBUG] Service response:', result);
            res.status(200).json({
                success: true,
                message: result.message,
                data: {
                    user: result.user
                }
            });

        } catch (error) {
            console.error('💥 [POSTMAN DEBUG] Error in resetPassword:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            
            // Manejar errores específicos
            if (error.message.includes('contraseñas no coinciden') || 
                error.message.includes('debe tener al menos') ||
                error.message.includes('Código inválido') || 
                error.message.includes('expirado')) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
}

module.exports = new PasswordResetController();