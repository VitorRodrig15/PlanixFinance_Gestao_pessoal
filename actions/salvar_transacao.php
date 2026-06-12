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
$descricao = mysqli_real_escape_string($conexao, trim($_POST['description'] ?? ''));
$categoria = mysqli_real_escape_string($conexao, trim($_POST['category'] ?? ''));
$valor_raw = str_replace(',', '.', trim($_POST['amount'] ?? '0'));
$valor = abs(floatval($valor_raw));
$data = trim($_POST['date'] ?? '');

if ($data === '') {
    $data = date('Y-m-d');
}

if ($descricao === '' || $categoria === '' || $valor <= 0) {
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

if (strtolower($categoria) === 'entradas' && $valor < 0) {
    $valor = abs($valor);
}

$sql = "INSERT INTO transacoes (usuario_id, descricao, categoria, valor, data) 
        VALUES ('$usuario_id', '$descricao', '$categoria', '$valor', '$data')";

if (mysqli_query($conexao, $sql)) {
    $_SESSION['message'] = "Transação adicionada com sucesso!";
    redirectToIndexWithMonthYear();
} else {
    echo "Erro ao salvar: " . mysqli_error($conexao);
}
?>