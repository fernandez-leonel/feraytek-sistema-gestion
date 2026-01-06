// ======================================================================
// Modelo de Recuperación de Contraseña
// Responsable de interactuar directamente con la base de datos MySQL.
// Contiene las operaciones CRUD sobre la tabla "password_resets".
// ======================================================================

const pool = require('../config/database');

class PasswordResetModel {
    // Crear tabla si no existe
    static async createTable() {
        // Primero, obtener información sobre la tabla usuarios para hacer compatible la FK
        const getUserTableInfo = `
            DESCRIBE usuarios
        `;
        
        try {
            const [userTableInfo] = await pool.execute(getUserTableInfo);
            const idUsuarioColumn = userTableInfo.find(col => col.Field === 'id_usuario');
            
            const createTableQuery = `
                CREATE TABLE IF NOT EXISTS password_resets (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id ${idUsuarioColumn.Type} NOT NULL,
                    email VARCHAR(255) NOT NULL,
                    reset_code VARCHAR(6) NOT NULL,
                    expires_at DATETIME NOT NULL,
                    used BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_email (email),
                    INDEX idx_reset_code (reset_code),
                    INDEX idx_expires_at (expires_at),
                    FOREIGN KEY (user_id) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
                )
            `;
            
            await pool.execute(createTableQuery);
            console.log('✓ Tabla password_resets verificada/creada exitosamente');
        } catch (error) {
            console.error('Error creando tabla password_resets:', error);
            throw error;
        }
    }

    // Crear nuevo registro de recuperación
    static async create(data) {
        const query = `
            INSERT INTO password_resets (user_id, email, reset_code, expires_at, used)
            VALUES (?, ?, ?, ?, ?)
        `;
        
        try {
            const [result] = await pool.execute(query, [
                data.user_id,
                data.email,
                data.reset_code,
                data.expires_at,
                data.used || false
            ]);
            
            return { id: result.insertId, ...data };
        } catch (error) {
            console.error('Error creando password reset:', error);
            throw error;
        }
    }

    // Buscar por email y código
    static async findByEmailAndCode(email, code) {
        const query = `
            SELECT * FROM password_resets 
            WHERE email = ? AND reset_code = ? AND used = FALSE
            ORDER BY created_at DESC
            LIMIT 1
        `;
        
        try {
            const [rows] = await pool.execute(query, [email, code]);
            return rows[0] || null;
        } catch (error) {
            console.error('Error buscando password reset:', error);
            throw error;
        }
    }

    // Marcar códigos anteriores como usados
    static async markPreviousAsUsed(userId) {
        const query = `
            UPDATE password_resets 
            SET used = TRUE 
            WHERE user_id = ? AND used = FALSE
        `;
        
        try {
            await pool.execute(query, [userId]);
        } catch (error) {
            console.error('Error marcando códigos como usados:', error);
            throw error;
        }
    }

    // Marcar código específico como usado
    static async markAsUsed(id) {
        const query = `
            UPDATE password_resets 
            SET used = TRUE 
            WHERE id = ?
        `;
        
        try {
            await pool.execute(query, [id]);
        } catch (error) {
            console.error('Error marcando código como usado:', error);
            throw error;
        }
    }

    // Limpiar códigos expirados
    static async cleanExpired() {
        const query = `
            DELETE FROM password_resets 
            WHERE expires_at < NOW()
        `;
        
        try {
            const [result] = await pool.execute(query);
            return result.affectedRows;
        } catch (error) {
            console.error('Error limpiando códigos expirados:', error);
            throw error;
        }
    }
}

module.exports = PasswordResetModel;