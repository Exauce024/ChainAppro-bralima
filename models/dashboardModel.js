const db = require('../config/db');

class DashboardModel {
  static async getKPIs() {
    const [kpis] = await db.execute(`
      SELECT 
        (SELECT COUNT(*) FROM commande WHERE statut = 'en_attente') as commandes_en_attente,
        (SELECT COUNT(*) FROM commande WHERE statut = 'approuvee') as commandes_approuvees,
        (SELECT COUNT(*) FROM commande WHERE statut = 'livree') as commandes_livrees,
        (SELECT COUNT(DISTINCT idmp) FROM stock WHERE qtedisponible > 0) as matieres_en_stock,
        (SELECT COUNT(*) FROM alertepredictive WHERE statut = 'active') as alertes_actives
    `);
    return kpis[0];
  }

  static async getAlertesActives() {
    const [alertes] = await db.execute(`
      SELECT a.idalert, a.idmp, a.message, a.datecreation, a.statut, a.niveauurgence,
             CASE 
               WHEN a.typealerte = 'seuil_critique' THEN 'seuil critique'
               WHEN a.typealerte = 'stock_faible' THEN 'seuil alerte'
               ELSE a.typealerte
             END AS typealerte,
             mp.libellé as matiere
      FROM alertepredictive a
      JOIN matièrepremiere mp ON a.idmp = mp.idmp
      WHERE a.statut = 'active'
      ORDER BY a.niveauurgence DESC, a.datecreation DESC
    `);
    return alertes;
  }

  static async getStockCritique() {
    const [stocks] = await db.execute(`
      SELECT s.idstock, s.idmp, s.identret, SUM(s.qtedisponible) AS qtedisponible,
             mp.libellé, mp.seuilcritique, mp.seuilalerte
      FROM stock s
      JOIN matièrepremiere mp ON s.idmp = mp.idmp
      GROUP BY s.idmp, s.identret
      HAVING SUM(s.qtedisponible) <= mp.seuilalerte
      ORDER BY qtedisponible ASC
    `);
    return stocks;
  }

  static async getCommandesRecentes(limit = 10) {
    const parsedLimit = parseInt(limit, 10) || 10;
    const [rows] = await db.execute(`
      SELECT c.idcommande, c.reference, c.statut, c.datecreation, f.raisonsocial
      FROM commande c
      LEFT JOIN fournisseur f ON c.idfournisseur = f.idfournisseur
      ORDER BY c.datecreation DESC
      LIMIT ${parsedLimit}
    `);
    return rows;
  }

  static async genererAlertes() {
    // Logique de génération d'alertes avec transition d'états
    const [matieres] = await db.execute(`
      SELECT mp.idmp, mp.libellé, mp.seuilcritique, mp.seuilalerte,
             COALESCE(SUM(s.qtedisponible), 0) as stock_actuel
      FROM matièrepremiere mp
      LEFT JOIN stock s ON mp.idmp = s.idmp
      GROUP BY mp.idmp
    `);

    for (const m of matieres) {
      if (m.seuilcritique !== null && m.stock_actuel <= m.seuilcritique) {
        // Désactiver l'alerte d'avertissement 'stock_faible' si elle existe
        await db.execute(`
          UPDATE alertepredictive 
          SET statut = 'traitee', date_traitement = CURRENT_TIMESTAMP 
          WHERE idmp = ? AND typealerte = 'stock_faible' AND statut = 'active'
        `, [m.idmp]);

        // Vérifier si une alerte critique existe déjà
        const [existingAlert] = await db.execute(`
          SELECT idalert FROM alertepredictive 
          WHERE idmp = ? AND typealerte = 'seuil_critique' AND statut = 'active'
        `, [m.idmp]);

        if (existingAlert.length === 0) {
          await db.execute(`
            INSERT INTO alertepredictive (idmp, typealerte, niveauurgence, message, statut)
            VALUES (?, 'seuil_critique', 'haute', ?, 'active')
          `, [m.idmp, `Stock critique pour ${m.libellé} : ${m.stock_actuel} Kg restants`]);
        }
      } else if (m.seuilalerte !== null && m.stock_actuel <= m.seuilalerte) {
        // Désactiver l'alerte critique 'seuil_critique' si elle existe (ex: stock réapprovisionné partiellement)
        await db.execute(`
          UPDATE alertepredictive 
          SET statut = 'traitee', date_traitement = CURRENT_TIMESTAMP 
          WHERE idmp = ? AND typealerte = 'seuil_critique' AND statut = 'active'
        `, [m.idmp]);

        // Vérifier si une alerte d'avertissement existe déjà
        const [existingAlert] = await db.execute(`
          SELECT idalert FROM alertepredictive 
          WHERE idmp = ? AND typealerte = 'stock_faible' AND statut = 'active'
        `, [m.idmp]);

        if (existingAlert.length === 0) {
          await db.execute(`
            INSERT INTO alertepredictive (idmp, typealerte, niveauurgence, message, statut)
            VALUES (?, 'stock_faible', 'moyenne', ?, 'active')
          `, [m.idmp, `Alerte stock faible pour ${m.libellé}`]);
        }
      } else {
        // Le stock est suffisant, désactiver toutes les alertes de stock pour cette matière
        await db.execute(`
          UPDATE alertepredictive 
          SET statut = 'traitee', date_traitement = CURRENT_TIMESTAMP 
          WHERE idmp = ? AND typealerte IN ('stock_faible', 'seuil_critique') AND statut = 'active'
        `, [m.idmp]);
      }
    }
  }
}

module.exports = DashboardModel;