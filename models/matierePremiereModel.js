const db = require('../config/db');

class MatierePremiereModel {
  static async findAll() {
    const [rows] = await db.execute(`
      SELECT mp.*, 
             COALESCE((SELECT fm.prix_kg FROM fournisseur_matiere fm WHERE fm.idmp = mp.idmp ORDER BY fm.datecreation DESC LIMIT 1), 0) AS prix_unitaire
      FROM matièrepremiere mp 
      ORDER BY mp.libellé
    `);
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.execute(`
      SELECT mp.*, 
             COALESCE((SELECT fm.prix_kg FROM fournisseur_matiere fm WHERE fm.idmp = mp.idmp ORDER BY fm.datecreation DESC LIMIT 1), 0) AS prix_unitaire
      FROM matièrepremiere mp 
      WHERE mp.idmp = ?
    `, [id]);
    return rows[0];
  }

  static async findByBarcode(barcode) {
    const [rows] = await db.execute('SELECT * FROM matièrepremiere WHERE codebarre = ?', [barcode]);
    return rows[0];
  }
}

module.exports = MatierePremiereModel;