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
$id = intval($_POST['id'] ?? 0);
$descricao = mysqli_real_escape_string($conexao, trim($_POST['description'] ?? ''));
$categoria = mysqli_real_escape_string($conexao, trim($_POST['category'] ?? ''));
$valor_raw = str_replace(',', '.', trim($_POST['amount'] ?? '0'));
$valor = abs(floatval($valor_raw));
$data = $_POST['date'] ?? '';

if ($id <= 0 || $descricao === '' || $categoria === '' || $valor <= 0 || $data === '') {
    $_SESSION['message'] = "Preencha corretamente os dados da transação.";
    redirectToIndexWithMonthYear();
}

if ($valor > 1000000000) {
    $_SESSION['message'] = "Valor máximo permitido é R$ 1.000.000.000,00.";
    redirectToIndexWithMonthYear();
}

if (strtolower($categoria) !== 'entradas') {
    $valor = -$valor;
}

$sql = "UPDATE transacoes
        SET descricao = '$descricao',
            categoria = '$categoria',
            valor = '$valor',
            data = '$data'
        WHERE id = '$id' AND usuario_id = '$usuario_id'";

if (mysqli_query($conexao, $sql)) {
    $_SESSION['message'] = "Transação atualizada com sucesso!";
} else {
    $_SESSION['message'] = "Erro ao atualizar transação: " . mysqli_error($conexao);
}

redirectToIndexWithMonthYear();
?>
