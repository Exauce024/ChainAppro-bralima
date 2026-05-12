const db = require('../config/db');

class ReceptionModel {
  static async createLigneReception({ idcommande, idmp, qtereçu, attribut, iduser }) {
    const [result] = await db.execute(
      `INSERT INTO lignereception (idcommande, idmp, qtereçu, attribut, statut)
       VALUES (?, ?, ?, ?, 'en_attente')`,
      [idcommande, idmp, qtereçu, attribut]
    );

    // Log audit
    await db.execute(
      `INSERT INTO logaudit (iduser, action, module, detaillson)
       VALUES (?, 'CREATE_RECEPTION', 'RECEPTION', ?)`,
      [iduser, `Réception ligne pour MP ${idmp}, quantité ${qtereçu}`]
    );

    return result.insertId;
  }

  static async validerReception(idlignerec, iduser, qteFinale) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      await connection.execute(
        `UPDATE lignereception SET statut = 'confirmee', qtereçu = ? WHERE idlignerec = ?`,
        [qteFinale, idlignerec]
      );

      // Mise à jour de la ligne de commande
      await connection.execute(
        `UPDATE lignecommande SET qtelivrée = qtelivrée + ? WHERE idcommande = 
         (SELECT idcommande FROM lignereception WHERE idlignerec = ?)`,
        [qteFinale, idlignerec]
      );

      await connection.commit();
      return true;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
}

module.exports = ReceptionModel;