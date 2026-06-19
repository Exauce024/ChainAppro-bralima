const db = require('../config/db');

class MatierePremiereController {
  // Générer un code-barres automatique avec fallback robuste
  static async generateBarcode() {
    console.log('🏷️ Début de la génération de code-barres...');
    
    // Fallback immédiat si la base de données n'est pas disponible
    let fallbackCode = 'PROD001';
    
    try {
      // Test simple de connexion
      await db.execute('SELECT 1');
      console.log('✅ Connexion à la base de données réussie');
    } catch (connError) {
      console.error('❌ Erreur de connexion à la base:', connError.message);
      console.log('⚠️ Utilisation du code fallback:', fallbackCode);
      return fallbackCode;
    }
    
    try {
      // Méthode 1: Essayer la requête principale
      console.log('🔍 Requête principale pour le dernier code...');
      const [lastCode] = await db.execute(
        'SELECT codebarre FROM matièrepremiere WHERE codebarre LIKE "PROD%" ORDER BY codebarre DESC LIMIT 1'
      );
      
      if (lastCode && lastCode.length > 0) {
        const lastBarcode = lastCode[0].codebarre;
        const match = lastBarcode.match(/PROD(\d+)/);
        if (match) {
          const newNumber = parseInt(match[1]) + 1;
          const newBarcode = `PROD${String(newNumber).padStart(3, '0')}`;
          console.log('✅ Code-barres généré depuis la base:', newBarcode);
          return newBarcode;
        }
      }
      
      console.log('ℹ️ Aucun code existant trouvé, utilisation de PROD001');
      return 'PROD001';
      
    } catch (mainError) {
      console.error('❌ Erreur dans la requête principale:', mainError.message);
      
      // Méthode 2: Fallback avec requête plus simple
      try {
        console.log('🔄 Tentative avec requête fallback...');
        const [simpleResult] = await db.execute('SELECT COUNT(*) as count FROM matièrepremiere');
        console.log('✅ Table accessible, utilisation code séquentiel simple');
        
        // Générer un code basé sur le timestamp pour éviter les conflits
        const timestamp = Date.now().toString().slice(-3);
        fallbackCode = `PROD${timestamp}`;
        console.log('⚠️ Code généré avec fallback:', fallbackCode);
        return fallbackCode;
        
      } catch (fallbackError) {
        console.error('❌ Erreur dans le fallback:', fallbackError.message);
        console.log('⚠️ Utilisation du code par défaut final:', fallbackCode);
        return fallbackCode;
      }
    }
  }

  // Afficher le formulaire de création
  static async showCreateForm(req, res) {
    try {
      // Générer un code-barres automatiquement
      const generatedBarcode = await MatierePremiereController.generateBarcode();
      
      res.render('layout_modern', {
        user: req.session.user,
        title: 'Créer une Matière Première',
        generatedBarcode,
        fournisseurs: [],
        success: req.query.success || null,
        error: req.query.error || null
      });
    } catch (error) {
      console.error('Erreur:', error);
      res.render('layout_modern', {
        user: req.session.user,
        title: 'Créer une Matière Première',
        generatedBarcode: 'PROD001',
        fournisseurs: [],
        error: 'Erreur lors de la génération du code-barres'
      });
    }
  }

  // Créer une nouvelle matière première
  static async create(req, res) {
    try {
      const { libellé, description, seuilcritique, seuilalerte, codebarre, generateAuto, idfournisseur, prix_kg } = req.body;
      
      let finalBarcode = codebarre;
      
      // Si génération automatique demandée
      if (generateAuto === 'auto' || !codebarre) {
        finalBarcode = await MatierePremiereController.generateBarcode();
      }
      
      // Vérifier si le code-barres existe déjà
      const [existing] = await db.execute(
        'SELECT idmp FROM matièrepremiere WHERE codebarre = ?',
        [finalBarcode]
      );
      
      if (existing.length > 0) {
        return res.redirect(`/matieres/create?error=Le code-barres ${finalBarcode} existe déjà`);
      }
      
      // Insérer la nouvelle matière première
      const [result] = await db.execute(
        `INSERT INTO matièrepremiere (libellé, description, seuilcritique, seuilalerte, codebarre) 
         VALUES (?, ?, ?, ?, ?)`,
        [libellé, description, seuilcritique || 0, seuilalerte || 0, finalBarcode]
      );
      const idmp = result.insertId;

      // Enregistrer l'association si un fournisseur et un prix sont renseignés
      if (idmp && idfournisseur && prix_kg) {
        await db.execute(
          `INSERT INTO fournisseur_matiere (idfournisseur, idmp, prix_kg) VALUES (?, ?, ?)`,
          [idfournisseur, idmp, parseFloat(prix_kg) || 0]
        );
      }
      
      // Log d'audit
      await db.execute(
        `INSERT INTO logaudit (iduser, action, module, detaillson) 
         VALUES (?, 'CREATE', 'MATIERE_PREMIERE', ?)`,
        [req.session.user.idusers, `Matière première créée par le gestionnaire: ${libellé} (${finalBarcode})`]
      );
      
      res.redirect(`/matieres/create?success=Matière première ${libellé} créée avec succès (Code: ${finalBarcode})`);
      
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      res.redirect('/matieres/create?error=Erreur lors de la création de la matière première');
    }
  }

  // Lister toutes les matières premières
  static async list(req, res) {
    try {
      const [matieres] = await db.execute(
        'SELECT * FROM matièrepremiere ORDER BY libellé'
      );
      
      res.render('layout_modern', {
        matieres,
        user: req.session.user,
        title: 'Liste des Matières Premières',
        success: req.query.success || null,
        error: req.query.error || null
      });
    } catch (error) {
      console.error('Erreur:', error);
      res.render('layout_modern', {
        matieres: [],
        user: req.session.user,
        title: 'Liste des Matières Premières',
        error: 'Erreur lors du chargement des matières premières'
      });
    }
  }

  // Afficher les détails d'une matière première
  static async showDetails(req, res) {
    try {
      const { id } = req.params;
      
      const [matiere] = await db.execute(
        'SELECT * FROM matièrepremiere WHERE idmp = ?',
        [id]
      );
      
      if (matiere.length === 0) {
        return res.redirect('/matieres?error=Matière première non trouvée');
      }
      
      // Récupérer les informations de stock associées
      const [stocks] = await db.execute(
        'SELECT * FROM stock WHERE idmp = ?',
        [id]
      );
      
      res.render('layout_modern', {
        matiere: matiere[0],
        stocks,
        user: req.session.user,
        title: `Détails - ${matiere[0].libellé}`
      });
    } catch (error) {
      console.error('Erreur:', error);
      res.redirect('/matieres?error=Erreur lors du chargement des détails');
    }
  }

  // Mettre à jour une matière première
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { libellé, description, seuilcritique, seuilalerte, codebarre } = req.body;
      
      // Vérifier si la matière première existe
      const [existing] = await db.execute(
        'SELECT idmp FROM matièrepremiere WHERE idmp = ?',
        [id]
      );
      
      if (existing.length === 0) {
        return res.redirect('/matieres?error=Matière première non trouvée');
      }
      
      // Si le code-barres est modifié, vérifier l'unicité
      if (codebarre) {
        const [duplicateCheck] = await db.execute(
          'SELECT idmp FROM matièrepremiere WHERE codebarre = ? AND idmp != ?',
          [codebarre, id]
        );
        
        if (duplicateCheck.length > 0) {
          return res.redirect(`/matieres/${id}?error=Le code-barres ${codebarre} existe déjà`);
        }
      }
      
      // Mettre à jour la matière première
      await db.execute(
        `UPDATE matièrepremiere 
         SET libellé = ?, description = ?, seuilcritique = ?, seuilalerte = ?, codebarre = ? 
         WHERE idmp = ?`,
        [libellé, description, seuilcritique || 0, seuilalerte || 0, codebarre, id]
      );
      
      // Log d'audit
      await db.execute(
        `INSERT INTO logaudit (iduser, action, module, detaillson) 
         VALUES (?, 'UPDATE', 'MATIERE_PREMIERE', ?)`,
        [req.session.user.idusers, `Matière première mise à jour: ${libellé} (${codebarre})`]
      );
      
      res.redirect(`/matieres/${id}?success=Matière première mise à jour avec succès`);
      
    } catch (error) {
      console.error('Erreur:', error);
      res.redirect(`/matieres/${id}?error=Erreur lors de la mise à jour`);
    }
  }

  // Supprimer une matière première
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      // Vérifier si la matière première existe
      const [matiere] = await db.execute(
        'SELECT libellé FROM matièrepremiere WHERE idmp = ?',
        [id]
      );
      
      if (matiere.length === 0) {
        return res.redirect('/matieres?error=Matière première non trouvée');
      }
      
      // Vérifier s'il y a du stock associé
      const [stockCheck] = await db.execute(
        'SELECT COUNT(*) as count FROM stock WHERE idmp = ?',
        [id]
      );
      
      if (stockCheck[0].count > 0) {
        return res.redirect('/matieres?error=Impossible de supprimer: du stock est associé à cette matière première');
      }
      
      // Supprimer la matière première
      await db.execute('DELETE FROM matièrepremiere WHERE idmp = ?', [id]);
      
      // Log d'audit
      await db.execute(
        `INSERT INTO logaudit (iduser, action, module, detaillson) 
         VALUES (?, 'DELETE', 'MATIERE_PREMIERE', ?)`,
        [req.session.user.idusers, `Matière première supprimée: ${matiere[0].libellé}`]
      );
      
      res.redirect('/matieres?success=Matière première supprimée avec succès');
      
    } catch (error) {
      console.error('Erreur:', error);
      res.redirect('/matieres?error=Erreur lors de la suppression');
    }
  }

  // Générer et imprimer des codes-barres
  static async generateBarcodes(req, res) {
    try {
      const { ids } = req.body; // Array of IDs
      
      if (!ids || !Array.isArray(ids)) {
        return res.json({ success: false, message: 'IDs invalides' });
      }
      
      // Récupérer les matières premières
      const placeholders = ids.map(() => '?').join(',');
      const [matieres] = await db.execute(
        `SELECT idmp, libellé, codebarre FROM matièrepremiere WHERE idmp IN (${placeholders})`,
        ids
      );
      
      // Générer les données pour les codes-barres
      const barcodeData = matieres.map(matiere => ({
        id: matiere.idmp,
        name: matiere.libellé,
        barcode: matiere.codebarre,
        generatedAt: new Date().toISOString()
      }));
      
      res.json({ 
        success: true, 
        data: barcodeData,
        message: `${barcodeData.length} codes-barres générés`
      });
      
    } catch (error) {
      console.error('Erreur:', error);
      res.json({ success: false, message: 'Erreur lors de la génération des codes-barres' });
    }
  }
}

module.exports = MatierePremiereController;
