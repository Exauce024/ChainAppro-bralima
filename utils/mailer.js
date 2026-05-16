const fs = require('fs');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuration SMTP Gmail optimisée
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false, // true pour 465 (SSL), false pour 587 (TLS/STARTTLS)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false, // Optionnel pour certains environnements
    minVersion: 'TLSv1'
  },
  connectionTimeout: 10000, // 10 secondes
  greetingTimeout: 10000,
  socketTimeout: 10000
});

// Vérification de la connexion au démarrage (non bloquante)
transporter.verify((error, success) => {
  if (error) {
    console.warn('⚠️ SMTP non disponible (emails non envoyés):', error.message);
    console.log('ℹ️ Magic Link sera affiché dans la console');
  } else {
    console.log('✅ Serveur SMTP prêt à envoyer des emails');
  }
});

function escapeHtml(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

class Mailer {
  /**
   * Un seul e-mail lors de la création de commande : accès portail (magic link) + récap
   * + bon de commande PDF en pièce jointe.
   */
  static async sendNouvelleCommandeFournisseur(fournisseurEmail, { token, idcommande, reference, bonCommandePdfPath = null }) {
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
    const magicLink = `${baseUrl}/fournisseur/magic-access?token=${token}`;

    const attachments = [];
    if (bonCommandePdfPath && fs.existsSync(bonCommandePdfPath)) {
      const safeRef = String(reference || idcommande || 'commande').replace(/[^\w.-]+/g, '_');
      attachments.push({
        filename: `Bon-de-commande-${safeRef}.pdf`,
        path: bonCommandePdfPath,
      });
    }

    const refHtml = escapeHtml(reference);
    const mailOptions = {
      from: `"BRALIMA Supply Chain" <${process.env.EMAIL_USER}>`,
      to: fournisseurEmail,
      subject: `Commande BRALIMA n°${idcommande} — bon de commande et accès portail`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .button { display: inline-block; background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 10px 10px; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
            .muted { font-size: 13px; color: #555; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>BRALIMA Supply Chain</h1>
              <p>Nouvelle commande</p>
            </div>
            <div class="content">
              <h2>Bonjour,</h2>
              <p>Une nouvelle commande a été créée. Vous trouverez ci-dessous le récapitulatif, puis le lien sécurisé pour accéder au portail fournisseur et répondre.</p>

              <div class="info-box">
                <p><strong>Numéro de commande :</strong> #${idcommande}</p>
                <p><strong>Référence :</strong> ${refHtml}</p>
                <p><strong>Date :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
              </div>

              <p class="muted">
                <strong>Bon de commande :</strong> le fichier PDF officiel est joint pour votre classement et votre suivi.
                Vous pourrez aussi le retrouver sur le portail après avoir utilisé le lien ci-dessous.
              </p>

              <p><strong>Ouvrir le portail fournisseur :</strong></p>
              <div style="text-align: center;">
                <a href="${magicLink}" class="button">Consulter la commande</a>
              </div>

              <div class="warning">
                <strong>Important :</strong> ce lien est valable <strong>24 heures</strong> et ne peut être utilisé <strong>qu'une seule fois</strong>.
              </div>

              <p>Si vous n’attendiez pas cet e-mail, vous pouvez l’ignorer.</p>
            </div>
            <div class="footer">
              <p>&copy; 2026 BRALIMA — Système de gestion Supply Chain</p>
              <p>Cet e-mail a été envoyé automatiquement, merci de ne pas répondre.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    if (attachments.length > 0) {
      mailOptions.attachments = attachments;
    }

    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ E-mail nouveau commande (fusionné) envoyé à ${fournisseurEmail}`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Erreur envoi e-mail fournisseur:`, error);
      throw error;
    }
  }

  /**
   * Lien court seul (relances automatiques ou manuelle sans nouveau PDF).
   */
  static async sendMagicLink(fournisseurEmail, token, commandeId) {
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
    const magicLink = `${baseUrl}/fournisseur/magic-access?token=${token}`;
    
    const mailOptions = {
      from: `"BRALIMA Supply Chain" <${process.env.EMAIL_USER}>`,
      to: fournisseurEmail,
      subject: `Commande BRALIMA n°${commandeId} - Action requise`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .button { display: inline-block; background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .button:hover { background: linear-gradient(135deg, #1e3a8a, #2563eb); }
            .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 10px 10px; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>BRALIMA Supply Chain</h1>
              <p>Nouvelle commande reçue</p>
            </div>
            <div class="content">
              <h2>Bonjour,</h2>
              <p>Une nouvelle commande a été créée et nécessite votre attention.</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Numéro de commande :</strong> #${commandeId}</p>
                <p><strong>Date :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
              </div>
              
              <p>Veuillez consulter les détails et répondre à cette commande en cliquant sur le bouton ci-dessous :</p>
              
              <div style="text-align: center;">
                <a href="${magicLink}" class="button">Consulter la commande</a>
              </div>
              
              <div class="warning">
                <strong>⚠️ Important :</strong> Ce lien est valable 24 heures et ne peut être utilisé qu'une seule fois.
              </div>

              <p>Si vous n’attendiez pas cet e-mail, vous pouvez l’ignorer.</p>
            </div>
            <div class="footer">
              <p>&copy; 2026 BRALIMA - Système de gestion Supply Chain</p>
              <p>Cet email a été envoyé automatiquement, ne répondez pas.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Magic Link envoyé à ${fournisseurEmail}`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Erreur lors de l'envoi à ${fournisseurEmail}:`, error);
      throw error;
    }
  }
}

module.exports = Mailer;