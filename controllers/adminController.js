const AdminModel = require('../models/adminModel');
const db = require('../config/db');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Mailer = require('../utils/mailer');

class AdminController {
  static async dashboard(req, res) {
    const users = await AdminModel.getAllUsers();
    const fournisseurs = await AdminModel.getAllFournisseurs();
    const logs = await AdminModel.getAuditLogs(50);
    const totalLogs = await AdminModel.countAuditLogs();

    res.render('layout_modern', {
      users,
      fournisseurs,
      logs,
      totalLogs,
      user: req.session.user,
      title: 'Administration Système',
      success: null,
      error: null
    });
  }

  static async showCreateUser(req, res) {
    const [roles] = await db.execute('SELECT * FROM role');
    res.render('layout_modern', { roles, user: req.session.user, title: 'Créer un utilisateur', success: null, error: null });
  }

  static async createUser(req, res) {
    try {
      await AdminModel.createUser(req.body);
      res.redirect('/admin/dashboard?success=Utilisateur créé');
    } catch (err) {
      console.error(err);
      res.status(500).send('Erreur lors de la création');
    }
  }

  static async toggleUser(req, res) {
    const { id, action } = req.params;
    const newStatut = action === 'activate' ? 'actif' : 'suspendu';
    await AdminModel.toggleUserStatus(id, newStatut);
    res.redirect('/admin/dashboard');
  }

  static async users(req, res) {
    const users = await AdminModel.getAllUsers();
    res.render('layout_modern', {
      users,
      user: req.session.user,
      title: 'Gestion des Utilisateurs',
      success: null,
      error: null
    });
  }

  static async fournisseurs(req, res) {
    const fournisseurs = await AdminModel.getAllFournisseurs();
    res.render('layout_modern', {
      fournisseurs,
      user: req.session.user,
      title: 'Gestion des Fournisseurs',
      success: null,
      error: null
    });
  }

  static async logs(req, res) {
    const logs = await AdminModel.getAuditLogs(100);
    res.render('layout_modern', {
      logs,
      user: req.session.user,
      title: 'Logs d\'Audit',
      success: null,
      error: null
    });
  }

  static async showCreateFournisseur(req, res) {
    try {
      const [matieres] = await db.execute('SELECT idmp, libellé FROM matièrepremiere ORDER BY libellé');
      res.render('layout_modern', { 
        user: req.session.user, 
        title: 'Créer un fournisseur', 
        matieres,
        success: null, 
        error: null 
      });
    } catch (error) {
      console.error(error);
      res.render('layout_modern', { 
        user: req.session.user, 
        title: 'Créer un fournisseur', 
        matieres: [],
        success: null, 
        error: 'Erreur lors du chargement des matières premières' 
      });
    }
  }

  static async createFournisseur(req, res) {
    try {
      const { idmp, prix_kg } = req.body;
      const { idfournisseur, tempPassword } = await AdminModel.createFournisseur(req.body);

      if (idfournisseur && idmp && prix_kg) {
        await db.execute(
          `INSERT INTO fournisseur_matiere (idfournisseur, idmp, prix_kg) VALUES (?, ?, ?)`,
          [idfournisseur, idmp, parseFloat(prix_kg) || 0]
        );
      }

      // Envoi de l'email de bienvenue avec le mot de passe temporaire
      if (req.body.email && tempPassword) {
        try {
          await Mailer.sendCredentialsFournisseur(req.body.email, {
            raisonsocial: req.body.raisonsocial,
            motdepasseTemp: tempPassword
          });
        } catch (emailErr) {
          console.error('Email credentials fournisseur (non bloquant):', emailErr.message);
          console.log(`📧 Mot de passe temporaire pour ${req.body.email} : ${tempPassword}`);
        }
      }

      res.redirect('/admin/dashboard?success=Fournisseur ajouté avec succès');
    } catch (err) {
      console.error(err);
      res.status(500).send('Erreur lors de l\'ajout du fournisseur');
    }
  }

  // Génère ou régénère les accès portail pour un fournisseur existant
  static async generateFournisseurAccess(req, res) {
    try {
      const { id } = req.params;
      const result = await AdminModel.generateFournisseurAccess(id);

      // Envoi de l'email de bienvenue
      try {
        await Mailer.sendCredentialsFournisseur(result.email, {
          raisonsocial: result.raisonsocial,
          motdepasseTemp: result.tempPassword
        });
        console.log(`✅ Accès portail générés et email envoyé à ${result.email}`);
      } catch (emailErr) {
        console.error('Email credentials fournisseur (non bloquant):', emailErr.message);
        console.log(`📧 Mot de passe temporaire pour ${result.email} : ${result.tempPassword}`);
      }

      res.redirect(`/admin/fournisseur/${id}?success=Accès portail générés — email envoyé à ${result.email}`);
    } catch (err) {
      console.error(err);
      res.redirect(`/admin/fournisseur/${req.params.id}?error=${encodeURIComponent(err.message)}`);
    }
  }

  // Show single fournisseur details
  static async viewFournisseur(req, res) {
    try {
      const { id } = req.params;
      const fournisseur = await AdminModel.getFournisseurById(id);
      if (!fournisseur) {
        return res.redirect('/admin/fournisseurs?error=Fournisseur non trouvé');
      }
      
      // Fetch current association if any
      const [assoc] = await db.execute(`
        SELECT fm.idmp, fm.prix_kg, mp.libellé AS libellé_mp 
        FROM fournisseur_matiere fm 
        JOIN matièrepremiere mp ON fm.idmp = mp.idmp 
        WHERE fm.idfournisseur = ?
      `, [id]);
      
      if (assoc.length > 0) {
        fournisseur.idmp = assoc[0].idmp;
        fournisseur.libellé_mp = assoc[0].libellé_mp;
        fournisseur.prix_kg = assoc[0].prix_kg;
      }

      res.render('layout_modern', { fournisseur, user: req.session.user, title: 'Détails du Fournisseur', success: null, error: null });
    } catch (error) {
      console.error('Erreur lors du chargement du fournisseur:', error);
      res.redirect('/admin/fournisseurs?error=Erreur lors du chargement');
    }
  }

  // Render edit form for fournisseur
  static async editFournisseur(req, res) {
    try {
      const { id } = req.params;
      const fournisseur = await AdminModel.getFournisseurById(id);
      if (!fournisseur) {
        return res.redirect('/admin/fournisseurs?error=Fournisseur non trouvé');
      }
      const [matieres] = await db.execute('SELECT * FROM matièrepremiere ORDER BY libellé');
      // Fetch current association if any
      const [assoc] = await db.execute('SELECT * FROM fournisseur_matiere WHERE idfournisseur = ?', [id]);
      res.render('layout_modern', { fournisseur, matieres, assoc: assoc[0] || null, user: req.session.user, title: 'Modifier Fournisseur', success: null, error: null });
    } catch (error) {
      console.error('Erreur lors du chargement du formulaire d\'édition:', error);
      res.redirect('/admin/fournisseurs?error=Erreur lors du chargement');
    }
  }

  // Handle edit form submission
  static async updateFournisseur(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;
      await AdminModel.updateFournisseur(id, data);
      
      // Update association: clear old one first
      await db.execute('DELETE FROM fournisseur_matiere WHERE idfournisseur = ?', [id]);
      if (data.idmp && data.prix_kg) {
        await db.execute(
          `INSERT INTO fournisseur_matiere (idfournisseur, idmp, prix_kg) VALUES (?, ?, ?)`,
          [id, data.idmp, parseFloat(data.prix_kg) || 0]
        );
      }
      
      res.redirect('/admin/fournisseurs?success=Fournisseur mis à jour');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du fournisseur:', error);
      res.redirect('/admin/fournisseurs?error=Erreur lors de la mise à jour');
    }
  }

  // Render delete confirmation for fournisseur
  static async confirmDeleteFournisseur(req, res) {
    try {
      const { id } = req.params;
      const fournisseur = await AdminModel.getFournisseurById(id);
      if (!fournisseur) {
        return res.redirect('/admin/fournisseurs?error=Fournisseur non trouvé');
      }
      res.render('layout_modern', { fournisseur, user: req.session.user, title: 'Supprimer Fournisseur', success: null, error: null });
    } catch (error) {
      console.error('Erreur lors de la confirmation de la suppression:', error);
      res.redirect('/admin/fournisseurs?error=Erreur lors de la suppression');
    }
  }

  // Delete fournisseur
  static async deleteFournisseur(req, res) {
    try {
      const { id } = req.params;
      await AdminModel.deleteFournisseur(id);
      // Also remove associations
      await db.execute('DELETE FROM fournisseur_matiere WHERE idfournisseur = ?', [id]);
      res.redirect('/admin/fournisseurs?success=Fournisseur supprimé');
    } catch (error) {
      console.error('Erreur lors de la suppression du fournisseur:', error);
      res.redirect('/admin/fournisseurs?error=Erreur lors de la suppression');
    }
  }



  static async editUser(req, res) {
    try {
      const { id } = req.params;
      const [roles] = await db.execute('SELECT * FROM role');
      const [users] = await db.execute('SELECT * FROM users WHERE idusers = ?', [id]);
      
      if (users.length === 0) {
        return res.redirect('/admin/users?error=Utilisateur non trouvé');
      }
      
      res.render('layout_modern', { 
        user: users[0], 
        roles, 
        user: req.session.user, 
        title: 'Modifier un utilisateur',
        success: null,
        error: null
      });
    } catch (error) {
      console.error('Erreur lors du chargement de l\'utilisateur:', error);
      res.redirect('/admin/users?error=Erreur lors du chargement');
    }
  }

  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { nom, prenom, email, role_libelle, statut } = req.body;
      
      await AdminModel.updateUser(id, { nom, prenom, email, role_libelle, statut });
      res.redirect('/admin/users?success=Utilisateur mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      res.redirect('/admin/users?error=Erreur lors de la mise à jour');
    }
  }

  static async deleteUser(req, res) {
    try {
      const { id } = req.params;
      
      // Vérifier que l'utilisateur ne se supprime pas lui-même
      if (parseInt(id) === req.session.user.idusers) {
        return res.redirect('/admin/users?error=Vous ne pouvez pas supprimer votre propre compte');
      }
      
      await AdminModel.deleteUser(id);
      res.redirect('/admin/users?success=Utilisateur supprimé avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      res.redirect('/admin/users?error=Erreur lors de la suppression');
    }
  }

  // Télécharger les logs en PDF
  static async downloadLogsPDF(req, res) {
    try {
      console.log('📄 Génération du PDF des logs...');
      
      // Récupérer tous les logs avec statistiques
      const [logs] = await db.execute(`
        SELECT la.idlog, la.detaillson, la.module, la.action, 
               u.nom, u.prenom, la.horodatage, la.adresse
        FROM logaudit la
        LEFT JOIN users u ON la.iduser = u.idusers
        ORDER BY la.horodatage DESC
        LIMIT 500
      `);

      if (logs.length === 0) {
        return res.status(404).send('Aucun log trouvé');
      }

      // Calculer les statistiques
      const stats = {
        total: logs.length,
        byModule: {},
        byAction: {},
        byUser: {},
        today: 0,
        thisWeek: 0,
        uniqueUsers: new Set()
      };

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      logs.forEach(log => {
        // Statistiques par module
        stats.byModule[log.module] = (stats.byModule[log.module] || 0) + 1;
        
        // Statistiques par action
        stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
        
        // Statistiques par utilisateur
        const userName = `${log.prenom || ''} ${log.nom || ''}`.trim();
        stats.byUser[userName] = (stats.byUser[userName] || 0) + 1;
        stats.uniqueUsers.add(userName);
        
        // Statistiques temporelles
        const logDate = new Date(log.horodatage);
        if (logDate >= today) stats.today++;
        if (logDate >= weekAgo) stats.thisWeek++;
      });

      console.log(`📝 ${logs.length} logs trouvés, début de la génération PDF...`);

      // Créer le document PDF
      const doc = new PDFDocument({ 
        size: 'A4', 
        margins: { top: 40, bottom: 40, left: 40, right: 40 },
        info: {
          Title: 'Rapport des Logs d\'Audit - BRALIMA',
          Author: 'BRALIMA Supply Chain',
          Subject: 'Rapport d\'Audit Système',
          Creator: 'BRALIMA Admin Panel',
          Producer: 'BRALIMA Supply Chain Management System'
        }
      });
      
      // Ajouter une police
      doc.font('Helvetica');
      
      // Logo & En-tête BRALIMA en haut de la page 1
      const logoPath = path.join(__dirname, '../public/images/bralima-logo.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 40, 30, { width: 50 });
      }
      
      // Nom BRALIMA
      doc.fontSize(22).fillColor('#1e40af').font('Helvetica-Bold').text('BRALIMA S.A.', 100, 35);
      doc.fontSize(10).fillColor('#4b5563').font('Helvetica').text('Département Supply Chain & Approvisionnement', 100, 58);
      doc.fontSize(8).fillColor('#9ca3af').text('Système automatisé de suivi d\'audit', 100, 72);
      
      // Séparateur
      doc.strokeColor('#1e40af').lineWidth(1.5).moveTo(40, 90).lineTo(555, 90).stroke();
      
      // Titre
      doc.fontSize(14).fillColor('#1e293b').font('Helvetica-Bold').text('RAPPORT DES LOGS D\'AUDIT SYSTÈME', 40, 105);
      doc.fontSize(8.5).fillColor('#64748b').font('Helvetica').text(`Généré le : ${new Date().toLocaleString('fr-FR')}`, 40, 120);

      // --- SECTION STATISTIQUES (En haut de la première page) ---
      doc.fillColor('#f8fafc').rect(40, 135, 515, 80).fill();
      doc.strokeColor('#cbd5e1').lineWidth(0.8).rect(40, 135, 515, 80).stroke();
      
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#1e40af').text('STATISTIQUES DE LA PÉRIODE', 50, 145);
      
      doc.fontSize(8.5).font('Helvetica').fillColor('#334155');
      doc.text(`Total des activités : ${stats.total}`, 50, 165);
      doc.text(`Aujourd'hui : ${stats.today}`, 50, 178);
      doc.text(`Cette semaine : ${stats.thisWeek}`, 50, 191);
      doc.text(`Utilisateurs actifs : ${stats.uniqueUsers.size}`, 50, 204);
      
      // Top modules et actions
      const sortedModules = Object.entries(stats.byModule).sort((a, b) => b[1] - a[1]);
      const topModuleStr = sortedModules.length > 0 ? `${sortedModules[0][0]} (${sortedModules[0][1]})` : 'Aucun';
      
      const sortedActions = Object.entries(stats.byAction).sort((a, b) => b[1] - a[1]);
      const topActionStr = sortedActions.length > 0 ? `${sortedActions[0][0]} (${sortedActions[0][1]})` : 'Aucune';
      
      doc.text(`Top Module : ${topModuleStr}`, 280, 165);
      doc.text(`Top Action : ${topActionStr}`, 280, 178);
      
      // Séparateur avant le tableau
      doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(40, 230).lineTo(555, 230).stroke();
      
      // --- TABLEAU DES LOGS ---
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e293b').text('ACTIVITÉS RÉCENTES', 40, 242);
      
      const xId = 40;
      const xDate = 75;
      const xUser = 170;
      const xModule = 265;
      const xAction = 345;
      const xDetails = 415;
      
      function drawTableHeader(y) {
        doc.fillColor('#1e40af').rect(40, y, 515, 18).fill();
        doc.fillColor('#ffffff').fontSize(7.5).font('Helvetica-Bold');
        doc.text('ID', xId + 5, y + 5);
        doc.text('Date & Heure', xDate, y + 5);
        doc.text('Utilisateur', xUser, y + 5);
        doc.text('Module', xModule, y + 5);
        doc.text('Action', xAction, y + 5);
        doc.text('Détails', xDetails, y + 5);
      }
      
      let currentY = 260;
      drawTableHeader(currentY);
      currentY += 18;
      
      // Données
      logs.forEach((log, index) => {
        const userName = `${log.prenom || ''} ${log.nom || ''}`.trim() || 'Système';
        const details = log.detaillson || '';
        const dateStr = log.horodatage ? new Date(log.horodatage).toLocaleString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }) : '';
        
        // Nouvelle page si limite atteinte
        if (currentY > 740) {
          doc.addPage();
          currentY = 40;
          drawTableHeader(currentY);
          currentY += 18;
        }
        
        // Couleur de fond alternée
        const bgColor = index % 2 === 0 ? '#f8fafc' : '#ffffff';
        doc.fillColor(bgColor).rect(40, currentY, 515, 18).fill();
        
        // Dessiner la ligne fine de séparation
        doc.strokeColor('#f1f5f9').lineWidth(0.5).moveTo(40, currentY + 18).lineTo(555, currentY + 18).stroke();
        
        // Écrire les données
        doc.fillColor('#1e293b').fontSize(7).font('Helvetica-Bold').text(log.idlog.toString(), xId + 5, currentY + 5);
        doc.font('Helvetica').fillColor('#475569');
        doc.text(dateStr, xDate, currentY + 5);
        doc.text(userName.substring(0, 18), xUser, currentY + 5);
        doc.text(log.module || '', xModule, currentY + 5);
        
        let actionColor = '#475569';
        if (log.action === 'CREATE') actionColor = '#16a34a';
        else if (log.action === 'UPDATE') actionColor = '#ca8a04';
        else if (log.action === 'DELETE') actionColor = '#dc2626';
        
        doc.fillColor(actionColor).font('Helvetica-Bold').text(log.action || '', xAction, currentY + 5);
        doc.font('Helvetica').fillColor('#334155');
        doc.text(details.substring(0, 42), xDetails, currentY + 5, { width: 140 });
        
        currentY += 18;
      });
      
      // Dessiner un simple pied de page en bas de la dernière page
      doc.moveDown(2);
      doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(1);
      doc.fontSize(7).fillColor('#64748b').text('BRALIMA S.A. - Département Approvisionnement & Supply Chain. Document d\'audit confidentiel.', { align: 'center' });
      
      // Finaliser le PDF
      const fileName = `logs_audit_${Date.now()}.pdf`;
      const filePath = path.join(__dirname, '../temp', fileName);
      
      // Créer le répertoire temp s'il n'existe pas
      const tempDir = path.dirname(filePath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
        console.log('📁 Répertoire temp créé:', tempDir);
      }
      
      // Écrire le PDF de manière synchrone
      console.log('💾 Écriture du fichier PDF...');
      const stream = fs.createWriteStream(filePath);
      
      // Gérer les erreurs d'écriture
      stream.on('error', (err) => {
        console.error('❌ Erreur d\'écriture du fichier:', err);
      });
      
      stream.on('finish', () => {
        console.log('✅ PDF généré avec succès:', fileName);
        
        // Envoyer le fichier au client
        res.download(filePath, fileName, (err) => {
          if (err) {
            console.error('❌ Erreur lors du téléchargement:', err);
            return res.status(500).send('Erreur lors du téléchargement');
          }
          
          // Supprimer le fichier temporaire après envoi
          setTimeout(() => {
            try {
              fs.unlinkSync(filePath);
              console.log('🗑️ Fichier temporaire supprimé');
            } catch (unlinkErr) {
              console.error('❌ Erreur suppression fichier temp:', unlinkErr);
            }
          }, 1000);
        });
      });
      
      // Finaliser le document
      doc.pipe(stream);
      doc.end();
      
    } catch (error) {
      console.error('❌ Erreur lors de la génération du PDF:', error.message);
      console.error('Stack trace:', error.stack);
      res.status(500).send(`Erreur lors de la génération du PDF: ${error.message}`);
    }
  }
}

module.exports = AdminController;