const db = require('../config/db');

class FournisseurModel {
  static async findAll() {
    const [rows] = await db.execute('SELECT * FROM fournisseur WHERE statut = "actif" ORDER BY raisonsocial');
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.execute('SELECT * FROM fournisseur WHERE idfournisseur = ?', [id]);
    return rows[0];
  }

  static async getWithEmail(id) {
    const [rows] = await db.execute('SELECT email, raisonsocial FROM fournisseur WHERE idfournisseur = ?', [id]);
    return rows[0];
  }
}

module.exports = FournisseurModel;