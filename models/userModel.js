const db = require('../config/db');
const bcrypt = require('bcryptjs');

class UserModel {
  static async create(userData) {
    const { nom, prenom, email, motdepasse, telephone, role_id } = userData;
    const hashedPassword = await bcrypt.hash(motdepasse, 12);

    const [result] = await db.execute(
      `INSERT INTO users (nom, prenom, email, motdepasse, telephone, role_id) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nom, prenom, email, hashedPassword, telephone, role_id]
    );

    // Log audit
    await db.execute(
      `INSERT INTO logaudit (iduser, action, module, detaillson) 
       VALUES (NULL, 'CREATE_USER', 'AUTH', ?)`,
      [`Utilisateur créé : ${email} (rôle ${role_id})`]
    );

    return result.insertId;
  }

  static async findByEmail(email) {
    const [rows] = await db.execute(
      `SELECT u.*, r.libellé as role_libelle 
       FROM users u 
       LEFT JOIN role r ON u.role_id = r.idrole 
       WHERE u.email = ?`,
      [email]
    );
    return rows[0];
  }

  static async verifyPassword(user, password) {
    return bcrypt.compare(password, user.motdepasse);
  }

  static async updateLastLogin(idusers) {
    await db.execute(
      `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE idusers = ?`,
      [idusers]
    );
  }

  static async findById(id) {
    const [rows] = await db.execute(
      `SELECT u.*, r.libellé as role_libelle 
       FROM users u 
       LEFT JOIN role r ON u.role_id = r.idrole 
       WHERE u.idusers = ?`,
      [id]
    );
    return rows[0];
  }
}

module.exports = UserModel;