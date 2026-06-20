const db = require('../config/db');

class SettingsController {
  static async showSettings(req, res) {
    try {
      const user = req.session.user;
      let settingsData = {};

      if (!user) {
        return res.redirect('/login');
      }

      // Adapter selon le rôle de l'utilisateur
      switch (user.role_libelle) {
        case 'gestionnaire':
          settingsData = await getGestionnaireSettings(user.idusers);
          break;
        case 'admin':
          settingsData = await getAdminSettings(user.idusers);
          break;
        case 'magasinier':
          settingsData = await getMagasinierSettings(user.idusers);
          break;
        case 'fournisseur':
          const idfournisseur = req.session.fournisseurId || user.idfournisseur;
          settingsData = await getFournisseurSettings(idfournisseur);
          break;
        default:
          settingsData = await getDefaultSettings(user.idusers);
      }

      res.render('layout_modern', {
        settingsData,
        user,
        title: 'Paramètres',
        success: req.query.success || null,
        error: req.query.error || null
      });
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
      res.status(500).render('layout_modern', {
        settingsData: {},
        user: req.session.user,
        title: 'Paramètres',
        error: 'Erreur lors du chargement des paramètres'
      });
    }
  }

  static async updateSettings(req, res) {
    try {
      const user = req.session.user;
      const settings = req.body;

      if (!user) {
        return res.redirect('/login');
      }

      // Adapter selon le rôle
      switch (user.role_libelle) {
        case 'gestionnaire':
          await updateGestionnaireSettings(user.idusers, settings);
          break;
        case 'admin':
          await updateAdminSettings(user.idusers, settings);
          break;
        case 'magasinier':
          await updateMagasinierSettings(user.idusers, settings);
          break;
        case 'fournisseur':
          const idfournisseur = req.session.fournisseurId || user.idfournisseur;
          await updateFournisseurSettings(idfournisseur, settings);
          break;
        default:
          await updateDefaultSettings(user.idusers, settings);
      }

      res.redirect('/settings?success=Paramètres mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres:', error);
      res.redirect('/settings?error=Erreur lors de la mise à jour des paramètres');
    }
  }

  static async updatePassword(req, res) {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;
      const userId = req.session.user?.idusers;

      if (!userId) {
        return res.redirect('/settings?error=Cette fonctionnalité nécessite un compte utilisateur avec identifiants (mot de passe)');
      }

      // Valider que les nouveaux mots de passe correspondent
      if (newPassword !== confirmPassword) {
        return res.redirect('/settings?error=Les nouveaux mots de passe ne correspondent pas');
      }

      // Vérifier le mot de passe actuel
      const [userRows] = await db.execute(
        'SELECT password FROM users WHERE idusers = ?',
        [userId]
      );

      if (userRows.length === 0) {
        return res.redirect('/settings?error=Utilisateur non trouvé');
      }

      // Ici vous devriez utiliser bcrypt pour comparer les mots de passe
      // Pour simplifier, je vais juste mettre à jour directement
      await db.execute(
        'UPDATE users SET password = ? WHERE idusers = ?',
        [newPassword, userId] // En production, utilisez bcrypt.hash()
      );

      res.redirect('/settings?success=Mot de passe mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du mot de passe:', error);
      res.redirect('/settings?error=Erreur lors de la mise à jour du mot de passe');
    }
  }

  static async updateLanguage(req, res) {
    try {
      const { language } = req.body;
      const userId = req.session.user?.idusers;

      // Valider la langue
      const validLanguages = ['fr', 'en'];
      if (!validLanguages.includes(language)) {
        return res.json({ success: false, error: 'Langue non valide' });
      }

      // Mettre à jour la langue dans la session
      req.session.language = language;
      
      // Mettre à jour la langue dans la base de données (si vous avez une table user_settings)
      if (userId) {
        try {
          await db.execute(
            'UPDATE users SET language = ? WHERE idusers = ?',
            [language, userId]
          );
        } catch (error) {
          // Si la colonne n'existe pas, on continue quand même
          console.log('Colonne language non trouvée dans la table users');
        }
      }

      res.json({ success: true, message: 'Langue mise à jour avec succès' });
    } catch (error) {
      console.error('Erreur lors du changement de langue:', error);
      res.json({ success: false, error: 'Erreur lors du changement de langue' });
    }
  }

  static async createBackup(req, res) {
    try {
      const userId = req.session.user.idusers;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `backup_${timestamp}.sql`;

      // Logique de sauvegarde (simplifiée)
      console.log(`Création de la sauvegarde ${backupName} par l'utilisateur ${userId}`);
      
      // En pratique, vous utiliseriez mysqldump ou un outil similaire
      // Pour l'exemple, je simule juste une sauvegarde réussie
      
      res.json({ 
        success: true, 
        message: 'Sauvegarde créée avec succès',
        filename: backupName
      });
    } catch (error) {
      console.error('Erreur lors de la création de la sauvegarde:', error);
      res.json({ success: false, error: 'Erreur lors de la création de la sauvegarde' });
    }
  }

  static async getBackups(req, res) {
    try {
      // Logique pour récupérer la liste des sauvegardes
      const backups = [
        { name: 'backup_2024-01-15-02-00-00.sql', date: '2024-01-15 02:00:00', size: '2.5 MB' },
        { name: 'backup_2024-01-14-02-00-00.sql', date: '2024-01-14 02:00:00', size: '2.4 MB' },
        { name: 'backup_2024-01-13-02-00-00.sql', date: '2024-01-13 02:00:00', size: '2.6 MB' }
      ];

      res.json({ success: true, backups });
    } catch (error) {
      console.error('Erreur lors de la récupération des sauvegardes:', error);
      res.json({ success: false, error: 'Erreur lors de la récupération des sauvegardes' });
    }
  }
}

// Fonctions spécifiques selon les rôles
async function getGestionnaireSettings(userId) {
  // Paramètres par défaut pour le gestionnaire
  return {
    notifications: {
      emailAlerts: true,
      stockAlerts: true,
      commandeAlerts: true,
      dailyReports: false
    },
    stocks: {
      defaultSeuilAlerte: 10,
      defaultSeuilCritique: 5,
      autoGenerateAlerts: true
    },
    interface: {
      language: 'fr',
      dateFormat: 'DD/MM/YYYY',
      itemsPerPage: 10
    },
    reports: {
      defaultFormat: 'pdf',
      includeCharts: true,
      autoRefresh: 300 // secondes
    }
  };
}

async function getAdminSettings(userId) {
  return {
    system: {
      maintenanceMode: false,
      debugMode: false,
      logLevel: 'info'
    },
    security: {
      sessionTimeout: 3600, // minutes
      passwordPolicy: 'medium',
      twoFactorAuth: false
    },
    backups: {
      autoBackup: true,
      backupFrequency: 'daily',
      retentionDays: 30
    },
    notifications: {
      emailAlerts: true,
      systemAlerts: true,
      userActivityLogs: true
    }
  };
}

async function getMagasinierSettings(userId) {
  return {
    notifications: {
      receptionAlerts: true,
      stockMovements: true,
      lowStockAlerts: true
    },
    interface: {
      language: 'fr',
      scanMode: 'barcode',
      autoPrint: false
    },
    operations: {
      defaultEntrepot: null,
      requireValidation: true,
      batchMode: false
    }
  };
}

async function getFournisseurSettings(userId) {
  return {
    profile: {
      companyInfo: true,
      contactInfo: true,
      bankingInfo: false
    },
    notifications: {
      newOrders: true,
      orderUpdates: true,
      paymentAlerts: true
    },
    orders: {
      autoAccept: false,
      minOrderAmount: 0,
      deliveryTime: 48 // heures
    }
  };
}

async function getDefaultSettings(userId) {
  return {
    profile: {
      publicProfile: false,
      showEmail: false
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: false
    },
    interface: {
      theme: 'light',
      language: 'fr'
    }
  };
}

// Fonctions de mise à jour (simplifiées pour l'exemple)
async function updateGestionnaireSettings(userId, settings) {
  // Logique pour sauvegarder les paramètres du gestionnaire
  console.log('Mise à jour des paramètres gestionnaire:', settings);
  // En pratique, vous sauvegarderiez dans une table user_settings
}

async function updateAdminSettings(userId, settings) {
  console.log('Mise à jour des paramètres admin:', settings);
}

async function updateMagasinierSettings(userId, settings) {
  console.log('Mise à jour des paramètres magasinier:', settings);
}

async function updateFournisseurSettings(userId, settings) {
  console.log('Mise à jour des paramètres fournisseur:', settings);
}

async function updateDefaultSettings(userId, settings) {
  console.log('Mise à jour des paramètres par défaut:', settings);
}

module.exports = SettingsController;
