/** Statuts pour lesquels le fournisseur peut confirmer l'expédition */
const STATUTS_CONFIRMABLES_EXPEDITION = [
  'en_attente',
  'approuvee',
  'en_cours',
  'envoyee',
];

/** Statuts pour lesquels le bon de transport est disponible */
const STATUTS_TRANSPORT_DISPONIBLE = [
  'approuvee',
  'en_cours',
  'envoyee',
  'en_cours_de_livraison',
  'livree',
];

function normalizeStatut(statut) {
  return String(statut || '').trim().toLowerCase();
}

function canConfirmDelivery(statut) {
  return STATUTS_CONFIRMABLES_EXPEDITION.includes(normalizeStatut(statut));
}

function canDownloadTransportPdf(statut) {
  return STATUTS_TRANSPORT_DISPONIBLE.includes(normalizeStatut(statut));
}

module.exports = {
  STATUTS_CONFIRMABLES_LIVRAISON: STATUTS_CONFIRMABLES_EXPEDITION, // Pour compatibilité
  normalizeStatut,
  canConfirmDelivery,
  canDownloadTransportPdf,
};
