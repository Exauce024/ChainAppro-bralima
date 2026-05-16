const StockModel = require('../models/stockModel');
const ReceptionModel = require('../models/receptionModel');
const MatierePremiereModel = require('../models/matierePremiereModel');
const CommandeModel = require('../models/commandeModel');
const FournisseurModel = require('../models/fournisseurModel');
const db = require('../config/db');

class StockController {
  static async showStocks(req, res) {
    const stocks = await StockModel.findAllWithDetails();
    const matieres = await MatierePremiereModel.findAll();

    const stats = {
      totalMatierePremieres: matieres.length,
      stockTotal: stocks.reduce((sum, stock) => sum + (Number(stock.qtedisponible) || 0), 0),
      stockCritique: stocks.filter(
        (stock) => Number(stock.qtedisponible) <= Number(stock.seuilcritique || 0)
      ).length,
      stockAlerte: stocks.filter((stock) => {
        const qte = Number(stock.qtedisponible) || 0;
        const critique = Number(stock.seuilcritique) || 0;
        const alerte = Number(stock.seuilalerte) || 0;
        return qte <= alerte && qte > critique;
      }).length,
      valeurTotale: 0,
    };

    res.render('layout_modern', {
      stocks,
      matieres,
      stats,
      user: req.session.user,
      title: 'Gestion des Stocks',
      showCreateMatiereButton: false,
    });
  }

  static async dashboardMagasinier(req, res) {
    const [entrepotsSummary, recentMouvements, stats, stocks] = await Promise.all([
      StockModel.getEntrepotSummary(),
      StockModel.getRecentMouvements(10),
      StockModel.getDashboardStats(),
      StockModel.findAll(),
    ]);

    res.render('layout_modern', {
      entrepotsSummary,
      recentMouvements,
      stats,
      stocks,
      user: req.session.user,
      title: 'Tableau de bord - Magasinier',
    });
  }

  static async showReceptionForm(req, res) {
    const [matieres, commandes, fournisseurs, entrepots] = await Promise.all([
      MatierePremiereModel.findAll(),
      db
        .execute(
          `
          SELECT c.idcommande, c.reference, c.statut, c.idfournisseur,
                 f.raisonsocial AS fournisseur_nom
          FROM commande c
          LEFT JOIN fournisseur f ON c.idfournisseur = f.idfournisseur
          WHERE c.statut IN ('approuvee', 'en_cours', 'livree', 'envoyee')
          ORDER BY c.datecreation DESC
        `
        )
        .then(([rows]) => rows),
      FournisseurModel.findAll(),
      db.execute('SELECT identret, nom FROM entrepôt ORDER BY nom ASC').then(([rows]) => rows),
    ]);

    res.render('layout_modern', {
      matieres,
      commandes,
      fournisseurs,
      entrepots,
      user: req.session.user,
      title: 'Nouvelle Réception',
    });
  }

  static async getCommandeLignes(req, res) {
    try {
      const commande = await CommandeModel.findById(req.params.id);
      if (!commande) {
        return res.status(404).json({ success: false, error: 'Commande introuvable' });
      }

      const lignes = await CommandeModel.getLignes(req.params.id);
      return res.json({
        success: true,
        commande: {
          idcommande: commande.idcommande,
          reference: commande.reference,
          statut: commande.statut,
          fournisseur: commande.raisonsocial,
          idfournisseur: commande.idfournisseur,
        },
        lignes,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, error: 'Erreur lors du chargement des lignes' });
    }
  }

  static async processReception(req, res) {
    try {
      const {
        idcommande,
        idmp,
        qtereçu,
        qterecu,
        lotnumero,
        dateperemption,
        identret,
        bon_livraison,
        chauffeur,
        observations,
        quality_status,
        zone,
        idfournisseur,
      } = req.body;

      const iduser = req.session.user.idusers;
      const quantiteRecue = parseInt(qtereçu || qterecu, 10);

      if (!idmp || !identret || !Number.isFinite(quantiteRecue) || quantiteRecue <= 0) {
        req.flash('error', 'Matière, entrepôt et quantité reçue sont obligatoires.');
        return res.redirect('/magasinier/reception');
      }

      const attributData = {
        lotnumero: lotnumero || null,
        dateperemption: dateperemption || null,
        bon_livraison: bon_livraison || null,
        chauffeur: chauffeur || null,
        observations: observations || null,
        quality_status: quality_status || 'conforme',
        zone: zone || null,
        idfournisseur: idfournisseur || null,
      };

      const idlignerec = await ReceptionModel.createLigneReception({
        idcommande: idcommande || null,
        idmp,
        qtereçu: quantiteRecue,
        attribut: JSON.stringify(attributData),
        iduser,
      });

      let stock = await StockModel.findByMpAndEntrepot(idmp, identret);
      if (!stock) {
        const [result] = await db.execute(
          `INSERT INTO stock (idmp, identret, lotnumero, dateperemption, qtedisponible)
           VALUES (?, ?, ?, ?, 0)`,
          [idmp, identret, lotnumero || null, dateperemption || null]
        );
        stock = { idstock: result.insertId };
      } else if (lotnumero || dateperemption) {
        await db.execute(
          `UPDATE stock SET lotnumero = COALESCE(?, lotnumero), dateperemption = COALESCE(?, dateperemption)
           WHERE idstock = ?`,
          [lotnumero || null, dateperemption || null, stock.idstock]
        );
      }

      const motif = idcommande
        ? `Réception marchandise — commande n°${idcommande}`
        : 'Réception marchandise';

      await StockModel.updateStock(
        stock.idstock,
        quantiteRecue,
        iduser,
        motif,
        idcommande || null,
        idlignerec
      );

      await ReceptionModel.validerReception(idlignerec, iduser, quantiteRecue);

      req.flash(
        'success',
        `Réception enregistrée : ${quantiteRecue} unité(s) ajoutée(s) au stock.`
      );
      return res.redirect('/magasinier/dashboard');
    } catch (err) {
      console.error(err);
      req.flash('error', `Erreur lors de l'enregistrement : ${err.message}`);
      return res.redirect('/magasinier/reception');
    }
  }

  static async processScan(req, res) {
    try {
      const { barcode } = req.body;

      if (!barcode) {
        return res.json({ success: false, message: 'Code-barres manquant' });
      }

      const product = await MatierePremiereModel.findByBarcode(barcode);

      if (!product) {
        return res.json({
          success: false,
          message: 'Aucune matière première trouvée avec ce code-barres',
        });
      }

      const stocks = await StockModel.getStockWithMouvements(product.idmp);
      const stockTotal = stocks.reduce((sum, row) => sum + (Number(row.qtedisponible) || 0), 0);
      const entrepots = stocks.map((row) => ({
        nom: row.entrepot_nom || `Entrepôt #${row.identret}`,
        qte: row.qtedisponible,
      }));

      return res.json({
        success: true,
        product: product.libellé,
        idmp: product.idmp,
        description: product.description,
        codebarre: product.codebarre,
        stockTotal,
        entrepots,
        seuilalerte: product.seuilalerte,
        seuilcritique: product.seuilcritique,
      });
    } catch (error) {
      console.error('Erreur lors du traitement du scan:', error);
      return res.json({
        success: false,
        message: 'Erreur lors de la recherche du produit',
      });
    }
  }

  static async logAuditStock(req, action, detail) {
    try {
      await db.execute(
        `INSERT INTO logaudit (iduser, action, module, detaillson) VALUES (?, ?, 'STOCK_MAGASINIER', ?)`,
        [req.session.user?.idusers || null, action, detail]
      );
    } catch (e) {
      console.warn('Log audit mouvement (non bloquant):', e.message);
    }
  }

  /** Hub flux MP → réception → sortie prod / transfert / ajustement */
  static async mouvementsHub(req, res) {
    try {
      const [countsToday, recentFlow] = await Promise.all([
        StockModel.countMouvementsTodayByType(),
        StockModel.getRecentMouvements(12),
      ]);

      res.render('layout_modern', {
        user: req.session.user,
        title: 'Mouvements de stock',
        countsToday,
        recentFlow,
      });
    } catch (err) {
      console.error(err);
      req.flash('error', 'Impossible de charger le hub mouvements.');
      res.redirect('/magasinier/dashboard');
    }
  }

  static async showSortieProduction(req, res) {
    try {
      const lignes = await StockModel.listStockLinesDetailed();
      const lignesDispo = lignes.filter((l) => Number(l.qtedisponible) > 0);

      res.render('layout_modern', {
        user: req.session.user,
        title: 'Sortie vers production',
        lignesStock: lignesDispo.length ? lignesDispo : lignes,
      });
    } catch (err) {
      console.error(err);
      req.flash('error', err.message);
      res.redirect('/magasinier/mouvements');
    }
  }

  static async processSortieProduction(req, res) {
    try {
      const iduser = req.session.user.idusers;
      const { idstock, quantite, reference_prod, notes } = req.body;
      const q = Math.round(parseFloat(String(quantite).replace(',', '.')));
      const ref = String(reference_prod || '').trim();

      if (!idstock || !Number.isFinite(q) || q < 1) {
        req.flash('error', 'Ligne de stock et quantité valide sont obligatoires.');
        return res.redirect('/magasinier/mouvements/sortie-production');
      }
      if (!ref || ref.length < 2) {
        req.flash('error', 'Référence production / OF obligatoire (ex. OF-2026-001).');
        return res.redirect('/magasinier/mouvements/sortie-production');
      }

      let motif = `Sortie production — Réf. ${ref}`;
      if (notes && String(notes).trim()) {
        motif += ` · ${String(notes).trim().substring(0, 200)}`;
      }

      await StockModel.executeMovement({
        idstock,
        type_mouvement: 'sortie',
        stock_delta: -q,
        iduser,
        motif,
      });

      await StockController.logAuditStock(req, 'SORTIE_PRODUCTION', motif);

      req.flash('success', `Sortie production enregistrée : ${q} unité(s). Les seuils d’alerte reflètent désormais ce mouvement.`);
      res.redirect('/magasinier/mouvements');
    } catch (err) {
      console.error(err);
      req.flash('error', err.message || 'Erreur sortie production.');
      res.redirect('/magasinier/mouvements/sortie-production');
    }
  }

  static async showTransfert(req, res) {
    try {
      const [lignes, entRows] = await Promise.all([
        StockModel.listStockLinesDetailed(),
        db.execute('SELECT identret, nom FROM entrepôt ORDER BY nom ASC').then(([r]) => r),
      ]);

      const lignesDispo = lignes.filter((l) => Number(l.qtedisponible) > 0);

      res.render('layout_modern', {
        user: req.session.user,
        title: 'Transfert entre entrepôts',
        lignesStock: lignesDispo.length ? lignesDispo : lignes,
        entrepots: entRows,
      });
    } catch (err) {
      console.error(err);
      req.flash('error', err.message);
      res.redirect('/magasinier/mouvements');
    }
  }

  static async processTransfert(req, res) {
    try {
      const iduser = req.session.user.idusers;
      const { idstock_source, identret_dest, quantite, reference } = req.body;
      const q = Math.round(parseFloat(String(quantite).replace(',', '.')));
      const ref = String(reference || '').trim();

      if (!idstock_source || !identret_dest || !Number.isFinite(q) || q < 1) {
        req.flash('error', 'Source, entrepôt destination et quantité sont obligatoires.');
        return res.redirect('/magasinier/mouvements/transfert');
      }
      if (!ref || ref.length < 2) {
        req.flash('error', 'Référence transport / bon interne obligatoire.');
        return res.redirect('/magasinier/mouvements/transfert');
      }

      const src = await StockModel.findStockLineById(idstock_source);
      if (!src) {
        req.flash('error', 'Ligne source introuvable.');
        return res.redirect('/magasinier/mouvements/transfert');
      }
      if (Number(src.identret) === Number(identret_dest)) {
        req.flash('error', 'L’entrepôt de destination doit être différent de la source.');
        return res.redirect('/magasinier/mouvements/transfert');
      }

      const dstLine = await StockModel.ensureStockLine(src.idmp, identret_dest);

      await StockModel.executeTransfer({
        idstockSource: src.idstock,
        idstockDest: dstLine.idstock,
        quantite: q,
        iduser,
        reference: ref,
      });

      await StockController.logAuditStock(
        req,
        'TRANSFERT_STOCK',
        `Transfert ${q} unités MP ${src.libelle || src.idmp} · Réf. ${ref}`
      );

      req.flash('success', `Transfert enregistré : ${q} unité(s) vers l’entrepôt de destination.`);
      res.redirect('/magasinier/mouvements');
    } catch (err) {
      console.error(err);
      req.flash('error', err.message || 'Erreur transfert.');
      res.redirect('/magasinier/mouvements/transfert');
    }
  }

  static async showAjustement(req, res) {
    try {
      const lignes = await StockModel.listStockLinesDetailed();

      res.render('layout_modern', {
        user: req.session.user,
        title: 'Ajustement inventaire',
        lignesStock: lignes,
      });
    } catch (err) {
      console.error(err);
      req.flash('error', err.message);
      res.redirect('/magasinier/mouvements');
    }
  }

  static async processAjustement(req, res) {
    try {
      const iduser = req.session.user.idusers;
      const { idstock, quantite, sens, motif } = req.body;
      const q = Math.round(parseFloat(String(quantite).replace(',', '.')));
      const motifTxt = String(motif || '').trim();

      if (!idstock || !Number.isFinite(q) || q < 1) {
        req.flash('error', 'Ligne de stock et quantité positive obligatoires.');
        return res.redirect('/magasinier/mouvements/ajustement');
      }
      if (!motifTxt || motifTxt.length < 10) {
        req.flash('error', 'Motif obligatoire (min. 10 caractères) — expliquez la cause de l’écart.');
        return res.redirect('/magasinier/mouvements/ajustement');
      }
      if (sens !== 'plus' && sens !== 'moins') {
        req.flash('error', 'Sens d’ajustement invalide.');
        return res.redirect('/magasinier/mouvements/ajustement');
      }

      const delta = sens === 'plus' ? q : -q;
      const labelSens = sens === 'plus' ? 'Gain inventaire' : 'Perte inventaire';

      await StockModel.executeMovement({
        idstock,
        type_mouvement: 'ajustement',
        stock_delta: delta,
        iduser,
        motif: `Ajustement — ${labelSens} · ${motifTxt}`,
      });

      await StockController.logAuditStock(
        req,
        'AJUSTEMENT_STOCK',
        `${labelSens} ${q} u. · ${motifTxt.substring(0, 120)}`
      );

      req.flash(
        'success',
        `Ajustement enregistré (${labelSens.toLowerCase()}, ${q} u.). Les alertes ont été recalculées.`
      );
      res.redirect('/magasinier/mouvements');
    } catch (err) {
      console.error(err);
      req.flash('error', err.message || 'Erreur ajustement.');
      res.redirect('/magasinier/mouvements/ajustement');
    }
  }
}

module.exports = StockController;
