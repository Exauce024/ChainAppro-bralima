const StockModel = require('../models/stockModel');
const ReceptionModel = require('../models/receptionModel');
const MatierePremiereModel = require('../models/matierePremiereModel');
const db = require('../config/db');

class StockController {
  static async showStocks(req, res) {
    const stocks = await StockModel.findAll();
    res.render('layout_modern', {
      stocks,
      user: req.session.user,
      title: 'Gestion des Stocks',
      success: null,
      error: null
    });
  }

  static async dashboardMagasinier(req, res) {
    const stocks = await StockModel.findAll();
    res.render('layout_modern', { 
      stocks, 
      user: req.session.user, 
      title: 'Tableau de bord - Magasinier',
      success: null,
      error: null
    });
  }

  static async showReceptionForm(req, res) {
    // Pour l'instant formulaire manuel. Scan sera ajouté plus tard via JS + camera
    const matieres = await db.execute('SELECT * FROM matièrepremiere').then(([r]) => r);
    const commandes = await db.execute('SELECT idcommande, reference FROM commande WHERE statut = "approuvee"').then(([r]) => r);

    res.render('magasinier/reception-form', { 
      matieres, 
      commandes, 
      user: req.session.user,
      title: 'Nouvelle Réception',
      success: null,
      error: null
    });
  }

  static async processReception(req, res) {
    try {
      const { idcommande, idmp, qtereçu, attribut, lotnumero, dateperemption, identret } = req.body;
      const iduser = req.session.user.idusers;

      // 1. Créer ligne réception
      const idlignerec = await ReceptionModel.createLigneReception({
        idcommande: idcommande || null,
        idmp,
        qtereçu,
        attribut: JSON.stringify({ lotnumero, dateperemption }),
        iduser
      });

      // 2. Trouver ou créer stock dans l'entrepôt
      let stock = await StockModel.findByMpAndEntrepot(idmp, identret);
      if (!stock) {
        const [result] = await db.execute(
          `INSERT INTO stock (idmp, identret, lotnumero, dateperemption) 
           VALUES (?, ?, ?, ?)`,
          [idmp, identret, lotnumero, dateperemption]
        );
        stock = { idstock: result.insertId };
      }

      // 3. Mettre à jour le stock
      await StockModel.updateStock(
        stock.idstock, 
        parseInt(qtereçu), 
        iduser, 
        'Réception marchandise', 
        idcommande, 
        idlignerec
      );

      // 4. Valider réception (contrôle qualité simulé)
      await ReceptionModel.validerReception(idlignerec, iduser, parseInt(qtereçu));

      res.redirect('/magasinier/dashboard?success=Réception enregistrée');
    } catch (err) {
      console.error(err);
      res.status(500).send('Erreur lors de l\'enregistrement de la réception');
    }
  }

  static async scanSimulation(req, res) {
    // Page dédiée pour simuler le scan mobile (utilisable sur smartphone)
    res.render('layout_modern', { 
      user: req.session.user,
      title: 'Mode Scan Mobile',
      success: null,
      error: null
    });
  }

  static async processScan(req, res) {
    try {
      const { barcode } = req.body;
      
      if (!barcode) {
        return res.json({ success: false, message: 'Code-barres manquant' });
      }

      // Rechercher le produit par code-barres
      const product = await MatierePremiereModel.findByBarcode(barcode);
      
      if (product) {
        return res.json({ 
          success: true, 
          product: product.libellé,
          idmp: product.idmp,
          description: product.description
        });
      } else {
        return res.json({ 
          success: false, 
          message: 'Produit non trouvé avec ce code-barres' 
        });
      }
    } catch (error) {
      console.error('Erreur lors du traitement du scan:', error);
      return res.json({ 
        success: false, 
        message: 'Erreur lors de la recherche du produit' 
      });
    }
  }
}

module.exports = StockController;