const fs = require('fs');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuration SMTP Gmail optimisée
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false,
    minVersion: 'TLSv1'
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000
});

// Vérification de la connexion au démarrage (non bloquante)
transporter.verify((error, success) => {
  if (error) {
    console.warn('⚠️ SMTP non disponible (emails non envoyés):', error.message);
  } else {
    console.log('✅ Serveur SMTP prêt à envoyer des emails');
  }
});

function escapeHtml(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

class Mailer {
  /**
   * Email de bienvenue envoyé à la création du compte fournisseur.
   * Contient le login (email) et le mot de passe temporaire.
   */
  static async sendCredentialsFournisseur(email, { raisonsocial, motdepasseTemp }) {
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
    const loginUrl = `${baseUrl}/login`;
    const nom = escapeHtml(raisonsocial || 'Fournisseur');

    const mailOptions = {
      from: `"BRALIMA Supply Chain" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `BRALIMA Supply Chain — Vos identifiants de connexion au portail fournisseur`,
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
            .credentials-box { background: white; border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .credential-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
            .button { display: inline-block; background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 10px 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>BRALIMA Supply Chain</h1>
              <p>Bienvenue sur le portail fournisseur</p>
            </div>
            <div class="content">
              <h2>Bonjour ${nom},</h2>
              <p>Un compte a été créé pour vous sur le portail fournisseur BRALIMA Supply Chain. Vous trouverez ci-dessous vos identifiants de connexion.</p>

              <div class="credentials-box">
                <h3 style="margin-top:0; color:#1e40af;">🔐 Vos identifiants</h3>
                <p><strong>Adresse email :</strong> <code style="background:#f1f5f9; padding:3px 8px; border-radius:4px;">${escapeHtml(email)}</code></p>
                <p><strong>Mot de passe temporaire :</strong> <code style="background:#fef9c3; padding:3px 8px; border-radius:4px; font-size:16px; letter-spacing:2px;">${escapeHtml(motdepasseTemp)}</code></p>
              </div>

              <div class="warning">
                <strong>⚠️ Important :</strong> Ce mot de passe est temporaire. Vous serez invité à le modifier dès votre première connexion.
              </div>

              <p>Cliquez sur le bouton ci-dessous pour accéder à la page de connexion :</p>
              <div style="text-align: center;">
                <a href="${loginUrl}" class="button">Accéder au portail</a>
              </div>

              <p style="font-size:13px; color:#555;">Si vous n'êtes pas à l'origine de ce compte ou si vous avez des questions, contactez votre responsable BRALIMA.</p>
            </div>
            <div class="footer">
              <p>&copy; 2026 BRALIMA — Système de gestion Supply Chain</p>
              <p>Cet e-mail a été envoyé automatiquement, merci de ne pas répondre.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Email de bienvenue (credentials) envoyé à ${email}`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Erreur envoi credentials fournisseur:`, error);
      throw error;
    }
  }

  /**
   * Email envoyé à la création d'une commande : récap + bon de commande PDF en PJ.
   * Plus de magic link — le fournisseur se connecte via /login.
   */
  static async sendNouvelleCommandeFournisseur(fournisseurEmail, { idcommande, reference, bonCommandePdfPath = null }) {
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
    const loginUrl = `${baseUrl}/login`;

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
      subject: `Commande BRALIMA n°${idcommande} — bon de commande`,
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
              <p>Une nouvelle commande a été créée et vous est destinée. Vous trouverez le bon de commande officiel en pièce jointe.</p>

              <div class="info-box">
                <p><strong>Numéro de commande :</strong> #${idcommande}</p>
                <p><strong>Référence :</strong> ${refHtml}</p>
                <p><strong>Date :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
              </div>

              <p class="muted">
                <strong>Bon de commande :</strong> le fichier PDF officiel est joint à cet e-mail pour votre classement et votre suivi.
              </p>

              <p>Connectez-vous sur le portail fournisseur pour consulter et répondre à cette commande :</p>
              <div style="text-align: center;">
                <a href="${loginUrl}" class="button">Se connecter au portail</a>
              </div>

              <p>Si vous n'avez pas encore reçu vos identifiants de connexion, contactez votre responsable BRALIMA.</p>
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
      console.log(`✅ E-mail nouvelle commande envoyé à ${fournisseurEmail}`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Erreur envoi e-mail commande fournisseur:`, error);
      throw error;
    }
  }

  /**
   * Email de relance (manuelle ou automatique) sans magic link.
   * Le fournisseur se connecte via /login.
   */
  static async sendRelanceFournisseur(fournisseurEmail, commandeId, reference) {
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
    const loginUrl = `${baseUrl}/login`;

    const mailOptions = {
      from: `"BRALIMA Supply Chain" <${process.env.EMAIL_USER}>`,
      to: fournisseurEmail,
      subject: `Rappel BRALIMA — Commande n°${commandeId} en attente de votre réponse`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #d97706, #f59e0b); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
            .button { display: inline-block; background: linear-gradient(135deg, #d97706, #f59e0b); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 10px 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>BRALIMA Supply Chain</h1>
              <p>Rappel commande en attente</p>
            </div>
            <div class="content">
              <h2>Bonjour,</h2>
              <p>Nous vous rappelons qu'une commande est en attente de votre réponse :</p>

              <div class="info-box">
                <p><strong>Numéro de commande :</strong> #${commandeId}</p>
                ${reference ? `<p><strong>Référence :</strong> ${escapeHtml(reference)}</p>` : ''}
                <p><strong>Date du rappel :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
              </div>

              <p>Veuillez vous connecter au portail fournisseur pour traiter cette commande dès que possible :</p>
              <div style="text-align: center;">
                <a href="${loginUrl}" class="button">Accéder au portail</a>
              </div>

              <p>Si vous rencontrez des difficultés pour vous connecter, contactez votre responsable BRALIMA.</p>
            </div>
            <div class="footer">
              <p>&copy; 2026 BRALIMA — Système de gestion Supply Chain</p>
              <p>Cet e-mail a été envoyé automatiquement, merci de ne pas répondre.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Email de relance envoyé à ${fournisseurEmail} pour commande ${commandeId}`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Erreur envoi relance fournisseur:`, error);
      throw error;
    }
  }
}

module.exports = Mailer;