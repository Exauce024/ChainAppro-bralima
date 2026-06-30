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

  static generateTempPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  }

  static async createFournisseur(data) {
    const { raisonsocial, libellé, telephone, email, adresse, contact_nom, delai_livraison } = data;

    // 1. Créer le fournisseur
    const [result] = await db.execute(
      `INSERT INTO fournisseur (raisonsocial, libellé, telephone, email, adresse, contact_nom, delai_livraison) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [raisonsocial, libellé, telephone, email, adresse, contact_nom, delai_livraison]
    );
    const idfournisseur = result.insertId;

    // 2. Créer le compte users associé si email fourni
    let tempPassword = null;
    if (email) {
      tempPassword = AdminModel.generateTempPassword();
      const hashed = await bcrypt.hash(tempPassword, 12);

      // Récupérer le role_id fournisseur
      const [roleRows] = await db.execute(`SELECT idrole FROM role WHERE libellé = 'fournisseur' LIMIT 1`);
      const roleId = roleRows.length > 0 ? roleRows[0].idrole : null;

      // Vérifier si un compte existe déjà pour cet email
      const [existingUser] = await db.execute(`SELECT idusers FROM users WHERE email = ? LIMIT 1`, [email]);
      if (existingUser.length === 0) {
        await db.execute(
          `INSERT INTO users (nom, prenom, email, motdepasse, telephone, role_id, statut, must_change_password)
           VALUES (?, ?, ?, ?, ?, ?, 'actif', 1)`,
          [raisonsocial, contact_nom || '', email, hashed, telephone, roleId]
        );
      }
    }

    await db.execute(
      `INSERT INTO logaudit (iduser, action, module, detaillson) VALUES (NULL, 'CREATE_FOURNISSEUR', 'ADMIN', ?)`,
      [`Nouveau fournisseur créé : ${raisonsocial}`]
    );

    return { idfournisseur, tempPassword };
  }

  // Génère ou régénère les accès portail pour un fournisseur existant
  static async generateFournisseurAccess(idfournisseur) {
    const [rows] = await db.execute(`SELECT * FROM fournisseur WHERE idfournisseur = ?`, [idfournisseur]);
    if (rows.length === 0) throw new Error('Fournisseur introuvable');
    const f = rows[0];

    if (!f.email) throw new Error('Ce fournisseur n\'a pas d\'adresse email enregistrée');

    const tempPassword = AdminModel.generateTempPassword();
    const hashed = await bcrypt.hash(tempPassword, 12);

    const [roleRows] = await db.execute(`SELECT idrole FROM role WHERE libellé = 'fournisseur' LIMIT 1`);
    const roleId = roleRows.length > 0 ? roleRows[0].idrole : null;

    const [existingUser] = await db.execute(`SELECT idusers FROM users WHERE email = ? LIMIT 1`, [f.email]);
    if (existingUser.length > 0) {
      // Mettre à jour le mot de passe et forcer le changement
      await db.execute(
        `UPDATE users SET motdepasse = ?, must_change_password = 1, role_id = ?, statut = 'actif' WHERE email = ?`,
        [hashed, roleId, f.email]
      );
    } else {
      await db.execute(
        `INSERT INTO users (nom, prenom, email, motdepasse, telephone, role_id, statut, must_change_password)
         VALUES (?, ?, ?, ?, ?, ?, 'actif', 1)`,
        [f.raisonsocial, f.contact_nom || '', f.email, hashed, f.telephone, roleId]
      );
    }

    await db.execute(
      `INSERT INTO logaudit (iduser, action, module, detaillson) VALUES (NULL, 'GENERATE_ACCESS', 'ADMIN', ?)`,
      [`Accès portail générés pour fournisseur ${idfournisseur} (${f.raisonsocial})`]
    );

    return { email: f.email, tempPassword, raisonsocial: f.raisonsocial };
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

  static async countAuditLogs() {
    const [rows] = await db.execute('SELECT COUNT(*) AS total FROM logaudit');
    return rows[0].total;
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