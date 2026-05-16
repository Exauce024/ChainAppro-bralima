const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const CommandeModel = require('../models/commandeModel');
const { formatMoney } = require('./currency');
const { normalizeStatut } = require('./commandeStatuts');

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

function drawTitleBlock(doc, title) {
  doc.fontSize(16).font('Helvetica-Bold').text(title, { align: 'center' });
  doc.moveDown(0.4);
  doc.fontSize(9).font('Helvetica').fillColor('#444444').text('BRALIMA Supply Chain', { align: 'center' });
  doc.fillColor('#000000');
  doc.moveDown(1.2);
}

function drawLigneTable(doc, lignes, { qtyKey, title }) {
  const tableTop = doc.y;
  const x1 = 50;
  const x2 = 270;
  const x3 = 350;
  const x4 = 460;
  doc.fontSize(10).font('Helvetica-Bold').text(title, x1, tableTop);
  doc.moveDown(0.6);

  let y = doc.y + 6;
  doc.fontSize(9).font('Helvetica-Bold');
  doc.text('Article', x1, y);
  doc.text(qtyKey === 'qtelivrée' ? 'Qté livrée' : 'Qté commandée', x2, y);
  doc.text('Prix unit.', x3, y);
  doc.text('Total ligne', x4, y);
  y += 16;

  doc.moveTo(x1, y - 4).lineTo(535, y - 4).stroke('#cccccc');
  doc.font('Helvetica');

  for (const ligne of lignes) {
    const q = Number(qtyKey === 'qtelivrée' ? ligne.qtelivrée ?? ligne.qtecommande : ligne.qtecommande) || 0;
    const pu = Number(ligne.prixunitaire) || 0;
    const lineTotal = q * pu;

    const label = ligne.libelle || ligne.description || `MP #${ligne.idmp}`;
    doc.text(label.substring(0, 48), x1, y, { width: x2 - x1 - 8 });
    doc.text(String(q), x2, y);
    doc.text(formatMoney(pu), x3, y);
    doc.text(formatMoney(lineTotal), x4, y);
    y += 18;
    if (y > doc.page.height - 100) {
      doc.addPage();
      y = 50;
    }
  }

  doc.y = y + 8;
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

  drawTitleBlock(doc, 'BON DE COMMANDE');

  doc.fontSize(10).font('Helvetica');
  doc.text(`N° commande interne : ${commande.idcommande}`);
  doc.text(`Référence : ${commande.reference || '—'}`);
  doc.text(`Fournisseur : ${commande.raisonsocial || '—'}`);
  doc.text(`Date de création : ${formatFrenchDate(commande.datecreation)}`);
  if (commande.deleidellivraison) {
    doc.text(`Délai / livraison souhaité : ${String(commande.deleidellivraison)}`);
  }
  doc.moveDown();

  drawLigneTable(doc, lignes, { qtyKey: 'qtecommande', title: 'Détail des lignes' });

  doc.font('Helvetica-Bold').fontSize(11).text(`Total : ${formatMoney(montantTotal)}`, { align: 'right' });
  doc.moveDown(2);
  doc.fontSize(8).font('Helvetica').fillColor('#666666');
  doc.text('Document émis automatiquement à la création de la commande.', { align: 'left' });
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

  drawTitleBlock(doc, 'BON DE LIVRAISON');

  doc.fontSize(10).font('Helvetica');
  doc.text(`N° commande : ${commande.idcommande}`);
  doc.text(`Référence : ${commande.reference || '—'}`);
  doc.text(`Fournisseur : ${commande.raisonsocial || '—'}`);
  doc.text(`Date BL : ${formatFrenchDate(new Date())}`);
  doc.text(`Commande créée le : ${formatFrenchDate(commande.datecreation)}`);
  doc.moveDown();

  drawLigneTable(doc, lignes, { qtyKey: 'qtelivrée', title: 'Marchandises livrées' });

  doc.font('Helvetica-Bold').fontSize(11).text(`Montant livré : ${formatMoney(montantTotal)}`, { align: 'right' });
  doc.moveDown(2);
  doc.fontSize(8).font('Helvetica').fillColor('#666666');
  doc.text('Document émis automatiquement suite à la confirmation de livraison par le fournisseur.', {
    align: 'left',
  });
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

  drawTitleBlock(doc, 'BON DE LIVRAISON — TRANSPORT');
  doc.fontSize(10).font('Helvetica').text('(Document à remettre au chauffeur / transporteur)', { align: 'center' });
  doc.moveDown(0.8);

  doc.fontSize(10).font('Helvetica');
  doc.text(`N° commande : ${commande.idcommande}`);
  doc.text(`Référence : ${commande.reference || '—'}`);
  doc.text(`Expéditeur (fournisseur) : ${commande.raisonsocial || '—'}`);
  doc.text(`Établi le : ${formatFrenchDate(new Date())}`);
  if (commande.deleidellivraison) {
    doc.text(`Livraison souhaitée / notes : ${String(commande.deleidellivraison)}`);
  }
  doc.moveDown();

  drawLigneTable(doc, lignes, { qtyKey: 'qtecommande', title: 'Marchandises prévues à l’expédition' });

  doc.font('Helvetica-Bold').fontSize(11).text(`Montant (réf.) : ${formatMoney(montantTotal)}`, { align: 'right' });
  doc.moveDown(2);
  doc.fontSize(8).font('Helvetica').fillColor('#666666');
  doc.text(
    'Ce document accompagne la matière première en route vers BRALIMA. Conserver une copie avec le bon définitif après réception.',
    { align: 'left' }
  );
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
