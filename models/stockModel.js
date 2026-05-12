const db = require('../config/db');

class StockModel {
  static async findAll() {
    const [rows] = await db.execute(`
      SELECT s.*, mp.libellé as matiere, e.nom as entrepot_nom 
      FROM stock s
      JOIN matièrepremiere mp ON s.idmp = mp.idmp
      JOIN entrepôt e ON s.identret = e.identret
      ORDER BY mp.libellé
    `);
    return rows;
  }

  static async findAllWithDetails() {
    try {
      const [rows] = await db.execute(`
        SELECT s.*, mp.libellé, mp.description, mp.seuilcritique, mp.seuilalerte
        FROM stock s
        JOIN matièrepremiere mp ON s.idmp = mp.idmp
        ORDER BY mp.libellé
      `);
      return rows;
    } catch (error) {
      console.error('Erreur dans findAllWithDetails:', error);
      throw error;
    }
  }

  static async findByIdWithDetails(id) {
    try {
      // D'abord chercher par idstock (ID du stock)
      let [rows] = await db.execute(`
        SELECT s.*, mp.libellé, mp.description, mp.seuilcritique, mp.seuilalerte
        FROM stock s
        JOIN matièrepremiere mp ON s.idmp = mp.idmp
        WHERE s.idstock = ?
        ORDER BY mp.libellé
      `, [id]);
      
      // Si rien trouvé par idstock, essayer par idmp
      if (rows.length === 0) {
        [rows] = await db.execute(`
          SELECT s.*, mp.libellé, mp.description, mp.seuilcritique, mp.seuilalerte
          FROM stock s
          JOIN matièrepremiere mp ON s.idmp = mp.idmp
          WHERE s.idmp = ?
          ORDER BY mp.libellé
        `, [id]);
      }
      
      return rows[0] || null;
    } catch (error) {
      console.error('Erreur dans findByIdWithDetails:', error);
      throw error;
    }
  }

  static async findByMpAndEntrepot(idmp, identret) {
    const [rows] = await db.execute(
      `SELECT * FROM stock WHERE idmp = ? AND identret = ?`,
      [idmp, identret]
    );
    return rows[0];
  }

  static async updateStock(idstock, qteAjoutee, iduser, motif, idcommande = null, idlignerec = null) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Mise à jour du stock
      await connection.execute(
        `UPDATE stock SET qtedisponible = qtedisponible + ?, datemaj = CURRENT_TIMESTAMP 
         WHERE idstock = ?`,
        [qteAjoutee, idstock]
      );

      // Enregistrement du mouvement
      await connection.execute(
        `INSERT INTO mouvement_stock (idstock, type_mouvement, quantite, iduser, motif, idcommande, idlignerec)
         VALUES (?, 'entree', ?, ?, ?, ?, ?)`,
        [idstock, qteAjoutee, iduser, motif, idcommande, idlignerec]
      );

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  static async getStockWithMouvements(idmp) {
    const [rows] = await db.execute(`
      SELECT s.*, mp.libellé, 
             (SELECT SUM(quantite) FROM mouvement_stock WHERE idstock = s.idstock) as total_mouvements
      FROM stock s 
      JOIN matièrepremiere mp ON s.idmp = mp.idmp
      WHERE s.idmp = ?
    `, [idmp]);
    return rows;
  }
}

module.exports = StockModel;