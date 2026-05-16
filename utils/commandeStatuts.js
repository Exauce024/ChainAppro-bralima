/** Statuts pour lesquels le fournisseur peut confirmer la livraison */
const STATUTS_CONFIRMABLES_LIVRAISON = [
  'en_attente',
  'approuvee',
  'en_cours',
  'envoyee',
];

function normalizeStatut(statut) {
  return String(statut || '').trim().toLowerCase();
}

function canConfirmDelivery(statut) {
  return STATUTS_CONFIRMABLES_LIVRAISON.includes(normalizeStatut(statut));
}

module.exports = {
  STATUTS_CONFIRMABLES_LIVRAISON,
  normalizeStatut,
  canConfirmDelivery,
};
