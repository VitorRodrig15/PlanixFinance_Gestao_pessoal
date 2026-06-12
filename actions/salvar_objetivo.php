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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    redirectToIndexWithMonthYear();
}

$usuario_id = $_SESSION['usuario_id'];
$descricao = mysqli_real_escape_string($conexao, trim($_POST['descricao'] ?? ''));
$valor_meta = str_replace(',', '.', trim($_POST['valor_meta'] ?? '0'));
$valor_meta = floatval($valor_meta);
$prazo = $_POST['prazo'] ?? '';

if (!$descricao || !$valor_meta || !$prazo || $valor_meta > 1000000000) {
    $_SESSION['message'] = "Preencha todos os campos do objetivo corretamente e use até R$ 1.000.000.000,00.";
    redirectToIndexWithMonthYear();
}

$sql = "INSERT INTO objetivos (usuario_id, descricao, valor_meta, prazo) VALUES ('$usuario_id', '$descricao', '$valor_meta', '$prazo')";

if (mysqli_query($conexao, $sql)) {
    $_SESSION['message'] = "Objetivo salvo com sucesso!";
    redirectToIndexWithMonthYear();
} else {
    echo "Erro ao salvar objetivo: " . mysqli_error($conexao);
}
?>