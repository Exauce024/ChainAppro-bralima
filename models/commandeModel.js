const db = require('../config/db');

class CommandeModel {
  static async create({ reference, deleidellivraison, idcreateur, idfournisseur, lignes }) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [result] = await connection.execute(
        `INSERT INTO commande (reference, deleidellivraison, idcreateur, idfournisseur, statut)
         VALUES (?, ?, ?, ?, 'en_attente')`,
        [reference, deleidellivraison, idcreateur, idfournisseur]
      );
      const idcommande = result.insertId;

      for (const ligne of lignes) {
        await connection.execute(
          `INSERT INTO lignecommande (idcommande, idmp, qtecommande, prixunitaire)
           VALUES (?, ?, ?, ?)`,
          [idcommande, ligne.idmp, ligne.qtecommande, ligne.prixunitaire]
        );
      }

      await connection.commit();
      return idcommande;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  static async findAll() {
    const [rows] = await db.execute(`
      SELECT c.*, f.raisonsocial 
      FROM commande c 
      LEFT JOIN fournisseur f ON c.idfournisseur = f.idfournisseur 
      ORDER BY c.datecreation DESC
    `);
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.execute(`
      SELECT c.*, f.raisonsocial,
             GROUP_CONCAT(CONCAT(mp.libellé, ' (', lc.qtecommande, ' x ', lc.prixunitaire, ')') SEPARATOR ' | ') as details_lignes
      FROM commande c 
      LEFT JOIN fournisseur f ON c.idfournisseur = f.idfournisseur
      LEFT JOIN lignecommande lc ON c.idcommande = lc.idcommande
      LEFT JOIN matièrepremiere mp ON lc.idmp = mp.idmp
      WHERE c.idcommande = ?
      GROUP BY c.idcommande
    `, [id]);
    return rows[0];
  }

  static async updateStatut(idcommande, statut, motifrefus = null) {
    await db.execute(
      `UPDATE commande SET statut = ?, motifrefus = ? WHERE idcommande = ?`,
      [statut, motifrefus, idcommande]
    );
  }
}

module.exports = CommandeModel;

CommandeModel.findByFournisseur = async function(idfournisseur) {
  const [rows] = await db.execute(`
    SELECT c.*, 
           GROUP_CONCAT(CONCAT(mp.libellé, ' x ', lc.qtecommande) SEPARATOR ' | ') as details
    FROM commande c
    LEFT JOIN lignecommande lc ON c.idcommande = lc.idcommande
    LEFT JOIN matièrepremiere mp ON lc.idmp = mp.idmp
    WHERE c.idfournisseur = ?
    GROUP BY c.idcommande
    ORDER BY c.datecreation DESC
  `, [idfournisseur]);
  return rows;
}

CommandeModel.updateStatutByFournisseur = async function(idcommande, statut, motifrefus = null) {
  await db.execute(
    `UPDATE commande SET statut = ?, motifrefus = ? WHERE idcommande = ?`,
    [statut, motifrefus, idcommande]
  );

  await db.execute(
    `INSERT INTO logaudit (iduser, action, module, detaillson) 
     VALUES (NULL, 'UPDATE_STATUT_FOURNISSEUR', 'COMMANDE', ?)`,
    [`Fournisseur a mis la commande ${idcommande} à ${statut}`]
  );
}