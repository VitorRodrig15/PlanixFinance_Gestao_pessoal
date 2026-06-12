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

ensureObjetivoColumn($conexao, "concluido", "TINYINT(1) NOT NULL DEFAULT 0");
ensureObjetivoColumn($conexao, "data_conclusao", "DATETIME NULL");
ensureObjetivoColumn($conexao, "ativo", "TINYINT(1) NOT NULL DEFAULT 0");

$objetivoSql = "SELECT * FROM objetivos WHERE id = '$id' AND usuario_id = '$usuario_id' LIMIT 1";
$objetivoResult = mysqli_query($conexao, $objetivoSql);
$objetivo = $objetivoResult ? mysqli_fetch_assoc($objetivoResult) : null;

if (!$objetivo) {
    $_SESSION['message'] = "Objetivo nao encontrado.";
    redirectToIndexWithMonthYear();
}

if (!empty($objetivo['concluido'])) {
    $_SESSION['message'] = "Este objetivo ja foi concluido.";
    redirectToIndexWithMonthYear();
}

if (empty($objetivo['ativo'])) {
    $_SESSION['message'] = "Ative este objetivo antes de concluir.";
    redirectToIndexWithMonthYear();
}

$prazo = $objetivo['prazo'];
$hoje = date('Y-m-d');
$fim = strtotime($hoje) > strtotime($prazo) ? $prazo : $hoje;

$transacoesSql = "
    SELECT categoria, valor
    FROM transacoes
    WHERE usuario_id = '$usuario_id'
      AND data <= '$fim'
";
$transacoesResult = mysqli_query($conexao, $transacoesSql);
$saldoAcumulado = 0;

while ($transacao = $transacoesResult ? mysqli_fetch_assoc($transacoesResult) : null) {
    $valor = floatval($transacao['valor']);

    if (strtolower($transacao['categoria']) !== 'entradas' && $valor > 0) {
        $valor = -$valor;
    }

    if (strtolower($transacao['categoria']) === 'entradas' && $valor < 0) {
        $valor = abs($valor);
    }

    $saldoAcumulado += $valor;
}

$valorMeta = floatval($objetivo['valor_meta']);

if ($valorMeta <= 0 || $saldoAcumulado < $valorMeta) {
    $_SESSION['message'] = "Este objetivo ainda nao chegou a 100%. Continue acompanhando!";
    redirectToIndexWithMonthYear();
}

$descricao = $objetivo['descricao'];
$updateSql = "UPDATE objetivos SET concluido = 1, data_conclusao = NOW() WHERE id = '$id' AND usuario_id = '$usuario_id'";

if (mysqli_query($conexao, $updateSql)) {
    $_SESSION['message'] = "Parabens! Objetivo \"" . $descricao . "\" concluido com sucesso!";
    redirectToIndexWithMonthYear();
} else {
    echo "Erro ao concluir objetivo: " . mysqli_error($conexao);
}
?>
