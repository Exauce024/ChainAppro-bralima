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
        SELECT s.*, mp.libellé, mp.description, mp.seuilcritique, mp.seuilalerte,
               COALESCE((SELECT fm.prix_kg FROM fournisseur_matiere fm WHERE fm.idmp = mp.idmp ORDER BY fm.datecreation DESC LIMIT 1), 0) AS prixunitaire
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

  static async findByMpAndEntrepotAndLot(idmp, identret, lotnumero, connection = null) {
    const executor = connection || db;
    const [rows] = await executor.execute(
      `SELECT * FROM stock WHERE idmp = ? AND identret = ? AND (lotnumero = ? OR (lotnumero IS NULL AND ? IS NULL))`,
      [idmp, identret, lotnumero, lotnumero]
    );
    return rows[0];
  }

  static async findByMpAndEntrepot(idmp, identret, connection = null) {
    return StockModel.findByMpAndEntrepotAndLot(idmp, identret, null, connection);
  }

  static async getDefaultEntrepotId(connection = null) {
    const executor = connection || db;
    const [rows] = await executor.execute(
      `SELECT identret FROM entrepôt ORDER BY identret ASC LIMIT 1`
    );

    if (rows.length > 0) {
      return rows[0].identret;
    }

    const [insert] = await executor.execute(
      `INSERT INTO entrepôt (nom) VALUES ('Entrepôt Principal')`
    );
    return insert.insertId;
  }

  /**
   * Crédite le stock à la livraison fournisseur (uniquement le reliquat non encore reçu).
   */
  static async creditStockFromLivraison(connection, { idcommande, lignes, iduser = null }) {
    const identret = await StockModel.getDefaultEntrepotId(connection);
    let totalUnits = 0;
    let linesUpdated = 0;
    const motif = `Livraison fournisseur — commande n°${idcommande}`;

    for (const ligne of lignes) {
      const qteCommandee = Number(ligne.qtecommande) || 0;
      const qteDejaRecue =
        Number(ligne.qtelivrée ?? ligne.qtelivree ?? 0) || 0;
      const qteAjoutee = qteCommandee - qteDejaRecue;

      if (qteAjoutee <= 0) {
        continue;
      }

      let stock = await StockModel.findByMpAndEntrepot(ligne.idmp, identret, connection);
      if (!stock) {
        const [insertStock] = await connection.execute(
          `INSERT INTO stock (idmp, identret, qtedisponible) VALUES (?, ?, 0)`,
          [ligne.idmp, identret]
        );
        stock = { idstock: insertStock.insertId };
      }

      await connection.execute(
        `UPDATE stock SET qtedisponible = qtedisponible + ?, datemaj = CURRENT_TIMESTAMP WHERE idstock = ?`,
        [qteAjoutee, stock.idstock]
      );

      await connection.execute(
        `INSERT INTO mouvement_stock (idstock, type_mouvement, quantite, stock_delta, iduser, motif, idcommande)
         VALUES (?, 'entree', ?, ?, ?, ?, ?)`,
        [stock.idstock, qteAjoutee, qteAjoutee, iduser, motif, idcommande]
      );

      totalUnits += qteAjoutee;
      linesUpdated += 1;
    }

    return { totalUnits, linesUpdated, identret };
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
        `INSERT INTO mouvement_stock (idstock, type_mouvement, quantite, stock_delta, iduser, motif, idcommande, idlignerec)
         VALUES (?, 'entree', ?, ?, ?, ?, ?, ?)`,
        [idstock, qteAjoutee, qteAjoutee, iduser, motif, idcommande, idlignerec]
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
      SELECT s.*, mp.libellé, mp.seuilalerte, mp.seuilcritique, e.nom AS entrepot_nom,
             (SELECT SUM(quantite) FROM mouvement_stock WHERE idstock = s.idstock) AS total_mouvements
      FROM stock s 
      JOIN matièrepremiere mp ON s.idmp = mp.idmp
      LEFT JOIN entrepôt e ON s.identret = e.identret
      WHERE s.idmp = ?
    `, [idmp]);
    return rows;
  }

  static async getEntrepotSummary() {
    const [rows] = await db.execute(`
      SELECT
        e.identret,
        e.nom,
        mp.libellé AS matiere_premiere,
        COALESCE(SUM(s.qtedisponible), 0) AS stock_total,
        MAX(s.datemaj) AS derniere_maj,
        CASE WHEN SUM(s.qtedisponible) <= COALESCE(mp.seuilcritique, 0) THEN 1 ELSE 0 END AS alertes_critiques,
        CASE WHEN SUM(s.qtedisponible) > COALESCE(mp.seuilcritique, 0) AND SUM(s.qtedisponible) <= COALESCE(mp.seuilalerte, 0) THEN 1 ELSE 0 END AS alertes_faibles
      FROM entrepôt e
      INNER JOIN stock s ON e.identret = s.identret
      INNER JOIN matièrepremiere mp ON s.idmp = mp.idmp
      GROUP BY e.identret, e.nom, s.idmp, mp.libellé
      ORDER BY e.nom ASC, mp.libellé ASC
    `);
    return rows;
  }

  static async getRecentMouvements(limit = 10) {
    const parsedLimit = parseInt(limit, 10) || 10;
    const [rows] = await db.execute(
      `
      SELECT
        m.idmouvement,
        m.type_mouvement,
        m.quantite,
        m.stock_delta,
        m.motif,
        m.date_mouvement,
        m.idcommande,
        mp.libellé AS matiere,
        mp.codebarre,
        e.nom AS entrepot_nom,
        u.nom AS user_nom,
        u.prenom AS user_prenom
      FROM mouvement_stock m
      INNER JOIN stock s ON m.idstock = s.idstock
      INNER JOIN matièrepremiere mp ON s.idmp = mp.idmp
      INNER JOIN entrepôt e ON s.identret = e.identret
      LEFT JOIN users u ON m.iduser = u.idusers
      ORDER BY m.date_mouvement DESC
      LIMIT ${parsedLimit}
    `
    );
    return rows;
  }

  static async getDashboardStats() {
    const [stockRows] = await db.execute(`
      SELECT
        COALESCE(SUM(s.qtedisponible), 0) AS stock_total,
        COUNT(DISTINCT s.idmp) AS nb_matieres_stockees
      FROM stock s
    `);

    const [receptionRows] = await db.execute(`
      SELECT COUNT(*) AS receptions_aujourdhui
      FROM mouvement_stock
      WHERE DATE(date_mouvement) = CURDATE()
        AND type_mouvement = 'entree'
        AND motif LIKE 'Réception%'
    `);

    const [mouvementRows] = await db.execute(`
      SELECT COUNT(*) AS mouvements_aujourdhui
      FROM mouvement_stock
      WHERE DATE(date_mouvement) = CURDATE()
    `);

    const [alertRows] = await db.execute(`
      SELECT COUNT(*) AS alertes_stock
      FROM alertepredictive
      WHERE statut = 'active'
    `);

    return {
      stockTotal: stockRows[0]?.stock_total || 0,
      nbMatieresStockees: stockRows[0]?.nb_matieres_stockees || 0,
      receptionsAujourdhui: receptionRows[0]?.receptions_aujourdhui || 0,
      mouvementsAujourdhui: mouvementRows[0]?.mouvements_aujourdhui || 0,
      alertesStock: alertRows[0]?.alertes_stock || 0,
    };
  }

  static async findStockLineById(idstock) {
    const [rows] = await db.execute(
      `
      SELECT s.*, mp.libellé AS libelle, mp.codebarre, e.nom AS entrepot_nom
      FROM stock s
      INNER JOIN matièrepremiere mp ON s.idmp = mp.idmp
      INNER JOIN entrepôt e ON s.identret = e.identret
      WHERE s.idstock = ?
    `,
      [idstock]
    );
    return rows[0] || null;
  }

  /**
   * Applique une variation signée (+ entrée / − sortie) avec journal mouvement.
   */
  static async executeMovement({
    idstock,
    type_mouvement,
    stock_delta,
    iduser,
    motif,
    idcommande = null,
    idlignerec = null,
  }) {
    const sd = Number(stock_delta);
    const quantiteAbs = Math.abs(sd);
    if (!quantiteAbs || !Number.isFinite(quantiteAbs)) {
      throw new Error('Quantité invalide.');
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [locked] = await conn.execute(`SELECT qtedisponible FROM stock WHERE idstock = ? FOR UPDATE`, [
        idstock,
      ]);
      if (!locked.length) {
        throw new Error('Ligne de stock introuvable.');
      }

      const current = Number(locked[0].qtedisponible) || 0;
      const next = current + sd;
      if (next < 0) {
        throw new Error(`Stock insuffisant (disponible : ${current}).`);
      }

      await conn.execute(
        `UPDATE stock SET qtedisponible = ?, datemaj = CURRENT_TIMESTAMP WHERE idstock = ?`,
        [next, idstock]
      );

      await conn.execute(
        `INSERT INTO mouvement_stock (idstock, type_mouvement, quantite, stock_delta, iduser, motif, idcommande, idlignerec)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [idstock, type_mouvement, quantiteAbs, sd, iduser, motif, idcommande, idlignerec]
      );

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * Transfert interne — deux lignes mouvement type transfert (stock_delta ±).
   */
  static async executeTransfer({ idstockSource, idstockDest, quantite, iduser, reference }) {
    const q = Number(quantite);
    if (!q || q <= 0 || !Number.isFinite(q)) {
      throw new Error('Quantité de transfert invalide.');
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const orderedIds = [Number(idstockSource), Number(idstockDest)].sort((a, b) => a - b);
      for (const id of orderedIds) {
        await conn.execute(`SELECT idstock FROM stock WHERE idstock = ? FOR UPDATE`, [id]);
      }

      const [srcRows] = await conn.execute(
        `
        SELECT s.*, mp.libellé AS libelle, es.nom AS entrepot_nom
        FROM stock s
        INNER JOIN matièrepremiere mp ON s.idmp = mp.idmp
        INNER JOIN entrepôt es ON s.identret = es.identret
        WHERE s.idstock = ?
      `,
        [idstockSource]
      );
      const [dstRows] = await conn.execute(
        `
        SELECT s.*, mp.libellé AS libelle, ed.nom AS entrepot_nom
        FROM stock s
        INNER JOIN matièrepremiere mp ON s.idmp = mp.idmp
        INNER JOIN entrepôt ed ON s.identret = ed.identret
        WHERE s.idstock = ?
      `,
        [idstockDest]
      );

      const src = srcRows[0];
      const dst = dstRows[0];
      if (!src || !dst) {
        throw new Error('Ligne source ou destination introuvable.');
      }
      if (Number(src.idstock) === Number(dst.idstock)) {
        throw new Error('Choisissez deux lignes de stock différentes.');
      }
      if (Number(src.idmp) !== Number(dst.idmp)) {
        throw new Error('La matière première doit être la même entre source et destination.');
      }

      const avail = Number(src.qtedisponible) || 0;
      if (avail < q) {
        throw new Error(`Stock source insuffisant (disponible : ${avail}).`);
      }

      const srcNext = avail - q;
      const dstNext = (Number(dst.qtedisponible) || 0) + q;

      await conn.execute(
        `UPDATE stock SET qtedisponible = ?, datemaj = CURRENT_TIMESTAMP WHERE idstock = ?`,
        [srcNext, idstockSource]
      );
      await conn.execute(
        `UPDATE stock SET qtedisponible = ?, datemaj = CURRENT_TIMESTAMP WHERE idstock = ?`,
        [dstNext, idstockDest]
      );

      const ref = reference ? String(reference).trim() : '—';
      const motifOut = `Transfert → ${dst.entrepot_nom} · Réf. ${ref}`;
      const motifIn = `Transfert ← ${src.entrepot_nom} · Réf. ${ref}`;

      await conn.execute(
        `INSERT INTO mouvement_stock (idstock, type_mouvement, quantite, stock_delta, iduser, motif)
         VALUES (?, 'transfert', ?, ?, ?, ?)`,
        [idstockSource, q, -q, iduser, motifOut]
      );
      await conn.execute(
        `INSERT INTO mouvement_stock (idstock, type_mouvement, quantite, stock_delta, iduser, motif)
         VALUES (?, 'transfert', ?, ?, ?, ?)`,
        [idstockDest, q, q, iduser, motifIn]
      );

      await conn.commit();
      return { libelle: src.libelle, qte: q, source: src.entrepot_nom, dest: dst.entrepot_nom };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static async countMouvementsTodayByType() {
    const [rows] = await db.execute(`
      SELECT type_mouvement, COUNT(*) AS n
      FROM mouvement_stock
      WHERE DATE(date_mouvement) = CURDATE()
      GROUP BY type_mouvement
    `);
    const map = { entree: 0, sortie: 0, transfert: 0, ajustement: 0 };
    for (const r of rows) {
      if (Object.prototype.hasOwnProperty.call(map, r.type_mouvement)) {
        map[r.type_mouvement] = Number(r.n);
      }
    }
    map.transfert = Math.floor(map.transfert / 2);
    return map;
  }

  static async listStockLinesDetailed() {
    const [rows] = await db.execute(`
      SELECT s.idstock, s.idmp, s.identret, s.qtedisponible, s.lotnumero, s.dateperemption, s.datemaj,
             mp.libellé AS libelle, mp.codebarre,
             e.nom AS entrepot_nom
      FROM stock s
      INNER JOIN matièrepremiere mp ON s.idmp = mp.idmp
      INNER JOIN entrepôt e ON s.identret = e.identret
      ORDER BY mp.libellé ASC, s.dateperemption ASC, s.datemaj ASC
    `);
    return rows;
  }

  static async ensureStockLine(idmp, identret, lotnumero = null, dateperemption = null, connection = null) {
    let row = await StockModel.findByMpAndEntrepotAndLot(idmp, identret, lotnumero, connection);
    if (row) return row;
    const exec = connection || db;
    await exec.execute(
      `INSERT INTO stock (idmp, identret, lotnumero, dateperemption, qtedisponible) VALUES (?, ?, ?, ?, 0)`,
      [idmp, identret, lotnumero, dateperemption]
    );
    row = await StockModel.findByMpAndEntrepotAndLot(idmp, identret, lotnumero, connection);
    return row;
  }

  static async findStockLinesByMp(idmp) {
    const [rows] = await db.execute(`
      SELECT s.*, mp.libellé, mp.description, mp.seuilcritique, mp.seuilalerte,
             e.nom AS entrepot_nom
      FROM stock s
      JOIN matièrepremiere mp ON s.idmp = mp.idmp
      JOIN entrepôt e ON s.identret = e.identret
      WHERE s.idmp = ?
      ORDER BY s.dateperemption ASC, s.datemaj ASC
    `, [idmp]);
    return rows;
  }
}

module.exports = StockModel;