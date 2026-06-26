const db = require('../config/db');

class GestionnaireEntrepotController {
  static async showEntrepots(req, res) {
    try {
      // Récupérer les statistiques des entrepôts
      const [entrepots] = await db.execute(`
        SELECT e.identret, e.nom,
               COUNT(DISTINCT s.idmp) AS nb_produits,
               COALESCE(SUM(s.qtedisponible), 0) AS quantite_totale
        FROM entrepôt e
        LEFT JOIN stock s ON e.identret = s.identret
        GROUP BY e.identret, e.nom
        ORDER BY e.nom ASC
      `);

      res.render('layout_modern', {
        entrepots,
        user: req.session.user,
        title: 'Gestion des Entrepôts'
      });
    } catch (err) {
      console.error(err);
      req.flash('error', 'Erreur lors du chargement des entrepôts.');
      res.redirect('/dashboard');
    }
  }

  static async createEntrepot(req, res) {
    try {
      const { nom } = req.body;
      if (!nom || nom.trim() === '') {
        req.flash('error', 'Le nom de l\'entrepôt est obligatoire.');
        return res.redirect('/gestionnaire/entrepots');
      }

      const cleanNom = nom.trim();

      // Vérifier si un entrepôt avec le même nom existe déjà
      const [existing] = await db.execute(
        'SELECT identret FROM entrepôt WHERE LOWER(nom) = LOWER(?)',
        [cleanNom]
      );

      if (existing.length > 0) {
        req.flash('error', 'Un entrepôt portant ce nom existe déjà.');
        return res.redirect('/gestionnaire/entrepots');
      }

      // Créer l'entrepôt
      await db.execute('INSERT INTO entrepôt (nom) VALUES (?)', [cleanNom]);

      req.flash('success', `L'entrepôt "${cleanNom}" a été créé avec succès.`);
      res.redirect('/gestionnaire/entrepots');
    } catch (err) {
      console.error(err);
      req.flash('error', 'Erreur lors de la création de l\'entrepôt.');
      res.redirect('/gestionnaire/entrepots');
    }
  }

  static async deleteEntrepot(req, res) {
    try {
      const { id } = req.params;

      // Vérifier si l'entrepôt contient du stock actif
      const [stockCheck] = await db.execute(
        'SELECT COALESCE(SUM(qtedisponible), 0) AS total FROM stock WHERE identret = ?',
        [id]
      );

      const totalStock = Number(stockCheck[0].total) || 0;
      if (totalStock > 0) {
        req.flash('error', 'Impossible de supprimer un entrepôt contenant du stock. Visez-le d\'abord par transfert.');
        return res.redirect('/gestionnaire/entrepots');
      }

      // Récupérer le nom de l'entrepôt avant de le supprimer pour le message de succès
      const [entrepot] = await db.execute('SELECT nom FROM entrepôt WHERE identret = ?', [id]);
      if (entrepot.length === 0) {
        req.flash('error', 'Entrepôt introuvable.');
        return res.redirect('/gestionnaire/entrepots');
      }

      const nomEntrepot = entrepot[0].nom;

      // Supprimer l'entrepôt
      await db.execute('DELETE FROM entrepôt WHERE identret = ?', [id]);

      req.flash('success', `L'entrepôt "${nomEntrepot}" a été supprimé avec succès.`);
      res.redirect('/gestionnaire/entrepots');
    } catch (err) {
      console.error(err);
      req.flash('error', 'Erreur lors de la suppression de l\'entrepôt.');
      res.redirect('/gestionnaire/entrepots');
    }
  }
}

module.exports = GestionnaireEntrepotController;
