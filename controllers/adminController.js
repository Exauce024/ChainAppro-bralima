const AdminModel = require('../models/adminModel');
const db = require('../config/db');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class AdminController {
  static async dashboard(req, res) {
    const users = await AdminModel.getAllUsers();
    const fournisseurs = await AdminModel.getAllFournisseurs();
    const logs = await AdminModel.getAuditLogs(50);

    res.render('layout_modern', {
      users,
      fournisseurs,
      logs,
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
      const idfournisseur = await AdminModel.createFournisseur(req.body);
      
      if (idfournisseur && idmp && prix_kg) {
        await db.execute(
          `INSERT INTO fournisseur_matiere (idfournisseur, idmp, prix_kg) VALUES (?, ?, ?)`,
          [idfournisseur, idmp, parseFloat(prix_kg) || 0]
        );
      }
      
      res.redirect('/admin/dashboard?success=Fournisseur ajouté');
    } catch (err) {
      console.error(err);
      res.status(500).send('Erreur lors de l’ajout du fournisseur');
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
        margins: { top: 70, bottom: 60, left: 40, right: 40 },
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
      
      // En-tête avec logo BRALIMA et cadre
      doc.fillColor('#f8f9fa').rect(40, 50, 520, 100);
      doc.strokeColor('#1e40af').lineWidth(2);
      doc.rect(40, 50, 520, 100);
      doc.stroke();
      
      // Logo BRALIMA
      doc.fontSize(28).fillColor('#1e40af').font('Helvetica-Bold').text('BRALIMA', 300, 85);
      doc.fontSize(14).fillColor('#374151').text('Supply Chain Management', 300, 115);
      
      // Ligne de séparation
      doc.strokeColor('#e5e7eb').lineWidth(1);
      doc.moveTo(60, 130).lineTo(540, 130).stroke();
      
      // Titre du rapport
      doc.fontSize(20).fillColor('#111827').font('Helvetica-Bold').text('RAPPORT D\'AUDIT SYSTÈME', { align: 'center' });
      doc.fontSize(12).fillColor('#6b7280').text(`Généré le: ${new Date().toLocaleString('fr-FR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`, { align: 'center' });
      doc.moveDown(30);
      
      // Tableau des logs avec design professionnel
      const tableTop = doc.y;
      const headers = ['ID', 'Utilisateur', 'Module', 'Action', 'Date/Heure', 'Adresse IP', 'Détails'];
      const colWidths = [40, 100, 70, 70, 100, 90, 80];
      
      // En-têtes de tableau avec design
      doc.fillColor('#1e40af').rect(40, tableTop, 560, 25);
      doc.fill();
      doc.strokeColor('#374151').lineWidth(1.5);
      doc.rect(40, tableTop, 560, 25);
      doc.stroke();
      
      // Texte des en-têtes
      doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold');
      headers.forEach((header, index) => {
        const xPos = 50 + (index > 0 ? colWidths.slice(0, index).reduce((a, b) => a + b, 0) + 10 : 10);
        doc.text(header, xPos, tableTop + 8);
      });
      
      // Ligne de séparation sous les en-têtes
      doc.strokeColor('#d1d5db').lineWidth(0.8);
      doc.moveTo(40, tableTop + 25).lineTo(600, tableTop + 25).stroke();
      
      let currentY = tableTop + 35;
      
      // Données des logs avec mise en forme professionnelle
      logs.forEach((log, index) => {
        const userName = `${log.prenom || ''} ${log.nom || ''}`.trim();
        const details = log.detaillson ? log.detaillson.substring(0, 50) : '';
        const dateStr = log.horodatage ? new Date(log.horodatage).toLocaleString('fr-FR', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }) : '';
        const ipAddr = log.adresse || 'Non spécifiée';
        
        // Couleur de fond alternée pour meilleure lisibilité
        const bgColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff';
        doc.fillColor(bgColor);
        
        // Rectangle pour la ligne avec coins arrondis
        doc.roundedRect(50, currentY, 550, 20, 3);
        doc.fill();
        
        // Bordure fine et élégante
        doc.strokeColor('#e2e8f0').lineWidth(0.8);
        doc.roundedRect(50, currentY, 550, 20, 3);
        doc.stroke();
        
        // Texte des données avec polices variées
        doc.fillColor('#1f2937').fontSize(10).font('Helvetica-Bold').text(log.idlog.toString(), 65, currentY + 6);
        doc.fillColor('#374151').fontSize(9).font('Helvetica').text(userName.substring(0, 20), 140, currentY + 6);
        doc.fillColor('#6b7280').fontSize(9).text(log.module || '', 280, currentY + 6);
        doc.fillColor('#059669').fontSize(9).font('Helvetica').text(log.action || '', 370, currentY + 6);
        doc.fillColor('#1f2937').fontSize(8).text(dateStr, 450, currentY + 6);
        doc.fillColor('#64748b').fontSize(8).text(ipAddr, 470, currentY + 6);
        doc.fillColor('#4b5563').fontSize(8).text(details, 65, currentY + 14);
        
        currentY += 22;
        
        // Nouvelle page si nécessaire avec marge de sécurité
        if (currentY > 680) {
          doc.addPage();
          currentY = 100;
          
          // En-tête réduit sur nouvelle page
          doc.fontSize(14).fillColor('#1e40af').text('BRALIMA - SUITE', { align: 'center' });
          doc.fontSize(10).fillColor('#6b7280').text('RAPPORT D\'AUDIT SYSTÈME (Page ' + Math.floor(index / 20) + ')', { align: 'center' });
          doc.moveDown(25);
          
          currentY = doc.y;
        }
      });
      
      // Section statistiques avant le tableau
      doc.moveDown(30);
      doc.fillColor('#f8f9fa').rect(50, doc.y, 550, 80);
      doc.fill();
      doc.strokeColor('#d1d5db').rect(50, doc.y, 550, 80);
      doc.stroke();
      
      doc.fillColor('#111827').fontSize(14).font('Helvetica-Bold').text('STATISTIQUES', 300, doc.y + 15);
      doc.fillColor('#374151').fontSize(10).font('Helvetica');
      
      let statsY = doc.y + 35;
      doc.text(`Total des logs: ${stats.total}`, 70, statsY);
      doc.text(`Logs aujourd'hui: ${stats.today}`, 70, statsY + 15);
      doc.text(`Logs cette semaine: ${stats.thisWeek}`, 70, statsY + 30);
      doc.text(`Utilisateurs uniques: ${stats.uniqueUsers.size}`, 70, statsY + 45);
      
      // Top modules
      doc.text('Top modules:', 350, statsY);
      const sortedModules = Object.entries(stats.byModule).sort((a, b) => b[1] - a[1]);
      sortedModules.slice(0, 3).forEach(([module, count], index) => {
        doc.text(`  ${module}: ${count}`, 350, statsY + 65 + (index * 12));
      });
      
      // Top actions
      doc.text('Top actions:', 350, statsY + 100);
      const sortedActions = Object.entries(stats.byAction).sort((a, b) => b[1] - a[1]);
      sortedActions.slice(0, 3).forEach(([action, count], index) => {
        doc.text(`  ${action}: ${count}`, 350, statsY + 130 + (index * 12));
      });
      
      doc.moveDown(30);
      
      // Pied de page avec design BRALIMA
      doc.moveTo(50, doc.y).lineTo(600, doc.y).stroke();
      doc.moveDown(20);
      
      // Rectangle pour le pied de page
      doc.fillColor('#1e40af').rect(50, doc.y, 550, 50);
      doc.fill();
      
      // Texte du pied de page
      doc.fillColor('#ffffff').fontSize(10).text(`Total des logs: ${stats.total}`, 200, doc.y + 10);
      doc.fontSize(8).fillColor('#e5e7eb').text(`Généré le ${new Date().toLocaleString('fr-FR')}`, 200, doc.y + 25);
      doc.fontSize(10).fillColor('#ffffff').text('BRALIMA Supply Chain Management', { align: 'center' });
      
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