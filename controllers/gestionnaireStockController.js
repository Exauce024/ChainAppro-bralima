const StockModel = require('../models/stockModel');
const MatierePremiereModel = require('../models/matierePremiereModel');
const db = require('../config/db');

class GestionnaireStockController {
  static async showStocks(req, res) {
    try {
      const stocks = await StockModel.findAllWithDetails();
      const matieres = await MatierePremiereModel.findAll();
      
      // Group stocks by idmp to calculate total available per raw material
      const mpStocksMap = {};
      stocks.forEach(s => {
        mpStocksMap[s.idmp] = (mpStocksMap[s.idmp] || 0) + (Number(s.qtedisponible) || 0);
      });

      const stats = {
        totalMatierePremieres: matieres.length,
        stockTotal: stocks.reduce((sum, stock) => sum + (stock.qtedisponible || 0), 0),
        stockCritique: matieres.filter(m => (mpStocksMap[m.idmp] || 0) <= Number(m.seuilcritique || 5)).length,
        stockAlerte: matieres.filter(m => {
          const qte = mpStocksMap[m.idmp] || 0;
          return qte <= Number(m.seuilalerte || 10) && qte > Number(m.seuilcritique || 5);
        }).length,
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
      console.log(` Recherche des lignes de stock pour la matière ID: ${id}`);
      
      const stockLines = await StockModel.findStockLinesByMp(id);
      
      if (stockLines.length === 0) {
        const matiere = await MatierePremiereModel.findById(id);
        if (!matiere) {
          return res.redirect('/gestionnaire/stocks?error=Stock non trouvé');
        }
        const stock = {
          idstock: null,
          idmp: matiere.idmp,
          libellé: matiere.libellé,
          description: matiere.description,
          seuilcritique: matiere.seuilcritique,
          seuilalerte: matiere.seuilalerte,
          qtedisponible: 0,
        };
        return res.render('layout_modern', { 
          stock, 
          lots: [],
          mouvements: [],
          user: req.session.user, 
          title: `Détails du Stock - ${stock.libellé}`,
          success: req.query.success || null,
          error: req.query.error || null
        });
      }

      const stock = {
        idstock: stockLines[0].idstock,
        idmp: stockLines[0].idmp,
        libellé: stockLines[0].libellé,
        description: stockLines[0].description,
        seuilcritique: stockLines[0].seuilcritique,
        seuilalerte: stockLines[0].seuilalerte,
        qtedisponible: stockLines.reduce((sum, s) => sum + (Number(s.qtedisponible) || 0), 0),
      };

      const mouvements = [];
      
      res.render('layout_modern', { 
        stock, 
        lots: stockLines,
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
      
      const mpStocksMap = {};
      stocks.forEach(s => {
        mpStocksMap[s.idmp] = (mpStocksMap[s.idmp] || 0) + (Number(s.qtedisponible) || 0);
      });

      const matieres = await MatierePremiereModel.findAll();

      const normalCount = matieres.filter(m => (mpStocksMap[m.idmp] || 0) > Number(m.seuilalerte || 10)).length;
      const alerteCount = matieres.filter(m => {
        const qte = mpStocksMap[m.idmp] || 0;
        return qte <= Number(m.seuilalerte || 10) && qte > Number(m.seuilcritique || 5);
      }).length;
      const critiqueCount = matieres.filter(m => (mpStocksMap[m.idmp] || 0) <= Number(m.seuilcritique || 5)).length;

      const stats = {
        totalStocks: matieres.length,
        stockTotal: stocks.reduce((sum, stock) => sum + (stock.qtedisponible || 0), 0),
        stockCritique: critiqueCount,
        stockAlerte: alerteCount,
        valeurTotale: stocks.reduce((sum, stock) => sum + (stock.qtedisponible || 0) * (stock.prixunitaire || 0), 0),
        stocksParStatut: {
          normal: normalCount,
          alerte: alerteCount,
          critique: critiqueCount
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
