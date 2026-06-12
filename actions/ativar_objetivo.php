<?php
session_start();
include "../config/database.php";
/** @var mysqli $conexao */

if (!isset($_SESSION['usuario_id'])) {
    header("Location: ../pages/auth/login.php");
    exit;
}

function redirectToIndexWithMonthYear() {
    $month = trim($_REQUEST['month'] ?? '');
    $year = trim($_REQUEST['year'] ?? '');
    $url = '../index.php';

    if ($month !== '' && $year !== '') {
        $url .= '?month=' . urlencode($month) . '&year=' . urlencode($year);
    }

    header("Location: $url");
    exit;
}

$usuario_id = intval($_SESSION['usuario_id']);
$id = intval($_GET['id'] ?? 0);

if ($id <= 0) {
    $_SESSION['message'] = "Objetivo invalido.";
    redirectToIndexWithMonthYear();
}

function ensureObjetivoColumn($conexao, $column, $definition) {
    $column = mysqli_real_escape_string($conexao, $column);
    $result = mysqli_query($conexao, "SHOW COLUMNS FROM objetivos LIKE '$column'");

    if ($result && mysqli_num_rows($result) === 0) {
        mysqli_query($conexao, "ALTER TABLE objetivos ADD COLUMN $column $definition");
    }
}

ensureObjetivoColumn($conexao, "ativo", "TINYINT(1) NOT NULL DEFAULT 0");
ensureObjetivoColumn($conexao, "concluido", "TINYINT(1) NOT NULL DEFAULT 0");

$objetivoSql = "SELECT id FROM objetivos WHERE id = '$id' AND usuario_id = '$usuario_id' AND concluido = 0 LIMIT 1";
$objetivoResult = mysqli_query($conexao, $objetivoSql);

if (!$objetivoResult || mysqli_num_rows($objetivoResult) === 0) {
    $_SESSION['message'] = "Objetivo nao encontrado ou ja concluido.";
    redirectToIndexWithMonthYear();
}

mysqli_query($conexao, "UPDATE objetivos SET ativo = 0 WHERE usuario_id = '$usuario_id'");
$updateSql = "UPDATE objetivos SET ativo = 1 WHERE id = '$id' AND usuario_id = '$usuario_id'";

if (mysqli_query($conexao, $updateSql)) {
    $_SESSION['message'] = "Objetivo ativado com sucesso!";
    redirectToIndexWithMonthYear();
} else {
    echo "Erro ao ativar objetivo: " . mysqli_error($conexao);
}
?>
