<?php
session_start();
setlocale(LC_TIME, 'pt_BR.UTF-8', 'pt_BR', 'Portuguese_Brazil');
include "config/database.php"; 

function formatarValorAbreviadoPHP($valor) {
    $valor = floatval($valor);
    $sinal = $valor < 0 ? '-R$ ' : 'R$ ';
    $absValor = abs($valor);

    if ($absValor >= 1000000000) {
        $numero = $absValor / 1000000000;
        $formatted = number_format($numero, $absValor >= 10000000000 ? 0 : 1, ',', '.');
        $formatted = preg_replace('/,0$/', '', $formatted);
        return $sinal . $formatted . 'B';
    }

    if ($absValor >= 1000000) {
        $numero = $absValor / 1000000;
        $formatted = number_format($numero, $absValor >= 10000000 ? 0 : 1, ',', '.');
        $formatted = preg_replace('/,0$/', '', $formatted);
        return $sinal . $formatted . 'M';
    }

    return $sinal . number_format($absValor, 2, ',', '.');
}

$conexao = mysqli_connect($host, $user, $pass, $db);

if (!isset($_SESSION['usuario_id'])) {
    header("Location: pages/auth/login.php");
    exit;
}

// Verificar mensagens de sessão
$welcomeType = $_SESSION['welcome_type'] ?? null;
$welcomeName = $_SESSION['usuario_nome'] ?? 'Usuário';

if (isset($_SESSION['message'])) {
    echo "<script>var notificationMessage = '" . addslashes($_SESSION['message']) . "';</script>";
    unset($_SESSION['message']);
}

if ($welcomeType === 'existing' && !isset($_SESSION['message'])) {
    $message = "Bem-vindo de volta, {$welcomeName}! Vamos ver suas finanças do mês.";
    echo "<script>var notificationMessage = '" . addslashes($message) . "';</script>";
}

if ($welcomeType === 'new') {
    $welcomeTitle = "Boas-vindas, {$welcomeName}!";
    $welcomeText = "Seu painel PlanixFinance está pronto. Aqui vão três passos rápidos para começar:";
    echo "<script>var welcomeType = 'new'; var welcomeTitle = '" . addslashes($welcomeTitle) . "'; var welcomeText = '" . addslashes($welcomeText) . "';</script>";
}

unset($_SESSION['welcome_type']);

$month = isset($_GET['month']) ? intval($_GET['month']) : date('m');
$year = isset($_GET['year']) ? intval($_GET['year']) : date('Y');
$selectedMonth = str_pad($month, 2, '0', STR_PAD_LEFT);

// 1. BUSCA NOVA: Pegar as transações para o histórico
$usuario_id = $_SESSION['usuario_id'];

// Consulta para pegar as transações do usuário, ordenando da mais recente para a mais antiga
$query_transacoes = "SELECT * FROM transacoes WHERE usuario_id = '$usuario_id' AND SUBSTRING(data, 1, 4) = '$year' AND SUBSTRING(data, 6, 2) = '$selectedMonth' ORDER BY data DESC";
$res_transacoes = mysqli_query($conexao, $query_transacoes);

$query_transacoes_objetivos = "SELECT * FROM transacoes WHERE usuario_id = '$usuario_id' ORDER BY data ASC";
$res_transacoes_objetivos = mysqli_query($conexao, $query_transacoes_objetivos);

// 2. BUSCA NOVA: Pegar os parcelamentos salvos para o histórico
$query_parcelamentos = "SELECT * FROM parcelamentos WHERE usuario_id = '$usuario_id' ORDER BY data_criacao DESC";
$res_parcelamentos = mysqli_query($conexao, "SELECT * FROM parcelamentos WHERE usuario_id = '$usuario_id' ORDER BY data_criacao DESC");

// Pegamos o ID do usuário que está na sessão
$query_limites = "SELECT * FROM limites WHERE usuario_id = '$usuario_id'";
$res_limites = mysqli_query($conexao, $query_limites);

$query_objetivos = "SELECT * FROM objetivos WHERE usuario_id = '$usuario_id' ORDER BY data_criacao DESC";
$res_objetivos = mysqli_query($conexao, $query_objetivos);

// Cálculos de saldo para os cards - Por mês
$q_entradas = "SELECT SUM(valor) as total FROM transacoes WHERE usuario_id = '$usuario_id' AND categoria = 'Entradas' AND SUBSTRING(data, 1, 4) = '$year' AND SUBSTRING(data, 6, 2) = '$selectedMonth'";
$res_entradas = mysqli_query($conexao, $q_entradas);
$row_entradas = mysqli_fetch_assoc($res_entradas);
$totalEntradas = $row_entradas['total'] ?? 0;

$q_saidas = "SELECT SUM(valor) as total FROM transacoes WHERE usuario_id = '$usuario_id' AND categoria != 'Entradas' AND SUBSTRING(data, 1, 4) = '$year' AND SUBSTRING(data, 6, 2) = '$selectedMonth'";
$res_saidas = mysqli_query($conexao, $q_saidas);
$row_saidas = mysqli_fetch_assoc($res_saidas);
$totalSaidas = abs($row_saidas['total'] ?? 0);

$saldoAnteriorQuery = "SELECT SUM(valor) as t FROM transacoes WHERE usuario_id = '$usuario_id' AND (SUBSTRING(data, 1, 4) < '$year' OR (SUBSTRING(data, 1, 4) = '$year' AND SUBSTRING(data, 6, 2) < '$selectedMonth'))";
$saldoAnteriorRow = mysqli_fetch_assoc(mysqli_query($conexao, $saldoAnteriorQuery));
$saldoAnterior = $saldoAnteriorRow['t'] ?? 0;

$saldoTotal = $saldoAnterior + $totalEntradas - $totalSaidas;
?>

<script>
  // Variáveis de mês e ano selecionados
  const mesAtualSelecionado = <?php echo $month; ?>;
  const anoAtualSelecionado = <?php echo $year; ?>;
  const nomesMeses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  
  // Ponte de dados para o JS
  const transacoesDoBanco = [
    <?php
    mysqli_data_seek($res_transacoes, 0);
    while($row = mysqli_fetch_assoc($res_transacoes)) {
        echo "{ id: {$row['id']}, description: '".addslashes($row['descricao'])."', amount: ".($row['valor']*100).", date: '".date('d/m/Y', strtotime($row['data']))."', category: '".$row['categoria']."', installmentId: ".($row['parcelamento_id'] ?: 'null')." },";
    }
    ?>
  ];

  const transacoesObjetivosDoBanco = [
    <?php
    while($row = mysqli_fetch_assoc($res_transacoes_objetivos)) {
        echo "{ id: {$row['id']}, description: '".addslashes($row['descricao'])."', amount: ".($row['valor']*100).", date: '".date('d/m/Y', strtotime($row['data']))."', category: '".$row['categoria']."', installmentId: ".($row['parcelamento_id'] ?: 'null')." },";
    }
    ?>
  ];

  // Ponte de dados para o JS - Limites por Categoria
  const limitesDoBanco = [
<?php
while($l = mysqli_fetch_assoc($res_limites)) {
    echo "{
        categoria: '".addslashes($l['categoria'])."',
        valor: ".($l['valor_limite'] * 100)."
    },";
}
?>
];

const objetivosDoBanco = [
<?php
while($o = mysqli_fetch_assoc($res_objetivos)) {
    $concluido = !empty($o['concluido']) ? 1 : 0;
    $ativo = !empty($o['ativo']) ? 1 : 0;
    $dataConclusao = isset($o['data_conclusao']) ? $o['data_conclusao'] : '';
    echo "{ id: {$o['id']}, descricao: '".addslashes($o['descricao'])."', valor: {$o['valor_meta']}, valor_meta: {$o['valor_meta']}, prazo: '{$o['prazo']}', dataCriacao: '{$o['data_criacao']}', concluido: {$concluido}, ativo: {$ativo}, dataConclusao: '{$dataConclusao}' },";
}
?>
];

  // Adicionando os parcelamentos para o JS processar o histórico
  
const parcelamentosDoBanco = [
    <?php
    while($p = mysqli_fetch_assoc($res_parcelamentos)) {
        echo "{ 
            id: {$p['id']}, 
            description: '".addslashes($p['descricao'])."', 
            totalAmount: ".($p['valor_total'] * 100).", 
            numParcelas: {$p['num_parcelas']}, 
            dataInicio: '{$p['data_inicio']}' 
        },";
    }
    ?>
  ];
</script>
<!DOCTYPE html>
<html lang="pt-br">
  <head>
    <!-- Meta tags para definir o caractere de codificação e a escala do viewport -->
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    
    <!-- Links para fontes externas, como fontes do Google Fonts e bibliotecas do Font Awesome -->
    <link rel="preconnect" href="https://fonts.gstatic.com" />
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@100;400;700&display=swap" rel="stylesheet" />

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" 
      integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" 
      crossorigin="anonymous" referrerpolicy="no-referrer" />
    <link rel="icon" type="image/png" href="src/assets/logo_icon.png">
    <!-- Link para o arquivo de estilo CSS -->
    <link rel="stylesheet" href="./src/css/style.css" />
    <style>
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }

      .flip-card {
        perspective: 1000px;
        cursor: pointer;
      }

      .flip-card-inner {
        position: relative;
        width: 100%;
        height: 100%;
        transition: transform 0.7s ease;
        transform-style: preserve-3d;
      }

      .flip-card.flipped .flip-card-inner {
        transform: rotateY(180deg);
      }

      .flip-card-front,
      .flip-card-back {
        backface-visibility: hidden;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }

      .flip-card-back {
        transform: rotateY(180deg);
      }

      .flip-card {
        position: relative;
      }

      .flip-tooltip {
        position: absolute;
        top: -50px;
        left: 50%;
        transform: translateX(-50%);
        background: #2d3277;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 0.85rem;
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
        z-index: 10;
      }

      .flip-tooltip::after {
        content: '';
        position: absolute;
        bottom: -5px;
        left: 50%;
        transform: translateX(-50%);
        border: 5px solid transparent;
        border-top-color: #2d3277;
      }

      .flip-card:hover .flip-tooltip {
        opacity: 1;
      }Segue

      .flip-card.no-balance .flip-card-back {
        display: none;
      }

      .flip-card.no-balance .flip-tooltip {
        display: none;
      }

      .flip-card.no-balance {
        cursor: default;
      }
    </style>
    <title> Sua Gestão - PlanixFinance </title>
    <!-- Chart.js para os gráficos -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <!-- jsPDF para gerar PDFs - Versão moderna com suporte a imagens -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <!-- html2canvas para capturar HTML -->
    <script src="https://html2canvas.hertzen.com/dist/html2canvas.min.js"></script>
  </head>

  <body>
  <div id="notification" style="display: none; position: fixed; top: 20px; right: 20px; background: linear-gradient(135deg, #2d3277, #00d4ff); color: white; padding: 15px 20px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); z-index: 1000; font-family: 'Poppins', sans-serif; font-size: 14px; max-width: 300px; word-wrap: break-word;">
    <i class="fa-solid fa-check-circle" style="margin-right: 10px;"></i>
    <span id="notification-text"></span>
  </div>

  <div id="welcome-overlay" style="display:none; position: fixed; inset:0; background: rgba(0,0,0,0.75); z-index: 1100; justify-content: center; align-items: center; padding: 24px;">
    <div style="background: #ffffff; border-radius: 22px; max-width: 640px; width: 100%; padding: 32px; box-shadow: 0 30px 80px rgba(0,0,0,0.3); position: relative; color: #111; font-family: 'Poppins', sans-serif;">
      <h2 id="welcome-overlay-title" style="margin-top:0; color:#2d3277;"></h2>
      <p id="welcome-overlay-text" style="margin-bottom:18px; color:#333; line-height:1.6;"></p>
      <ul style="padding-left:20px; color:#444; line-height:1.7; margin: 0;">
        <li>Adicione sua primeira transação clicando em "Nova Transação".</li>
        <li>Defina metas e limites para organizar seu orçamento.</li>
        <li>Retorne sempre para acompanhar seu saldo e resultados.</li>
      </ul>
      <button id="welcome-overlay-ok" style="margin-top:20px; background:#5d3fd3; color:white; border:none; border-radius:10px; padding:12px 20px; cursor:pointer;">Começar agora</button>
    </div>
  </div>

  <div id="toast-container" class="toast-container"></div>

  <!-- Modal de Confirmação Leve -->
  <div id="confirmModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 2000; justify-content: center; align-items: center; flex-direction: column;">
    <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); max-width: 400px; text-align: center; font-family: 'Poppins', sans-serif;">
      <p id="confirmText" style="margin: 0 0 20px; font-size: 16px; color: #333;"></p>
      <button id="confirmYes" style="background: #2d3277; color: white; border: none; padding: 10px 20px; border-radius: 5px; margin-right: 10px; cursor: pointer;">Sim</button>
      <button id="confirmNo" style="background: #e92929; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Não</button>
    </div>
  </div>
  <header class="dashboard-header">
    
    <h1 id="logo" style="margin-bottom: 25px;">Planix<span>Finance</span></h1>
    <p id="subtitle">Seu painel financeiro acessível com um visual mais leve.</p>

    <div style="
        display: flex; 
        align-items: center; 
        justify-content: center; 
        gap: 15px; 
        margin-top: 20px;
        font-family: 'Poppins', sans-serif;
    ">
        <span style="color: rgba(255,255,255,0.9); font-size: 1rem; letter-spacing: 0.5px;">
            Que bom te ver, <strong style="color: #00d4ff;"><?php echo explode(" ", $_SESSION['usuario_nome'])[0]; ?>!</strong> Seja Bem vindo(a) a PlanixFinance!<br>
             Aqui você tem o controle total das suas finanças, de forma simples, rápida e segura.
        </span>
        
        <a href="javascript:void(0)" onclick="customConfirm('Tem certeza que deseja sair da sua conta?', () => { window.location.href = 'pages/auth/logout.php'; })" style="
            color: white; 
            text-decoration: none; 
            font-size: 0.7rem; 
            font-weight: 700; 
            text-transform: uppercase; 
            background: #e92929; 
            padding: 6px 12px; 
            border-radius: 5px; 
            transition: 0.3s;
            box-shadow: 0 4px 15px rgba(233, 41, 41, 0.3);
        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
            Sair
        </a>
    </div>

</header>

<div style="margin-top: -50px; position: relative; z-index: 10;">
    </div>

    <main class="container">
      <section id="balance">
        <h2 class="sr-only">Balanço</h2>

        <div class="card income flip-card<?php echo ($saldoAnterior > 0 ? ' flipped' : ' no-balance'); ?>" id="flipBalanceCard">
          <div class="flip-tooltip">Clique para alternar ou aguarde 5 segundos</div>
          <div class="flip-card-inner">
            <div class="flip-card-front">
              <h3><span>Entradas Mensais</span> <i class="fa-solid fa-circle-arrow-up icon-income"></i></h3>
              <p><?php echo formatarValorAbreviadoPHP($totalEntradas); ?></p>
            </div>
            <div class="flip-card-back">
              <h3><span>Saldo anterior</span> <i class="fa-solid fa-clock-rotate-left icon-income"></i></h3>
              <p><?php echo formatarValorAbreviadoPHP($saldoAnterior); ?></p>
            </div>
          </div>
        </div>

        <div class="card expense">
          <h3><span>Saídas</span> <i class="fa-solid fa-circle-arrow-down icon-expense"></i></h3>
          <p><?php echo formatarValorAbreviadoPHP($totalSaidas); ?></p>
        </div>

        <div class="card total">
          <h3><span>Total</span> <i class="fa-solid fa-dollar-sign icon-total"></i></h3>
          <p><?php echo formatarValorAbreviadoPHP($saldoTotal); ?></p>
        </div>
      </section>

      <section id="transaction">
        <h2 class="sr-only">Transações</h2>

        <div class="actions-header">
          <a onclick="Modal.toggle()" href="#" class="button new">
            <i class="fa-solid fa-plus"></i> Nova Transação
          </a>
          <a id="definirLimiteBtn" onclick="ModalLimite.toggle()" href="#" class="button new">
            <i class="fa-solid fa-chart-line"></i> Definir Limite por Categoria
          </a>
          <a onclick="openInstallmentModal()" href="#" class="button new">
            <i class="fa-solid fa-scroll"></i> Histórico de Parcelamentos
          </a>
          <a href="pages/estudos.html" class="button new">
            <i class="fa-solid fa-graduation-cap"></i> Estudos
          </a>
        </div>

        <div class="transactions-toolbar" aria-label="Filtros de transações">
          <div class="transactions-search">
            <label for="transactionSearch">Pesquisar transações</label>
            <div class="search-field">
              <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
              <input
                type="search"
                id="transactionSearch"
                placeholder="Descrição ou categoria"
                autocomplete="off"
                aria-describedby="transactionSearchStatus"
              >
            </div>
            <br><p id="transactionSearchStatus" aria-live="polite">Mostrando todas as transações.</p><br>
          </div>

          <div class="transactions-theme" aria-hidden="true">
            <span><i class="fa-solid fa-wallet"></i> Movimentações</span>
            <span><i class="fa-solid fa-tags"></i> Categorias</span>
            <span><i class="fa-solid fa-calendar-days"></i> Histórico mensal</span>
          </div>
        </div>

        <table id="data-table">
          <caption class="sr-only">Lista de transações financeiras do mês selecionado</caption>
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Valor</th>
              <th>Data</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
    <?php while($row = mysqli_fetch_assoc($res_transacoes)): ?>
    <tr>
        <td class="description"><?php echo $row['descricao']; ?></td>
        <td class="category"><?php echo $row['categoria']; ?></td>
        <td class="<?php echo ($row['categoria'] == 'Entradas' ? 'income' : 'expense'); ?>">
            <?php echo formatarValorAbreviadoPHP($row['valor']); ?>
        </td>
        <td class="date"><?php echo date('d/m/Y', strtotime($row['data'])); ?></td>
        <td>
            <a href="javascript:void(0)" onclick="customConfirm('Tem certeza que deseja excluir esta transação?\n\nDescrição: <?php echo addslashes($row['descricao']); ?>\nValor: <?php echo formatarValorAbreviadoPHP($row['valor']); ?>\nData: <?php echo date('d/m/Y', strtotime($row['data'])); ?>', () => { window.location.href = 'actions/excluir_transacao.php?id=<?php echo $row['id']; ?>&month=<?php echo $month; ?>&year=<?php echo $year; ?>' })" style="color: #e92929;">
                <i class="fa-solid fa-trash"></i>
            </a>
        </td>
    </tr>
    <?php endwhile; ?>
          </tbody>
        </table>
      </section>

      <!-- Navegação de Meses -->
      <!-- Navegação de Mês -->
      <div style="margin-top: 20px; text-align: center; display: flex; align-items: center; justify-content: center; gap: 20px;">
        <?php
        // Calcular mês anterior
        $prev_month = $month - 1;
        $prev_year = $year;
        if ($prev_month < 1) {
          $prev_month = 12;
          $prev_year = $year - 1;
        }

        // Calcular próximo mês
        $next_month = $month + 1;
        $next_year = $year;
        if ($next_month > 12) {
          $next_month = 1;
          $next_year = $year + 1;
        }

        // Mês atual do sistema
        $current_month = date('m');
        $current_year = date('Y');
        ?>
        <a href="?month=<?php echo $prev_month; ?>&year=<?php echo $prev_year; ?>" 
           style="background: #2d3277; color: white; padding: 10px 15px; border-radius: 50%; text-decoration: none; transition: 0.3s; box-shadow: 0 4px 15px rgba(45, 50, 119, 0.3);"
           onmouseover="this.style.transform='scale(1.1)'; this.style.boxShadow='0 6px 20px rgba(45, 50, 119, 0.5)'"
           onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 15px rgba(45, 50, 119, 0.3)'">
          <i class="fa-solid fa-chevron-left"></i>
        </a>
        
        <a href="?month=<?php echo $current_month; ?>&year=<?php echo $current_year; ?>" 
           style="background: <?php echo ($month == $current_month && $year == $current_year) ? '#00d4ff' : '#2d3277'; ?>; color: white; padding: 10px 20px; border-radius: 25px; text-decoration: none; font-weight: bold; transition: 0.3s; box-shadow: 0 4px 15px rgba(45, 50, 119, 0.3);"
           onmouseover="if(!this.originalText) this.originalText = this.innerHTML; this.innerHTML = 'Mês Atual?'; this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 20px rgba(45, 50, 119, 0.5)'"
           onmouseout="this.innerHTML = this.originalText; this.style.transform='scale(1)'; this.style.boxShadow='0 4px 15px rgba(45, 50, 119, 0.3)'">
          <?php echo strftime('%b/%Y', mktime(0, 0, 0, $month, 1, $year)); ?>
        </a>
        
        <a href="?month=<?php echo $next_month; ?>&year=<?php echo $next_year; ?>" 
           style="background: #2d3277; color: white; padding: 10px 15px; border-radius: 50%; text-decoration: none; transition: 0.3s; box-shadow: 0 4px 15px rgba(45, 50, 119, 0.3);"
           onmouseover="this.style.transform='scale(1.1)'; this.style.boxShadow='0 6px 20px rgba(45, 50, 119, 0.5)'"
           onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 15px rgba(45, 50, 119, 0.3)'">
          <i class="fa-solid fa-chevron-right"></i>
        </a>
      </div>

      <!-- NOVA SEÇÃO DE DASHBOARD -->
      <section id="dashboard">
        <h2>Dashboard de Despesas</h2>

        <div id="dashboardTipGrid" class="dashboard-tip-grid" aria-live="polite">
          <article class="dashboard-tip-card">
            <div class="tip-card-icon"><i class="fa-solid fa-lightbulb"></i></div>
            <strong>Use o alternador</strong>
            <p>Troque entre gráfico de rosca e gráfico de barras para ver os dados do seu jeito.</p>
          </article>
          <article class="dashboard-tip-card">
            <div class="tip-card-icon"><i class="fa-solid fa-chart-line"></i></div>
            <strong>Resumo instantâneo</strong>
            <p>Os cards mostram em destaque entradas, saídas e o saldo rápido.</p>
          </article>
          <article class="dashboard-tip-card">
            <div class="tip-card-icon"><i class="fa-solid fa-bullseye"></i></div>
            <strong>Foco nas metas</strong>
            <p>Cadastre objetivos e acompanhe o progresso no painel principal.</p>
          </article>
        </div>

        <div id="dashboard-alerts" class="dashboard-alerts"></div>

        <div id="dashboard-summary" class="dashboard-summary"></div>

        <div class="chart-wrapper card">
          <canvas id="graficoDespesas"></canvas>
          <div class="chart-center">
            <span id="valorTotal" class="valor">R$ 0,00</span>
            <p class="descricao">Despesas Totais</p>
        </div>
        </div>

        <div class="input-area">
          <div class="buttons">
            <button type="button" onclick="mudarTipo()">Alternar Gráfico</button>
            <button type="button" onclick="alternarSalario()">Mostrar/Ocultar Entradas</button>
            <button type="button" onclick="toggleObjetivosPanel()">Planejar Objetivos</button>
            <button type="button" onclick="gerarRelatorio()">Gerar Relatório</button>
            <button type="button" class="button tip" onclick="mostrarDica()">Dicas de Uso</button>
          </div>
        </div>

        <div id="objetivosPanel" class="card objetivos-panel hidden">
          <h3>Planejar Objetivos</h3>
          <div class="objetivo-form">
            <div class="input-group">
              <label class="sr-only" for="objetivoDescricao">Objetivo</label>
              <input type="text" id="objetivoDescricao" placeholder="Objetivo (Ex: Reserva de Emergência)">
            </div>
            <div class="input-group">
              <label class="sr-only" for="objetivoValor">Meta</label>
              <input type="number" id="objetivoValor" max="1000000000" placeholder="Meta em R$">
            </div>
            <div class="input-group">
              <label class="sr-only" for="objetivoPrazo">Prazo</label>
              <input type="date" id="objetivoPrazo">
            </div>
            <div class="input-group actions">
              <button type="button" onclick="adicionarObjetivo()">Salvar Objetivo</button>
            </div>
          </div>
          <div id="listaObjetivos"></div>
        </div>

        <div id="resultado"></div>

        <div id="floatingTip" class="floating-tip hidden" role="dialog" aria-label="Dica de uso">
          <div class="floating-tip-card">
            <div class="floating-tip-top">
              <span class="floating-tip-tag">Dicas de Uso</span>
            </div>
            <p class="floating-tip-intro">Escolha uma dica rapida para navegar pelo painel.</p>
            <div class="floating-tip-list"></div>
          </div>
        </div>
      </section>
    </main>

    <!-- Modal de Nova Transação -->
    <div class="modal-overlay" id="modal-overlay">
  <div class="modal">
    <div id="form">
      <h2>Nova Transação</h2>
      <form action="actions/salvar_transacao.php" method="POST" id="transactionForm">
        <div class="input-group">
          <label for="category">Categoria</label>
          <select id="category" name="category" onchange="toggleParcelamentoFields()" required>
            <option value="">Selecione</option>
            <option value="Entradas">Entradas</option>
            <option value="Alimentação">Alimentação</option>
            <option value="Lazer">Lazer</option>
            <option value="Saúde">Saúde</option>
            <option value="Transporte">Transporte</option>
            <option value="Contas">Contas</option>
            <option value="Parcelamento">Parcelamento</option>
            <option value="Outros">Outros</option>
          </select>
        </div>

        <div class="input-group">
          <input type="text" name="description" id="description" placeholder="Descrição (Ex: Salário, Pix, Aluguel)" required />
        </div>

        <div class="input-group">
          <input type="number" step="0.01" name="amount" id="amount" placeholder="0,00" max="1000000000" required />
          <small class="help">Ao selecionar a <strong>Categoria,</strong> o valor será calculado.</small>
        </div>

        <div class="input-group">
          <input type="date" id="date" name="date" />
        </div>

        <input type="hidden" name="month" value="<?php echo $month; ?>" />
        <input type="hidden" name="year" value="<?php echo $year; ?>" />

        <div id="parcelamentoFields" style="display: none;">
          <div class="input-group">
            <label for="numParcelas">Número de Parcelas</label>
            <input type="number" id="numParcelas" name="num_parcelas" min="2" max="60" placeholder="Ex: 12" />
            <small class="help">Máximo 60 parcelas para cada parcelamento.</small>
          </div>
          <div class="input-group">
            <label for="mesInicial">Mês Inicial (opcional)</label>
            <input type="number" id="mesInicial" name="mes_inicial" min="0" placeholder="0 = imediato" />
          </div>
        </div>

        <div class="input-group actions">
          <a onclick="Modal.toggle()" href="#" class="button cancel">Cancelar</a>
          <button type="submit">Salvar</button>
        </div>
      </form>
    </div>
  </div>
</div>

<div class="modal-overlay" id="editTransactionOverlay">
  <div class="modal">
    <div id="edit-transaction-form">
      <h2>Editar Transação</h2>
      <form action="actions/editar_transacao.php" method="POST">
        <input type="hidden" name="id" id="editTransactionId">
        <input type="hidden" name="month" value="<?php echo $month; ?>" />
        <input type="hidden" name="year" value="<?php echo $year; ?>" />

        <div class="input-group">
          <label for="editCategory">Categoria</label>
          <select id="editCategory" name="category" required>
            <option value="Entradas">Entradas</option>
            <option value="Alimentação">Alimentação</option>
            <option value="Lazer">Lazer</option>
            <option value="Saúde">Saúde</option>
            <option value="Transporte">Transporte</option>
            <option value="Contas">Contas</option>
            <option value="Parcelamento">Parcelamento</option>
            <option value="Outros">Outros</option>
          </select>
        </div>

        <div class="input-group">
          <label for="editDescription">Descrição</label>
          <input type="text" name="description" id="editDescription" required>
        </div>

        <div class="input-group">
          <label for="editAmount">Valor</label>
          <input type="number" step="0.01" name="amount" id="editAmount" max="1000000000" required>
        </div>

        <div class="input-group">
          <label for="editDate">Data</label>
          <input type="date" name="date" id="editDate" required>
        </div>

        <div class="input-group actions">
          <a onclick="closeEditTransactionModal()" href="#" class="button cancel">Cancelar</a>
          <button type="submit">Salvar Alterações</button>
        </div>
      </form>
    </div>
  </div>
</div>

<div class="modal-overlay" id="modalInstallmentOverlay">
  <div class="modal">
    <div id="installment-content">
      <h2>Histórico de Parcelamentos</h2>
      
      <div class="input-group">
        <label for="selectInstallment">Selecione um Parcelamento</label>
        <select id="selectInstallment" onchange="showInstallmentDetails()">
          <option value="">-- Escolha um parcelamento --</option>
        </select>
      </div>

      <div id="installmentDetails" style="margin-top: 1.5rem; display: none;">
        <h3 id="installmentTitle" style="color: #2d3277; margin-bottom: 0.5rem;"></h3>
        
        <div id="installmentCardInfo" style="background: #f0f2f5; padding: 10px; border-radius: 8px; margin-bottom: 10px; font-size: 0.8rem;">
            </div>

        <div id="installmentTableContainer">
            </div>
      </div>

      <div class="input-group actions" style="margin-top: 1.5rem;">
        <a onclick="closeInstallmentModal()" href="#" class="button cancel">Fechar</a>
      </div>
    </div>
  </div>
</div>

<div class="modal-overlay" id="editInstallmentOverlay">
  <div class="modal">
    <div id="edit-installment-form">
      <h2>Editar Parcelamento</h2>
      <form action="actions/editar_parcelamento.php" method="POST">
        <input type="hidden" name="id" id="editInstallmentId">
        <input type="hidden" name="month" value="<?php echo $month; ?>" />
        <input type="hidden" name="year" value="<?php echo $year; ?>" />

        <div class="input-group">
          <label for="editInstallmentDescription">Descrição</label>
          <input type="text" name="description" id="editInstallmentDescription" required>
        </div>

        <div class="input-group">
          <label for="editInstallmentAmount">Valor Total</label>
          <input type="number" step="0.01" name="amount" id="editInstallmentAmount" max="1000000000" required>
          <small class="help">Edite o valor total do parcelamento, não o valor da parcela mensal.</small>
        </div>

        <div class="input-group">
          <label for="editInstallmentNumParcelas">Número de Parcelas</label>
          <input type="number" name="num_parcelas" id="editInstallmentNumParcelas" min="2" max="60" required>
          <small class="help">Máximo 60 parcelas para cada parcelamento.</small>
        </div>

        <div class="input-group">
          <label for="editInstallmentDate">Data da Primeira Parcela</label>
          <input type="date" name="date" id="editInstallmentDate" required>
        </div>

        <div class="input-group actions">
          <a onclick="closeEditInstallmentModal()" href="#" class="button cancel">Cancelar</a>
          <button type="submit">Salvar Alterações</button>
        </div>
      </form>
    </div>
  </div>
</div>

    <!-- Modal de Limite por Categoria -->
    <div class="modal-overlay" id="modalLimiteOverlay">
  <div class="modal">
    <div id="form-limite">
      <h2>Definir Limite por Categoria</h2>
      
      <form action="actions/salvar_limite.php" method="POST">
        <input type="hidden" name="month" value="<?php echo $month; ?>" />
        <input type="hidden" name="year" value="<?php echo $year; ?>" />
        
        <div class="input-group">
          <label for="categoriaLimite">Categoria</label>
          
          <select id="categoriaLimite" name="categoriaLimite">
            <option value="Alimentação">Alimentação</option>
            <option value="Lazer">Lazer</option>
            <option value="Saúde">Saúde</option>
            <option value="Transporte">Transporte</option>
            <option value="Contas">Contas</option>
            <option value="Outros">Outros</option>
          </select>
        </div>

        <div class="input-group">
          <label for="valorLimite">Valor Limite</label>
          
          <input type="number" name="valorLimite" id="valorLimite" placeholder="Ex: 500" max="1000000000" required />
        </div>

        <div class="input-group actions">
          <a onclick="ModalLimite.toggle()" href="#" class="button cancel">Cancelar</a>
          <button type="submit">Salvar</button>
        </div>
      </form>
    </div>
  </div>
</div>
    <footer>
      <p>Planix Finance &copy; 2026</p>
    </footer>

    <script src="./src/js/script.js"></script>
    <script>
      let flipTimer;
      const hasPreviousBalance = <?php echo ($saldoAnterior > 0 ? 'true' : 'false'); ?>;
      
      function toggleBalanceCard() {
        const card = document.getElementById('flipBalanceCard');
        if (card && hasPreviousBalance) {
          card.classList.toggle('flipped');
        }
      }

      function startBalanceFlipTimer() {
        if (!hasPreviousBalance) return;
        flipTimer = setInterval(() => {
          toggleBalanceCard();
        }, 5000);
      }

      function resetBalanceFlipTimer() {
        if (!hasPreviousBalance) return;
        clearInterval(flipTimer);
        startBalanceFlipTimer();
      }

      document.addEventListener('DOMContentLoaded', () => {
        const flipCard = document.getElementById('flipBalanceCard');
        if (flipCard && hasPreviousBalance) {
          flipCard.addEventListener('click', () => {
            toggleBalanceCard();
            resetBalanceFlipTimer();
          });
        }
        startBalanceFlipTimer();
      });
    </script>
    <div id="toast-container" style="position: fixed; top: 20px; right: 20px; z-index: 1000;"></div>
  </body>
</html>
