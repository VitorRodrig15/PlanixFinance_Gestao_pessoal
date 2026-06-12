<?php
session_start();
require '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $email = $_POST['email'];
    $senha_digitada = $_POST['senha'];

    // 1. Busca o usuário apenas pelo e-mail
    $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    $usuario = $stmt->fetch();

    // 2. Verifica se o usuário existe E se a senha bate com o hash do banco
    if ($usuario && password_verify($senha_digitada, $usuario['senha'])) {
        // Senha correta! Inicia a sessão
        $_SESSION['usuario_id'] = $usuario['id'];
        $_SESSION['usuario_nome'] = $usuario['nome'];

        if (isset($_SESSION['new_user_registered']) && $_SESSION['new_user_registered']) {
            $_SESSION['welcome_type'] = 'new';
            unset($_SESSION['new_user_registered']);
        } else {
            $_SESSION['welcome_type'] = 'existing';
        }
        
        header("Location: ../../index.php");
        exit;
    } else {
        $erro = "E-mail ou senha incorretos.";
    }
}

if (isset($_GET['sucesso'])) {
    $sucesso = "Conta criada com sucesso! Faça login para acessar seu painel.";
}
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>PlanixFinance - Acesso</title>
    <link rel="stylesheet" href="../../src/css/style.css"> 
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="icon" type="image/png" href="../../src/assets/logo_icon.png">
    
    <style>
        /* Estilos Isolados para não quebrar seu CSS de 1000 linhas */
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

        /* Lado Esquerdo - Info */
        .lado-info {
            flex: 1; padding: 50px; color: white;
            display: flex; flex-direction: column; justify-content: center;
        }

        /* LOGO IGUAL AO PRINT */
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

        /* Lado Direito - Form */
        .lado-form {
            flex: 0.8; background: white; padding: 50px;
            display: flex; flex-direction: column; justify-content: center;
        }

        .lado-form h2 { color: #5d3fd3; margin-bottom: 25px; font-weight: 700; }
        .lado-form input {
            width: 100%; padding: 14px; margin-bottom: 15px;
            border: 1px solid #ddd; border-radius: 10px; box-sizing: border-box;
        }

        .password-field {
            position: relative;
            margin-bottom: 15px;
        }

        .password-field input {
            padding-right: 48px;
            margin-bottom: 0;
        }

        .toggle-password {
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            width: 34px;
            height: 34px;
            border: none;
            background: transparent;
            color: #5d3fd3;
            cursor: pointer;
            box-shadow: none;
            padding: 0;
            font-size: 1rem;
        }

        .toggle-password:hover,
        .toggle-password:focus-visible {
            background: rgba(93, 63, 211, 0.08);
            transform: translateY(-50%);
            outline: 2px solid rgba(93, 63, 211, 0.25);
        }

        .btn-planix {
            width: 100%; padding: 14px; background: #5d3fd3;
            color: white; border: none; border-radius: 10px;
            font-weight: bold; cursor: pointer; transition: 0.3s;
        }
        .btn-planix:hover { background: #4a32a8; }

        .link-alternativo {
            display: block; text-align: center; margin-top: 20px;
            color: #5d3fd3; text-decoration: none; font-size: 0.9rem;
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
                <h1>Gestão de alto nível.</h1>
                <p>Domine suas finanças com ferramentas profissionais de análise e projeção.</p>
                
                <ul class="lista-funcionalidades">
                    <li>Dashboards de Fluxo de Caixa</li>
                    <li>Controle de Metas e Economias</li>
                    <li>Relatórios de Gastos Mensais</li>
                    <li>Gestão e Acessibilidade</li>
                    <li>Estudos sobre Gestão Financeira e Dicas</li>
                </ul>
            </div>

            <div class="lado-form">
                <form action="login.php" method="POST">
                    <h2>Entrar</h2>
                    <?php if (isset($sucesso)): ?>
                        <div style="margin-bottom: 18px; padding: 12px 14px; border-radius: 12px; background: #e4f7ff; color: #064b74; font-size: 0.95rem;">
                            <?php echo htmlspecialchars($sucesso); ?>
                        </div>
                    <?php endif; ?>
                    <input type="email" name="email" placeholder="E-mail profissional" required>
                    <div class="password-field">
                        <input type="password" id="loginSenha" name="senha" placeholder="Senha" required>
                        <button type="button" class="toggle-password" onclick="togglePasswordVisibility('loginSenha', this)" aria-label="Mostrar senha" title="Mostrar senha">
                            <i class="fa-solid fa-eye" aria-hidden="true"></i>
                        </button>
                    </div>
                    <button type="submit" class="btn-planix">Acessar Painel</button>
                    <a href="esqueci_senha.php" class="link-alternativo">Esqueci minha senha</a>
                    <a href="cadastro.php" class="link-alternativo">Não tem conta? Criar agora</a>
                </form>
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

        function togglePasswordVisibility(inputId, button) {
            const input = document.getElementById(inputId);
            const icon = button.querySelector('i');
            const isPassword = input.type === 'password';

            input.type = isPassword ? 'text' : 'password';
            icon.className = isPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
            button.setAttribute('aria-label', isPassword ? 'Ocultar senha' : 'Mostrar senha');
            button.setAttribute('title', isPassword ? 'Ocultar senha' : 'Mostrar senha');
        }
    </script>
</body>
</html>
