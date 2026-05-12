const DashboardModel = require('../models/dashboardModel');
const db = require('../config/db');

class GestionnaireAlerteController {
  static async showAlertes(req, res) {
    try {
      const allAlertes = await DashboardModel.getAlertesActives();
      
      // Limiter à 10 alertes maximum
      const alertes = allAlertes.slice(0, 10);
      
      // Calculer les statistiques
      const stats = {
        totalAlertes: allAlertes.length,
        alertesHaute: allAlertes.filter(a => a.niveauurgence === 'haute').length,
        alertesMoyenne: allAlertes.filter(a => a.niveauurgence === 'moyenne').length,
        alertesBasse: allAlertes.filter(a => a.niveauurgence === 'basse').length
      };

      res.render('layout_modern', { 
        alertes, 
        allAlertes, // Pour les stats de pagination
        stats,
        user: req.session.user, 
        title: 'Gestion des Alertes',
        success: req.query.success || null,
        error: req.query.error || null
      });
    } catch (error) {
      console.error('Erreur lors du chargement des alertes:', error);
      res.status(500).render('layout_modern', { 
        alertes: [], 
        allAlertes: [],
        stats: {},
        user: req.session.user, 
        title: 'Gestion des Alertes',
        error: 'Erreur lors du chargement des alertes'
      });
    }
  }

  static async traiterAlerte(req, res) {
    try {
      const { id } = req.params;
      const iduser = req.session.user.idusers;

      // Mettre à jour le statut de l'alerte
      await db.execute(`
        UPDATE alertepredictive 
        SET statut = 'traitee', iduser_traite = ?, date_traitement = CURRENT_TIMESTAMP 
        WHERE idalert = ?
      `, [iduser, id]);

      // Log d'audit
      await db.execute(
        `INSERT INTO logaudit (iduser, action, module, detaillson) 
         VALUES (?, 'TRAITER_ALERTE', 'GESTIONNAIRE', ?)`,
        [iduser, `Alerte ${id} traitée par le gestionnaire`]
      );

      res.redirect('/gestionnaire/alertes?success=Alerte traitée avec succès');
    } catch (error) {
      console.error('Erreur lors du traitement de l\'alerte:', error);
      res.redirect('/gestionnaire/alertes?error=Erreur lors du traitement de l\'alerte');
    }
  }

  static async ignorerAlerte(req, res) {
    try {
      const { id } = req.params;
      const iduser = req.session.user.idusers;

      // Mettre à jour le statut de l'alerte
      await db.execute(`
        UPDATE alertepredictive 
        SET statut = 'ignoree', iduser_traite = ?, date_traitement = CURRENT_TIMESTAMP 
        WHERE idalert = ?
      `, [iduser, id]);

      // Log d'audit
      await db.execute(
        `INSERT INTO logaudit (iduser, action, module, detaillson) 
         VALUES (?, 'IGNORER_ALERTE', 'GESTIONNAIRE', ?)`,
        [iduser, `Alerte ${id} ignorée par le gestionnaire`]
      );

      res.redirect('/gestionnaire/alertes?success=Alerte ignorée avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'ignorance de l\'alerte:', error);
      res.redirect('/gestionnaire/alertes?error=Erreur lors de l\'ignorance de l\'alerte');
    }
  }

  static async getAlerteStats(req, res) {
    try {
      const alertes = await DashboardModel.getAlertesActives();
      
      const stats = {
        total: alertes.length,
        haute: alertes.filter(a => a.niveauurgence === 'haute').length,
        moyenne: alertes.filter(a => a.niveauurgence === 'moyenne').length,
        basse: alertes.filter(a => a.niveauurgence === 'basse').length,
        parType: {}
      };

      // Compter par type d'alerte
      alertes.forEach(alerte => {
        const type = alerte.typealerte || 'autre';
        stats.parType[type] = (stats.parType[type] || 0) + 1;
      });

      res.json(stats);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      res.status(500).json({ error: 'Erreur lors du chargement des statistiques' });
    }
  }
}

module.exports = GestionnaireAlerteController;
