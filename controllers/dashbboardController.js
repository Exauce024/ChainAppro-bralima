const DashboardModel = require('../models/dashboardModel');
const StockModel = require('../models/stockModel');
const db = require('../config/db');

class DashboardController {
  static async showGestionnaireDashboard(req, res) {
    try {
      // Générer les alertes automatiquement à chaque chargement (pour démo)
      await DashboardModel.genererAlertes();

      const kpis = await DashboardModel.getKPIs();
      const alertes = await DashboardModel.getAlertesActives();
      const stocksCritiques = await DashboardModel.getStockCritique();
      const stocks = await StockModel.findAll();
      const commandesRecentes = await DashboardModel.getCommandesRecentes(10);

      res.render('layout_modern', {
        kpis,
        alertes,
        stocksCritiques,
        stocks,
        commandesRecentes,
        user: req.session.user,
        title: 'Tableau de bord - Gestionnaire',
        success: req.flash('success'),
        error: req.flash('error'),
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Erreur lors du chargement du tableau de bord');
    }
  }

  static async traiterAlerte(req, res) {
    const { idalert } = req.params;
    const iduser = req.session.user.idusers;

    await db.execute(`
      UPDATE alertepredictive 
      SET statut = 'traitee', iduser_traite = ?, date_traitement = CURRENT_TIMESTAMP 
      WHERE idalert = ?
    `, [iduser, idalert]);

    // Log audit
    await db.execute(
      `INSERT INTO logaudit (iduser, action, module, detaillson) 
       VALUES (?, 'TRAITER_ALERTE', 'DASHBOARD', ?)`,
      [iduser, `Alerte ${idalert} traitée`]
    );

    res.redirect('/dashboard');
  }
}

module.exports = DashboardController;