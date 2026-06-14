const db = require('../config/db');
const bcrypt = require('bcryptjs');

class AdminModel {
  static async getAllUsers() {
    const [users] = await db.execute(`
      SELECT u.*, r.libellé as role_libelle 
      FROM users u 
      LEFT JOIN role r ON u.role_id = r.idrole 
      ORDER BY u.nom, u.prenom
    `);
    return users;
  }

  static async getAllFournisseurs() {
    const [fournisseurs] = await db.execute(`
      SELECT * FROM fournisseur ORDER BY raisonsocial
    `);
    return fournisseurs;
  }

  // Get single fournisseur by id
  static async getFournisseurById(id) {
    const [rows] = await db.execute('SELECT * FROM fournisseur WHERE idfournisseur = ?', [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  // Update fournisseur details
  static async updateFournisseur(id, data) {
    const { raisonsocial, libellé, telephone, email, adresse, contact_nom, delai_livraison } = data;
    await db.execute(`
      UPDATE fournisseur SET raisonsocial = ?, libellé = ?, telephone = ?, email = ?, adresse = ?, contact_nom = ?, delai_livraison = ?
      WHERE idfournisseur = ?
    `, [raisonsocial, libellé, telephone, email, adresse, contact_nom, delai_livraison, id]);
    await db.execute(
      `INSERT INTO logaudit (iduser, action, module, detaillson) VALUES (NULL, 'UPDATE_FOURNISSEUR', 'ADMIN', ?)`,
      [`Fournisseur ${id} mis à jour`]
    );
  }

  // Delete fournisseur
  static async deleteFournisseur(id) {
    await db.execute('DELETE FROM fournisseur WHERE idfournisseur = ?', [id]);
    await db.execute(
      `INSERT INTO logaudit (iduser, action, module, detaillson) VALUES (NULL, 'DELETE_FOURNISSEUR', 'ADMIN', ?)`,
      [`Fournisseur ${id} supprimé`]
    );
  }

  static async createUser(userData) {
    const { nom, prenom, email, motdepasse, telephone, role_id } = userData;
    const hashed = await bcrypt.hash(motdepasse, 12);

    const [result] = await db.execute(
      `INSERT INTO users (nom, prenom, email, motdepasse, telephone, role_id, statut) 
       VALUES (?, ?, ?, ?, ?, ?, 'actif')`,
      [nom, prenom, email, hashed, telephone, role_id]
    );

    await db.execute(
      `INSERT INTO logaudit (iduser, action, module, detaillson) 
       VALUES (NULL, 'CREATE_USER', 'ADMIN', ?)`,
      [`Admin a créé l'utilisateur ${email} (rôle ID ${role_id})`]
    );

    return result.insertId;
  }

  static async toggleUserStatus(idusers, newStatut) {
    await db.execute(
      `UPDATE users SET statut = ? WHERE idusers = ?`,
      [newStatut, idusers]
    );

    await db.execute(
      `INSERT INTO logaudit (iduser, action, module, detaillson) 
       VALUES (NULL, 'UPDATE_STATUS', 'ADMIN', ?)`,
      [`Statut utilisateur ${idusers} changé en ${newStatut}`]
    );
  }

  static async createFournisseur(data) {
    const { raisonsocial, libellé, telephone, email, adresse, contact_nom, delai_livraison } = data;

    const [result] = await db.execute(
      `INSERT INTO fournisseur (raisonsocial, libellé, telephone, email, adresse, contact_nom, delai_livraison) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [raisonsocial, libellé, telephone, email, adresse, contact_nom, delai_livraison]
    );

    await db.execute(
      `INSERT INTO logaudit (iduser, action, module, detaillson) 
       VALUES (NULL, 'CREATE_FOURNISSEUR', 'ADMIN', ?)`,
      [`Nouveau fournisseur créé : ${raisonsocial}`]
    );

    return result.insertId;
  }

  static async getAuditLogs(limit = 100) {
    const parsedLimit = parseInt(limit, 10) || 100;
    const [logs] = await db.execute(`
      SELECT l.*, u.nom, u.prenom 
      FROM logaudit l 
      LEFT JOIN users u ON l.iduser = u.idusers 
      ORDER BY l.horodatage DESC 
      LIMIT ${parsedLimit}
    `);
    return logs;
  }

  static async updateUser(idusers, userData) {
    const { nom, prenom, email, role_libelle, statut } = userData;
    
    // Récupérer l'ID du rôle
    const [role] = await db.execute('SELECT idrole FROM role WHERE libellé = ?', [role_libelle]);
    const roleId = role.length > 0 ? role[0].idrole : null;
    
    await db.execute(
      `UPDATE users SET nom = ?, prenom = ?, email = ?, role_id = ?, statut = ? WHERE idusers = ?`,
      [nom, prenom, email, roleId, statut, idusers]
    );

    await db.execute(
      `INSERT INTO logaudit (iduser, action, module, detaillson) 
       VALUES (NULL, 'UPDATE_USER', 'ADMIN', ?)`,
      [`Utilisateur ${idusers} mis à jour : ${nom} ${prenom}`]
    );
  }

  static async deleteUser(idusers) {
    // Récupérer les infos de l'utilisateur pour le log
    const [user] = await db.execute('SELECT nom, prenom, email FROM users WHERE idusers = ?', [idusers]);
    
    await db.execute('DELETE FROM users WHERE idusers = ?', [idusers]);

    if (user.length > 0) {
      await db.execute(
        `INSERT INTO logaudit (iduser, action, module, detaillson) 
         VALUES (NULL, 'DELETE_USER', 'ADMIN', ?)`,
        [`Utilisateur supprimé : ${user[0].nom} ${user[0].prenom} (${user[0].email})`]
      );
    }
  }
}

module.exports = AdminModel;