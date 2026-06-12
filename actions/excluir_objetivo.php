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

$usuario_id = $_SESSION['usuario_id'];
$id = intval($_GET['id'] ?? 0);

if ($id <= 0) {
    $_SESSION['message'] = "Objetivo inválido.";
    redirectToIndexWithMonthYear();
}

$sql = "DELETE FROM objetivos WHERE id = '$id' AND usuario_id = '$usuario_id'";

if (mysqli_query($conexao, $sql)) {
    $_SESSION['message'] = "Objetivo excluído com sucesso!";
    redirectToIndexWithMonthYear();
} else {
    echo "Erro ao excluir objetivo: " . mysqli_error($conexao);
}
?>