const db = require('../config/db');
const StockModel = require('./stockModel');

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
      SELECT c.*, f.raisonsocial, c.prixtotal AS total,
             GROUP_CONCAT(mp.libellé SEPARATOR ', ') AS matieres,
             GROUP_CONCAT(CONCAT(lc.qtecommande, ' Kg') SEPARATOR ', ') AS quantites
      FROM commande c 
      LEFT JOIN fournisseur f ON c.idfournisseur = f.idfournisseur 
      LEFT JOIN lignecommande lc ON c.idcommande = lc.idcommande
      LEFT JOIN matièrepremiere mp ON lc.idmp = mp.idmp
      GROUP BY c.idcommande
      ORDER BY c.datecreation DESC
    `);
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.execute(`
      SELECT c.*, f.raisonsocial,
             GROUP_CONCAT(CONCAT(mp.libellé, ' (', lc.qtecommande, ' Kg x ', lc.prixunitaire, ')') SEPARATOR ' | ') as details_lignes
      FROM commande c 
      LEFT JOIN fournisseur f ON c.idfournisseur = f.idfournisseur
      LEFT JOIN lignecommande lc ON c.idcommande = lc.idcommande
      LEFT JOIN matièrepremiere mp ON lc.idmp = mp.idmp
      WHERE c.idcommande = ?
      GROUP BY c.idcommande
    `, [id]);
    return rows[0];
  }

  static async getLignes(idcommande) {
    const [rows] = await db.execute(`
      SELECT lc.idligne, lc.idcommande, lc.idmp, lc.qtecommande, lc.prixunitaire, lc.qtelivrée,
             mp.libellé AS libelle, mp.description
      FROM lignecommande lc
      INNER JOIN matièrepremiere mp ON lc.idmp = mp.idmp
      WHERE lc.idcommande = ?
      ORDER BY lc.idligne ASC
    `, [idcommande]);
    return rows;
  }

  static computeMontantTotal(lignes) {
    return lignes.reduce(
      (sum, ligne) => sum + Number(ligne.qtecommande || 0) * Number(ligne.prixunitaire || 0),
      0
    );
  }

  static async updateStatut(idcommande, statut, motifrefus = null) {
    await db.execute(
      `UPDATE commande SET statut = ?, motifrefus = ? WHERE idcommande = ?`,
      [statut, motifrefus, idcommande]
    );
  }

  static async markAsShipped(idcommande, options = {}) {
    const { iduser = null } = options;
    const [result] = await db.execute(
      `UPDATE commande SET statut = 'en_cours_de_livraison', motifrefus = NULL WHERE idcommande = ?`,
      [idcommande]
    );

    if (result.affectedRows === 0) {
      throw new Error(`Commande ${idcommande} introuvable`);
    }

    try {
      await db.execute(
        `INSERT INTO logaudit (iduser, action, module, detaillson) 
         VALUES (?, 'EXPEDIER_COMMANDE', 'COMMANDE', ?)`,
        [
          iduser,
          `Commande ${idcommande} expédiée par le fournisseur (statut en_cours_de_livraison)`,
        ]
      );
    } catch (auditErr) {
      console.error('Log audit expédition (non bloquant):', auditErr.message);
    }

    return true;
  }

  static async markAsDelivered(idcommande, options = {}) {
    const { iduser = null } = options;
    const lignes = await CommandeModel.getLignes(idcommande);
    const prixtotal = CommandeModel.computeMontantTotal(lignes);

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [result] = await connection.execute(
        `UPDATE commande SET statut = 'livree', motifrefus = NULL, prixtotal = ? WHERE idcommande = ?`,
        [prixtotal, idcommande]
      );

      if (result.affectedRows === 0) {
        throw new Error(`Commande ${idcommande} introuvable`);
      }

      for (const ligne of lignes) {
        await connection.execute(
          `UPDATE lignecommande SET qtelivrée = qtecommande WHERE idligne = ?`,
          [ligne.idligne]
        );
      }

      const stockCredits = await StockModel.creditStockFromLivraison(connection, {
        idcommande,
        lignes,
        iduser,
      });

      try {
        await connection.execute(
          `INSERT INTO logaudit (iduser, action, module, detaillson) 
           VALUES (?, 'CONFIRMER_LIVRAISON', 'COMMANDE', ?)`,
          [
            iduser,
            `Commande ${idcommande} livrée par le fournisseur — stock crédité (+${stockCredits.totalUnits} Kg sur ${stockCredits.linesUpdated} article(s))`,
          ]
        );
      } catch (auditErr) {
        console.error('Log audit livraison (non bloquant):', auditErr.message);
      }

      await connection.commit();
      return { stockCredits };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
}

module.exports = CommandeModel;

CommandeModel.findByFournisseur = async function(idfournisseur) {
  const [rows] = await db.execute(`
    SELECT c.*, c.prixtotal AS total, c.prixtotal AS montant,
           GROUP_CONCAT(CONCAT(mp.libellé, ' x ', lc.qtecommande, ' Kg') SEPARATOR ' | ') as details
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