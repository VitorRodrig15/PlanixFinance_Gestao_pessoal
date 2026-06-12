<?php
session_start();
session_destroy(); // Limpa os dados de login
header("Location: login.php"); // Manda de volta para a tela de login
exit;
?>