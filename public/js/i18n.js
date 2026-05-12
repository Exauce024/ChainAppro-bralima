// Système d'internationalisation simple
const translations = {
  fr: {
    // Navigation
    dashboard: "Tableau de bord",
    commandes: "Commandes", 
    stocks: "Stocks",
    alertes: "Alertes",
    utilisateurs: "Utilisateurs",
    fournisseurs: "Fournisseurs",
    logs: "Logs Audit",
    parametres: "Paramètres",
    
    // Actions
    creer: "Créer",
    modifier: "Modifier",
    supprimer: "Supprimer",
    annuler: "Annuler",
    enregistrer: "Enregistrer",
    valider: "Valider",
    rechercher: "Rechercher",
    filtrer: "Filtrer",
    exporter: "Exporter",
    imprimer: "Imprimer",
    
    // Messages
    bienvenue: "Bienvenue sur votre espace de travail",
    operation_reussie: "Opération réussie",
    erreur: "Erreur",
    confirmation: "Confirmation",
    
    // Paramètres
    informations_personnelles: "Informations personnelles",
    changer_mot_de_passe: "Changer le mot de passe",
    mot_de_passe_actuel: "Mot de passe actuel",
    nouveau_mot_de_passe: "Nouveau mot de passe",
    confirmer_mot_de_passe: "Confirmer le nouveau mot de passe",
    
    // Interface
    langue: "Langue",
    format_de_date: "Format de date",
    francais: "Français",
    anglais: "English",
    
    // Onglets
    profil: "Profil",
    systeme: "Système",
    securite: "Sécurité",
    sauvegardes: "Sauvegardes",
    interface: "Interface"
  },
  en: {
    // Navigation
    dashboard: "Dashboard",
    commandes: "Orders", 
    stocks: "Stocks",
    alertes: "Alerts",
    utilisateurs: "Users",
    fournisseurs: "Suppliers",
    logs: "Audit Logs",
    parametres: "Settings",
    
    // Actions
    creer: "Create",
    modifier: "Edit",
    supprimer: "Delete",
    annuler: "Cancel",
    enregistrer: "Save",
    valider: "Validate",
    rechercher: "Search",
    filtrer: "Filter",
    exporter: "Export",
    imprimer: "Print",
    
    // Messages
    bienvenue: "Welcome to your workspace",
    operation_reussie: "Operation successful",
    erreur: "Error",
    confirmation: "Confirmation",
    
    // Paramètres
    informations_personnelles: "Personal Information",
    changer_mot_de_passe: "Change Password",
    mot_de_passe_actuel: "Current Password",
    nouveau_mot_de_passe: "New Password",
    confirmer_mot_de_passe: "Confirm New Password",
    
    // Interface
    langue: "Language",
    format_de_date: "Date Format",
    francais: "French",
    anglais: "English",
    
    // Onglets
    profil: "Profile",
    systeme: "System",
    securite: "Security",
    sauvegardes: "Backups",
    interface: "Interface"
  }
};

// Fonction pour obtenir la traduction
function t(key, language = 'fr') {
  return translations[language][key] || translations.fr[key] || key;
}

// Fonction pour traduire toute la page
function translatePage(language) {
  // Traduire les éléments avec data-translate
  document.querySelectorAll('[data-translate]').forEach(element => {
    const key = element.getAttribute('data-translate');
    const translation = t(key, language);
    
    if (element.tagName === 'INPUT' && element.type === 'submit') {
      element.value = translation;
    } else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      element.placeholder = translation;
    } else {
      element.textContent = translation;
    }
  });
  
  // Traduire les titres et labels spécifiques
  translateSpecificElements(language);
}

// Fonction pour traduire les éléments spécifiques
function translateSpecificElements(language) {
  const translations = {
    fr: {
      "Paramètres": "Paramètres",
      "Profil": "Profil", 
      "Interface": "Interface",
      "Système": "Système",
      "Sécurité": "Sécurité",
      "Sauvegardes": "Sauvegardes",
      "Français": "Français",
      "English": "English"
    },
    en: {
      "Paramètres": "Settings",
      "Profil": "Profile",
      "Interface": "Interface", 
      "Système": "System",
      "Sécurité": "Security",
      "Sauvegardes": "Backups",
      "Français": "French",
      "English": "English"
    }
  };
  
  // Traduire les textes par correspondance exacte
  document.querySelectorAll('*').forEach(element => {
    if (element.children.length === 0 && element.textContent.trim()) {
      const text = element.textContent.trim();
      if (translations[language][text]) {
        element.textContent = translations[language][text];
      }
    }
  });
}

// Appliquer la langue au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
  // Récupérer la langue depuis la session ou le localStorage
  const currentLanguage = localStorage.getItem('language') || 'fr';
  translatePage(currentLanguage);
});

// Rendre la fonction globale
window.t = t;
window.translatePage = translatePage;
