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
$valor_total_raw = str_replace(',', '.', trim($_POST['amount'] ?? '0'));
$valor_total = abs(floatval($valor_total_raw));
$num_parcelas = intval($_POST['num_parcelas'] ?? 0);
$mes_inicial = intval($_POST['mes_inicial'] ?? 0);
$data_inicio = $_POST['date'] ?? '';
$categoria = "Parcelamento";

if ($descricao === '' || $valor_total <= 0 || $valor_total > 1000000000 || $num_parcelas < 2 || $num_parcelas > 60 || $data_inicio === '') {
    $_SESSION['message'] = "Preencha corretamente os dados do parcelamento. O valor máximo permitido é R$ 1.000.000.000,00.";
    redirectToIndexWithMonthYear();
}

if ($mes_inicial < 0) {
    $mes_inicial = 0;
}

$valor_parcela = $valor_total / $num_parcelas;

$sql_mestre = "INSERT INTO parcelamentos (usuario_id, descricao, valor_total, num_parcelas, data_inicio)
               VALUES ('$usuario_id', '$descricao', '$valor_total', '$num_parcelas', '$data_inicio')";

if (!mysqli_query($conexao, $sql_mestre)) {
    die("Erro ao salvar parcelamento: " . mysqli_error($conexao));
}

$parcelamento_id = mysqli_insert_id($conexao);

for ($i = 1; $i <= $num_parcelas; $i++) {
    $data_parcela = date('Y-m-d', strtotime("+" . ($mes_inicial + $i - 1) . " month", strtotime($data_inicio)));
    $desc_formatada = mysqli_real_escape_string($conexao, $descricao . " ($i/$num_parcelas)");
    $valor_negativo = -abs($valor_parcela);

    $sql_transacao = "INSERT INTO transacoes (usuario_id, descricao, valor, categoria, data, parcelamento_id)
                      VALUES ('$usuario_id', '$desc_formatada', '$valor_negativo', '$categoria', '$data_parcela', '$parcelamento_id')";

    if (!mysqli_query($conexao, $sql_transacao)) {
        die("Erro ao salvar parcela: " . mysqli_error($conexao));
    }
}

$_SESSION['message'] = "Parcelamento adicionado com sucesso!";
redirectToIndexWithMonthYear();
exit;
?>
