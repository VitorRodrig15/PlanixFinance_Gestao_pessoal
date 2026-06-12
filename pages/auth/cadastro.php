<?php
session_start();
require '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $nome = $_POST['nome'];
    $email = $_POST['email'];
    $telefone = $_POST['telefone'];
    
    // 1. Pega a senha que o usuário digitou no formulário
    $senha_pura = $_POST['senha']; 

    // 2. Transforma a senha em um HASH seguro (como você faz no ps.php)
    $senha_segura = password_hash($senha_pura, PASSWORD_DEFAULT);

    try {
        // 3. Salva a $senha_segura no banco de dados
        $stmt = $pdo->prepare("INSERT INTO usuarios (nome, email, senha, telefone) VALUES (?, ?, ?, ?)");
        $stmt->execute([$nome, $email, $senha_segura, $telefone]);
        
        $_SESSION['new_user_registered'] = true;
        header("Location: login.php?sucesso=1");
        exit;
    } catch (PDOException $e) {
        $erro = "Erro ao cadastrar: e-mail já existe.";
    }
}
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>PlanixFinance - Criar Conta</title>
    <link rel="stylesheet" href="../../src/css/style.css"> 
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="icon" type="image/png" href="../../src/assets/logo_icon.png">
    
    <style>
        /* Reutilizando os estilos isolados para manter o padrão */
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

        /* LOGO IDENTICA AO LOGIN */
        .box-logo-site {
            border: 2px solid white; padding: 8px 25px;
            border-radius: 12px; display: inline-block;
            font-size: 2rem; margin-bottom: 25px; align-self: flex-start;
        }
        .box-logo-site .fina { font-weight: 300; }
        .box-logo-site .grossa { font-weight: 800; }

        .lado-form {
            flex: 0.8; background: white; padding: 40px;
            display: flex; flex-direction: column; justify-content: center;
        }

        .lado-form h2 { color: #5d3fd3; margin-bottom: 20px; font-weight: 700; }
        .lado-form input {
            width: 100%; padding: 12px; margin-bottom: 12px;
            border: 1px solid #ddd; border-radius: 10px; box-sizing: border-box;
        }

        .password-field {
            position: relative;
            margin-bottom: 12px;
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
            display: block; text-align: center; margin-top: 15px;
            color: #5d3fd3; text-decoration: none; font-size: 0.85rem;
        }
        .erro-msg { color: #ff4d4d; margin-bottom: 15px; font-size: 0.9rem; }
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
                <h1>Crie sua conta gratuita.</h1>
                <p>Junte-se a milhares de usuários que já organizam sua vida financeira com o Planix.</p>
                
                <div style="margin-top: 20px; font-size: 0.9rem; opacity: 0.9;">
                    <p>✓ Acesso imediato aos dashboards</p>
                    <p>✓ Sem taxas de manutenção</p>
                    <p>✓ Relatórios ilimitados</p>
                    <p>✓ Suporte dedicado</p>
                    <p>✓ Gestão Facil e Segura</p>
                    <p>✓ Dicas e Estudos sobre Gestão Financeira</p>
                </div>
            </div>

            <div class="lado-form">
                <form id="cadastroForm" action="cadastro.php" method="POST">
                    <h2>Cadastrar</h2>
                    
                    <?php if(isset($erro)) echo "<p class='erro-msg'>$erro</p>"; ?>

                    <input type="text" name="nome" placeholder="Nome Completo" required>
                    <input type="email" name="email" placeholder="E-mail" required>
                    <input type="text" name="telefone" placeholder="Telefone (opcional)">
                    <div class="password-field">
                        <input type="password" id="cadastroSenha" name="senha" placeholder="Crie uma senha" required>
                        <button type="button" class="toggle-password" onclick="togglePasswordVisibility('cadastroSenha', this)" aria-label="Mostrar senha" title="Mostrar senha">
                            <i class="fa-solid fa-eye" aria-hidden="true"></i>
                        </button>
                    </div>
                    
                    <button type="submit" class="btn-planix">Finalizar Cadastro</button>
                    <a href="login.php" class="link-alternativo">Já tem uma conta? Entrar agora</a>
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
