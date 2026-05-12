const CommandeModel = require('../models/commandeModel');
const FournisseurModel = require('../models/fournisseurModel');
const MatierePremiereModel = require('../models/matierePremiereModel');
const Mailer = require('../utils/mailer');
const crypto = require('crypto');
const db = require('../config/db');

class CommandeController {
  static async list(req, res) {
    const commandes = await CommandeModel.findAll();
    res.render('layout_modern', { commandes, user: req.session.user, title: 'Commandes', success: null, error: null });
  }

  static async showCreateForm(req, res) {
    const fournisseurs = await FournisseurModel.findAll();
    const matieres = await MatierePremiereModel.findAll();
    res.render('layout_modern', { fournisseurs, matieres, user: req.session.user, title: 'Créer une nouvelle commande', success: null, error: null });
  }

  static async create(req, res) {
    try {
      let { reference, deleidellivraison, idfournisseur, lignes } = req.body;
      const idcreateur = req.session.user.idusers;

      // Générer une référence automatiquement si non fournie
      if (!reference || reference.trim() === '') {
        reference = await this.generateReference();
      }

      console.log('Données reçues:', { reference, deleidellivraison, idfournisseur, lignes });

      // Validation simple
      if (!lignes || (Array.isArray(lignes) && lignes.length === 0)) {
        return res.status(400).send('Au moins une ligne de commande est requise');
      }

      // Si lignes n'est pas un tableau, le convertir
      const lignesArray = Array.isArray(lignes) ? lignes : [lignes];

      // Validation et nettoyage des lignes
      const lignesNettoyees = lignesArray.map(ligne => ({
        idmp: ligne.idmp,
        qtecommande: parseFloat(ligne.qtecommande) || 0,
        prixunitaire: parseFloat(ligne.prixunitaire) || 0
      }));

      console.log('Lignes nettoyées:', lignesNettoyees);

      const idcommande = await CommandeModel.create({
        reference,
        deleidellivraison,
        idcreateur,
        idfournisseur,
        lignes: lignesNettoyees
      });

      // Magic Link + email
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 heures
      await db.execute(
        `INSERT INTO magicklink (token, idfournisseur, idcommande, dateexpiration) 
         VALUES (?, ?, ?, ?)`,
        [token, idfournisseur, idcommande, expires]
      );

      const magicLinkUrl = `${process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`}/fournisseur/magic-access?token=${token}`;
      console.log('==========================================');
      console.log('MAGIC LINK POUR FOURNISSEUR:');
      console.log(magicLinkUrl);
      console.log('==========================================');

      const fournisseur = await FournisseurModel.getWithEmail(idfournisseur);
      if (fournisseur && fournisseur.email) {
        try {
          await Mailer.sendMagicLink(fournisseur.email, token, idcommande);
          await Mailer.sendRecapCommande(fournisseur.email, { idcommande, reference });
        } catch (emailErr) {
          console.error('Erreur email (non bloquant):', emailErr);
          console.log('Email non configuré - Magic link disponible dans la console');
        }
      }

      // Log audit
      await db.execute(
        `INSERT INTO logaudit (iduser, action, module, detaillson) 
         VALUES (?, 'CREATE', 'COMMANDE', ?)`,
        [idcreateur, `Commande ${idcommande} créée pour fournisseur ${idfournisseur}`]
      );

      res.redirect('/commandes?success=Commande créée avec succès');
    } catch (err) {
      console.error('Erreur détaillée lors de la création de commande:', err);
      res.status(500).send(`Erreur lors de la création de la commande: ${err.message}`);
    }
  }

  static async detail(req, res) {
    const commande = await CommandeModel.findById(req.params.id);
    if (!commande) return res.status(404).send('Commande non trouvée');
    res.render('layout_modern', { commande, user: req.session.user, title: `Commande n°${commande.idcommande}`, success: null, error: null });
  }

  static async updateStatut(req, res) {
    const { id } = req.params;
    const { statut, motifrefus } = req.body;

    await CommandeModel.updateStatut(id, statut, motifrefus || null);

    await db.execute(
      `INSERT INTO logaudit (iduser, action, module, detaillson) 
       VALUES (?, 'UPDATE_STATUT', 'COMMANDE', ?)`,
      [req.session.user.idusers, `Commande ${id} → ${statut}`]
    );

    res.redirect(`/commandes/${id}`);
  }

  // Générer une référence unique
  static async generateReference() {
    const year = new Date().getFullYear();
    let reference;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      const random = Math.floor(Math.random() * 900) + 100; // 3-digit random number
      reference = `CMD-${year}-${random}`;
      
      // Vérifier si la référence existe déjà
      const [existing] = await db.execute(
        'SELECT idcommande FROM commande WHERE reference = ?',
        [reference]
      );
      
      if (existing.length === 0) {
        isUnique = true;
      } else {
        attempts++;
      }
    }

    if (!isUnique) {
      throw new Error('Impossible de générer une référence unique après plusieurs tentatives');
    }

    return reference;
  }

  // Relance manuelle (on ajoutera un cron plus tard)
  static async relancer(req, res) {
    const { id } = req.params;
    const commande = await CommandeModel.findById(id);

    if (commande && commande.statut === 'en_attente') {
      const fournisseur = await FournisseurModel.getWithEmail(commande.idfournisseur);
      if (fournisseur && fournisseur.email) {
        await Mailer.sendMagicLink(fournisseur.email, 'RELANCE-' + Date.now(), commande.idcommande); // token temporaire
      }
      res.json({ success: true, message: 'Relance envoyée' });
    } else {
      res.status(400).json({ success: false });
    }
  }
}

module.exports = CommandeController;