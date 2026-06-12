<?php
session_start();
require '../../config/database.php';

if (!isset($_SESSION['usuario_id'])) {
    header("Location: login.php");
    exit;
}

$stmt = $pdo->prepare("SELECT nome, email, telefone FROM usuarios WHERE id = ?");
$stmt->execute([$_SESSION['usuario_id']]);
$dados = $stmt->fetch();
?>

<!DOCTYPE html>
<html>
<body>
    <h1>Bem-vindo, <?php echo htmlspecialchars($dados['nome']); ?></h1>
    <p><strong>E-mail:</strong> <?php echo $dados['email']; ?></p>
    <p><strong>Telefone:</strong> <?php echo $dados['telefone']; ?></p>
    <a href="logout.php">Sair</a>
</body>
</html>