-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 13, 2026 at 02:33 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `gestionstocks`
--

-- --------------------------------------------------------

--
-- Table structure for table `alertepredictive`
--

CREATE TABLE `alertepredictive` (
  `idalert` int(11) NOT NULL,
  `idmp` int(11) NOT NULL,
  `typealerte` enum('stock_faible','seuil_critique','peremption','retard_livraison') NOT NULL,
  `message` text DEFAULT NULL,
  `datecreation` datetime DEFAULT current_timestamp(),
  `statut` enum('active','traitee','ignoree') DEFAULT 'active',
  `niveauurgence` enum('basse','moyenne','haute','critique') DEFAULT 'moyenne',
  `iduser_traite` int(11) DEFAULT NULL,
  `date_traitement` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `alertepredictive`
--

INSERT INTO `alertepredictive` (`idalert`, `idmp`, `typealerte`, `message`, `datecreation`, `statut`, `niveauurgence`, `iduser_traite`, `date_traitement`) VALUES
(1, 1, 'stock_faible', 'Alerte stock faible pour Mais', '2026-05-11 20:08:11', 'traitee', 'moyenne', 6, '2026-05-15 23:38:21');

-- --------------------------------------------------------

--
-- Table structure for table `commande`
--

CREATE TABLE `commande` (
  `idcommande` int(11) NOT NULL,
  `reference` varchar(100) NOT NULL,
  `datecreation` datetime DEFAULT current_timestamp(),
  `deleidellivraison` date DEFAULT NULL,
  `statut` enum('en_attente','approuvee','refusee','annulee','livree','en_cours','envoyee','en_cours_de_livraison') DEFAULT 'en_attente',
  `motifrefus` text DEFAULT NULL,
  `prixtotal` decimal(15,2) DEFAULT 0.00,
  `idcreateur` int(11) DEFAULT NULL,
  `idfournisseur` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `commande`
--

INSERT INTO `commande` (`idcommande`, `reference`, `datecreation`, `deleidellivraison`, `statut`, `motifrefus`, `prixtotal`, `idcreateur`, `idfournisseur`) VALUES
(1, 'CMD-2026-306', '2026-05-11 21:21:17', '2026-05-12', '', NULL, 14999.70, 6, 1),
(2, 'CMD-2026-899', '2026-05-11 21:43:14', '2026-05-13', '', NULL, 12220.00, 6, 1),
(3, 'CMD-2026-808', '2026-05-11 21:46:43', '2026-05-11', 'approuvee', NULL, 2400.00, 6, 1),
(4, 'CMD-2026-737', '2026-05-11 22:00:39', '2026-05-13', 'approuvee', NULL, 1000.00, 6, 1),
(5, 'CMD-2026-368', '2026-05-12 07:32:55', '2026-05-13', 'approuvee', NULL, 100000.00, 6, 1),
(6, 'CMD-2026-404', '2026-05-12 07:44:42', '2026-05-13', 'approuvee', NULL, 10000.00, 6, 1),
(7, 'CMD-2026-123', '2026-05-15 20:12:14', '2026-05-16', '', NULL, 10000000.00, 6, 1),
(9, 'CMD-2026-679', '2026-05-15 20:19:00', '2026-05-16', 'approuvee', NULL, 10000000.00, 6, 1),
(10, 'CMD-2026-321', '2026-05-15 20:35:03', '2026-05-16', 'en_cours', NULL, 10000000.00, 6, 1),
(11, 'CMD-2026-885', '2026-05-15 20:52:02', '2026-05-16', 'livree', NULL, 10000000.00, 6, 1),
(13, 'CMD-2026-955', '2026-05-15 21:28:13', '2026-05-15', 'livree', NULL, 11000.00, 6, 1),
(16, 'CMD-2026-641', '2026-05-15 22:30:51', '2026-05-15', 'livree', NULL, 10000.00, 6, 1),
(17, 'CMD-2026-183', '2026-05-16 00:06:35', '2026-05-16', 'en_cours', NULL, 2200.00, 6, 1),
(18, 'CMD-2026-457', '2026-05-16 00:29:05', '2026-05-16', 'livree', NULL, 16140.00, 6, 1),
(19, 'CMD-2026-311', '2026-05-22 07:46:56', '2026-05-23', 'livree', NULL, 3998.00, 6, 1),
(20, 'CMD-2026-484', '2026-05-22 12:28:41', '2026-05-23', 'livree', NULL, 200000.00, 6, 1),
(21, 'CMD-2026-611', '2026-05-30 08:24:03', '2026-06-02', 'livree', NULL, 100000.00, 6, 1),
(22, 'CMD-2026-623', '2026-06-08 08:44:47', '2026-06-12', 'livree', NULL, 2200.00, 6, 1),
(23, 'CMD-2026-867', '2026-06-08 22:50:33', '2026-06-09', 'livree', NULL, 100000.00, 6, 1),
(24, 'CMD-2026-401', '2026-06-12 06:58:40', '2026-06-14', 'livree', NULL, 200000.00, 6, 1),
(25, 'CMD-2026-578', '2026-06-12 07:10:29', '2026-06-12', 'livree', NULL, 100000.00, 6, 1),
(26, 'CMD-2026-601', '2026-06-12 15:18:24', '2026-06-12', 'en_attente', NULL, 10000.00, 6, 3),
(27, 'CMD-2026-300', '2026-06-12 15:23:03', '2026-06-12', 'livree', NULL, 100000.00, 6, 1);

-- --------------------------------------------------------

--
-- Table structure for table `entrepôt`
--

CREATE TABLE `entrepôt` (
  `identret` int(11) NOT NULL,
  `nom` varchar(100) DEFAULT 'Entrepôt Principal'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `entrepôt`
--

INSERT INTO `entrepôt` (`identret`, `nom`) VALUES
(1, 'Entrepôt Principal');

-- --------------------------------------------------------

--
-- Table structure for table `fournisseur`
--

CREATE TABLE `fournisseur` (
  `idfournisseur` int(11) NOT NULL,
  `raisonsocial` varchar(200) NOT NULL,
  `libellé` varchar(200) DEFAULT NULL,
  `telephone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `adresse` text DEFAULT NULL,
  `contact_nom` varchar(150) DEFAULT NULL,
  `delai_livraison` int(11) DEFAULT 7,
  `statut` enum('actif','inactif') DEFAULT 'actif',
  `datecreation` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `fournisseur`
--

INSERT INTO `fournisseur` (`idfournisseur`, `raisonsocial`, `libellé`, `telephone`, `email`, `adresse`, `contact_nom`, `delai_livraison`, `statut`, `datecreation`) VALUES
(1, 'Malterie congo SARL', 'Malterie Congoo', '+243999255796', 'exaucebanza04@gmail.com', 'N°2911,AV MPOLO/DU 30 JUIN EN DIAGONAL DE KILIMAJAROM', 'Exaucé BK', 7, 'actif', '2026-05-11 11:12:21'),
(3, 'CSA', 'liberte', '0975622111', 'epeemr7@gmail.com', 'mpolo', 'Epee', 7, 'actif', '2026-06-12 15:17:43');

-- --------------------------------------------------------

--
-- Table structure for table `fournisseur_matiere`
--

CREATE TABLE `fournisseur_matiere` (
  `idfournisseur` int(11) NOT NULL,
  `idmp` int(11) NOT NULL,
  `prix_kg` decimal(15,2) NOT NULL,
  `datecreation` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `fournisseur_matiere`
--

INSERT INTO `fournisseur_matiere` (`idfournisseur`, `idmp`, `prix_kg`, `datecreation`) VALUES
(1, 1, 100000.00, '2026-06-08 20:25:05'),
(3, 1, 100.00, '2026-06-12 15:17:43');

-- --------------------------------------------------------

--
-- Table structure for table `lignecommande`
--

CREATE TABLE `lignecommande` (
  `idligne` int(11) NOT NULL,
  `idcommande` int(11) NOT NULL,
  `idmp` int(11) NOT NULL,
  `qtecommande` int(11) NOT NULL,
  `prixunitaire` decimal(15,2) NOT NULL,
  `qtelivrée` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `lignecommande`
--

INSERT INTO `lignecommande` (`idligne`, `idcommande`, `idmp`, `qtecommande`, `prixunitaire`, `qtelivrée`) VALUES
(1, 1, 1, 15, 999.98, 0),
(2, 2, 1, 10, 1222.00, 0),
(3, 3, 1, 12, 200.00, 0),
(4, 4, 1, 10, 100.00, 0),
(5, 5, 1, 100, 1000.00, 100),
(6, 6, 1, 10, 1000.00, 10),
(7, 7, 1, 1000, 10000.00, 0),
(8, 9, 1, 1000, 10000.00, 0),
(9, 10, 1, 1000, 10000.00, 0),
(10, 11, 1, 1000, 10000.00, 0),
(11, 13, 1, 11, 1000.00, 11),
(12, 16, 1, 10, 1000.00, 10),
(13, 17, 1, 11, 200.00, 0),
(14, 18, 1, 12, 1345.00, 12),
(15, 19, 1, 2, 1999.00, 2),
(16, 20, 1, 20, 10000.00, 21),
(17, 21, 1, 100, 1000.00, 101),
(18, 22, 1, 11, 200.00, 12),
(19, 23, 1, 1, 100000.00, 1),
(20, 24, 1, 2, 100000.00, 2),
(21, 25, 1, 1, 100000.00, 2),
(22, 26, 1, 100, 100.00, 0),
(23, 27, 1, 1, 100000.00, 2);

--
-- Triggers `lignecommande`
--
DELIMITER $$
CREATE TRIGGER `update_commande_total` AFTER INSERT ON `lignecommande` FOR EACH ROW BEGIN
    UPDATE commande c SET c.prixtotal = (
        SELECT SUM(l.qtecommande * l.prixunitaire)
        FROM lignecommande l WHERE l.idcommande = NEW.idcommande
    ) WHERE c.idcommande = NEW.idcommande;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `lignereception`
--

CREATE TABLE `lignereception` (
  `idlignerec` int(11) NOT NULL,
  `idcommande` int(11) DEFAULT NULL,
  `idmp` int(11) DEFAULT NULL,
  `qtereçu` int(11) NOT NULL,
  `attribut` text DEFAULT NULL,
  `statut` enum('en_attente','approuvee','refusee','confirmee') DEFAULT 'en_attente',
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `lignereception`
--

INSERT INTO `lignereception` (`idlignerec`, `idcommande`, `idmp`, `qtereçu`, `attribut`, `statut`, `description`) VALUES
(1, 6, 1, 10, '{\"lotnumero\":\"LOT-10\",\"dateperemption\":null,\"bon_livraison\":\"12\",\"chauffeur\":null,\"observations\":null,\"quality_status\":\"conforme\",\"zone\":\"A-12\",\"idfournisseur\":\"1\"}', 'confirmee', NULL),
(2, 5, 1, 100, '{\"lotnumero\":\"LOT-10\",\"dateperemption\":null,\"bon_livraison\":\"12\",\"chauffeur\":null,\"observations\":null,\"quality_status\":\"conforme\",\"zone\":\"A-12\",\"idfournisseur\":\"1\"}', 'confirmee', NULL),
(3, 20, 1, 1, '{\"lotnumero\":null,\"dateperemption\":null,\"bon_livraison\":\"22\",\"chauffeur\":null,\"observations\":null,\"quality_status\":\"conforme\",\"zone\":null,\"idfournisseur\":\"1\"}', 'confirmee', NULL),
(4, 21, 1, 1, '{\"lotnumero\":\"22\",\"dateperemption\":\"2026-05-30\",\"bon_livraison\":\"11\",\"chauffeur\":\"DD\",\"observations\":null,\"quality_status\":\"conforme\",\"zone\":null,\"idfournisseur\":\"1\"}', 'confirmee', NULL),
(5, 22, 1, 1, '{\"lotnumero\":null,\"dateperemption\":\"2026-06-08\",\"bon_livraison\":\"22\",\"chauffeur\":null,\"observations\":null,\"quality_status\":\"conforme\",\"zone\":null,\"idfournisseur\":\"1\"}', 'confirmee', NULL),
(6, 25, 1, 1, '{\"lotnumero\":\"D12\",\"dateperemption\":\"2026-06-19\",\"bon_livraison\":\"11\",\"chauffeur\":\"KD\",\"observations\":null,\"quality_status\":\"conforme\",\"zone\":\"EE\",\"idfournisseur\":\"1\"}', 'confirmee', NULL),
(7, 27, 1, 1, '{\"lotnumero\":\"LOT-0044\",\"dateperemption\":\"2026-06-25\",\"bon_livraison\":\"N°06\",\"chauffeur\":\"efwaya\",\"observations\":null,\"quality_status\":\"conforme\",\"zone\":\"A-09\",\"idfournisseur\":\"1\"}', 'confirmee', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `logaudit`
--

CREATE TABLE `logaudit` (
  `idlog` int(11) NOT NULL,
  `iduser` int(11) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `module` varchar(100) NOT NULL,
  `horodatage` datetime DEFAULT current_timestamp(),
  `adresse` varchar(255) DEFAULT NULL,
  `detaillson` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `logaudit`
--

INSERT INTO `logaudit` (`idlog`, `iduser`, `action`, `module`, `horodatage`, `adresse`, `detaillson`) VALUES
(1, 1, 'LOGIN', 'AUTH', '2026-05-11 10:27:53', NULL, 'Connexion réussie depuis 127.0.0.1'),
(2, 1, 'LOGIN', 'AUTH', '2026-05-11 10:28:20', NULL, 'Connexion réussie depuis 127.0.0.1'),
(3, 1, 'LOGIN', 'AUTH', '2026-05-11 10:29:10', NULL, 'Connexion réussie depuis 127.0.0.1'),
(4, 1, 'LOGIN', 'AUTH', '2026-05-11 10:29:40', NULL, 'Connexion réussie depuis 127.0.0.1'),
(5, NULL, 'DELETE_USER', 'ADMIN', '2026-05-11 10:30:35', NULL, 'Utilisateur supprimé : Gestionnaire Principal (gestionnaire@bralima.cd)'),
(6, NULL, 'DELETE_USER', 'ADMIN', '2026-05-11 10:30:41', NULL, 'Utilisateur supprimé : Fournisseur Test (fournisseur@bralima.cd)'),
(7, NULL, 'DELETE_USER', 'ADMIN', '2026-05-11 10:30:45', NULL, 'Utilisateur supprimé : Gestionnaire Second (gestionnaire2@bralima.cd)'),
(8, NULL, 'DELETE_USER', 'ADMIN', '2026-05-11 10:30:50', NULL, 'Utilisateur supprimé : Magasinier Stock (magasinier@bralima.cd)'),
(9, NULL, 'CREATE_USER', 'ADMIN', '2026-05-11 10:32:17', NULL, 'Admin a créé l\'utilisateur exaucebanza04@gmail.com (rôle ID 2)'),
(10, 6, 'LOGIN', 'AUTH', '2026-05-11 10:32:39', NULL, 'Connexion réussie depuis 127.0.0.1'),
(11, 1, 'LOGIN', 'AUTH', '2026-05-11 10:33:18', NULL, 'Connexion réussie depuis 127.0.0.1'),
(12, NULL, 'CREATE_FOURNISSEUR', 'ADMIN', '2026-05-11 11:12:21', NULL, 'Nouveau fournisseur créé : Malterie congo SARL'),
(13, NULL, 'CREATE_USER', 'ADMIN', '2026-05-11 11:13:13', NULL, 'Admin a créé l\'utilisateur johnkituo26@gmail.com (rôle ID 4)'),
(14, 7, 'LOGIN', 'AUTH', '2026-05-11 11:13:24', NULL, 'Connexion réussie depuis 127.0.0.1'),
(15, 1, 'LOGIN', 'AUTH', '2026-05-11 11:15:53', NULL, 'Connexion réussie depuis 127.0.0.1'),
(16, NULL, 'CREATE_USER', 'ADMIN', '2026-05-11 11:16:58', NULL, 'Admin a créé l\'utilisateur fournisseur@test.com (rôle ID 3)'),
(17, 8, 'LOGIN', 'AUTH', '2026-05-11 11:17:11', NULL, 'Connexion réussie depuis 127.0.0.1'),
(18, 8, 'LOGIN', 'AUTH', '2026-05-11 11:18:33', NULL, 'Connexion réussie depuis 127.0.0.1'),
(19, 1, 'LOGIN', 'AUTH', '2026-05-11 18:16:31', NULL, 'Connexion réussie depuis 127.0.0.1'),
(20, 1, 'LOGIN', 'AUTH', '2026-05-11 18:42:21', NULL, 'Connexion réussie depuis 127.0.0.1'),
(21, 1, 'LOGIN', 'AUTH', '2026-05-11 18:48:16', NULL, 'Connexion réussie depuis 127.0.0.1'),
(22, 1, 'LOGIN', 'AUTH', '2026-05-11 18:58:25', NULL, 'Connexion réussie depuis 127.0.0.1'),
(23, 1, 'LOGIN', 'AUTH', '2026-05-11 19:01:19', NULL, 'Connexion réussie depuis 127.0.0.1'),
(24, 1, 'LOGIN', 'AUTH', '2026-05-11 19:06:17', NULL, 'Connexion réussie depuis 127.0.0.1'),
(25, 1, 'LOGIN', 'AUTH', '2026-05-11 19:12:24', NULL, 'Connexion réussie depuis 127.0.0.1'),
(26, 1, 'LOGIN', 'AUTH', '2026-05-11 19:16:15', NULL, 'Connexion réussie depuis 127.0.0.1'),
(27, 1, 'LOGIN', 'AUTH', '2026-05-11 19:22:40', NULL, 'Connexion réussie depuis 127.0.0.1'),
(28, 6, 'LOGIN', 'AUTH', '2026-05-11 19:33:44', NULL, 'Connexion réussie depuis 127.0.0.1'),
(29, 6, 'LOGIN', 'AUTH', '2026-05-11 19:39:42', NULL, 'Connexion réussie depuis 127.0.0.1'),
(30, 6, 'CREATE', 'MATIERE_PREMIERE', '2026-05-11 19:40:13', NULL, 'Matière première créée par le gestionnaire: Mais (PROD001)'),
(31, 6, 'LOGIN', 'AUTH', '2026-05-11 20:08:11', NULL, 'Connexion réussie depuis 127.0.0.1'),
(32, 6, 'LOGIN', 'AUTH', '2026-05-11 20:31:26', NULL, 'Connexion réussie depuis 127.0.0.1'),
(33, 6, 'LOGIN', 'AUTH', '2026-05-11 20:43:52', NULL, 'Connexion réussie depuis 127.0.0.1'),
(34, 6, 'LOGIN', 'AUTH', '2026-05-11 20:51:47', NULL, 'Connexion réussie depuis 127.0.0.1'),
(35, 6, 'LOGIN', 'AUTH', '2026-05-11 21:01:21', NULL, 'Connexion réussie depuis 127.0.0.1'),
(36, 1, 'LOGIN', 'AUTH', '2026-05-11 21:03:57', NULL, 'Connexion réussie depuis 127.0.0.1'),
(37, 6, 'LOGIN', 'AUTH', '2026-05-11 21:06:37', NULL, 'Connexion réussie depuis 127.0.0.1'),
(38, 6, 'CREATE', 'COMMANDE', '2026-05-11 21:21:28', NULL, 'Commande 1 créée pour fournisseur 1'),
(39, 6, 'UPDATE_STATUT', 'COMMANDE', '2026-05-11 21:39:10', NULL, 'Commande 1 → approuvee'),
(40, 6, 'UPDATE_STATUT', 'COMMANDE', '2026-05-11 21:39:30', NULL, 'Commande 1 → en_cours'),
(41, 6, 'CREATE', 'COMMANDE', '2026-05-11 21:43:25', NULL, 'Commande 2 créée pour fournisseur 1'),
(42, 6, 'UPDATE_STATUT', 'COMMANDE', '2026-05-11 21:43:30', NULL, 'Commande 2 → approuvee'),
(43, 6, 'UPDATE_STATUT', 'COMMANDE', '2026-05-11 21:43:55', NULL, 'Commande 2 → en_cours'),
(44, 6, 'CREATE', 'COMMANDE', '2026-05-11 21:46:53', NULL, 'Commande 3 créée pour fournisseur 1'),
(45, 6, 'UPDATE_STATUT', 'COMMANDE', '2026-05-11 21:47:02', NULL, 'Commande 3 → approuvee'),
(46, 6, 'LOGIN', 'AUTH', '2026-05-11 22:00:07', NULL, 'Connexion réussie depuis 127.0.0.1'),
(47, 6, 'CREATE', 'COMMANDE', '2026-05-11 22:00:49', NULL, 'Commande 4 créée pour fournisseur 1'),
(48, 6, 'UPDATE_STATUT', 'COMMANDE', '2026-05-11 22:01:10', NULL, 'Commande 4 → approuvee'),
(49, 6, 'LOGIN', 'AUTH', '2026-05-12 07:29:50', NULL, 'Connexion réussie depuis 127.0.0.1'),
(50, 6, 'CREATE', 'COMMANDE', '2026-05-12 07:33:07', NULL, 'Commande 5 créée pour fournisseur 1'),
(51, 6, 'UPDATE_STATUT', 'COMMANDE', '2026-05-12 07:33:31', NULL, 'Commande 5 → approuvee'),
(52, 6, 'LOGIN', 'AUTH', '2026-05-12 07:41:49', NULL, 'Connexion réussie depuis 127.0.0.1'),
(53, 6, 'CREATE', 'COMMANDE', '2026-05-12 07:44:55', NULL, 'Commande 6 créée pour fournisseur 1'),
(54, 6, 'UPDATE_STATUT', 'COMMANDE', '2026-05-12 07:45:00', NULL, 'Commande 6 → approuvee'),
(55, 6, 'LOGIN', 'AUTH', '2026-05-12 14:13:58', NULL, 'Connexion réussie depuis 127.0.0.1'),
(56, 1, 'LOGIN', 'AUTH', '2026-05-12 14:17:14', NULL, 'Connexion réussie depuis 127.0.0.1'),
(57, 7, 'LOGIN', 'AUTH', '2026-05-12 14:23:00', NULL, 'Connexion réussie depuis 127.0.0.1'),
(58, 7, 'LOGIN', 'AUTH', '2026-05-14 12:16:16', NULL, 'Connexion réussie depuis 127.0.0.1'),
(59, 7, 'LOGIN', 'AUTH', '2026-05-15 15:32:22', NULL, 'Connexion réussie depuis undefined'),
(60, 7, 'LOGIN', 'AUTH', '2026-05-15 15:32:25', NULL, 'Connexion réussie depuis undefined'),
(61, 7, 'LOGIN', 'AUTH', '2026-05-15 15:32:36', NULL, 'Connexion réussie depuis undefined'),
(62, 7, 'LOGIN', 'AUTH', '2026-05-15 15:32:36', NULL, 'Connexion réussie depuis undefined'),
(63, 7, 'LOGIN', 'AUTH', '2026-05-15 15:32:37', NULL, 'Connexion réussie depuis undefined'),
(64, 7, 'LOGIN', 'AUTH', '2026-05-15 15:32:37', NULL, 'Connexion réussie depuis undefined'),
(65, 7, 'LOGIN', 'AUTH', '2026-05-15 15:32:37', NULL, 'Connexion réussie depuis undefined'),
(66, 1, 'LOGIN', 'AUTH', '2026-05-15 15:32:39', NULL, 'Connexion réussie depuis undefined'),
(67, 1, 'LOGIN', 'AUTH', '2026-05-15 15:32:39', NULL, 'Connexion réussie depuis undefined'),
(68, 1, 'LOGIN', 'AUTH', '2026-05-15 15:32:39', NULL, 'Connexion réussie depuis undefined'),
(69, 1, 'LOGIN', 'AUTH', '2026-05-15 15:32:39', NULL, 'Connexion réussie depuis undefined'),
(70, 1, 'LOGIN', 'AUTH', '2026-05-15 19:58:31', NULL, 'Connexion réussie depuis 127.0.0.1'),
(71, 7, 'LOGIN', 'AUTH', '2026-05-15 19:59:41', NULL, 'Connexion réussie depuis 127.0.0.1'),
(72, 6, 'LOGIN', 'AUTH', '2026-05-15 20:01:18', NULL, 'Connexion réussie depuis 127.0.0.1'),
(73, 6, 'LOGIN', 'AUTH', '2026-05-15 20:11:27', NULL, 'Connexion réussie depuis 127.0.0.1'),
(74, 6, 'LOGIN', 'AUTH', '2026-05-15 20:11:36', NULL, 'Connexion réussie depuis 127.0.0.1'),
(75, 6, 'CREATE', 'COMMANDE', '2026-05-15 20:12:33', NULL, 'Commande 7 créée pour fournisseur 1'),
(76, 6, 'CREATE', 'COMMANDE', '2026-05-15 20:19:12', NULL, 'Commande 9 créée pour fournisseur 1'),
(77, 6, 'UPDATE_STATUT', 'COMMANDE', '2026-05-15 20:21:09', NULL, 'Commande 9 → approuvee'),
(78, 6, 'UPDATE_STATUT', 'COMMANDE', '2026-05-15 20:21:16', NULL, 'Commande 9 → approuvee'),
(79, 6, 'UPDATE_STATUT', 'COMMANDE', '2026-05-15 20:21:25', NULL, 'Commande 7 → approuvee'),
(80, 6, 'UPDATE_STATUT', 'COMMANDE', '2026-05-15 20:21:50', NULL, 'Commande 9 → approuvee'),
(81, 6, 'UPDATE_STATUT', 'COMMANDE', '2026-05-15 20:21:54', NULL, 'Commande 9 → en_cours'),
(82, 6, 'UPDATE_STATUT', 'COMMANDE', '2026-05-15 20:22:32', NULL, 'Commande 9 → approuvee'),
(83, 6, 'UPDATE_STATUT', 'COMMANDE', '2026-05-15 20:32:40', NULL, 'Commande 7 → en_cours'),
(84, 6, 'CREATE', 'COMMANDE', '2026-05-15 20:35:16', NULL, 'Commande 10 créée pour fournisseur 1'),
(85, 6, 'UPDATE_STATUT', 'COMMANDE', '2026-05-15 20:39:18', NULL, 'Commande 10 → approuvee'),
(86, 6, 'LOGIN', 'AUTH', '2026-05-15 20:51:31', NULL, 'Connexion réussie depuis 127.0.0.1'),
(87, 6, 'CREATE', 'COMMANDE', '2026-05-15 20:52:11', NULL, 'Commande 11 créée pour fournisseur 1'),
(88, 6, 'UPDATE_STATUT', 'COMMANDE', '2026-05-15 20:52:20', NULL, 'Commande 11 → approuvee'),
(89, 7, 'LOGIN', 'AUTH', '2026-05-15 20:54:26', NULL, 'Connexion réussie depuis 127.0.0.1'),
(90, 6, 'LOGIN', 'AUTH', '2026-05-15 21:25:40', NULL, 'Connexion réussie depuis 127.0.0.1'),
(91, 6, 'UPDATE_STATUT', 'COMMANDE', '2026-05-15 21:26:16', NULL, 'Commande 11 → livree'),
(92, 6, 'CREATE', 'COMMANDE', '2026-05-15 21:28:35', NULL, 'Commande 13 créée pour fournisseur 1'),
(93, 6, 'UPDATE_STATUT', 'COMMANDE', '2026-05-15 21:29:13', NULL, 'Commande 13 → approuvee'),
(94, 6, 'LOGIN', 'AUTH', '2026-05-15 22:29:22', NULL, 'Connexion réussie depuis 127.0.0.1'),
(95, 6, 'CREATE', 'COMMANDE', '2026-05-15 22:31:02', NULL, 'Commande 16 créée pour fournisseur 1'),
(96, 6, 'UPDATE_STATUT', 'COMMANDE', '2026-05-15 22:31:31', NULL, 'Commande 16 → approuvee'),
(97, NULL, 'CONFIRMER_LIVRAISON', 'COMMANDE', '2026-05-15 22:31:45', NULL, 'Commande 16 marquée comme livrée par le fournisseur'),
(98, 6, 'LOGIN', 'AUTH', '2026-05-15 22:40:02', NULL, 'Connexion réussie depuis 127.0.0.1'),
(99, 7, 'LOGIN', 'AUTH', '2026-05-15 22:46:46', NULL, 'Connexion réussie depuis 127.0.0.1'),
(100, 6, 'LOGIN', 'AUTH', '2026-05-15 22:47:12', NULL, 'Connexion réussie depuis 127.0.0.1'),
(101, 7, 'LOGIN', 'AUTH', '2026-05-15 22:48:03', NULL, 'Connexion réussie depuis 127.0.0.1'),
(102, 6, 'LOGIN', 'AUTH', '2026-05-15 23:19:45', NULL, 'Connexion réussie depuis 127.0.0.1'),
(103, 7, 'LOGIN', 'AUTH', '2026-05-15 23:21:45', NULL, 'Connexion réussie depuis 127.0.0.1'),
(104, 7, 'CREATE_RECEPTION', 'RECEPTION', '2026-05-15 23:30:13', NULL, 'Réception ligne pour MP 1, quantité 10'),
(105, 7, 'CREATE_RECEPTION', 'RECEPTION', '2026-05-15 23:37:16', NULL, 'Réception ligne pour MP 1, quantité 100'),
(106, 6, 'LOGIN', 'AUTH', '2026-05-15 23:37:36', NULL, 'Connexion réussie depuis 127.0.0.1'),
(107, 6, 'TRAITER_ALERTE', 'GESTIONNAIRE', '2026-05-15 23:38:21', NULL, 'Alerte 1 traitée par le gestionnaire'),
(108, 6, 'UPDATE_STATUT', 'COMMANDE', '2026-05-15 23:40:18', NULL, 'Commande 13 → en_cours'),
(109, 6, 'LOGIN', 'AUTH', '2026-05-16 00:06:01', NULL, 'Connexion réussie depuis 127.0.0.1'),
(110, 6, 'CREATE', 'COMMANDE', '2026-05-16 00:06:47', NULL, 'Commande 17 créée pour fournisseur 1'),
(111, 6, 'LOGIN', 'AUTH', '2026-05-16 00:28:31', NULL, 'Connexion réussie depuis 127.0.0.1'),
(112, 6, 'CREATE', 'COMMANDE', '2026-05-16 00:29:12', NULL, 'Commande 18 créée pour fournisseur 1'),
(113, 6, 'UPDATE_STATUT', 'COMMANDE', '2026-05-16 00:31:26', NULL, 'Commande 18 → approuvee'),
(114, NULL, 'CONFIRMER_LIVRAISON', 'COMMANDE', '2026-05-16 00:31:53', NULL, 'Commande 18 livrée par le fournisseur — stock crédité (+12 unités sur 1 article(s))'),
(115, 7, 'LOGIN', 'AUTH', '2026-05-16 00:35:32', NULL, 'Connexion réussie depuis 127.0.0.1'),
(116, 6, 'LOGIN', 'AUTH', '2026-05-16 00:37:53', NULL, 'Connexion réussie depuis 127.0.0.1'),
(117, 7, 'LOGIN', 'AUTH', '2026-05-16 00:44:05', NULL, 'Connexion réussie depuis 127.0.0.1'),
(118, 7, 'LOGIN', 'AUTH', '2026-05-16 01:05:50', NULL, 'Connexion réussie depuis 127.0.0.1'),
(119, 1, 'LOGIN', 'AUTH', '2026-05-16 01:06:23', NULL, 'Connexion réussie depuis 127.0.0.1'),
(120, 6, 'LOGIN', 'AUTH', '2026-05-16 01:06:58', NULL, 'Connexion réussie depuis 127.0.0.1'),
(121, 7, 'LOGIN', 'AUTH', '2026-05-16 01:23:56', NULL, 'Connexion réussie depuis 127.0.0.1'),
(122, 7, 'SORTIE_PRODUCTION', 'STOCK_MAGASINIER', '2026-05-16 01:25:45', NULL, 'Sortie production — Réf. Pr · demande'),
(123, 7, 'LOGIN', 'AUTH', '2026-05-16 01:58:06', NULL, 'Connexion réussie depuis 127.0.0.1'),
(124, 7, 'LOGIN', 'AUTH', '2026-05-16 06:31:40', NULL, 'Connexion réussie depuis 127.0.0.1'),
(125, 7, 'LOGIN', 'AUTH', '2026-05-18 12:17:30', NULL, 'Connexion réussie depuis 127.0.0.1'),
(126, 1, 'LOGIN', 'AUTH', '2026-05-18 13:02:22', NULL, 'Connexion réussie depuis 127.0.0.1'),
(127, 6, 'LOGIN', 'AUTH', '2026-05-18 13:18:41', NULL, 'Connexion réussie depuis 127.0.0.1'),
(128, 7, 'LOGIN', 'AUTH', '2026-05-18 20:38:28', NULL, 'Connexion réussie depuis 127.0.0.1'),
(129, 6, 'LOGIN', 'AUTH', '2026-05-18 20:52:46', NULL, 'Connexion réussie depuis 127.0.0.1'),
(130, 6, 'LOGIN', 'AUTH', '2026-05-19 10:14:29', NULL, 'Connexion réussie depuis 127.0.0.1'),
(131, 6, 'LOGIN', 'AUTH', '2026-05-22 07:41:14', NULL, 'Connexion réussie depuis 127.0.0.1'),
(132, 6, 'UPDATE_STATUT', 'COMMANDE', '2026-05-22 07:41:31', NULL, 'Commande 17 → approuvee'),
(133, 7, 'LOGIN', 'AUTH', '2026-05-22 07:42:45', NULL, 'Connexion réussie depuis 127.0.0.1'),
(134, 1, 'LOGIN', 'AUTH', '2026-05-22 07:44:38', NULL, 'Connexion réussie depuis 127.0.0.1'),
(135, 6, 'LOGIN', 'AUTH', '2026-05-22 07:45:36', NULL, 'Connexion réussie depuis 127.0.0.1'),
(136, 6, 'CREATE', 'COMMANDE', '2026-05-22 07:47:08', NULL, 'Commande 19 créée pour fournisseur 1'),
(137, 6, 'UPDATE_STATUT', 'COMMANDE', '2026-05-22 07:47:22', NULL, 'Commande 19 → approuvee'),
(138, NULL, 'CONFIRMER_LIVRAISON', 'COMMANDE', '2026-05-22 07:48:33', NULL, 'Commande 19 livrée par le fournisseur — stock crédité (+2 unités sur 1 article(s))'),
(139, NULL, 'CONFIRMER_LIVRAISON', 'COMMANDE', '2026-05-22 07:48:49', NULL, 'Commande 13 livrée par le fournisseur — stock crédité (+11 unités sur 1 article(s))'),
(140, 7, 'LOGIN', 'AUTH', '2026-05-22 07:49:28', NULL, 'Connexion réussie depuis 127.0.0.1'),
(141, 6, 'LOGIN', 'AUTH', '2026-05-22 08:15:03', NULL, 'Connexion réussie depuis 127.0.0.1'),
(142, 1, 'LOGIN', 'AUTH', '2026-05-22 11:09:02', NULL, 'Connexion réussie depuis 127.0.0.1'),
(143, 1, 'LOGIN', 'AUTH', '2026-05-22 11:09:25', NULL, 'Connexion réussie depuis 127.0.0.1'),
(144, 1, 'LOGIN', 'AUTH', '2026-05-22 12:26:12', NULL, 'Connexion réussie depuis 127.0.0.1'),
(145, 1, 'LOGIN', 'AUTH', '2026-05-22 12:26:48', NULL, 'Connexion réussie depuis 127.0.0.1'),
(146, 6, 'LOGIN', 'AUTH', '2026-05-22 12:27:52', NULL, 'Connexion réussie depuis 127.0.0.1'),
(147, 6, 'CREATE', 'COMMANDE', '2026-05-22 12:28:55', NULL, 'Commande 20 créée pour fournisseur 1'),
(148, 6, 'UPDATE_STATUT', 'COMMANDE', '2026-05-22 12:29:05', NULL, 'Commande 20 → approuvee'),
(149, NULL, 'CONFIRMER_LIVRAISON', 'COMMANDE', '2026-05-22 12:32:11', NULL, 'Commande 20 livrée par le fournisseur — stock crédité (+20 unités sur 1 article(s))'),
(150, 7, 'LOGIN', 'AUTH', '2026-05-22 12:32:57', NULL, 'Connexion réussie depuis 127.0.0.1'),
(151, 7, 'CREATE_RECEPTION', 'RECEPTION', '2026-05-22 12:33:17', NULL, 'Réception ligne pour MP 1, quantité 1'),
(152, 7, 'LOGIN', 'AUTH', '2026-05-26 12:31:54', NULL, 'Connexion réussie depuis ::1'),
(153, 6, 'LOGIN', 'AUTH', '2026-05-26 12:32:09', NULL, 'Connexion réussie depuis ::1'),
(154, 6, 'LOGIN', 'AUTH', '2026-05-27 14:29:48', NULL, 'Connexion réussie depuis ::1'),
(155, 6, 'LOGIN', 'AUTH', '2026-05-30 08:22:25', NULL, 'Connexion réussie depuis ::1'),
(156, 6, 'CREATE', 'COMMANDE', '2026-05-30 08:24:10', NULL, 'Commande 21 créée pour fournisseur 1'),
(157, 6, 'UPDATE_STATUT', 'COMMANDE', '2026-05-30 08:24:20', NULL, 'Commande 21 → approuvee'),
(158, NULL, 'CONFIRMER_LIVRAISON', 'COMMANDE', '2026-05-30 08:26:19', NULL, 'Commande 21 livrée par le fournisseur — stock crédité (+100 unités sur 1 article(s))'),
(159, 7, 'LOGIN', 'AUTH', '2026-05-30 08:26:55', NULL, 'Connexion réussie depuis ::1'),
(160, 7, 'CREATE_RECEPTION', 'RECEPTION', '2026-05-30 08:27:37', NULL, 'Réception ligne pour MP 1, quantité 1'),
(161, 6, 'LOGIN', 'AUTH', '2026-06-08 08:43:42', NULL, 'Connexion réussie depuis 127.0.0.1'),
(162, 6, 'CREATE', 'COMMANDE', '2026-06-08 08:44:53', NULL, 'Commande 22 créée pour fournisseur 1'),
(163, 6, 'UPDATE_STATUT', 'COMMANDE', '2026-06-08 08:45:10', NULL, 'Commande 22 → approuvee'),
(164, NULL, 'CONFIRMER_LIVRAISON', 'COMMANDE', '2026-06-08 08:53:42', NULL, 'Commande 22 livrée par le fournisseur — stock crédité (+11 unités sur 1 article(s))'),
(165, 7, 'LOGIN', 'AUTH', '2026-06-08 08:54:04', NULL, 'Connexion réussie depuis 127.0.0.1'),
(166, 7, 'CREATE_RECEPTION', 'RECEPTION', '2026-06-08 08:55:14', NULL, 'Réception ligne pour MP 1, quantité 1'),
(167, 7, 'SORTIE_PRODUCTION', 'STOCK_MAGASINIER', '2026-06-08 08:56:08', NULL, 'Sortie production — Réf. prod 002'),
(168, 6, 'LOGIN', 'AUTH', '2026-06-08 10:39:31', NULL, 'Connexion réussie depuis 127.0.0.1'),
(169, 6, 'LOGIN', 'AUTH', '2026-06-08 11:04:09', NULL, 'Connexion réussie depuis 127.0.0.1'),
(170, 1, 'LOGIN', 'AUTH', '2026-06-08 14:13:48', NULL, 'Connexion réussie depuis ::1'),
(171, 6, 'LOGIN', 'AUTH', '2026-06-08 14:31:04', NULL, 'Connexion réussie depuis ::1'),
(172, 1, 'LOGIN', 'AUTH', '2026-06-08 14:35:22', NULL, 'Connexion réussie depuis ::1'),
(173, 1, 'LOGIN', 'AUTH', '2026-06-08 16:37:07', NULL, 'Connexion réussie depuis ::1'),
(174, 1, 'LOGIN', 'AUTH', '2026-06-08 20:09:10', NULL, 'Connexion réussie depuis ::1'),
(175, 1, 'LOGIN', 'AUTH', '2026-06-08 20:20:25', NULL, 'Connexion réussie depuis ::1'),
(176, 1, 'LOGIN', 'AUTH', '2026-06-08 20:24:06', NULL, 'Connexion réussie depuis ::1'),
(177, NULL, 'UPDATE_FOURNISSEUR', 'ADMIN', '2026-06-08 20:25:05', NULL, 'Fournisseur 1 mis à jour'),
(178, 6, 'LOGIN', 'AUTH', '2026-06-08 20:25:21', NULL, 'Connexion réussie depuis ::1'),
(179, 6, 'LOGIN', 'AUTH', '2026-06-08 22:24:42', NULL, 'Connexion réussie depuis ::1'),
(180, 6, 'LOGIN', 'AUTH', '2026-06-08 22:50:01', NULL, 'Connexion réussie depuis ::1'),
(181, 6, 'CREATE', 'COMMANDE', '2026-06-08 22:50:38', NULL, 'Commande 23 créée pour fournisseur 1'),
(182, 6, 'UPDATE_STATUT', 'COMMANDE', '2026-06-08 22:50:57', NULL, 'Commande 23 → approuvee'),
(183, 6, 'UPDATE_STATUT', 'COMMANDE', '2026-06-08 22:51:07', NULL, 'Commande 23 → approuvee'),
(184, NULL, 'CONFIRMER_LIVRAISON', 'COMMANDE', '2026-06-08 22:52:07', NULL, 'Commande 23 livrée par le fournisseur — stock crédité (+1 unités sur 1 article(s))'),
(185, 6, 'LOGIN', 'AUTH', '2026-06-09 07:30:33', NULL, 'Connexion réussie depuis ::1'),
(186, 6, 'LOGIN', 'AUTH', '2026-06-09 08:43:35', NULL, 'Connexion réussie depuis ::1'),
(187, 7, 'LOGIN', 'AUTH', '2026-06-09 08:44:12', NULL, 'Connexion réussie depuis ::1'),
(188, 7, 'LOGIN', 'AUTH', '2026-06-11 15:17:23', NULL, 'Connexion réussie depuis ::1'),
(189, 7, 'LOGIN', 'AUTH', '2026-06-11 18:09:02', NULL, 'Connexion réussie depuis ::1'),
(190, 7, 'LOGIN', 'AUTH', '2026-06-12 06:40:11', NULL, 'Connexion réussie depuis ::1'),
(191, 6, 'LOGIN', 'AUTH', '2026-06-12 06:41:00', NULL, 'Connexion réussie depuis ::1'),
(192, 6, 'CREATE', 'COMMANDE', '2026-06-12 06:58:48', NULL, 'Commande 24 créée pour fournisseur 1'),
(193, 6, 'UPDATE_STATUT', 'COMMANDE', '2026-06-12 06:58:58', NULL, 'Commande 24 → approuvee'),
(194, NULL, 'CONFIRMER_LIVRAISON', 'COMMANDE', '2026-06-12 07:00:48', NULL, 'Commande 24 livrée par le fournisseur — stock crédité (+2 unités sur 1 article(s))'),
(195, 7, 'LOGIN', 'AUTH', '2026-06-12 07:01:35', NULL, 'Connexion réussie depuis ::1'),
(196, 6, 'LOGIN', 'AUTH', '2026-06-12 07:10:05', NULL, 'Connexion réussie depuis ::1'),
(197, 6, 'CREATE', 'COMMANDE', '2026-06-12 07:10:34', NULL, 'Commande 25 créée pour fournisseur 1'),
(198, 6, 'UPDATE_STATUT', 'COMMANDE', '2026-06-12 07:10:38', NULL, 'Commande 25 → approuvee'),
(199, NULL, 'EXPEDIER_COMMANDE', 'COMMANDE', '2026-06-12 07:11:21', NULL, 'Commande 25 expédiée par le fournisseur (statut en_cours_de_livraison)'),
(200, 7, 'LOGIN', 'AUTH', '2026-06-12 07:12:03', NULL, 'Connexion réussie depuis ::1'),
(201, 6, 'LOGIN', 'AUTH', '2026-06-12 07:14:15', NULL, 'Connexion réussie depuis ::1'),
(202, 7, 'LOGIN', 'AUTH', '2026-06-12 07:15:53', NULL, 'Connexion réussie depuis ::1'),
(203, 7, 'CREATE_RECEPTION', 'RECEPTION', '2026-06-12 07:17:30', NULL, 'Réception ligne pour MP 1, quantité 1'),
(204, 7, 'LIVRER_COMMANDE', 'COMMANDE', '2026-06-12 07:17:30', NULL, 'Commande 25 entièrement réceptionnée par le magasinier — statut changé à livrée'),
(205, 6, 'LOGIN', 'AUTH', '2026-06-12 07:18:02', NULL, 'Connexion réussie depuis ::1'),
(206, 6, 'UPDATE_STATUT', 'COMMANDE', '2026-06-12 07:18:58', NULL, 'Commande 10 → en_cours'),
(207, 6, 'UPDATE_STATUT', 'COMMANDE', '2026-06-12 07:19:11', NULL, 'Commande 17 → en_cours'),
(208, 6, 'LOGIN', 'AUTH', '2026-06-12 07:33:48', NULL, 'Connexion réussie depuis ::1'),
(209, 6, 'LOGIN', 'AUTH', '2026-06-12 07:34:40', NULL, 'Connexion réussie depuis ::1'),
(210, 6, 'LOGIN', 'AUTH', '2026-06-12 15:08:48', NULL, 'Connexion réussie depuis ::1'),
(211, 6, 'LOGIN', 'AUTH', '2026-06-12 15:10:26', NULL, 'Connexion réussie depuis ::1'),
(212, 7, 'LOGIN', 'AUTH', '2026-06-12 15:12:21', NULL, 'Connexion réussie depuis ::1'),
(213, 1, 'LOGIN', 'AUTH', '2026-06-12 15:13:53', NULL, 'Connexion réussie depuis ::1'),
(214, NULL, 'CREATE_FOURNISSEUR', 'ADMIN', '2026-06-12 15:17:43', NULL, 'Nouveau fournisseur créé : CSA'),
(215, 6, 'LOGIN', 'AUTH', '2026-06-12 15:18:07', NULL, 'Connexion réussie depuis ::1'),
(216, 6, 'CREATE', 'COMMANDE', '2026-06-12 15:18:30', NULL, 'Commande 26 créée pour fournisseur 3'),
(217, 6, 'CREATE', 'COMMANDE', '2026-06-12 15:23:14', NULL, 'Commande 27 créée pour fournisseur 1'),
(218, 6, 'UPDATE_STATUT', 'COMMANDE', '2026-06-12 15:23:21', NULL, 'Commande 27 → approuvee'),
(219, NULL, 'EXPEDIER_COMMANDE', 'COMMANDE', '2026-06-12 15:25:36', NULL, 'Commande 27 expédiée par le fournisseur (statut en_cours_de_livraison)'),
(220, 6, 'LOGIN', 'AUTH', '2026-06-12 15:31:12', NULL, 'Connexion réussie depuis ::1'),
(221, 7, 'LOGIN', 'AUTH', '2026-06-12 15:33:06', NULL, 'Connexion réussie depuis ::1'),
(222, 7, 'CREATE_RECEPTION', 'RECEPTION', '2026-06-12 15:34:21', NULL, 'Réception ligne pour MP 1, quantité 1'),
(223, 7, 'LIVRER_COMMANDE', 'COMMANDE', '2026-06-12 15:34:21', NULL, 'Commande 27 entièrement réceptionnée par le magasinier — statut changé à livrée'),
(224, 6, 'LOGIN', 'AUTH', '2026-06-12 15:34:41', NULL, 'Connexion réussie depuis ::1');

-- --------------------------------------------------------

--
-- Table structure for table `magicklink`
--

CREATE TABLE `magicklink` (
  `idtoken` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `idfournisseur` int(11) DEFAULT NULL,
  `idcommande` int(11) DEFAULT NULL,
  `dateexpiration` datetime NOT NULL,
  `utilise` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `magicklink`
--

INSERT INTO `magicklink` (`idtoken`, `token`, `idfournisseur`, `idcommande`, `dateexpiration`, `utilise`) VALUES
(20, 'f91a1a4a34d3b6b2419fa75bf670adb729d5d66682dee4b5cd6b0ea397bbec51', 1, 24, '2026-06-13 06:58:41', 1),
(21, '2da99b2b4f277f375bfcc2d83790c6c95872569ab412fdce35b0673633b0c5d2', 1, 25, '2026-06-13 07:10:29', 1),
(22, 'b5120e834556946cd13af2171cde49f070306c489abf845516e603699ad23ec4', 3, 26, '2026-06-13 15:18:25', 0),
(23, '9d6d4207550c03eb908ef42fe9c841d4bb4f8d79f8b5e5bef6ab3560dd79a5d8', 1, 27, '2026-06-13 15:23:07', 1);

-- --------------------------------------------------------

--
-- Table structure for table `matièrepremiere`
--

CREATE TABLE `matièrepremiere` (
  `idmp` int(11) NOT NULL,
  `libellé` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `seuilcritique` int(11) DEFAULT 0,
  `seuilalerte` int(11) DEFAULT 0,
  `codebarre` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `matièrepremiere`
--

INSERT INTO `matièrepremiere` (`idmp`, `libellé`, `description`, `seuilcritique`, `seuilalerte`, `codebarre`) VALUES
(1, 'Mais', 'le mais', 20, 10, 'PROD001');

-- --------------------------------------------------------

--
-- Table structure for table `mouvement_stock`
--

CREATE TABLE `mouvement_stock` (
  `idmouvement` int(11) NOT NULL,
  `idstock` int(11) NOT NULL,
  `type_mouvement` enum('entree','sortie','transfert','ajustement') NOT NULL,
  `quantite` int(11) NOT NULL,
  `stock_delta` int(11) DEFAULT NULL COMMENT 'Variation réelle stock (+ entrée / - sortie)',
  `iduser` int(11) DEFAULT NULL,
  `date_mouvement` datetime DEFAULT current_timestamp(),
  `motif` text DEFAULT NULL,
  `idcommande` int(11) DEFAULT NULL,
  `idlignerec` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `mouvement_stock`
--

INSERT INTO `mouvement_stock` (`idmouvement`, `idstock`, `type_mouvement`, `quantite`, `stock_delta`, `iduser`, `date_mouvement`, `motif`, `idcommande`, `idlignerec`) VALUES
(1, 2, 'entree', 10, 10, 7, '2026-05-15 23:30:13', 'Réception marchandise — commande n°6', 6, 1),
(2, 2, 'entree', 100, 100, 7, '2026-05-15 23:37:17', 'Réception marchandise — commande n°5', 5, 2),
(3, 2, 'entree', 12, 12, NULL, '2026-05-16 00:31:53', 'Livraison fournisseur — commande n°18', 18, NULL),
(4, 2, 'sortie', 20, -20, 7, '2026-05-16 01:25:45', 'Sortie production — Réf. Pr · demande', NULL, NULL),
(5, 2, 'entree', 2, 2, NULL, '2026-05-22 07:48:33', 'Livraison fournisseur — commande n°19', 19, NULL),
(6, 2, 'entree', 11, 11, NULL, '2026-05-22 07:48:49', 'Livraison fournisseur — commande n°13', 13, NULL),
(7, 2, 'entree', 20, 20, NULL, '2026-05-22 12:32:11', 'Livraison fournisseur — commande n°20', 20, NULL),
(8, 2, 'entree', 1, 1, 7, '2026-05-22 12:33:17', 'Réception marchandise — commande n°20', 20, 3),
(9, 2, 'entree', 100, 100, NULL, '2026-05-30 08:26:19', 'Livraison fournisseur — commande n°21', 21, NULL),
(10, 2, 'entree', 1, 1, 7, '2026-05-30 08:27:37', 'Réception marchandise — commande n°21', 21, 4),
(11, 2, 'entree', 11, 11, NULL, '2026-06-08 08:53:42', 'Livraison fournisseur — commande n°22', 22, NULL),
(12, 2, 'entree', 1, 1, 7, '2026-06-08 08:55:14', 'Réception marchandise — commande n°22', 22, 5),
(13, 2, 'sortie', 40, -40, 7, '2026-06-08 08:56:08', 'Sortie production — Réf. prod 002', NULL, NULL),
(14, 2, 'entree', 1, 1, NULL, '2026-06-08 22:52:07', 'Livraison fournisseur — commande n°23', 23, NULL),
(15, 2, 'entree', 2, 2, NULL, '2026-06-12 07:00:48', 'Livraison fournisseur — commande n°24', 24, NULL),
(16, 2, 'entree', 1, 1, 7, '2026-06-12 07:17:30', 'Réception marchandise — commande n°25', 25, 6),
(17, 2, 'entree', 1, 1, 7, '2026-06-12 15:34:21', 'Réception marchandise — commande n°27', 27, 7);

-- --------------------------------------------------------

--
-- Table structure for table `notification`
--

CREATE TABLE `notification` (
  `idnotification` int(11) NOT NULL,
  `iduser` int(11) DEFAULT NULL,
  `role_libelle` varchar(100) DEFAULT NULL,
  `titre` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `lu` tinyint(1) DEFAULT 0,
  `datecreation` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notification`
--

INSERT INTO `notification` (`idnotification`, `iduser`, `role_libelle`, `titre`, `description`, `lu`, `datecreation`) VALUES
(1, NULL, 'fournisseur', 'Nouvelle commande d\'approvisionnement', 'Une nouvelle commande (CMD-2026-601) a été créée par le gestionnaire. Veuillez confirmer l\'expédition.', 0, '2026-06-12 15:18:24'),
(2, NULL, 'fournisseur', 'Nouvelle commande d\'approvisionnement', 'Une nouvelle commande (CMD-2026-300) a été créée par le gestionnaire. Veuillez confirmer l\'expédition.', 0, '2026-06-12 15:23:05'),
(3, NULL, 'gestionnaire', 'Commande expédiée', 'La commande CMD-2026-300 a été expédiée par le fournisseur Malterie congo SARL.', 1, '2026-06-12 15:25:36'),
(4, NULL, 'magasinier', 'Commande expédiée (en transit)', 'La commande CMD-2026-300 de Malterie congo SARL a été expédiée et est en route pour la réception.', 0, '2026-06-12 15:25:36'),
(5, NULL, 'gestionnaire', 'Réception de marchandise', 'Le magasinier a réceptionné 1 unité(s) pour la commande n°27.', 1, '2026-06-12 15:34:21'),
(6, NULL, 'gestionnaire', 'Commande livrée et close', 'La commande n°27 a été entièrement livrée et réceptionnée.', 1, '2026-06-12 15:34:21'),
(7, NULL, 'fournisseur', 'Livraison réceptionnée', 'La livraison pour la commande n°27 a été entièrement réceptionnée et validée.', 0, '2026-06-12 15:34:21');

-- --------------------------------------------------------

--
-- Table structure for table `role`
--

CREATE TABLE `role` (
  `idrole` int(11) NOT NULL,
  `libellé` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`permissions`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `role`
--

INSERT INTO `role` (`idrole`, `libellé`, `description`, `permissions`) VALUES
(1, 'admin', 'Administrateur système', NULL),
(2, 'gestionnaire', 'Gestionnaire Supply Chain', NULL),
(3, 'fournisseur', 'Fournisseur', NULL),
(4, 'magasinier', 'Magasinier', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `stock`
--

CREATE TABLE `stock` (
  `idstock` int(11) NOT NULL,
  `idmp` int(11) NOT NULL,
  `identret` int(11) NOT NULL,
  `qtedisponible` int(11) DEFAULT 0,
  `qtereserve` int(11) DEFAULT 0,
  `datemaj` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `lotnumero` varchar(100) DEFAULT NULL,
  `dateperemption` date DEFAULT NULL,
  `idlignerec` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock`
--

INSERT INTO `stock` (`idstock`, `idmp`, `identret`, `qtedisponible`, `qtereserve`, `datemaj`, `lotnumero`, `dateperemption`, `idlignerec`) VALUES
(2, 1, 1, 314, 0, '2026-06-12 15:34:21', 'LOT-0044', '2026-06-25', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `idusers` int(11) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `prenom` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `motdepasse` varchar(255) NOT NULL,
  `telephone` varchar(20) DEFAULT NULL,
  `statut` enum('actif','inactif','suspendu') DEFAULT 'actif',
  `datedecreation` datetime DEFAULT current_timestamp(),
  `last_login` datetime DEFAULT NULL,
  `role_id` int(11) DEFAULT NULL,
  `photo` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`idusers`, `nom`, `prenom`, `email`, `motdepasse`, `telephone`, `statut`, `datedecreation`, `last_login`, `role_id`, `photo`) VALUES
(1, 'Admin', 'System', 'admin@bralima.cd', '$2a$12$DPoAxKXmS31uKPXL2KvGs.HPfNBgr/XKDijDVAxT6/lI6TImWvz36', '123456789', 'actif', '2026-05-11 10:08:36', '2026-06-12 15:13:53', 1, NULL),
(6, 'Banza', 'Exauce', 'exaucebanza04@gmail.com', '$2a$12$Dm24QnYEYEFvFdB3c6.2B.kFdlpB8Z.Xs53gYJQPXoamMO/eBoZSq', '0999255796', 'actif', '2026-05-11 10:32:17', '2026-06-12 15:34:41', 2, NULL),
(7, 'Banza', 'John', 'johnkituo26@gmail.com', '$2a$12$bFoMQ8sQyWxb9aJIclqpBuhb42.OnTURfyYYhWih7S3k0JN2iYQfO', '999255796', 'actif', '2026-05-11 11:13:13', '2026-06-12 15:33:06', 4, NULL),
(8, 'Ngoie', 'Masengo', 'fournisseur@test.com', '$2a$12$EFFSt3SSTjH2d0.s9ZKbhemInclO9Pv55.iFxx1DKBiwAaz6F.Vim', '0978283338', 'actif', '2026-05-11 11:16:58', '2026-05-11 11:18:33', 3, NULL);

-- --------------------------------------------------------

--
-- Stand-in structure for view `vue_consommation_moyenne`
-- (See below for the actual view)
--
CREATE TABLE `vue_consommation_moyenne` (
`idmp` int(11)
,`conso_moyenne_jour` decimal(35,2)
);

-- --------------------------------------------------------

--
-- Structure for view `vue_consommation_moyenne`
--
DROP TABLE IF EXISTS `vue_consommation_moyenne`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vue_consommation_moyenne`  AS SELECT `daily`.`idmp` AS `idmp`, round(sum(`daily`.`qtecommande`) / count(0),2) AS `conso_moyenne_jour` FROM (select `lc`.`idmp` AS `idmp`,`lc`.`qtecommande` AS `qtecommande` from (`lignecommande` `lc` join `commande` `c` on(`lc`.`idcommande` = `c`.`idcommande`)) where `c`.`statut` in ('livree','approuvee')) AS `daily` GROUP BY `daily`.`idmp` ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `alertepredictive`
--
ALTER TABLE `alertepredictive`
  ADD PRIMARY KEY (`idalert`),
  ADD KEY `idmp` (`idmp`),
  ADD KEY `iduser_traite` (`iduser_traite`),
  ADD KEY `idx_alerte_statut` (`statut`);

--
-- Indexes for table `commande`
--
ALTER TABLE `commande`
  ADD PRIMARY KEY (`idcommande`),
  ADD UNIQUE KEY `reference` (`reference`),
  ADD KEY `idcreateur` (`idcreateur`),
  ADD KEY `idx_commande_statut` (`statut`),
  ADD KEY `idx_commande_fournisseur` (`idfournisseur`);

--
-- Indexes for table `entrepôt`
--
ALTER TABLE `entrepôt`
  ADD PRIMARY KEY (`identret`);

--
-- Indexes for table `fournisseur`
--
ALTER TABLE `fournisseur`
  ADD PRIMARY KEY (`idfournisseur`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `fournisseur_matiere`
--
ALTER TABLE `fournisseur_matiere`
  ADD PRIMARY KEY (`idfournisseur`,`idmp`),
  ADD KEY `idmp` (`idmp`);

--
-- Indexes for table `lignecommande`
--
ALTER TABLE `lignecommande`
  ADD PRIMARY KEY (`idligne`),
  ADD KEY `idcommande` (`idcommande`),
  ADD KEY `idmp` (`idmp`);

--
-- Indexes for table `lignereception`
--
ALTER TABLE `lignereception`
  ADD PRIMARY KEY (`idlignerec`),
  ADD KEY `idcommande` (`idcommande`),
  ADD KEY `idmp` (`idmp`);

--
-- Indexes for table `logaudit`
--
ALTER TABLE `logaudit`
  ADD PRIMARY KEY (`idlog`),
  ADD KEY `iduser` (`iduser`),
  ADD KEY `idx_log_horodatage` (`horodatage`);

--
-- Indexes for table `magicklink`
--
ALTER TABLE `magicklink`
  ADD PRIMARY KEY (`idtoken`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `idfournisseur` (`idfournisseur`),
  ADD KEY `idcommande` (`idcommande`);

--
-- Indexes for table `matièrepremiere`
--
ALTER TABLE `matièrepremiere`
  ADD PRIMARY KEY (`idmp`),
  ADD UNIQUE KEY `codebarre` (`codebarre`);

--
-- Indexes for table `mouvement_stock`
--
ALTER TABLE `mouvement_stock`
  ADD PRIMARY KEY (`idmouvement`),
  ADD KEY `idstock` (`idstock`),
  ADD KEY `iduser` (`iduser`),
  ADD KEY `idcommande` (`idcommande`),
  ADD KEY `idlignerec` (`idlignerec`);

--
-- Indexes for table `notification`
--
ALTER TABLE `notification`
  ADD PRIMARY KEY (`idnotification`),
  ADD KEY `iduser` (`iduser`);

--
-- Indexes for table `role`
--
ALTER TABLE `role`
  ADD PRIMARY KEY (`idrole`),
  ADD UNIQUE KEY `libellé` (`libellé`);

--
-- Indexes for table `stock`
--
ALTER TABLE `stock`
  ADD PRIMARY KEY (`idstock`),
  ADD UNIQUE KEY `unique_mp_entrepot` (`idmp`,`identret`),
  ADD KEY `identret` (`identret`),
  ADD KEY `idlignerec` (`idlignerec`),
  ADD KEY `idx_stock_mp` (`idmp`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`idusers`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `role_id` (`role_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `alertepredictive`
--
ALTER TABLE `alertepredictive`
  MODIFY `idalert` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `commande`
--
ALTER TABLE `commande`
  MODIFY `idcommande` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `entrepôt`
--
ALTER TABLE `entrepôt`
  MODIFY `identret` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `fournisseur`
--
ALTER TABLE `fournisseur`
  MODIFY `idfournisseur` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `lignecommande`
--
ALTER TABLE `lignecommande`
  MODIFY `idligne` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `lignereception`
--
ALTER TABLE `lignereception`
  MODIFY `idlignerec` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `logaudit`
--
ALTER TABLE `logaudit`
  MODIFY `idlog` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=225;

--
-- AUTO_INCREMENT for table `magicklink`
--
ALTER TABLE `magicklink`
  MODIFY `idtoken` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `matièrepremiere`
--
ALTER TABLE `matièrepremiere`
  MODIFY `idmp` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `mouvement_stock`
--
ALTER TABLE `mouvement_stock`
  MODIFY `idmouvement` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `notification`
--
ALTER TABLE `notification`
  MODIFY `idnotification` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `role`
--
ALTER TABLE `role`
  MODIFY `idrole` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `stock`
--
ALTER TABLE `stock`
  MODIFY `idstock` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `idusers` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `alertepredictive`
--
ALTER TABLE `alertepredictive`
  ADD CONSTRAINT `alertepredictive_ibfk_1` FOREIGN KEY (`idmp`) REFERENCES `matièrepremiere` (`idmp`) ON DELETE CASCADE,
  ADD CONSTRAINT `alertepredictive_ibfk_2` FOREIGN KEY (`iduser_traite`) REFERENCES `users` (`idusers`) ON DELETE SET NULL;

--
-- Constraints for table `commande`
--
ALTER TABLE `commande`
  ADD CONSTRAINT `commande_ibfk_1` FOREIGN KEY (`idcreateur`) REFERENCES `users` (`idusers`) ON DELETE SET NULL,
  ADD CONSTRAINT `commande_ibfk_2` FOREIGN KEY (`idfournisseur`) REFERENCES `fournisseur` (`idfournisseur`) ON DELETE SET NULL;

--
-- Constraints for table `fournisseur_matiere`
--
ALTER TABLE `fournisseur_matiere`
  ADD CONSTRAINT `fournisseur_matiere_ibfk_1` FOREIGN KEY (`idfournisseur`) REFERENCES `fournisseur` (`idfournisseur`) ON DELETE CASCADE,
  ADD CONSTRAINT `fournisseur_matiere_ibfk_2` FOREIGN KEY (`idmp`) REFERENCES `matièrepremiere` (`idmp`) ON DELETE CASCADE;

--
-- Constraints for table `lignecommande`
--
ALTER TABLE `lignecommande`
  ADD CONSTRAINT `lignecommande_ibfk_1` FOREIGN KEY (`idcommande`) REFERENCES `commande` (`idcommande`) ON DELETE CASCADE,
  ADD CONSTRAINT `lignecommande_ibfk_2` FOREIGN KEY (`idmp`) REFERENCES `matièrepremiere` (`idmp`);

--
-- Constraints for table `lignereception`
--
ALTER TABLE `lignereception`
  ADD CONSTRAINT `lignereception_ibfk_1` FOREIGN KEY (`idcommande`) REFERENCES `commande` (`idcommande`) ON DELETE SET NULL,
  ADD CONSTRAINT `lignereception_ibfk_2` FOREIGN KEY (`idmp`) REFERENCES `matièrepremiere` (`idmp`) ON DELETE SET NULL;

--
-- Constraints for table `logaudit`
--
ALTER TABLE `logaudit`
  ADD CONSTRAINT `logaudit_ibfk_1` FOREIGN KEY (`iduser`) REFERENCES `users` (`idusers`) ON DELETE SET NULL;

--
-- Constraints for table `magicklink`
--
ALTER TABLE `magicklink`
  ADD CONSTRAINT `magicklink_ibfk_1` FOREIGN KEY (`idfournisseur`) REFERENCES `fournisseur` (`idfournisseur`) ON DELETE CASCADE,
  ADD CONSTRAINT `magicklink_ibfk_2` FOREIGN KEY (`idcommande`) REFERENCES `commande` (`idcommande`) ON DELETE CASCADE;

--
-- Constraints for table `mouvement_stock`
--
ALTER TABLE `mouvement_stock`
  ADD CONSTRAINT `mouvement_stock_ibfk_1` FOREIGN KEY (`idstock`) REFERENCES `stock` (`idstock`) ON DELETE CASCADE,
  ADD CONSTRAINT `mouvement_stock_ibfk_2` FOREIGN KEY (`iduser`) REFERENCES `users` (`idusers`) ON DELETE SET NULL,
  ADD CONSTRAINT `mouvement_stock_ibfk_3` FOREIGN KEY (`idcommande`) REFERENCES `commande` (`idcommande`) ON DELETE SET NULL,
  ADD CONSTRAINT `mouvement_stock_ibfk_4` FOREIGN KEY (`idlignerec`) REFERENCES `lignereception` (`idlignerec`) ON DELETE SET NULL;

--
-- Constraints for table `notification`
--
ALTER TABLE `notification`
  ADD CONSTRAINT `notification_ibfk_1` FOREIGN KEY (`iduser`) REFERENCES `users` (`idusers`) ON DELETE CASCADE;

--
-- Constraints for table `stock`
--
ALTER TABLE `stock`
  ADD CONSTRAINT `stock_ibfk_1` FOREIGN KEY (`idmp`) REFERENCES `matièrepremiere` (`idmp`) ON DELETE CASCADE,
  ADD CONSTRAINT `stock_ibfk_2` FOREIGN KEY (`identret`) REFERENCES `entrepôt` (`identret`) ON DELETE CASCADE,
  ADD CONSTRAINT `stock_ibfk_3` FOREIGN KEY (`idlignerec`) REFERENCES `lignereception` (`idlignerec`) ON DELETE SET NULL;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `role` (`idrole`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
