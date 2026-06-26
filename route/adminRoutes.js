const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { isAuthenticated, hasRole } = require('../middleware/authMiddlawere');

router.use(isAuthenticated);
router.use(hasRole(['admin']));   // Seul l'admin a accès à ce module

router.get('/', (req, res) => res.redirect('/admin/dashboard'));
router.get('/dashboard', AdminController.dashboard);
router.get('/users', AdminController.users);
router.get('/fournisseurs', AdminController.fournisseurs);
router.get('/logs', AdminController.logs);
router.get('/users', AdminController.users);
router.get('/fournisseurs', AdminController.fournisseurs);
router.get('/logs', AdminController.logs);
router.get('/create-user', AdminController.showCreateUser);
router.post('/create-user', AdminController.createUser);
router.get('/user/:id/:action(activate|suspend)', AdminController.toggleUser);
router.get('/user/:id/edit', AdminController.editUser);
router.post('/user/:id/update', AdminController.updateUser);
router.get('/user/:id/delete', AdminController.deleteUser);
router.get('/create-fournisseur', AdminController.showCreateFournisseur);
router.post('/create-fournisseur', AdminController.createFournisseur);
// Supplier CRUD routes
router.get('/fournisseur/:id', AdminController.viewFournisseur);
router.get('/fournisseur/:id/edit', AdminController.editFournisseur);
router.post('/fournisseur/:id/update', AdminController.updateFournisseur);
router.get('/fournisseur/:id/delete', AdminController.confirmDeleteFournisseur);
router.post('/fournisseur/:id/delete', AdminController.deleteFournisseur);
router.post('/fournisseur/:id/generate-access', AdminController.generateFournisseurAccess);
router.get('/download-logs-pdf', AdminController.downloadLogsPDF);

module.exports = router;
