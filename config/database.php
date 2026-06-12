<?php
$host = 'localhost';
$db   = 'Projeto_gestao';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Erro ao conectar: " . $e->getMessage());
}

/** @var mysqli|null $conexao */
$conexao = null;

try {
    $conexao = mysqli_connect($host, $user, $pass, $db);
} catch (Exception $e) {
    // Apenas para não travar se o mysqli falhar
}
?>

<!-- no sql vai precisar criar estas tables, caso o banco de dados online cair, precisa criar no local para testar, usando o xampp 
 e criar as mesmas tabelas, usando o mesmo nome do banco de dados, e depois importar os dados do banco online para o local,
usando o phpmyadmin, exportando o banco online e importando no local.

-- Para suportar valores até R$ 1.000.000.000,00, use decimal(12,2) em campos monetários.
-- ALTER TABLE transacoes MODIFY valor DECIMAL(12,2) NULL;
-- ALTER TABLE parcelamentos MODIFY valor_total DECIMAL(12,2) NOT NULL;
-- ALTER TABLE limites MODIFY valor_limite DECIMAL(12,2) NULL;
-- ALTER TABLE objetivos MODIFY valor_meta DECIMAL(12,2) NOT NULL;

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `telefone` varchar(15) NOT NULL,
  `data_cadastro` timestamp NULL DEFAULT current_timestamp(),
  `tipo` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `transacoes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `descricao` varchar(255) DEFAULT NULL,
  `categoria` varchar(100) DEFAULT NULL,
  `valor` decimal(12,2) DEFAULT NULL,
  `data` date DEFAULT NULL,
  `parcelamento_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `transacoes_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `parcelamentos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `descricao` varchar(255) NOT NULL,
  `valor_total` decimal(12,2) NOT NULL,
  `num_parcelas` int(11) NOT NULL,
  `data_inicio` date NOT NULL,
  `data_criacao` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `parcelamentos_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `limites` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `categoria` varchar(100) DEFAULT NULL,
  `valor_limite` decimal(12,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `limites_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `objetivos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `descricao` varchar(255) NOT NULL,
  `valor_meta` decimal(12,2) NOT NULL,
  `prazo` date NOT NULL,
  `data_criacao` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `objetivos_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-->
