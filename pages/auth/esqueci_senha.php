<?php
session_start();
require '../../config/database.php';

$mensagem = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = filter_input(INPUT_POST, 'email', FILTER_VALIDATE_EMAIL);
    if ($email) {
        // Gera token numérico de 6 dígitos para facilitar digitação
        try {
            $token = random_int(100000, 999999);
        } catch (Exception $e) {
            $token = mt_rand(100000, 999999);
        }

        // Hash do token para armazenamento seguro
        $token_hash = password_hash((string)$token, PASSWORD_DEFAULT);
        $expires_at = date('Y-m-d H:i:s', time() + 3600); // 1 hora

        // Insere ou atualiza tabela password_resets
        $stmt = $pdo->prepare("INSERT INTO password_resets (email, token_hash, expires_at, created_at) VALUES (?, ?, ?, NOW())");
        $stmt->execute([$email, $token_hash, $expires_at]);

        // Monta e-mail
        $subject = 'PlanixFinance - Código para redefinição de senha';
        $message = "Olá,\n\nRecebemos uma solicitação para redefinir a senha da sua conta PlanixFinance.\n\nSeu código para redefinição é:\n\n" . $token . "\n\nEste código expira em 1 hora.\n\nSe você não solicitou, ignore esta mensagem.\n\nAtenciosamente,\nEquipe PlanixFinance";
        $headers = "From: no-reply@planixfinance.local" . "\r\n";
        $headers .= "Content-Type: text/plain; charset=UTF-8" . "\r\n";

        // Envia e-mail (no XAMPP local pode exigir configuração do sendmail)
        @mail($email, $subject, $message, $headers);

        $mensagem = 'Se este e-mail estiver cadastrado, você receberá um código para redefinir sua senha (verifique a caixa de entrada).';
    } else {
        $mensagem = 'Por favor, informe um e-mail válido.';
    }
}
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>PlanixFinance - Recuperar Senha</title>
    <link rel="stylesheet" href="../../src/css/style.css"> 
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="icon" type="image/png" href="../../src/assets/logo_icon.png">
    <style>
        .planix-viewport {
            margin: 0; padding: 0; height: 100vh; width: 100vw;
            display: flex; align-items: center; justify-content: center;
            font-family: 'Poppins', sans-serif; position: relative; overflow: hidden;
        }

        #video-bg-site {
            position: absolute; top: 50%; left: 50%;
            min-width: 100%; min-height: 100%;
            transform: translate(-50%, -50%); z-index: -2; object-fit: cover;
        }

        .overlay-site {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: linear-gradient(135deg, rgba(93, 63, 211, 0.4), rgba(20, 10, 60, 0.7));
            z-index: -1;
        }

        .container-acesso {
            display: flex; width: 900px; max-width: 95%;
            background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(12px);
            border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.2);
            overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.3);
        }

        .lado-info {
            flex: 1; padding: 50px; color: white;
            display: flex; flex-direction: column; justify-content: center;
        }

        .box-logo-site {
            border: 2px solid white; padding: 8px 25px;
            border-radius: 12px; display: inline-block;
            font-size: 2rem; margin-bottom: 25px; align-self: flex-start;
        }
        .box-logo-site .fina { font-weight: 300; }
        .box-logo-site .grossa { font-weight: 800; }

        .lista-funcionalidades { list-style: none; padding: 0; margin-top: 20px; }
        .lista-funcionalidades li { margin-bottom: 12px; font-size: 0.95rem; display: flex; align-items: center; }
        .lista-funcionalidades li::before { content: "✓"; margin-right: 10px; color: #00d4ff; font-weight: bold; }

        .lado-form {
            flex: 0.8; background: white; padding: 50px;
            display: flex; flex-direction: column; justify-content: center;
        }

        .lado-form h2 { color: #5d3fd3; margin-bottom: 25px; font-weight: 700; }
        .lado-form input {
            width: 100%; padding: 14px; margin-bottom: 15px;
            border: 1px solid #ddd; border-radius: 10px; box-sizing: border-box;
        }

        .btn-planix {
            width: 100%; padding: 14px; background: #5d3fd3;
            color: white; border: none; border-radius: 10px;
            font-weight: bold; cursor: pointer; transition: 0.3s;
        }
        .btn-planix:hover { background: #4a32a8; }

        .link-alternativo {
            display: block; text-align: center; margin-top: 18px;
            color: #5d3fd3; text-decoration: none; font-size: 0.95rem;
        }

        .mensagem-aviso {
            margin-top: 1rem; padding: 1rem 1rem;
            border-radius: 0.85rem; background: #f7f5ff;
            border: 1px solid #d6c8ff; color: #3f2175;
            line-height: 1.5;
        }
    </style>
</head>
<body>
    <div class="planix-viewport">
        <video autoplay muted id="video-bg-site" playsinline>
            <source src="../../src/assets/videos/fundo_1.mp4" type="video/mp4">
        </video>
        <div class="overlay-site"></div>

        <div class="container-acesso">
            <div class="lado-info">
                <div class="box-logo-site">
                    <span class="fina">Planix</span><span class="grossa">Finance</span>
                </div>
                <h1>Recupere sua senha</h1>
                <p>Digite seu e-mail e envie a solicitação para redefinição de senha.</p>
                <ul class="lista-funcionalidades">
                    <li>Envio de link de recuperação</li>
                    <li>Proteção com e-mail cadastrado</li>
                    <li>Fácil acesso em poucos passos</li>
                </ul>
            </div>

            <div class="lado-form">
                <form action="esqueci_senha.php" method="POST">
                    <h2>Esqueci minha senha</h2>
                    <input type="email" name="email" placeholder="Seu e-mail cadastrado" required>
                    <button type="submit" class="btn-planix">Enviar link de recuperação</button>
                    <a href="login.php" class="link-alternativo">Voltar ao login</a>
                </form>
                <?php if ($mensagem): ?>
                    <div class="mensagem-aviso"><?php echo htmlspecialchars($mensagem); ?></div>
                <?php endif; ?>
            </div>
        </div>
    </div>
    <script>
        const video = document.getElementById('video-bg-site');
        let index = 1;
        video.onended = () => {
            index = index < 5 ? index + 1 : 1;
            video.src = `../../src/assets/videos/fundo_${index}.mp4`;
            video.play();
        };
        </script>
</body>
</html>
