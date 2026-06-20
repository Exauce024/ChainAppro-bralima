const db = require('../config/db');

class ProfileController {
  static async showProfile(req, res) {
    try {
      console.log('Session user:', req.session.user);
      const userRole = req.session.user?.role_libelle;
      
      let profileData = {};
      
      if (userRole === 'admin' || userRole === 'gestionnaire' || userRole === 'magasinier') {
        const userId = req.session.user.idusers;
        console.log('UserID:', userId, 'UserRole:', userRole);
        // Récupérer les informations de l'utilisateur interne
        const [userRows] = await db.execute(`
          SELECT u.* 
          FROM users u
          WHERE u.idusers = ?
        `, [userId]);
        
        console.log('User rows:', userRows);
        
        if (userRows.length > 0) {
          const user = userRows[0];
          profileData = {
            type: 'interne',
            nom: user.nom || 'Non défini',
            prenom: user.prenom || 'Non défini',
            email: user.email || 'Non défini',
            telephone: user.telephone || 'Non défini',
            role: userRole,
            date_creation: user.datecreation || new Date(),
            dernier_login: user.dernier_login || 'Non défini',
            statut: user.statut || 'actif'
          };
        } else {
          console.log('Aucun utilisateur trouvé pour ID:', userId);
        }
      } else if (userRole === 'fournisseur') {
        // Récupérer les informations du fournisseur
        const idfournisseur = req.session.fournisseurId || req.session.user?.idfournisseur;
        console.log('SupplierID resolved:', idfournisseur);
        
        if (idfournisseur) {
          const [fournisseurRows] = await db.execute(`
            SELECT * FROM fournisseur WHERE idfournisseur = ?
          `, [idfournisseur]);
          
          console.log('Fournisseur rows:', fournisseurRows);
          
          if (fournisseurRows.length > 0) {
            const fournisseur = fournisseurRows[0];
            profileData = {
              type: 'fournisseur',
              raison_sociale: fournisseur.raisonsocial || 'Non défini',
              email: fournisseur.email || 'Non défini',
              telephone: fournisseur.telephone || 'Non défini',
              adresse: fournisseur.adresse || 'Non défini',
              ville: fournisseur.ville || 'Non défini',
              pays: fournisseur.pays || 'Non défini',
              nif: fournisseur.nif || 'Non défini',
              statut: fournisseur.statut || 'actif',
              date_creation: fournisseur.datecreation || new Date()
            };
          } else {
            console.log('Aucun fournisseur trouvé pour ID:', idfournisseur);
          }
        }
      }
      
      console.log('Profile data final:', profileData);
      
      res.render('layout_modern', { 
        profileData, 
        user: req.session.user, 
        title: 'Mon Profil',
        success: req.query.success || null,
        error: req.query.error || null
      });
      
    } catch (error) {
      console.error('Erreur détaillée lors du chargement du profil:', error);
      res.status(500).render('layout_modern', { 
        profileData: {}, 
        user: req.session.user, 
        title: 'Mon Profil',
        error: 'Erreur lors du chargement du profil: ' + error.message
      });
    }
  }
  
  static async updateProfile(req, res) {
    try {
      const userRole = req.session.user?.role_libelle;
      const { email, telephone } = req.body;
      
      if (userRole === 'admin' || userRole === 'gestionnaire' || userRole === 'magasinier') {
        const userId = req.session.user.idusers;
        // Mettre à jour les informations de l'utilisateur interne
        await db.execute(`
          UPDATE users 
          SET email = ?, telephone = ?, datemaj = NOW()
          WHERE idusers = ?
        `, [email, telephone, userId]);

        // Log de l'action
        await db.execute(`
          INSERT INTO logaudit (iduser, action, module, detaillson) 
          VALUES (?, 'UPDATE', 'PROFILE', ?)
        `, [userId, `Profil mis à jour pour l'utilisateur ${userId}`]);
      } else if (userRole === 'fournisseur') {
        // Mettre à jour les informations du fournisseur
        const idfournisseur = req.session.fournisseurId || req.session.user?.idfournisseur;
        const { adresse, ville, pays } = req.body;
        
        if (idfournisseur) {
          await db.execute(`
            UPDATE fournisseur 
            SET email = ?, telephone = ?, adresse = ?, ville = ?, pays = ?, datemaj = NOW()
            WHERE idfournisseur = ?
          `, [email, telephone, adresse, ville, pays, idfournisseur]);

          // Log de l'action
          await db.execute(`
            INSERT INTO logaudit (iduser, action, module, detaillson) 
            VALUES (NULL, 'UPDATE', 'PROFILE', ?)
          `, [`Profil mis à jour pour le fournisseur ${idfournisseur}`]);
        }
      }
      
      res.redirect('/profile?success=Profil mis à jour avec succès');
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      res.redirect('/profile?error=Erreur lors de la mise à jour du profil');
    }
  }
}

module.exports = ProfileController;
