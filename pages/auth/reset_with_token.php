<?php
session_start();
require '../../config/database.php';

$step = 'form';
$mensagem = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    $email = filter_input(INPUT_POST, 'email', FILTER_VALIDATE_EMAIL);

    if ($action === 'verify_token') {
        $token = trim($_POST['token'] ?? '');
        if ($email && $token) {
            // Busca último token válido
            $stmt = $pdo->prepare("SELECT * FROM password_resets WHERE email = ? AND expires_at >= NOW() ORDER BY created_at DESC LIMIT 1");
            $stmt->execute([$email]);
            $row = $stmt->fetch();
            if ($row && password_verify($token, $row['token_hash'])) {
                // Token válido — permitir redefinir
                $_SESSION['pwreset_email'] = $email;
                $_SESSION['pwreset_id'] = $row['id'];
                $step = 'reset';
            } else {
                $mensagem = 'Código inválido ou expirado. Peça um novo código.';
                $step = 'form';
            }
        } else {
            $mensagem = 'Informe e-mail e código.';
            $step = 'form';
        }
    }

    if ($action === 'do_reset') {
        // Validar sessão ou revalidar token
        $newpass = $_POST['nova_senha'] ?? '';
        $confirm = $_POST['confirm_senha'] ?? '';
        $reset_id = $_SESSION['pwreset_id'] ?? null;
        $reset_email = $_SESSION['pwreset_email'] ?? null;

        if (!$reset_email || !$reset_id) {
            $mensagem = 'Sem permissão para redefinir. Verifique o código primeiro.';
            $step = 'form';
        } elseif (!$newpass || strlen($newpass) < 6) {
            $mensagem = 'A senha deve ter ao menos 6 caracteres.';
            $step = 'reset';
        } elseif ($newpass !== $confirm) {
            $mensagem = 'As senhas não conferem.';
            $step = 'reset';
        } else {
            // Re-validate token entry exists and not expired
            $stmt = $pdo->prepare("SELECT * FROM password_resets WHERE id = ? AND email = ? AND expires_at >= NOW() LIMIT 1");
            $stmt->execute([$reset_id, $reset_email]);
            $row = $stmt->fetch();
            if (!$row) {
                $mensagem = 'Código expirado ou inválido. Solicite outro.';
                $step = 'form';
            } else {
                // Atualiza senha do usuário
                $pwd_hash = password_hash($newpass, PASSWORD_DEFAULT);
                $u = $pdo->prepare("UPDATE usuarios SET senha = ? WHERE email = ?");
                $u->execute([$pwd_hash, $reset_email]);

                // Remove tokens existentes para o e-mail
                $d = $pdo->prepare("DELETE FROM password_resets WHERE email = ?");
                $d->execute([$reset_email]);

                // Limpar sessão
                unset($_SESSION['pwreset_email'], $_SESSION['pwreset_id']);

                $mensagem = 'Senha atualizada com sucesso. Você já pode acessar o sistema.';
                $step = 'done';
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="utf-8">
    <title>Redefinir senha - PlanixFinance</title>
    <link rel="stylesheet" href="../../src/css/style.css">
    <link rel="icon" href="../../src/assets/logo_icon.png">
    <style>
        /* Pequenos ajustes para o formulário */
        .reset-card { max-width: 720px; margin: 3rem auto; padding: 2rem; }
        .form-row { margin-bottom: 1rem; }
    </style>
</head>
<body>
  <main class="container">
    <section class="card reset-card">
      <h2>Redefinir Senha 🔐</h2>

      <?php if ($mensagem): ?>
        <div class="mensagem-aviso"><?php echo htmlspecialchars($mensagem); ?></div>
      <?php endif; ?>

      <?php if ($step === 'form'): ?>
        <p>Digite o e-mail usado no cadastro e o código que você recebeu por e-mail.</p>
        <form method="POST">
          <div class="form-row">
            <input type="email" name="email" placeholder="Seu e-mail cadastrado" required>
          </div>
          <div class="form-row">
            <input type="text" name="token" placeholder="Código (6 dígitos)" required>
          </div>
          <input type="hidden" name="action" value="verify_token">
          <div class="form-row">
            <button class="btn-resource" type="submit">Verificar código</button>
          </div>
        </form>
      <?php elseif ($step === 'reset'): ?>
        <p>Insira a nova senha para a conta <strong><?php echo htmlspecialchars($_SESSION['pwreset_email'] ?? ''); ?></strong></p>
        <form method="POST">
          <div class="form-row">
            <input type="password" name="nova_senha" placeholder="Nova senha" required>
          </div>
          <div class="form-row">
            <input type="password" name="confirm_senha" placeholder="Confirmar nova senha" required>
          </div>
          <input type="hidden" name="action" value="do_reset">
          <div class="form-row">
            <button class="btn-resource" type="submit">Redefinir senha</button>
          </div>
        </form>
      <?php else: ?>
        <p><?php echo htmlspecialchars($mensagem); ?></p>
        <p><a class="btn-resource" href="login.php">Voltar ao login</a></p>
      <?php endif; ?>

    </section>
  </main>
</body>
</html>
