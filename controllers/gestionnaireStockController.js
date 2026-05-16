const StockModel = require('../models/stockModel');
const MatierePremiereModel = require('../models/matierePremiereModel');
const db = require('../config/db');

class GestionnaireStockController {
  static async showStocks(req, res) {
    try {
      const stocks = await StockModel.findAllWithDetails();
      const matieres = await MatierePremiereModel.findAll();
      
      // Calculer les statistiques
      const stats = {
        totalMatierePremieres: matieres.length,
        stockTotal: stocks.reduce((sum, stock) => sum + (stock.qtedisponible || 0), 0),
        stockCritique: stocks.filter(stock => stock.qtedisponible <= stock.seuilcritique).length,
        stockAlerte: stocks.filter(stock => stock.qtedisponible <= stock.seuilalerte && stock.qtedisponible > stock.seuilcritique).length,
        valeurTotale: 0 // Prix unitaire non disponible
      };

      res.render('layout_modern', { 
        stocks, 
        matieres,
        stats,
        user: req.session.user, 
        title: 'Gestion des Stocks',
        showCreateMatiereButton: true,
        success: req.query.success || null,
        error: req.query.error || null
      });
    } catch (error) {
      console.error('Erreur lors du chargement des stocks:', error);
      res.status(500).render('layout_modern', { 
        stocks: [], 
        matieres: [],
        stats: {},
        user: req.session.user, 
        title: 'Gestion des Stocks',
        showCreateMatiereButton: true,
        error: 'Erreur lors du chargement des stocks'
      });
    }
  }

  static async showStockDetails(req, res) {
    try {
      const { id } = req.params;
      console.log(` Recherche du stock avec ID: ${id}`);
      
      const stock = await StockModel.findByIdWithDetails(id);
      console.log(` Résultat findByIdWithDetails: ${stock ? 'TROUVÉ' : 'NON TROUVÉ'}`);
      
      if (!stock) {
        console.log(' Stock non trouvé, redirection vers la liste');
        return res.redirect('/gestionnaire/stocks?error=Stock non trouvé');
      }

      // Si pas de stock, créer un objet avec les infos de la matière première
      if (!stock.idstock) {
        console.log(' Création d un objet stock avec les infos de la matière première');
        stock.idstock = null;
        stock.qtedisponible = 0;
        stock.datemiseajour = new Date();
      }

      // Pas d'historique des mouvements (table mouvementstock n'existe pas)
      const mouvements = [];

      console.log(` Rendu du template avec title: "Détails du Stock - ${stock.libellé}"`);
      
      res.render('layout_modern', { 
        stock, 
        mouvements,
        user: req.session.user, 
        title: `Détails du Stock - ${stock.libellé}`,
        success: req.query.success || null,
        error: req.query.error || null
      });
    } catch (error) {
      console.error('Erreur lors de l affichage des détails du stock:', error);
      res.redirect('/gestionnaire/stocks?error=Erreur lors du chargement des détails');
    }
  }

  static async getStockStats(req, res) {
    try {
      const stocks = await StockModel.findAllWithDetails();
      
      const stats = {
        totalStocks: stocks.length,
        stockTotal: stocks.reduce((sum, stock) => sum + (stock.qtedisponible || 0), 0),
        stockCritique: stocks.filter(stock => stock.qtedisponible <= stock.seuilcritique).length,
        stockAlerte: stocks.filter(stock => stock.qtedisponible <= stock.seuilalerte && stock.qtedisponible > stock.seuilcritique).length,
        valeurTotale: stocks.reduce((sum, stock) => sum + (stock.qtedisponible || 0) * (stock.prixunitaire || 0), 0),
        stocksParStatut: {
          normal: stocks.filter(stock => stock.qtedisponible > stock.seuilalerte).length,
          alerte: stocks.filter(stock => stock.qtedisponible <= stock.seuilalerte && stock.qtedisponible > stock.seuilcritique).length,
          critique: stocks.filter(stock => stock.qtedisponible <= stock.seuilcritique).length
        }
      };

      res.json(stats);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      res.status(500).json({ error: 'Erreur lors du chargement des statistiques' });
    }
  }

  static async searchStocks(req, res) {
    try {
      const { query } = req.query;
      
      if (!query) {
        return res.json([]);
      }

      const [stocks] = await db.execute(`
        SELECT s.*, mp.libellé, mp.description, mp.unite, mp.seuilcritique, mp.seuilalerte, mp.prixunitaire
        FROM stock s
        JOIN matièrepremiere mp ON s.idmp = mp.idmp
        WHERE mp.libellé LIKE ? OR mp.description LIKE ?
        ORDER BY mp.libellé
      `, [`%${query}%`, `%${query}%`]);

      res.json(stocks);
    } catch (error) {
      console.error('Erreur lors de la recherche des stocks:', error);
      res.status(500).json({ error: 'Erreur lors de la recherche' });
    }
  }
}

module.exports = GestionnaireStockController;
