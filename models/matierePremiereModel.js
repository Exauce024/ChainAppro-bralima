const db = require('../config/db');

class MatierePremiereModel {
  static async findAll() {
    const [rows] = await db.execute('SELECT * FROM matièrepremiere ORDER BY libellé');
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.execute('SELECT * FROM matièrepremiere WHERE idmp = ?', [id]);
    return rows[0];
  }

  static async findByBarcode(barcode) {
    const [rows] = await db.execute('SELECT * FROM matièrepremiere WHERE codebarre = ?', [barcode]);
    return rows[0];
  }
}

module.exports = MatierePremiereModel;