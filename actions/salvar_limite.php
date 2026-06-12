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
$categoria  = mysqli_real_escape_string($conexao, trim($_POST['categoriaLimite'] ?? ''));
$valor = str_replace(',', '.', trim($_POST['valorLimite'] ?? '0'));
$valor = floatval($valor);

if ($categoria === '' || $valor <= 0 || $valor > 1000000000) {
    $_SESSION['message'] = "Informe um valor de limite válido até R$ 1.000.000.000,00.";
    redirectToIndexWithMonthYear();
}

$check_query = "SELECT id FROM limites WHERE usuario_id = '$usuario_id' AND categoria = '$categoria'";
$result = mysqli_query($conexao, $check_query);

if (mysqli_num_rows($result) > 0) {
    $sql = "UPDATE limites 
            SET valor_limite = '$valor' 
            WHERE usuario_id = '$usuario_id' AND categoria = '$categoria'";
} else {
    $sql = "INSERT INTO limites (usuario_id, categoria, valor_limite) 
            VALUES ('$usuario_id', '$categoria', '$valor')";
}

if (mysqli_query($conexao, $sql)) {
    $_SESSION['message'] = "Limite de categoria definido com sucesso!";
    redirectToIndexWithMonthYear();
} else {
    echo "Erro ao salvar limite: " . mysqli_error($conexao);
}
?>