const db = require('../config/db');

class DashboardModel {
  static async getKPIs() {
    const [kpis] = await db.execute(`
      SELECT 
        (SELECT COUNT(*) FROM commande WHERE statut = 'en_attente') as commandes_en_attente,
        (SELECT COUNT(*) FROM commande WHERE statut = 'approuvee') as commandes_approuvees,
        (SELECT COUNT(*) FROM commande WHERE statut = 'livree') as commandes_livrees,
        (SELECT SUM(qtedisponible) FROM stock) as stock_total,
        (SELECT COUNT(*) FROM alertepredictive WHERE statut = 'active') as alertes_actives
    `);
    return kpis[0];
  }

  static async getAlertesActives() {
    const [alertes] = await db.execute(`
      SELECT a.*, mp.libellé as matiere
      FROM alertepredictive a
      JOIN matièrepremiere mp ON a.idmp = mp.idmp
      WHERE a.statut = 'active'
      ORDER BY a.niveauurgence DESC, a.datecreation DESC
    `);
    return alertes;
  }

  static async getStockCritique() {
    const [stocks] = await db.execute(`
      SELECT s.*, mp.libellé, mp.seuilcritique, mp.seuilalerte
      FROM stock s
      JOIN matièrepremiere mp ON s.idmp = mp.idmp
      WHERE s.qtedisponible <= mp.seuilalerte
      ORDER BY s.qtedisponible ASC
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
    // Logique simple de génération d'alertes (peut être lancée via cron plus tard)
    const [matieres] = await db.execute(`
      SELECT mp.idmp, mp.libellé, mp.seuilcritique, mp.seuilalerte,
             COALESCE(SUM(s.qtedisponible), 0) as stock_actuel
      FROM matièrepremiere mp
      LEFT JOIN stock s ON mp.idmp = s.idmp
      GROUP BY mp.idmp
    `);

    for (const m of matieres) {
      if (m.stock_actuel <= m.seuilcritique && m.stock_actuel > 0) {
        // Vérifier si une alerte critique existe déjà pour cette matière
        const [existingAlert] = await db.execute(`
          SELECT idalert FROM alertepredictive 
          WHERE idmp = ? AND typealerte = 'seuil_critique' AND statut = 'active'
        `, [m.idmp]);

        if (existingAlert.length === 0) {
          await db.execute(`
            INSERT INTO alertepredictive (idmp, typealerte, niveauurgence, message, statut)
            VALUES (?, 'seuil_critique', 'haute', ?, 'active')
          `, [m.idmp, `Stock critique pour ${m.libellé} : ${m.stock_actuel} unités restantes`]);
        }
      } else if (m.stock_actuel <= m.seuilalerte) {
        // Vérifier si une alerte de stock faible existe déjà pour cette matière
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
      }
    }
  }
}

module.exports = DashboardModel;