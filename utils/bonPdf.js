const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const CommandeModel = require('../models/commandeModel');
const { normalizeStatut } = require('./commandeStatuts');

/**
 * Formatte un montant en francs congolais pour les PDF.
 * N'utilise pas Intl.NumberFormat (comportement inconsistant selon l'OS/locale du serveur).
 * Ex: 1000000 => "1.000.000 FC"
 */
function pdfFormatMoney(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return '— FC';
  // Arrondi sans décimales, séparateur de milliers = point
  const parts = Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${parts} FC`;
}

const STORAGE_ROOT = path.join(__dirname, '..', 'storage', 'bons');

function ensureStorage() {
  fs.mkdirSync(STORAGE_ROOT, { recursive: true });
}

function getBonCommandePath(idcommande) {
  return path.join(STORAGE_ROOT, `BC-${Number(idcommande)}.pdf`);
}

function getBonLivraisonPath(idcommande) {
  return path.join(STORAGE_ROOT, `BL-${Number(idcommande)}.pdf`);
}

function getBonTransportPath(idcommande) {
  return path.join(STORAGE_ROOT, `BT-${Number(idcommande)}.pdf`);
}

function formatFrenchDate(val) {
  if (!val) return '—';
  const dt = new Date(val);
  if (Number.isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function pipeDocToFile(doc, filePath) {
  return new Promise((resolve, reject) => {
    const ws = fs.createWriteStream(filePath);
    ws.on('finish', () => resolve(filePath));
    ws.on('error', reject);
    doc.on('error', reject);
    doc.pipe(ws);
    doc.end();
  });
}

function drawHeaderBlock(doc, title, themeColor = '#1e3a8a') {
  const logoPath = path.join(__dirname, '..', 'public', 'images', 'bralima-logo.png');
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 50, 30, { width: 70 });
  }
  
  // Sub-header details under the logo
  doc.fontSize(7).font('Helvetica').fillColor('#64748b');
  doc.text('LUBUMBASHI - 29, Rte Munama, C/kampemba,', 50, 82);
  doc.text('+243 998 946 935', 50, 91);
  
  // Title and company info on the right
  doc.fontSize(16).font('Helvetica-Bold').fillColor(themeColor).text(title, 50, 32, { align: 'right' });
  doc.fontSize(9).font('Helvetica').fillColor('#475569').text('BRALIMA S.A. — Supply Chain Département', 50, 52, { align: 'right' });
  doc.fontSize(8).font('Helvetica-Oblique').fillColor('#64748b').text('Système automatisé de suivi des approvisionnements', 50, 64, { align: 'right' });
  
  // Separator line
  doc.moveTo(50, 108).lineTo(545, 108).lineWidth(1.5).stroke('#e2e8f0');
  
  // Reset cursor position
  doc.y = 125;
  doc.x = 50;
  doc.fillColor('#000000').font('Helvetica');
}

function drawLigneTable(doc, lignes, { qtyKey, title, themeColor = '#1e3a8a' }) {
  const tableTop = doc.y;
  const x1 = 50;
  const x2 = 270;
  const x3 = 350;
  const x4 = 460;
  
  doc.fontSize(10).font('Helvetica-Bold').fillColor(themeColor).text(title, x1, tableTop);
  doc.moveDown(0.6);

  let y = doc.y + 6;
  
  // Shaded header background
  doc.rect(x1, y - 4, 495, 20).fill('#f8fafc');
  doc.fillColor('#1e293b'); // Dark slate text color for headers
  
  doc.fontSize(9).font('Helvetica-Bold');
  doc.text('Article', x1 + 5, y);
  doc.text(qtyKey === 'qtelivrée' ? 'Qté livrée' : 'Qté commandée', x2, y);
  doc.text('Prix unit.', x3, y);
  doc.text('Total ligne', x4, y);
  y += 20;

  // Thin line below header
  doc.moveTo(x1, y - 4).lineTo(545, y - 4).lineWidth(1).stroke('#e2e8f0');
  doc.font('Helvetica').fillColor('#334155'); // Dark gray text color for rows

  for (const ligne of lignes) {
    const q = Number(qtyKey === 'qtelivrée' ? ligne.qtelivrée ?? ligne.qtecommande : ligne.qtecommande) || 0;
    const pu = Number(ligne.prixunitaire) || 0;
    const lineTotal = q * pu;

    const label = ligne.libelle || ligne.description || `MP #${ligne.idmp}`;
    doc.text(label.substring(0, 48), x1 + 5, y, { width: x2 - x1 - 15 });
    doc.text(String(q) + ' Kg', x2, y);
    doc.text(pdfFormatMoney(pu), x3, y);
    doc.text(pdfFormatMoney(lineTotal), x4, y);
    y += 20;
    
    // Line under each row
    doc.moveTo(x1, y - 4).lineTo(545, y - 4).lineWidth(0.5).stroke('#f1f5f9');
    
    if (y > doc.page.height - 120) {
      doc.addPage();
      y = 50;
    }
  }

  doc.y = y + 8;
  doc.fillColor('#000000').font('Helvetica');
}

/**
 * Bon de commande — généré à la création de la commande (ou régénéré si fichier absent).
 */
async function generateBonCommandePdf(idcommande) {
  ensureStorage();
  const commande = await CommandeModel.findById(idcommande);
  if (!commande) throw new Error('Commande introuvable');
  const lignes = await CommandeModel.getLignes(idcommande);
  const montantTotal = CommandeModel.computeMontantTotal(lignes);

  const outPath = getBonCommandePath(idcommande);

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    info: {
      Title: `Bon de commande ${idcommande}`,
      Author: 'BRALIMA Supply Chain',
    },
  });

  drawHeaderBlock(doc, 'BON DE COMMANDE', '#1e3a8a');

  const startY = doc.y;
  // Left Column - Order details
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#1e3a8a').text('INFORMATIONS COMMANDE', 50, startY);
  doc.font('Helvetica').fillColor('#334155');
  doc.moveDown(0.4);
  doc.text(`Référence : ${commande.reference || '—'}`);
  doc.text(`Date émission : ${formatFrenchDate(commande.datecreation)}`);
  if (commande.deleidellivraison) {
    doc.text(`Livraison souhaitée : ${formatFrenchDate(commande.deleidellivraison)}`);
  }
  
  // Right Column - Supplier details
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#1e3a8a').text('FOURNISSEUR', 300, startY);
  doc.font('Helvetica').fillColor('#334155');
  doc.moveDown(0.4);
  doc.text(`Nom : ${commande.raisonsocial || '—'}`);
  if (commande.contact_nom) doc.text(`Contact : ${commande.contact_nom}`);
  if (commande.fournisseur_telephone) doc.text(`Téléphone : ${commande.fournisseur_telephone}`);
  if (commande.fournisseur_email) doc.text(`Email : ${commande.fournisseur_email}`);
  
  doc.y = Math.max(doc.y, startY + 80);
  doc.x = 50;
  doc.moveDown(1.5);

  drawLigneTable(doc, lignes, { qtyKey: 'qtecommande', title: 'Détail des lignes', themeColor: '#1e3a8a' });

  doc.font('Helvetica-Bold').fontSize(11).fillColor('#1e3a8a').text(`Total : ${pdfFormatMoney(montantTotal)}`, { align: 'right' });
  doc.moveDown(2);
  doc.fontSize(8).font('Helvetica').fillColor('#64748b');
  doc.text('Document émis automatiquement à la création de la commande par le système BRALIMA Supply Chain.', { align: 'left' });
  doc.fillColor('#000000');

  await pipeDocToFile(doc, outPath);
  return outPath;
}

/**
 * Bon de livraison — après confirmation livraison fournisseur (statut livrée).
 */
async function generateBonLivraisonPdf(idcommande) {
  ensureStorage();
  const commande = await CommandeModel.findById(idcommande);
  if (!commande) throw new Error('Commande introuvable');

  const statut = normalizeStatut(commande.statut);
  if (statut !== 'livree') {
    throw new Error('Bon de livraison disponible uniquement pour une commande livrée');
  }

  const lignes = await CommandeModel.getLignes(idcommande);
  const montantTotal = lignes.reduce((sum, ligne) => {
    const q = Number(ligne.qtelivrée ?? ligne.qtecommande) || 0;
    return sum + q * Number(ligne.prixunitaire || 0);
  }, 0);

  const outPath = getBonLivraisonPath(idcommande);

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    info: {
      Title: `Bon de livraison ${idcommande}`,
      Author: 'BRALIMA Supply Chain',
    },
  });

  drawHeaderBlock(doc, 'BON DE LIVRAISON', '#10b981');

  const startY = doc.y;
  // Left Column - Delivery details
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#10b981').text('INFORMATIONS LIVRAISON', 50, startY);
  doc.font('Helvetica').fillColor('#334155');
  doc.moveDown(0.4);
  doc.text(`N° Commande : ${commande.idcommande}`);
  doc.text(`Référence : ${commande.reference || '—'}`);
  doc.text(`Date Réception : ${formatFrenchDate(new Date())}`);
  doc.text(`Date Commande : ${formatFrenchDate(commande.datecreation)}`);
  
  // Right Column - Supplier details
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#10b981').text('FOURNISSEUR', 300, startY);
  doc.font('Helvetica').fillColor('#334155');
  doc.moveDown(0.4);
  doc.text(`Nom : ${commande.raisonsocial || '—'}`);
  if (commande.contact_nom) doc.text(`Contact : ${commande.contact_nom}`);
  if (commande.fournisseur_telephone) doc.text(`Téléphone : ${commande.fournisseur_telephone}`);
  if (commande.fournisseur_email) doc.text(`Email : ${commande.fournisseur_email}`);
  
  doc.y = Math.max(doc.y, startY + 80);
  doc.x = 50;
  doc.moveDown(1.5);

  drawLigneTable(doc, lignes, { qtyKey: 'qtelivrée', title: 'Marchandises livrées', themeColor: '#10b981' });

  doc.font('Helvetica-Bold').fontSize(11).fillColor('#10b981').text(`Montant livré : ${pdfFormatMoney(montantTotal)}`, { align: 'right' });
  doc.moveDown(2);
  doc.fontSize(8).font('Helvetica').fillColor('#64748b');
  doc.text('Document émis automatiquement suite à la réception effective de la marchandise à l\'entrepôt.', { align: 'left' });
  doc.fillColor('#000000');

  await pipeDocToFile(doc, outPath);
  return outPath;
}

/**
 * Bon de livraison « document de transport » — à remettre au chauffeur avant la livraison effective.
 * Quantités = commandées (préparation expédition).
 */
async function generateBonTransportPdf(idcommande) {
  ensureStorage();
  const commande = await CommandeModel.findById(idcommande);
  if (!commande) throw new Error('Commande introuvable');

  const statut = normalizeStatut(commande.statut);
  if (statut === 'livree') {
    throw new Error('Ce document n’est plus nécessaire : la commande est déjà livrée (utilisez le bon de livraison final).');
  }
  if (statut === 'refusee') {
    throw new Error('Commande refusée — document de transport non applicable.');
  }

  const lignes = await CommandeModel.getLignes(idcommande);
  const montantTotal = CommandeModel.computeMontantTotal(lignes);
  const outPath = getBonTransportPath(idcommande);

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    info: {
      Title: `Bon de transport ${idcommande}`,
      Author: 'BRALIMA Supply Chain',
    },
  });

  drawHeaderBlock(doc, 'BON DE TRANSPORT', '#d97706');

  const startY = doc.y;
  // Left Column - Transport details
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#d97706').text('INFORMATIONS TRANSPORT', 50, startY);
  doc.font('Helvetica').fillColor('#334155');
  doc.moveDown(0.4);
  doc.text(`N° Commande : ${commande.idcommande}`);
  doc.text(`Référence : ${commande.reference || '—'}`);
  doc.text(`Date Expédition : ${formatFrenchDate(new Date())}`);
  if (commande.deleidellivraison) {
    doc.text(`Livraison souhaitée : ${formatFrenchDate(commande.deleidellivraison)}`);
  }
  
  // Right Column - Supplier/Shipper details
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#d97706').text('EXPÉDITEUR', 300, startY);
  doc.font('Helvetica').fillColor('#334155');
  doc.moveDown(0.4);
  doc.text(`Nom : ${commande.raisonsocial || '—'}`);
  if (commande.contact_nom) doc.text(`Contact : ${commande.contact_nom}`);
  if (commande.fournisseur_telephone) doc.text(`Téléphone : ${commande.fournisseur_telephone}`);
  if (commande.fournisseur_email) doc.text(`Email : ${commande.fournisseur_email}`);
  
  doc.y = Math.max(doc.y, startY + 80);
  doc.x = 50;
  doc.moveDown(1.5);

  drawLigneTable(doc, lignes, { qtyKey: 'qtecommande', title: 'Marchandises prévues à l’expédition', themeColor: '#d97706' });

  doc.font('Helvetica-Bold').fontSize(11).fillColor('#d97706').text(`Montant (réf.) : ${pdfFormatMoney(montantTotal)}`, { align: 'right' });
  doc.moveDown(2);
  doc.fontSize(8).font('Helvetica').fillColor('#64748b');
  doc.text('Ce document de transport doit obligatoirement accompagner le chauffeur durant le trajet vers la brasserie BRALIMA.', { align: 'left' });
  doc.fillColor('#000000');

  await pipeDocToFile(doc, outPath);
  return outPath;
}

module.exports = {
  generateBonCommandePdf,
  generateBonLivraisonPdf,
  generateBonTransportPdf,
  getBonCommandePath,
  getBonLivraisonPath,
  getBonTransportPath,
  STORAGE_ROOT,
};
