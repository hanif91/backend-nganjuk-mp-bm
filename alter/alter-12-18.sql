CREATE TABLE `web_public_user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `nama` varchar(100) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `provider` enum('google','credential') NOT NULL,
  `provider_id` varchar(255) DEFAULT NULL,
  `nomor_telepon` varchar(20) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `alamat` text,
  `status` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB;

CREATE TABLE `web_nomor_pelanggan` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nomor_pelanggan` varchar(255) NOT NULL,
  `id_user` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `id_user` (`id_user`),
  CONSTRAINT `web_nomor_pelanggan_ibfk_1` FOREIGN KEY (`id_user`) REFERENCES `web_public_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;



CREATE TABLE `web_user_aduan` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `pengaduan_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `pengaduan_id` (`pengaduan_id`),
  CONSTRAINT `web_user_aduan_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `web_public_user` (`id`),
) ENGINE=InnoDB;

CREATE TABLE `web_user_bcmandiri` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `stanskrg` int NOT NULL,
  `periode` varchar(10) NOT NULL,
  `no_pelanggan` varchar(20) NOT NULL,
  `nama` varchar(100) NOT NULL,
  `alamat` text,
  `pakaiskrg` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;



CREATE TABLE `session` (
  `id` varchar(255) NOT NULL,
  `userid` int NOT NULL,
  `expires_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userid` (`userid`),
  CONSTRAINT `session_ibfk_1` FOREIGN KEY (`userid`) REFERENCES `web_public_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;