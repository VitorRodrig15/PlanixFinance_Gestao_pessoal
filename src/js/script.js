// --- Código original do Planix ---
// Essa parte controla o modal de criar nova transação
const Modal = {
  toggle() {
    document.querySelector(".modal-overlay").classList.toggle("active");
  },
};

// Função para mostrar notificações atraentes
function showNotification(message) {
  const notification = document.getElementById('notification');
  const text = document.getElementById('notification-text');
  text.textContent = message;
  notification.style.display = 'block';
  notification.style.animation = 'slideIn 0.5s ease-out';

  // Auto-hide after 5 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.5s ease-in';
    setTimeout(() => {
      notification.style.display = 'none';
    }, 500);
  }, 5000);
}

// Função para confirmação customizada
function customConfirm(message, yesCallback) {
  document.getElementById('confirmText').textContent = message;
  document.getElementById('confirmModal').style.display = 'flex';
  window.confirmCallback = yesCallback;
}

document.getElementById('confirmYes').addEventListener('click', () => {
  document.getElementById('confirmModal').style.display = 'none';
  if (window.confirmCallback) window.confirmCallback();
});

document.getElementById('confirmNo').addEventListener('click', () => {
  document.getElementById('confirmModal').style.display = 'none';
});

function toggleWelcomeOverlay(show) {
  const overlay = document.getElementById('welcome-overlay');
  if (!overlay) return;
  overlay.style.display = show ? 'flex' : 'none';
}

function bindWelcomeOverlayActions() {
  const okButton = document.getElementById('welcome-overlay-ok');
  if (okButton) {
    okButton.addEventListener('click', () => toggleWelcomeOverlay(false));
  }
}

// Verificar se há mensagem de notificação ou boas-vindas ao carregar
window.addEventListener('DOMContentLoaded', () => {
  bindWelcomeOverlayActions();

  if (typeof welcomeType !== 'undefined' && welcomeType === 'new') {
    const titleElement = document.getElementById('welcome-overlay-title');
    const textElement = document.getElementById('welcome-overlay-text');
    if (titleElement) titleElement.textContent = welcomeTitle || 'Bem-vindo!';
    if (textElement) textElement.textContent = welcomeText || '';
    toggleWelcomeOverlay(true);
    return;
  }

  if (typeof notificationMessage !== 'undefined') {
    showNotification(notificationMessage);
  }
});

// Mapeamento de cores por categoria
const CategoryColors = {
  "Entradas": "#2ecc71",
  "Alimentação": "#f39c12",
  "Lazer": "#9b59b6",
  "Saúde": "#2eedfa",
  "Transporte": "#3498db",
  "Contas": "#e74c3c",
  "Parcelamento": "#fbf731",
  "Outros": "#4d50fd"
};

// Gerencia as transações do app (adicionar, remover e cálculos)
const Transaction = {
  all: (typeof transacoesDoBanco !== 'undefined')
    ? transacoesDoBanco
    : [],
         
  remove(index) {
    Transaction.all.splice(index, 1);
    Storage.set(Transaction.all);
    App.reload();
  },

  incomes() {
    // soma todos os valores positivos (entradas)
    return Transaction.all.reduce((acc, t) => {
      return t.amount > 0 ? acc + t.amount : acc;
    }, 0);
  },

  expenses() {
    // soma todos os valores negativos (despesas)
    return Transaction.all.reduce((acc, t) => {
      return t.amount < 0 ? acc + t.amount : acc;
    }, 0);
  },

  total() {
    // saldo final: entradas + despesas
    return Transaction.incomes() + Transaction.expenses();
  },
};

// Atualiza o DOM (HTML) com as transações e saldo
let currentTransactionSearch = "";

const DOM = {
  transactionsContainer: document.querySelector("#data-table tbody"),

  addTransaction(transaction, index) {
    const tr = document.createElement("tr");
    tr.innerHTML = DOM.innerHTMLTransaction(transaction, index);
    tr.dataset.index = index;
    DOM.transactionsContainer.appendChild(tr);
  },

  innerHTMLTransaction(transaction, index) {
    const CSSclass = transaction.amount > 0 ? "income" : "expense";
    const amount = Utils.formatCurrency(transaction.amount);
    const descricaoSegura = String(transaction.description || "").replace(/'/g, "&#39;").replace(/"/g, "&quot;");

    // Retorna o HTML da linha da tabela para cada transacao
    return `
      <td class="description">${transaction.description}</td>
      <td class="category ${transaction.category.toLowerCase()}">
      ${transaction.category}
      </td>
      <td class="${CSSclass}">${amount}</td>
      <td class="date">${transaction.date}</td>
      <td>
        <div class="table-actions">
          <button type="button" class="action-icon action-edit" onclick="openEditTransactionModal(${index})" aria-label="Editar transacao ${descricaoSegura}" title="Editar">
            <i class="fa-solid fa-pen-to-square" aria-hidden="true"></i>
          </button>
          ${transaction.id ? `<button type="button" class="action-icon action-delete" onclick="customConfirm('Tem certeza que deseja excluir esta transacao?\\n\\nDescricao: ${descricaoSegura}\\nValor: ${Utils.formatCurrency(transaction.amount)}\\nData: ${transaction.date}', () => { window.location.href = 'actions/excluir_transacao.php?id=${transaction.id}&month=${mesAtualSelecionado}&year=${anoAtualSelecionado}' })" aria-label="Excluir transacao ${descricaoSegura}" title="Excluir"><i class="fa-solid fa-trash" aria-hidden="true"></i></button>` : `<button type="button" class="action-icon action-delete" onclick="customConfirm('Tem certeza que deseja excluir esta transacao?\\n\\nDescricao: ${descricaoSegura}\\nValor: ${Utils.formatCurrency(transaction.amount)}\\nData: ${transaction.date}', () => { deleteTransaction(${index}) })" aria-label="Excluir transacao ${descricaoSegura}" title="Excluir"><i class="fa-solid fa-trash-can" aria-hidden="true"></i></button>`}
        </div>
      </td>
    `;
  },
   // Atualiza os cards com valores formatados de entradas, saídas e total
  updateBalance() {
    const income = document.getElementById("incomeDisplay");
    const expense = document.getElementById("expenseDisplay");
    const total = document.getElementById("totalDisplay");

    if (income) income.innerHTML = Utils.formatCurrency(Transaction.incomes());
    if (expense) expense.innerHTML = Utils.formatCurrency(Transaction.expenses());
    if (total) total.innerHTML = Utils.formatCurrency(Transaction.total());
  },

  clearTransactions() {
    DOM.transactionsContainer.innerHTML = "";
  },

  showEmptyTransactions(message) {
    DOM.transactionsContainer.innerHTML = `
      <tr class="transactions-empty">
        <td colspan="5">${message}</td>
      </tr>
    `;
  },
}; 

function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getFilteredTransactions() {
  const search = normalizeSearchText(currentTransactionSearch);

  if (!search) {
    return Transaction.all.map((transaction, index) => ({ transaction, index }));
  }

  return Transaction.all
    .map((transaction, index) => ({ transaction, index }))
    .filter(({ transaction }) => {
      const description = normalizeSearchText(transaction.description);
      const category = normalizeSearchText(transaction.category);
      return description.includes(search) || category.includes(search);
    });
}

function updateTransactionSearchStatus(count) {
  const status = document.getElementById("transactionSearchStatus");
  if (!status) return;

  const total = Transaction.all.length;

  if (!currentTransactionSearch.trim()) {
    status.textContent = total === 1
      ? "Mostrando 1 transação."
      : `Mostrando ${total} transações.`;
    return;
  }

  status.textContent = count === 1
    ? "1 transação encontrada."
    : `${count} transações encontradas.`;
}

function renderTransactions() {
  const filteredTransactions = getFilteredTransactions();
  DOM.clearTransactions();

  if (filteredTransactions.length === 0) {
    DOM.showEmptyTransactions("Nenhuma transação encontrada para a pesquisa.");
  } else {
    filteredTransactions.forEach(({ transaction, index }) => {
      DOM.addTransaction(transaction, index);
    });
  }

  updateTransactionSearchStatus(filteredTransactions.length);
}

function setupTransactionSearch() {
  const input = document.getElementById("transactionSearch");
  if (!input) return;

  input.addEventListener("input", () => {
    currentTransactionSearch = input.value;
    renderTransactions();
  });
}


// Funções utilitárias (conversão e formatação)
const Utils = {
  // Converte valor do campo para inteiro em centavos
  formatAmount(value) {
    value = Number(value) * 100;
    return Math.round(value);
  },

  // Converte uma data YYYY-MM-DD para DD/MM/YYYY
  formatDate(date) {
    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
  },

  // Formata número em moeda BRL a partir de centavos ou string de valor real
  formatCurrency(value) {
    let cents = 0;

    if (typeof value === "string") {
      const raw = value.trim();
      if (raw === "") {
        return "R$ 0,00";
      }

      const cleaned = raw
        .replace(/\./g, "")
        .replace(/,/g, ".")
        .replace(/[^0-9.-]/g, "");

      const parsed = Number(cleaned);
      if (Number.isNaN(parsed)) {
        cents = 0;
      } else {
        cents = Math.round(parsed * 100);
      }
    } else {
      cents = Math.round(Number(value));
    }

    const signal = cents < 0 ? "-" : "";
    const amount = Math.abs(cents) / 100;

    return `${signal}${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount)}`;
  },

  formatarValorAbreviado(valor) {
        const numero = Math.abs(Number(valor));

        if (numero >= 1000000000) {
            return (numero / 1000000000)
                .toFixed(numero >= 10000000000 ? 0 : 1)
                .replace('.', ',')
                .replace(/,0$/, '') + 'B';
        }

        if (numero >= 1000000) {
            return (numero / 1000000)
                .toFixed(numero >= 10000000 ? 0 : 1)
                .replace('.', ',')
                .replace(/,0$/, '') + 'M';
        }

        return numero.toLocaleString('pt-BR');
    }
};

function formatDashboardCurrency(cents) {
  const reais = cents / 100;
  const absReais = Math.abs(reais);

  if (absReais >= 1000000) {
    return `${reais < 0 ? '-' : ''}R$ ${Utils.formatarValorAbreviado(absReais)}`;
  }

  return Utils.formatCurrency(cents);
}

function formatAnimatedCurrency(valor) {
  if (Math.abs(valor) >= 1000000) {
    return `${valor < 0 ? '-' : ''}R$ ${Utils.formatarValorAbreviado(Math.abs(valor))}`;
  }

  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Gerencia o formulário de nova transação
const Form = {
  description: document.querySelector("#description"),
  amount: document.querySelector("#amount"),
  date: document.querySelector("#date"),
  category: document.querySelector("#category"),

  getValues() {
    return {
      description: this.description.value,
      amount: this.amount.value,
      date: this.date.value,
      category: this.category.value
    };
  },

  validateFields() {
    const { description, amount, date, category } = this.getValues();

    // Verifica se todos os campos foram preenchidos
    if (
      description.trim() === "" ||
      amount.trim() === "" ||
      date.trim() === "" ||
      category.trim() === ""
    ) {
      throw new Error("Por favor, preencha todos os campos");
    }
  },

  formatValues() {
    let { description, amount, date, category } = this.getValues();

    // Converte valores e data para formato interno antes de salvar
    amount = Utils.formatAmount(amount);
    date = Utils.formatDate(date);

    // Se for entradas, força o valor a ser positivo
    if (category.toLowerCase() === "entradas") {
      if (amount < 0) {
        amount = Math.abs(amount);
      }
    } else {
      // Todas as outras categorias forçam valor negativo (despesa)
      if (amount > 0) {
        amount = -amount;
      }
    }

    return { description, amount, date, category };
  },

  clearFields() {
    Form.description.value = "";
    Form.amount.value = "";
    Form.date.value = "";
    Form.category.value = "";
  },

  submit(event) {
    event.preventDefault();

    try {
      Form.validateFields();
      
      const category = Form.category.value;
      
      // Se for parcelamento, criar múltiplas transações
      if (category === "Parcelamento") {
        Installment.createFromForm();
      } else {
        // Transação comum
        const transaction = Form.formatValues();
        Transaction.add(transaction);
      }
      
      Form.clearFields();
      Modal.toggle();
    } catch (error) {
      alert(error.message);
    }
  },
};

function deleteTransaction(index) {
  const transaction = Transaction.all[index];
  if (!transaction) return;

  if (transaction.installmentId) {
    const installment = Installment.all.find(inst => inst.id === transaction.installmentId);
    const title = installment ? installment.description : transaction.description;
    const count = installment ? installment.numParcelas : 1;

    customConfirm(
      `Tem certeza que deseja excluir o parcelamento?\n\n"${title}"\n\nIsso removerá todas as ${count} parcelas registradas.`,
      () => {
        const installmentId = transaction.installmentId;
        Transaction.all = Transaction.all.filter(t => t.installmentId !== installmentId);
        Installment.all = Installment.all.filter(inst => inst.id !== installmentId);
        Storage.set(Transaction.all);
        App.reload();
      }
    );
    return;
  }

  Transaction.remove(index);
}

function openEditTransactionModal(index) {
  const transaction = Transaction.all[index];
  if (!transaction || !transaction.id) return;

  if (transaction.installmentId) {
    openEditInstallmentModal(transaction.installmentId);
    return;
  }

  document.getElementById("editTransactionId").value = transaction.id;
  document.getElementById("editDescription").value = transaction.description;
  document.getElementById("editAmount").value = Math.abs(transaction.amount / 100).toFixed(2);
  document.getElementById("editDate").value = transaction.date.split("/").reverse().join("-");
  document.getElementById("editCategory").value = transaction.category;
  document.getElementById("editTransactionOverlay").classList.add("active");
}

function closeEditTransactionModal() {
  document.getElementById("editTransactionOverlay").classList.remove("active");
}

// Gerencia parcelamentos
const Installment = {
  all: (typeof parcelamentosDoBanco !== "undefined") ? parcelamentosDoBanco : [],

  createFromForm() {
    const description = Form.description.value;
    let amount = Utils.formatAmount(Form.amount.value);
    const startDate = Form.date.value;
    const numParcelas = parseInt(document.querySelector("#numParcelas").value);
    const mesInicial = parseInt(document.querySelector("#mesInicial").value) || 0;

    if (!numParcelas || numParcelas < 2 || numParcelas > 24) {
      throw new Error("Defina um número válido de parcelas (2-24)");
    }

    // Força parcelamento a ser negativo (é uma despesa)
    if (amount > 0) {
      amount = -amount;
    }

    // Cria um ID único para este parcelamento
    const installmentId = Date.now();

    // Cria as transações para cada parcela
    for (let i = 0; i < numParcelas; i++) {
      const parcelDate = new Date(startDate);
      parcelDate.setMonth(parcelDate.getMonth() + mesInicial + i);

      const transaction = {
        description: `${description} (Parcela ${i + 1}/${numParcelas})`,
        amount: Math.round(amount / numParcelas),
        date: Utils.formatDate(parcelDate.toISOString().split('T')[0]),
        category: "Parcelamento",
        installmentId: installmentId,
        isInstallmentInitial: i === 0 // Marca apenas a primeira parcela
      };

      // Adiciona diretamente sem passar por Transaction.add para não recarregar múltiplas vezes
      Transaction.all.push(transaction);
    }

    // Registra o parcelamento
    Installment.all.push({
      id: installmentId,
      description,
      totalAmount: amount,
      numParcelas,
      dataInicio: Utils.formatDate(startDate),
      mesInicial,
      dataCriacao: new Date().toLocaleDateString()
    });
    App.reload(); // Recarrega uma única vez após adicionar todas as parcelas
  }
};

// Função para mostrar/esconder campos de parcelamento
function toggleParcelamentoFields() {
    const category = document.querySelector("#category").value;
    const extraFields = document.querySelector("#parcelamentoFields");
    const form = document.querySelector("#transactionForm");

    if (category === "Parcelamento") {
        extraFields.style.display = "block";
        // Quando for parcelamento, envia para o arquivo de parcelas
        form.action = "actions/salvar_parcelamento.php"; 
    } else {
        extraFields.style.display = "none";
        // Quando for comum, envia para o arquivo de transação normal
        form.action = "actions/salvar_transacao.php";
    }
}

// Calcula e exibe limites por categoria
function calcularLimitesPorCategoria() {
  const limites = {};

  limitesDoBanco.forEach(l => {
    limites[l.categoria] = l.valor;
  });

  // Despesas por categoria (considerando apenas transações do banco, ignorando o storage antigo)
  const despesasPorCategoria = {};

  // Agrupa despesas por categoria
  Transaction.all.forEach(t => {
    if (t.amount < 0) {
      const categoria = t.category;
      const valor = Math.abs(t.amount);

      if (!despesasPorCategoria[categoria]) {
        despesasPorCategoria[categoria] = 0;
      }
      despesasPorCategoria[categoria] += valor;
    }
  });

  // Ranking de categorias
  const ranking = Object.entries(despesasPorCategoria)
    .sort((a, b) => b[1] - a[1]);

  const maiorCategoria = ranking[0];

  // Totais gerais
  const totalGasto = Object.values(despesasPorCategoria)
    .reduce((a, b) => a + b, 0);

  const totalLimite = Object.values(limites)
    .reduce((a, b) => a + b, 0);

  let html = "";

  // Resumo geral
  html += `
    <div style="margin-bottom: 1rem; padding: 1rem; background: #e8f5e9; border-radius: 0.5rem;">
      <strong>📊 Resumo Geral</strong><br>
      Gasto total: <strong>${Utils.formatCurrency(totalGasto)}</strong><br>
      Limite total: <strong>${Utils.formatCurrency(totalLimite)}</strong>
    </div>
  `;

  // Insights temáticos
  if (maiorCategoria) {
    const gastoMaior = Utils.formatCurrency(maiorCategoria[1]);
    const percentualMaior = totalGasto > 0 ? Math.round((maiorCategoria[1] / totalGasto) * 100) : 0;
    html += `
      <div style="margin-bottom: 1rem; padding: 1rem; background: #f0f4ff; border-radius: 0.5rem; border-left: 4px solid #2d3277;">
        <strong>🔍 Maior categoria de gasto</strong><br>
        ${maiorCategoria[0]} — ${gastoMaior} (${percentualMaior}% do total)
      </div>
    `;
  }

  // Grid de categorias
  html += "<div style='display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;'>";

  for (const [categoria, limite] of Object.entries(limites)) {
    const gasto = despesasPorCategoria[categoria] || 0;
    const percentual = limite > 0 ? (gasto / limite) * 100 : 0;
// No seu loop, altere estas linhas:
    const excedido = gasto >= limite; // Mudança para >= (maior ou igual)

    const cor = gasto > limite 
      ? "#e74c3c" // Vermelho se passar
      : (gasto === limite ? "#27ae60" : (percentual > 80 ? "#f39c12" : "#59e408")); 

    // Mensagem inteligente
    let mensagem = "";
    if (gasto > limite) {
      mensagem = "🚨 Limite ultrapassado";
    } else if (gasto === limite) {
      mensagem = "🎯 Limite atingido";
    } else if (percentual > 80) {
      mensagem = "⚠️ Quase no limite";
    } else {
      mensagem = "✅ Controle saudável";
    }

    // Sugestão
    const sugestao = excedido
    ? Utils.formatCurrency(gasto - limite)
    : Utils.formatCurrency((limite - gasto) * 0.2);

    html += `
      <div style="background: #f8f9fa; padding: 1rem; border-radius: 0.5rem; border-left: 4px solid ${cor};">
        
        <p style="margin: 0; font-weight: 600; color: #333;">
          ${categoria}
        </p>

        <p style="margin: 0.5rem 0; color: #666; font-size: 0.9rem;">
          Gasto: <strong>${Utils.formatCurrency(gasto)}</strong> 
        / ${Utils.formatCurrency(limite)}
        </p>

        <div style="background: #ddd; height: 8px; border-radius: 4px; overflow: hidden;">
          <div style="background: ${cor}; height: 100%; width: ${Math.min(percentual, 100)}%;"></div>
        </div>

        <p style="margin-top: 0.5rem; font-size: 0.8rem;">
          ${mensagem}
        </p>

        <p style="font-size: 0.8rem; color: #555;">
          💡 Ajuste sugerido: R$ ${sugestao}
        </p>

      </div>
    `;
  }

  html += "</div>";

  const resultadoDiv = document.getElementById("resultado");
  resultadoDiv.style.marginTop = "40px";
  resultadoDiv.style.marginBottom = "40px";

  if (limites && Object.keys(limites).length > 0) {
    resultadoDiv.innerHTML = html;
  } else {
    resultadoDiv.innerHTML = "<p style='color: #999; text-align: center;'>Nenhum limite definido</p>";
  }
}

// Inicia e recarrega a aplicação
const App = {
  init() {
    // 1. Prioridade para os dados que o PHP escreveu na constante transacoesDoBanco
    if (typeof transacoesDoBanco !== 'undefined' && transacoesDoBanco.length > 0) {
      Transaction.all = transacoesDoBanco.map(t => {
    let amount = Number(t.amount);

    if (t.category.toLowerCase() !== "entradas" && amount > 0) {
      amount = -amount;
    }

    if (t.category.toLowerCase() === "entradas" && amount < 0) {
      amount = Math.abs(amount);
    }

    return {
      ...t,
      amount
    };
  });
    } else {
      // Se não houver nada no banco, tenta o storage (opcional)
      Transaction.all = Storage.get();
    }

    // 2. Limpa e preenche a tabela
    renderTransactions();

    // 3. Atualiza os cards (agora com os dados do banco)
    DOM.updateBalance();

    // 4. Desenha o gráfico
    renderDashboard();
  },
  reload() { // Inicializa tudo
  App.init();
    },
  };

// --- Dashboard ---
// Variáveis para o gráfico Chart.js
let ctx;
let tipoGrafico = "doughnut"; // tipo inicial
let grafico;
let mostrarSalario = true; // controla se o salário aparece no gráfico
let primeiroRender = true;
let dashboardTipIndex = 0;
let dashboardTipIntervalId;
const dashboardTipTransitionDelay = 350;
let summaryInsightIndex = 0;
let summaryInsightIntervalId;
let objectiveSummaryIndex = 0;
let objectiveSummaryIntervalId;
const summaryInsightTransitionDelay = 350;
let dashboardAlertIndex = 0;
let dashboardAlertIntervalId;
const dashboardAlertTransitionDelay = 350;
const objetivoUrgenteDias = 30;

const dashboardTips = [
  {
    icon: 'fa-lightbulb',
    title: 'Use o alternador',
    description: 'Troque entre gráfico de rosca e gráfico de barras para ver os dados do seu jeito.'
  },
  {
    icon: 'fa-chart-line',
    title: 'Resumo instantâneo',
    description: 'Os cards mostram em destaque entradas, saídas e o saldo rapido.'
  },
  {
    icon: 'fa-bullseye',
    title: 'Foco nas metas',
    description: 'Cadastre objetivos e acompanhe o progresso no painel principal.'
  },
  {
    icon: 'fa-magnifying-glass',
    title: 'Encontre transações',
    description: 'Use a busca para localizar gastos por descricao ou categoria sem precisar rolar a tabela.'
  },
  {
    icon: 'fa-wallet',
    title: 'Revise seus limites',
    description: 'Defina limites por categoria e acompanhe alertas antes que uma despesa passe do planejado.'
  },
  {
    icon: 'fa-file-pdf',
    title: 'Salve um relatório',
    description: 'Gere um PDF de extrato do mês para guardar seu histórico ou compartilhar seu resumo financeiro.'
  },
  {
    icon: 'fa-calendar-days',
    title: 'Compare os meses',
    description: 'Use as setas de navegacao para analisar meses anteriores e perceber mudanças nos gastos.'
  },
  {
    icon: 'fa-piggy-bank',
    title: 'Acompanhe economias',
    description: 'Observe a diferenca entre entradas e saidas para decidir quanto reservar com seguranca.'
  },
  {
    icon: 'fa-toggle-on',
    title: 'Ative uma meta',
    description: 'Quando houver varios objetivos, apenas o objetivo ativo recebe o saldo positivo acumulado.'
  },
  {
    icon: 'fa-list-check',
    title: 'Atualize com frequencia',
    description: 'Registre novas movimentações no mesmo dia para manter o dashboard sempre confiavel.'
  }
];

function renderDashboardTips() {
  const grid = document.getElementById('dashboardTipGrid');
  if (!grid) return;

  const visibleTips = dashboardTips.slice(dashboardTipIndex, dashboardTipIndex + 3);
  const tipsToShow = visibleTips.length === 3
    ? visibleTips
    : [...visibleTips, ...dashboardTips.slice(0, 3 - visibleTips.length)];

  grid.innerHTML = tipsToShow.map(tip => `
    <article class="dashboard-tip-card">
      <div class="tip-card-icon"><i class="fa-solid ${tip.icon}"></i></div>
      <strong>${tip.title}</strong>
      <p>${tip.description}</p>
    </article>
  `).join('');
}

function rotateDashboardTips() {
  const grid = document.getElementById('dashboardTipGrid');
  if (!grid) return;

  grid.classList.add('is-changing');

  setTimeout(() => {
    dashboardTipIndex = (dashboardTipIndex + 3) % dashboardTips.length;
    renderDashboardTips();
    grid.classList.remove('is-changing');
  }, dashboardTipTransitionDelay);
}

function startDashboardTipRotation() {
  if (dashboardTipIntervalId) return;

  renderDashboardTips();
  dashboardTipIntervalId = setInterval(rotateDashboardTips, 15000);
}

function getDadosGrafico() {
  if (mostrarSalario) {
    // Agrupa despesas por categoria e calcula salário total
    const categoriasDespesas = {};
    let salarioTotal = 0;
    
    Transaction.all.forEach(t => {
      if (t.amount > 0) {
        salarioTotal += t.amount / 100;
      } else {
        const categoria = t.category;
        const valor = Math.abs(t.amount / 100);
        
        if (!categoriasDespesas[categoria]) {
          categoriasDespesas[categoria] = 0;
        }
        categoriasDespesas[categoria] += valor;
      }
    });
    
    const categorias = Object.keys(categoriasDespesas);
    const valoresDespesas = Object.values(categoriasDespesas);
    const somaDespesas = valoresDespesas.reduce((a, b) => a + b, 0);
    const restante = Math.max(0, salarioTotal - somaDespesas);
    
    let labels, valores;
    
    if (tipoGrafico === "doughnut") {
      labels = [...categorias];
      valores = [...valoresDespesas];
      if (restante > 0) {
        labels.push("Restante");
        valores.push(restante);
      }
    } else {
      labels = [...categorias];
      valores = [...valoresDespesas];
    }
     
    return { categorias: labels, valores, salarioTotal, somaDespesas };
  } else {
    // Comportamento antigo: agrupa todas as transações por categoria
    const categoriasAgregadas = {};
    
    Transaction.all.forEach(t => {
      const categoria = t.category;
      const valor = t.amount / 100;
  
      if (!categoriasAgregadas[categoria]) {
        categoriasAgregadas[categoria] = 0;
      }
      categoriasAgregadas[categoria] += valor;
    });
    
    const categorias = Object.keys(categoriasAgregadas);
    const valores = Object.values(categoriasAgregadas).map(v => {
      return tipoGrafico === "doughnut" ? Math.abs(v) : v;
    });
    
    return { categorias, valores, salarioTotal: 0, somaDespesas: 0 };
  }
}

function getMaiorCategoria() {
  const categorias = {};

  Transaction.all.forEach(t => {
    if (t.amount < 0) {
      const categoria = t.category;
      const valor = Math.abs(t.amount / 100);

      if (!categorias[categoria]) {
        categorias[categoria] = 0;
      }
      categorias[categoria] += valor;
    }
  });

  const ranking = Object.entries(categorias)
    .sort((a, b) => b[1] - a[1]);

  return ranking.length ? ranking[0][0] : null;
}

function formatPercent(value) {
  return `${Number(value).toFixed(0)}%`;
}

function escapeHTML(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getObjetivosUrgentes() {
  return Objetivos.all
    .map(objetivo => ({
      ...objetivo,
      dados: calcularObjetivo(objetivo)
    }))
    .filter(item => !item.dados.cumprida && !item.dados.prazoPassou && item.dados.diasRestantes <= objetivoUrgenteDias)
    .sort((a, b) => a.dados.diasRestantes - b.dados.diasRestantes);
}

function getAlertasLimites() {
  if (!Array.isArray(limitesDoBanco) || !limitesDoBanco.length) return [];

  const despesasPorCategoria = Transaction.all.reduce((acc, transacao) => {
    if (transacao.amount < 0) {
      acc[transacao.category] = (acc[transacao.category] || 0) + Math.abs(transacao.amount);
    }
    return acc;
  }, {});

  return limitesDoBanco
    .map(limite => {
      const valorLimite = Number(limite.valor || 0);
      const gasto = despesasPorCategoria[limite.categoria] || 0;
      const percentual = valorLimite > 0 ? (gasto / valorLimite) * 100 : 0;

      return {
        categoria: limite.categoria,
        gasto,
        valorLimite,
        percentual
      };
    })
    .filter(item => item.valorLimite > 0 && item.percentual >= 80)
    .sort((a, b) => b.percentual - a.percentual)
    .map(item => {
    const excedeu = item.percentual > 100;
    const atingido = item.percentual === 100;

    return {
      type: excedeu
        ? 'urgent'
        : (atingido ? 'success' : 'warning'),

      message: excedeu
        ? `🚨 Limite excedido em ${escapeHTML(item.categoria)}: ${Utils.formatCurrency(item.gasto)} de ${Utils.formatCurrency(item.valorLimite)}.`

        : atingido
          ? `🎯 Limite concluído em ${escapeHTML(item.categoria)}: ${Utils.formatCurrency(item.gasto)} de ${Utils.formatCurrency(item.valorLimite)}. Cuidado com novos gastos.`

          : `⚠️ Quase no limite em ${escapeHTML(item.categoria)}: ${formatPercent(item.percentual)} usado.`
    };
  });
  }

function getDashboardAlertItems() {
  const despesas = Math.abs(Transaction.expenses()) / 100;
  const maiorCategoria = getMaiorCategoria();
  const urgentes = getObjetivosUrgentes();
  const alerts = [];

  urgentes.forEach(objetivo => {
    alerts.push({
      type: 'urgent',
      message: `Meta urgente: "${escapeHTML(objetivo.descricao)}" vence em ${objetivo.dados.diasRestantes} dia(s).`
    });
  });

  const objetivosConcluidos = Array.isArray(Objetivos.all)
    ? Objetivos.all.filter(objetivo => Number(objetivo.concluido) === 1)
    : [];

  objetivosConcluidos.slice(0, 3).forEach(objetivo => {
    alerts.push({
      type: 'success',
      message: `🎉 Objetivo concluido: "${escapeHTML(objetivo.descricao)}". Parabens pela conquista!`
    });
  });

  alerts.push(...getAlertasLimites());

  if (despesas > 0) {
    alerts.push(
      {
        type: 'info',
        message: maiorCategoria
          ? `📈 Use o grafico para comparar "${escapeHTML(maiorCategoria)}" com as outras categorias do mês.`
          : '📊 Use o grafico para explorar as categorias com mais peso nas suas despesas deste mês.'
      },
      {
        type: 'info',
        message: '- Alterne entre rosca e barras para enxergar proporcao e ranking com mais clareza.'
      },
      {
        type: 'info',
        message: '- Depois de revisar o grafico, defina limites para as categorias que mais variam.'
      }
    );
  } else {
    alerts.push({
      type: 'info',
      message: '- Nenhuma despesa registrada no mês. Adicione uma transacao para ativar o grafico.'
    });
  }

  if (Array.isArray(Objetivos.all) && Objetivos.all.length > 0 && !urgentes.length) {
    alerts.push({
      type: 'info',
      message: `- Voce tem ${Objetivos.all.length} meta(s) em andamento. Elas entram em alerta quando faltarem ${objetivoUrgenteDias} dias ou menos.`
    });
  }

  return alerts;
}

function renderDashboardAlertsStatic() {
  const container = document.getElementById("dashboard-alerts");
  if (!container) return;

  const alerts = [];
  const despesas = Math.abs(Transaction.expenses()) / 100;

  const urgentes = getObjetivosUrgentes();
  if (urgentes.length) {
    const proximo = urgentes[0];
    alerts.push({
      type: 'urgent',
      message: `Meta urgente: "${proximo.descricao}" vence em ${proximo.dados.diasRestantes} dia(s).` 
    });
  }

  if (despesas > 0) {
    alerts.push({
      type: 'info',
      message: `📈 Use o gráfico para explorar as categorias com mais peso nas suas despesas deste mês.`
    });
  } else {
    alerts.push({
      type: 'info',
      message: '- Nenhuma despesa registrada no mês. Adicione uma transação para ativar o gráfico.'
    });
  }

  if (Objetivos.all.length > 0 && urgentes.length === 0) {
    alerts.push({
      type: 'info',
      message: `Você tem ${Objetivos.all.length} meta(s) em andamento — acompanhe o progresso no painel de objetivos.`
    });
  }

  container.innerHTML = alerts
    .map(alert => `
      <div class="dashboard-alert ${alert.type === 'urgent' ? 'urgent' : ''}">
        <div>
          <strong>${alert.message}</strong>
        </div>
      </div>
    `)
    .join('');
}

function renderDashboardAlerts() {
  const container = document.getElementById("dashboard-alerts");
  if (!container) return;

  const alerts = getDashboardAlertItems();
  if (dashboardAlertIndex >= alerts.length) {
    dashboardAlertIndex = 0;
  }

  const visibleAlerts = alerts.slice(dashboardAlertIndex, dashboardAlertIndex + 2);
  const alertsToShow = visibleAlerts.length === 2 || alerts.length < 2
    ? visibleAlerts
    : [...visibleAlerts, ...alerts.slice(0, 2 - visibleAlerts.length)];

  container.innerHTML = alertsToShow
    .map(alert => `
      <div class="dashboard-alert ${alert.type === 'urgent' ? 'urgent' : ''} ${alert.type === 'warning' ? 'warning' : ''} ${alert.type === 'success' ? 'success' : ''}">
        <div>
          <strong>${alert.message}</strong>
        </div>
      </div>
    `)
    .join('');
}

function rotateDashboardAlerts() {
  const container = document.getElementById("dashboard-alerts");
  if (!container) return;

  const alerts = getDashboardAlertItems();
  if (alerts.length <= 2) {
    renderDashboardAlerts();
    return;
  }

  container.classList.add('is-changing');

  setTimeout(() => {
    dashboardAlertIndex = (dashboardAlertIndex + 2) % alerts.length;
    renderDashboardAlerts();
    container.classList.remove('is-changing');
  }, dashboardAlertTransitionDelay);
}

function startDashboardAlertsRotation() {
  if (dashboardAlertIntervalId) return;
  dashboardAlertIntervalId = setInterval(rotateDashboardAlerts, 20000);
}

function renderDashboardSummaryStatic() {
  const container = document.getElementById("dashboard-summary");
  if (!container) return;

  const despesas = Math.abs(Transaction.expenses()) / 100;
  const entradas = Transaction.incomes();
  const saldo = Transaction.total();
  const expenseCount = Transaction.all.filter(t => t.amount < 0).length;
  const maiorCategoria = getMaiorCategoria();
  const totalMaior = maiorCategoria
    ? Transaction.all.reduce((sum, t) => {
        return t.amount < 0 && t.category === maiorCategoria
          ? sum + Math.abs(t.amount / 100)
          : sum;
      }, 0)
    : 0;
  const usoEntradas = entradas > 0 ? (Math.abs(Transaction.expenses()) / entradas) * 100 : 0;
  const mediaDespesa = expenseCount ? despesas / expenseCount : 0;
  const saldoPositivo = saldo >= 0;

  const urgentes = getObjetivosUrgentes();
  const objetivoTexto = urgentes.length
    ? `${urgentes[0].descricao} vence em ${urgentes[0].dados.diasRestantes} dia(s)`
    : Objetivos.all.length
      ? `${Objetivos.all.length} meta(s) em andamento`
      : 'Nenhuma meta cadastrada';

  container.innerHTML = `
    <div class="summary-card">
      <small>Maior gasto</small>
      <strong>${maiorCategoria || 'Sem dados'}</strong>
      <span>${maiorCategoria ? formatPercent(despesas ? (totalMaior / despesas) * 100 : 0) : 'Aguardando transações'}</span>
    </div>
    <div class="summary-card">
      <small>Despesa total</small>
      <strong>${Utils.formatCurrency(-Transaction.expenses())}</strong>
      <span>Entradas: ${Utils.formatCurrency(Transaction.incomes())}</span>
    </div>
    <div class="summary-card">
      <small>Objetivos</small>
      <strong>${Objetivos.all.length} ativo(s)</strong>
      <span>${objetivoTexto}</span>
    </div>
  `;
}

function renderDashboardSummary() {
  const container = document.getElementById("dashboard-summary");
  if (!container) return;

  const despesas = Math.abs(Transaction.expenses()) / 100;
  const entradas = Transaction.incomes();
  const saldo = Transaction.total();
  const expenseCount = Transaction.all.filter(t => t.amount < 0).length;
  const maiorCategoria = getMaiorCategoria();
  const totalMaior = maiorCategoria
    ? Transaction.all.reduce((sum, t) => {
        return t.amount < 0 && t.category === maiorCategoria
          ? sum + Math.abs(t.amount / 100)
          : sum;
      }, 0)
    : 0;
  const usoEntradas = entradas > 0 ? (Math.abs(Transaction.expenses()) / entradas) * 100 : 0;
  const mediaDespesa = expenseCount ? despesas / expenseCount : 0;
  const saldoPositivo = saldo >= 0;

  const insights = [
    {
      label: 'Maior gasto',
      value: maiorCategoria || 'Sem dados',
      detail: maiorCategoria ? `${formatPercent(despesas ? (totalMaior / despesas) * 100 : 0)} das despesas do mês` : 'Aguardando transacoes'
    },
    {
      label: 'Despesa total',
      value: formatDashboardCurrency(-Transaction.expenses()),
      detail: `Entradas: ${formatDashboardCurrency(entradas)}`
    },
    {
      label: 'Saldo do mês',
      value: formatDashboardCurrency(saldo),
      detail: saldoPositivo ? 'Boa margem para reservar ou investir.' : 'Atenção: despesas acima das entradas.'
    },
    {
      label: 'Uso das entradas',
      value: entradas > 0 ? formatPercent(usoEntradas) : 'Sem entradas',
      detail: usoEntradas > 80 ? 'Tente reduzir gastos variaveis este mês.' : 'Nivel saudavel para manter controle.'
    },
    {
      label: 'Media por despesa',
      value: expenseCount ? formatDashboardCurrency(mediaDespesa * 100) : 'Sem despesas',
      detail: expenseCount ? `${expenseCount} despesa(s) registradas no mês` : 'Cadastre transacoes para medir a media.'
    },
    {
      label: 'Ação recomendada',
      value: maiorCategoria || 'Comece pelo registro',
      detail: maiorCategoria ? 'Revise essa categoria antes de novos gastos.' : 'Adicione uma despesa para receber indicativos.'
    }
  ];

  const visibleInsights = insights.slice(summaryInsightIndex, summaryInsightIndex + 2);
  const insightsToShow = visibleInsights.length === 2
    ? visibleInsights
    : [...visibleInsights, ...insights.slice(0, 2 - visibleInsights.length)];

  const objetivos = Array.isArray(Objetivos.all) ? Objetivos.all : [];
  if (objectiveSummaryIndex >= objetivos.length) {
    objectiveSummaryIndex = 0;
  }

  const objetivoAtual = objetivos[objectiveSummaryIndex];
  const objetivoCard = objetivoAtual
    ? (() => {
        const dados = calcularObjetivo(objetivoAtual);
        const concluido = Number(objetivoAtual.concluido) === 1;
        const ativo = Number(objetivoAtual.ativo) === 1 || dados.ativo;
        const descricao = escapeHTML(objetivoAtual.descricao || 'Objetivo sem nome');
        const detalhe = concluido
          ? `Concluido${objetivoAtual.dataConclusao ? ` em ${formatarDataObjetivo(objetivoAtual.dataConclusao)}` : ''}`
          : !ativo
            ? 'Pausado - ative para direcionar o saldo positivo'
            : dados.cumprida
              ? '100% atingido - pronto para concluir'
              : dados.prazoPassou
                ? `${formatPercent(dados.percentual)} concluido - prazo encerrado`
                : `${formatPercent(dados.percentual)} concluido - faltam ${formatDashboardCurrency(dados.faltante * 100)}`;

        return {
          label: `Objetivos (${objectiveSummaryIndex + 1}/${objetivos.length})`,
          value: descricao,
          detail: detalhe,
          type: concluido ? 'success' : (!ativo ? 'paused' : (dados.cumprida ? 'ready' : (dados.prazoPassou ? 'danger' : 'info')))
        };
      })()
    : {
        label: 'Objetivos',
        value: 'Nenhuma meta',
        detail: 'Cadastre um objetivo para acompanhar o progresso aqui.',
        type: 'info'
      };

  const cards = [...insightsToShow, objetivoCard];

  container.innerHTML = cards.map(card => `
    <div class="summary-card ${card.type || ''}">
      <small>${card.label}</small>
      <strong>${card.value}</strong>
      <span>${card.detail}</span>
    </div>
  `).join('');
}

function rotateDashboardSummaryInsights() {
  const container = document.getElementById("dashboard-summary");
  if (!container) return;

  container.classList.add('is-changing');

  setTimeout(() => {
    summaryInsightIndex = (summaryInsightIndex + 2) % 6;
    renderDashboardSummary();
    container.classList.remove('is-changing');
  }, summaryInsightTransitionDelay);
}

function rotateDashboardSummaryObjective() {
  if (!Array.isArray(Objetivos.all) || Objetivos.all.length <= 1) {
    objectiveSummaryIndex = 0;
    renderDashboardSummary();
    return;
  }

  const container = document.getElementById("dashboard-summary");
  if (!container) return;

  container.classList.add('is-changing');

  setTimeout(() => {
    objectiveSummaryIndex = (objectiveSummaryIndex + 1) % Objetivos.all.length;
    renderDashboardSummary();
    container.classList.remove('is-changing');
  }, summaryInsightTransitionDelay);
}

function startDashboardSummaryRotation() {
  if (!summaryInsightIntervalId) {
    summaryInsightIntervalId = setInterval(rotateDashboardSummaryInsights, 16000);
  }

  if (!objectiveSummaryIntervalId) {
    objectiveSummaryIntervalId = setInterval(rotateDashboardSummaryObjective, 16000);
  }
}

function criarGrafico(tipo) {

    // 1. DEFINIÇÃO DO VALOR (Substitua a linha antiga do valorCentral por isso)
    let valorCentral;
    const descricaoEl = document.querySelector(".chart-center .descricao");
    const valorEl = document.getElementById("valorTotal");


    if (mostrarSalario) { 
        // Se o botão estiver LIGADO (true)
        valorCentral = Transaction.total() / 100; // Saldo (Entradas - Saídas)
        
        if (descricaoEl) descricaoEl.innerHTML = "  Saldo Total ";
        if (valorEl) valorEl.style.color = "#27ae60"; // Verde
    } else {
        // Se o botão estiver DESLIGADO (false)
        valorCentral = Math.abs(Transaction.expenses() / 100); // Somente Despesas
        
        if (descricaoEl) descricaoEl.innerHTML = "Despesas Totais";
        if (valorEl) valorEl.style.color = "#e74c3c"; // Vermelho
    }

    // 2. EXIBIÇÃO NO HTML
    // Aqui você garante que o número formatado apareça no centro do gráfico
    if (valorEl) {
        valorEl.innerHTML = formatAnimatedCurrency(valorCentral);
        animarValorCentral(0, valorCentral, 1000);
    }

  const { categorias, valores, salarioTotal, somaDespesas } = getDadosGrafico();
 
  let labels = [...categorias];
  let dados = [...valores];
  const maiorCategoria = getMaiorCategoria();

  let cores = categorias.map(cat => {
    let corBase = CategoryColors[cat] || "#ccc";

    // destaca a maior categoria
    if (cat === maiorCategoria) {
      return corBase;
    }

    // deixa as outras mais suaves
    return corBase + "80"; // transparência
  });

  return new Chart(ctx, {
    type: tipo,
    data: {
      labels,
      datasets: [{
        data: dados,
        label: "Valores em R$",
        backgroundColor: cores,
        borderColor: "#fff",
        borderWidth: 2,
        hoverOffset: 15
      }]
    },
    options: {
  responsive: true,
  maintainAspectRatio: false,

  plugins: {
    legend: {
      position: tipo === "bar" ? "top" : "bottom"
    }
  },

  cutout: tipo === "doughnut" ? "70%" : 0,
  rotation: -Math.PI / 2,

  scales: tipo === "bar" ? {
    y: {
      beginAtZero: true,
      title: { display: true, text: "Valor em R$" }
    },
    x: {
      title: { display: true, text: "Categorias" }
    }
  } : {},

  animation: {
    duration: 1000,
    easing: "easeOutQuart",
    animateRotate: true,
    animateScale: true
  },

  animations: tipo === "bar" ? {
    y: {
      from: 0,
      duration: 1000,
      easing: "easeOutBounce"
    }
  } : {}
}
  });
}     

// Animar o valor central do gráfico (contagem de 0 ao valor final)
function animarValorCentral(inicio, fim, duracao) {
  const elemento = document.getElementById("valorTotal");
  if (!elemento) return; // Segurança caso o elemento não exista
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progresso = Math.min((timestamp - startTimestamp) / duracao, 1);

    // Calcula o valor atual da contagem
    const valorAtual = progresso * (fim - inicio) + inicio;

    // Atualiza o texto no centro da rosca com formatação curta quando necessário
    elemento.innerHTML = formatAnimatedCurrency(valorAtual);

    if (progresso < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

// Chama/desenha o dashboard (inicializa ctx se necessário)
function renderDashboard() {
  if (!ctx) {
    const canvas = document.getElementById("graficoDespesas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");
  }

  if (grafico) {
    grafico.destroy();
  }

  grafico = criarGrafico(tipoGrafico);
  renderDashboardSummary();
  renderDashboardAlerts();

  if (primeiroRender) {
    primeiroRender = false;
  }
}

const dicasDeUso = [
  {
    id: 'revisarLimites',
    title: 'Revisar limites',
    description: 'Seus limites já estão definidos. Use este painel para verificar se alguma categoria já está perto do limite.',
    actionText: 'Ver Limites',
    action() {
      const btn = document.getElementById('definirLimiteBtn');
      if (btn) {
        btn.classList.add('highlight-target');
        btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        btn.click();
        setTimeout(() => btn.classList.remove('highlight-target'), 2500);
      }
    }
  },
  {
    id: 'criarLimite',
    title: 'Definir limite',
    description: 'Ainda não há limites cadastrados. Crie limites para evitar gastos excessivos por categoria.',
    actionText: 'Criar Limite',
    action() {
      const btn = document.getElementById('definirLimiteBtn');
      if (btn) {
        btn.classList.add('highlight-target');
        btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        btn.click();
        setTimeout(() => btn.classList.remove('highlight-target'), 2500);
      }
    }
  },
  {
    id: 'alternarGrafico',
    title: 'Alternar gráfico',
    description: 'Veja seus dados em gráfico de rosca ou barras para identificar padrões diferentes.',
    actionText: 'Alternar Gráfico',
    action() {
      mudarTipo();
    }
  },
  {
    id: 'objetivos',
    title: 'Planejar objetivos',
    description: 'Defina e acompanhe metas financeiras diretamente no painel de objetivos.',
    actionText: 'Abrir Objetivos',
    action() {
      toggleObjetivosPanel();
    }
  },
  {
    id: 'relatorio',
    title: 'Gerar relatório',
    description: 'Crie um resumo em PDF das suas finanças com apenas um clique.',
    actionText: 'Gerar Relatório',
    action() {
      gerarRelatorio();
    }
  },
  {
    id: 'pesquisa',
    title: 'Buscar transações',
    description: 'Filtre suas transações facilmente por descrição ou categoria.',
    actionText: 'Abrir Busca',
    action() {
      const input = document.getElementById('transactionSearch');
      if (input) {
        input.focus();
      }
    }
  }
];

function getDicasDeUso() {
  const temLimites = Array.isArray(limitesDoBanco) && limitesDoBanco.length > 0;
  return dicasDeUso.filter(dica => temLimites ? dica.id !== 'criarLimite' : dica.id !== 'revisarLimites');
}

function mostrarDica() {
  const tip = document.getElementById('floatingTip');
  const list = tip?.querySelector('.floating-tip-list');
  if (!tip || !list) return;

  const dicas = getDicasDeUso();
  list.innerHTML = dicas.map(dica => `
    <button type="button" class="floating-tip-item" onclick="executarAcaoDica('${dica.id}')">
      <div>
        <strong>${dica.title}</strong>
        <small>${dica.description}</small>
      </div>
      <span>${dica.actionText}</span>
    </button>
  `).join('');

  tip.classList.remove('hidden');
}

function executarAcaoDica(id) {
  const dica = dicasDeUso.find(item => item.id === id);
  if (!dica || typeof dica.action !== 'function') return;
  dica.action();
  fecharTip();
}

function fecharTip() {
  const tip = document.getElementById('floatingTip');
  if (!tip) return;
  tip.classList.add('hidden');

  const btn = document.getElementById('definirLimiteBtn');
  if (btn) {
    btn.classList.remove('highlight-target');
  }
}

// Fechar dica ao clicar fora do modal
const floatingTipOverlay = document.getElementById('floatingTip');
if (floatingTipOverlay) {
  floatingTipOverlay.addEventListener('click', (event) => {
    if (event.target === floatingTipOverlay) {
      fecharTip();
    }
  });
}

// Alterna entre gráfico de rosca e barras
function mudarTipo() {
  tipoGrafico = tipoGrafico === "doughnut" ? "bar" : "doughnut";
  renderDashboard();
}

// Alterna mostrar/ocultar salário no gráfico
function alternarSalario() {
  mostrarSalario = !mostrarSalario;
  renderDashboard();
}

// --- Inicialização ---
// Executa após a página carregar, inicializa a App
document.addEventListener("DOMContentLoaded", () => {
  setupTransactionSearch();
  App.init();
  calcularLimitesPorCategoria();
  startDashboardTipRotation();
  startDashboardAlertsRotation();
  startDashboardSummaryRotation();

  const tipGrid = document.getElementById('dashboardTipGrid');
  if (tipGrid) {
    tipGrid.addEventListener('click', () => {
      rotateDashboardTips();
    });
  }

  const alertContainer = document.getElementById('dashboard-alerts');
  if (alertContainer) {
    alertContainer.addEventListener('click', () => {
      rotateDashboardAlerts();
    });
  }

  const summaryContainer = document.getElementById('dashboard-summary');
  if (summaryContainer) {
    summaryContainer.addEventListener('click', () => {
      rotateDashboardSummaryInsights();
    });
  }

  renderDashboard();

  const installmentOverlay = document.getElementById("modalInstallmentOverlay");
  if (installmentOverlay) {
    installmentOverlay.addEventListener("click", (event) => {
      if (event.target === installmentOverlay) {
        closeInstallmentModal();
      }
    });
  }
});

// ----------------------
// Modal Limite por Categoria
// ----------------------
const ModalLimite = {
  toggle() {
    document.getElementById("modalLimiteOverlay").classList.toggle("active");
  }
};

// ----------------------
// Toast Mensagens de Sucesso e Erro (Alertas)
// ----------------------
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    // Estilo moderno
    toast.style.background = type === 'success' ? '#2fb380' : '#e92929';
    toast.style.color = 'white';
    toast.style.padding = '15px 25px';
    toast.style.borderRadius = '8px';
    toast.style.marginBottom = '10px';
    toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    toast.style.fontFamily = "'Poppins', sans-serif";
    toast.style.fontWeight = '500';
    toast.style.transition = 'opacity 0.5s ease';
    toast.innerText = message;
    
    container.appendChild(toast);
    
    // Remove após 3 segundos
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

const StorageObjetivos = {
  get() {
    return JSON.parse(localStorage.getItem("planix:objetivos")) || [];
  },
  set(objetivos) {
    localStorage.setItem("planix:objetivos", JSON.stringify(objetivos));
  }
};

const Objetivos = {
  all: (typeof objetivosDoBanco !== "undefined" ? objetivosDoBanco : StorageObjetivos.get()),

  async add(objetivo) {
    const formData = new URLSearchParams();
    formData.append("descricao", objetivo.descricao);
    formData.append("valor_meta", objetivo.valor);
    formData.append("prazo", objetivo.prazo);

    const response = await fetch("actions/salvar_objetivo.php", {
      method: "POST",
      body: formData
    });

    if (response.ok) {
      window.location.reload();
    } else {
      const text = await response.text();
      alert("Erro ao salvar objetivo: " + text);
    }
  },

  async remove(idOrIndex) {
    const objetivo = Objetivos.all.find(obj => obj.id === idOrIndex);

    if (objetivo) {
      const response = await fetch(`actions/excluir_objetivo.php?id=${idOrIndex}`);
      if (response.ok) {
        window.location.reload();
      } else {
        const text = await response.text();
        alert("Erro ao excluir objetivo: " + text);
      }
    } else {
      Objetivos.all.splice(idOrIndex, 1);
      StorageObjetivos.set(Objetivos.all);
      renderObjetivos();
    }
  },

  async complete(idOrIndex) {
    const objetivo = Objetivos.all.find(obj => obj.id === idOrIndex);

    if (objetivo) {
      window.location.href = `actions/concluir_objetivo.php?id=${idOrIndex}&month=${mesAtualSelecionado}&year=${anoAtualSelecionado}`;
    } else {
      const localObjetivo = Objetivos.all[idOrIndex];
      if (!localObjetivo) return;

      localObjetivo.concluido = 1;
      localObjetivo.dataConclusao = hojeISO();
      StorageObjetivos.set(Objetivos.all);
      showNotification(`Parabens! Objetivo "${localObjetivo.descricao}" concluido com sucesso!`);
      renderObjetivos();
      renderDashboard();
    }
  },

  activate(idOrIndex) {
    const objetivo = Objetivos.all.find(obj => obj.id === idOrIndex);

    if (objetivo) {
      window.location.href = `actions/ativar_objetivo.php?id=${idOrIndex}&month=${mesAtualSelecionado}&year=${anoAtualSelecionado}`;
    } else {
      Objetivos.all.forEach((item, index) => {
        item.ativo = index === idOrIndex ? 1 : 0;
      });
      StorageObjetivos.set(Objetivos.all);
      showNotification("Objetivo ativado com sucesso!");
      renderObjetivos();
      renderDashboard();
    }
  }
};

function hojeISO() {
  return new Date().toISOString().split("T")[0];
}

function parseDataObjetivo(data) {
  if (!data) return null;
  const dataLimpa = String(data).split(" ")[0];

  if (dataLimpa.includes("/")) {
    const [dia, mes, ano] = dataLimpa.split("/");
    return new Date(Number(ano), Number(mes) - 1, Number(dia));
  }

  const [ano, mes, dia] = dataLimpa.split("-");
  return new Date(Number(ano), Number(mes) - 1, Number(dia));
}

function formatarDataObjetivo(data) {
  const parsed = parseDataObjetivo(data);
  return parsed ? parsed.toLocaleDateString("pt-BR") : "";
}

function formatarMoedaObjetivo(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(valor || 0));
}

function fimDoMesSelecionado() {
  return new Date(anoAtualSelecionado, mesAtualSelecionado, 0);
}

function normalizarValorTransacaoObjetivo(transacao) {
  let amount = Number(transacao.amount || 0);

  if (String(transacao.category).toLowerCase() !== "entradas" && amount > 0) {
    amount = -amount;
  }

  if (String(transacao.category).toLowerCase() === "entradas" && amount < 0) {
    amount = Math.abs(amount);
  }

  return amount / 100;
}

function calcularObjetivo(objetivo) {
  const criadoEm = objetivo.criadoEm || objetivo.dataCriacao || hojeISO();
  const prazo = parseDataObjetivo(objetivo.prazo);
  const referencia = fimDoMesSelecionado();
  const dataFinalCalculo = prazo && referencia > prazo ? prazo : referencia;
  const existeObjetivoAtivo = Array.isArray(Objetivos.all) && Objetivos.all.some(item => Number(item.ativo) === 1 && Number(item.concluido) !== 1);
  const primeiroObjetivoAberto = Array.isArray(Objetivos.all)
    ? Objetivos.all.find(item => Number(item.concluido) !== 1)
    : null;
  const objetivoPadraoAtivo = !existeObjetivoAtivo && primeiroObjetivoAberto && primeiroObjetivoAberto.id === objetivo.id;
  const objetivoAtivo = objetivoPadraoAtivo || Number(objetivo.ativo) === 1 || Number(objetivo.concluido) === 1;
  const transacoesObjetivo = (typeof transacoesObjetivosDoBanco !== "undefined" && transacoesObjetivosDoBanco.length)
    ? transacoesObjetivosDoBanco
    : Transaction.all;

  const saldoAcumulado = objetivoAtivo
    ? transacoesObjetivo.reduce((total, transacao) => {
      const dataTransacao = parseDataObjetivo(transacao.date);

      if (!dataTransacao || !prazo) return total;
      if (dataTransacao > dataFinalCalculo) return total;

      return total + normalizarValorTransacaoObjetivo(transacao);
    }, 0)
    : 0;

  const valorMeta = Number(objetivo.valor || objetivo.valor_meta || 0);
  const valorParaMeta = Math.max(0, saldoAcumulado);
  const faltante = Math.max(0, valorMeta - valorParaMeta);
  const percentual = valorMeta > 0 ? Math.min(100, (valorParaMeta / valorMeta) * 100) : 0;
  const prazoPassou = prazo ? referencia >= prazo : false;
  const cumprida = valorParaMeta >= valorMeta;
  const diasRestantes = prazo ? Math.max(0, Math.ceil((prazo - referencia) / (1000 * 60 * 60 * 24))) : 0;
  const mesesRestantes = Math.max(1, Math.ceil(diasRestantes / 30));
  const sugestaoMensal = faltante / mesesRestantes;
  const sugestaoDiaria = diasRestantes > 0 ? faltante / diasRestantes : faltante;

  return {
    criadoEm,
    prazo,
    saldoAcumulado,
    valorParaMeta,
    faltante,
    percentual,
    prazoPassou,
    cumprida,
    ativo: objetivoAtivo,
    diasRestantes,
    sugestaoMensal,
    sugestaoDiaria
  };
}

function textoStatusObjetivo(dados) {
  if (!dados.ativo) {
    return "Objetivo pausado. Ative para direcionar o saldo positivo para ele.";
  }

  if (dados.cumprida) {
    return "Meta atingida. Agora voce pode concluir este objetivo.";
  }

  if (dados.prazoPassou) {
    return "Meta nao cumprida no prazo planejado.";
  }

  return `Em andamento. Faltam ${formatarMoedaObjetivo(dados.faltante)}.`;
}

function dicaObjetivo(dados) {
  if (!dados.ativo) {
    return "Enquanto outro objetivo estiver ativo, este nao recebe o acumulado do saldo.";
  }

  if (dados.cumprida) {
    return "Conclua a meta para registrar essa conquista no painel e receber a notificacao de parabens.";
  }

  if (dados.prazoPassou) {
    return `Para tentar recuperar, revise os maiores gastos, diminua despesas variaveis e planeje uma reserva extra de ${formatarMoedaObjetivo(dados.faltante)}.`;
  }

  return `Sugestao: Reserve cerca de ${formatarMoedaObjetivo(dados.sugestaoMensal)} por mês ou ${formatarMoedaObjetivo(dados.sugestaoDiaria)} por dia até o Prazo.`;
}

function toggleObjetivosPanel() {
  const panel = document.getElementById("objetivosPanel");
  panel.classList.toggle("hidden");
  renderObjetivos();
}

async function adicionarObjetivo() {
  const descricao = document.getElementById("objetivoDescricao").value.trim();
  const valor = Number(document.getElementById("objetivoValor").value);
  const prazo = document.getElementById("objetivoPrazo").value;

  if (!descricao || !valor || !prazo) {
    alert("Preencha objetivo, valor e prazo.");
    return;
  }

  if (parseDataObjetivo(prazo) < parseDataObjetivo(hojeISO())) {
    alert("Escolha uma data de prazo a partir de hoje.");
    return;
  }

  await Objetivos.add({ descricao, valor, prazo });
}

function confirmarRemoverObjetivo(idOrIndex) {
  const objetivo = Objetivos.all.find(obj => obj.id === idOrIndex) || Objetivos.all[idOrIndex];
  const descricao = objetivo?.descricao || "este objetivo";

  customConfirm(`Tem certeza que deseja excluir o objetivo "${descricao}"?`, () => {
    Objetivos.remove(idOrIndex);
  });
}

function renderObjetivos() {
  const container = document.getElementById("listaObjetivos");

  if (!container) return;
  if (Objetivos.all.length === 0) {
    container.innerHTML = "<p style='color: #555; margin-top: 1rem;'>Nenhum objetivo planejado ainda.</p>";
    return;
  }

  container.innerHTML = Objetivos.all
    .map((objetivo, index) => {
      const descricao = objetivo.descricao || "";
      const valorMeta = objetivo.valor ?? objetivo.valor_meta ?? 0;
      const dados = calcularObjetivo(objetivo);
      const concluido = Number(objetivo.concluido) === 1;
      const objetivoAtivo = Number(objetivo.ativo) === 1 || dados.ativo;
      const classeStatus = concluido ? "concluido" : (!objetivoAtivo ? "pausado" : (dados.cumprida ? "cumprida" : (dados.prazoPassou ? "nao-cumprida" : "andamento")));
      const saldoClasse = dados.saldoAcumulado >= 0 ? "positivo" : "negativo";
      const objetivoId = objetivo.id ?? index;
      const statusTexto = concluido
        ? "Objetivo concluido. Parabens pela conquista!"
        : textoStatusObjetivo(dados);
      const dicaTexto = concluido
        ? "Essa meta fica registrada como concluida. Voce pode manter no historico ou remover quando quiser."
        : dicaObjetivo(dados);
      const concluirButton = objetivoAtivo && dados.cumprida && !concluido
        ? `<button type="button" class="concluir-objetivo" onclick="Objetivos.complete(${objetivoId})">Concluir objetivo</button>`
        : '';
      const ativarButton = !objetivoAtivo && !concluido
        ? `<button type="button" class="ativar-objetivo" onclick="Objetivos.activate(${objetivoId})">Ativar objetivo</button>`
        : '';
      const progressoObjetivo = concluido
        ? `<div class="objetivo-concluido-badge">Objetivo concluido</div>`
        : `<div class="objetivo-progress">
            <span style="width: ${dados.percentual}%;"></span>
          </div>`;
      const acumuladoObjetivo = concluido ? Number(valorMeta) : dados.valorParaMeta;
      const faltanteObjetivo = concluido ? 0 : dados.faltante;

      return `
        <div class="objetivo-card ${classeStatus}">
          <div class="objetivo-topo">
            <strong>${escapeHTML(descricao)}</strong>
            <span>${concluido ? 'Concluido' : (objetivoAtivo ? `${dados.percentual.toFixed(0)}%` : 'Pausado')}</span>
          </div>
          <div class="objetivo-meta">Meta: ${formatarMoedaObjetivo(valorMeta)} | Criada em: ${formatarDataObjetivo(dados.criadoEm)} | Prazo: ${formatarDataObjetivo(objetivo.prazo)}</div>
          ${progressoObjetivo}
          <div class="objetivo-valores">
            <span class="${saldoClasse}">Acumulado: ${formatarMoedaObjetivo(acumuladoObjetivo)}</span>
            <span>Faltam: ${formatarMoedaObjetivo(faltanteObjetivo)}</span>
          </div>
          <div class="objetivo-status">${statusTexto}</div>
          <div class="objetivo-dica">${dicaTexto}</div>
          <div class="objetivo-actions">
            ${ativarButton}
            ${concluirButton}
            <button type="button" class="remover-objetivo" onclick="confirmarRemoverObjetivo(${objetivoId})">Remover</button>
          </div>
        </div>
      `;
    })
    .join("");
}

// Funcao para gerar relatorio em PDF
async function gerarRelatorio() {
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;
    const mesNome = nomesMeses[mesAtualSelecionado - 1];
    const nomeRelatorio = `PF_Extrato_${mesNome}_${anoAtualSelecionado}`;
    const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

    let y = 16;

    const formatMoney = (value) => moeda.format(Number(value || 0));
    const centsToMoney = (value) => formatMoney(Math.abs(Number(value || 0)) / 100);
    const sanitize = (value) => String(value || "").replace(/\s+/g, " ").trim();
    const dateToNumber = (date) => {
      const [dia, mes, ano] = String(date).split("/");
      return new Date(`${ano}-${mes}-${dia}`).getTime();
    };
    const setText = (color = [31, 41, 55], style = "normal", size = 9) => {
      doc.setTextColor(...color);
      doc.setFont("helvetica", style);
      doc.setFontSize(size);
    };
    const addFooter = () => {
      setText([120, 130, 150], "normal", 8);
      doc.text("PlanixFinance - Relatório Financeiro", margin, pageHeight - 8);
      doc.text(`Pagina ${doc.internal.getNumberOfPages()}`, pageWidth - margin, pageHeight - 8, { align: "right" });
    };
    const addPage = () => {
      addFooter();
      doc.addPage();
      y = 16;
    };
    const ensureSpace = (height) => {
      if (y + height > pageHeight - 18) {
        addPage();
      }
    };
    const sectionTitle = (title) => {
      ensureSpace(12);
      setText([45, 50, 119], "bold", 11);
      doc.text(title, margin, y);
      y += 6;
      doc.setDrawColor(222, 226, 235);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;
    };
    const drawSummaryCard = (x, title, value, color) => {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(224, 229, 239);
      doc.roundedRect(x, y, 84, 25, 2, 2, "FD");
      setText([91, 100, 122], "normal", 8);
      doc.text(title, x + 6, y + 8);
      setText(color, "bold", 15);
      doc.text(value, x + 6, y + 19);
    };
    const drawTransactionHeader = () => {
      doc.setFillColor(45, 50, 119);
      doc.rect(margin, y, contentWidth, 8, "F");
      setText([255, 255, 255], "bold", 8);
      doc.text("Data", margin + 3, y + 5.2);
      doc.text("Descricao", margin + 28, y + 5.2);
      doc.text("Categoria", margin + 151, y + 5.2);
      doc.text("Tipo", margin + 198, y + 5.2);
      doc.text("Valor", pageWidth - margin - 3, y + 5.2, { align: "right" });
      y += 8;
    };

    const transacoesFiltradas = Transaction.all
      .filter(t => {
        const [, mes, ano] = String(t.date).split("/");
        return parseInt(mes, 10) === mesAtualSelecionado && parseInt(ano, 10) === anoAtualSelecionado;
      })
      .sort((a, b) => dateToNumber(b.date) - dateToNumber(a.date));

    const entradas = transacoesFiltradas
      .filter(t => t.category === "Entradas")
      .reduce((acc, t) => acc + Number(t.amount || 0), 0) / 100;
    const saidas = Math.abs(transacoesFiltradas
      .filter(t => t.category !== "Entradas")
      .reduce((acc, t) => acc + Number(t.amount || 0), 0)) / 100;
    const saldo = entradas - saidas;

    const despesasPorCategoria = transacoesFiltradas.reduce((acc, t) => {
      if (t.category !== "Entradas") {
        acc[t.category] = (acc[t.category] || 0) + Math.abs(Number(t.amount || 0));
      }
      return acc;
    }, {});
    const rankingCategorias = Object.entries(despesasPorCategoria).sort((a, b) => b[1] - a[1]);

    doc.setFillColor(45, 50, 119);
    doc.rect(0, 0, pageWidth, 36, "F");
    setText([255, 255, 255], "bold", 18);
    doc.text("PlanixFinance", margin, 15);
    setText([222, 235, 255], "normal", 9);
    doc.text(`PF_Extrato financeiro - ${mesNome} de ${anoAtualSelecionado}`, margin, 23);
    doc.text(
      `Gerado em ${new Date().toLocaleDateString("pt-BR")} as ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
      pageWidth - margin,
      23,
      { align: "right" }
    );

    y = 46;
    drawSummaryCard(margin, "Entradas", formatMoney(entradas), [39, 174, 96]);
    drawSummaryCard(margin + 94, "Saidas", formatMoney(saidas), [220, 53, 69]);
    drawSummaryCard(margin + 188, "Saldo do mês", formatMoney(saldo), saldo >= 0 ? [39, 174, 96] : [220, 53, 69]);
    y += 36;

    sectionTitle("Resumo por categoria");
    if (rankingCategorias.length === 0) {
      setText([91, 100, 122], "normal", 9);
      doc.text("Nenhuma despesa registrada neste periodo.", margin, y);
      y += 10;
    } else {
      const maxCategoria = rankingCategorias[0][1] || 1;
      rankingCategorias.slice(0, 8).forEach(([categoria, totalCentavos]) => {
        ensureSpace(10);
        const total = Math.abs(totalCentavos) / 100;
        const barWidth = 86 * (totalCentavos / maxCategoria);

        setText([31, 41, 55], "bold", 8.5);
        doc.text(sanitize(categoria), margin, y);
        setText([31, 41, 55], "normal", 8.5);
        doc.text(formatMoney(total), margin + 58, y);

        doc.setFillColor(235, 239, 247);
        doc.roundedRect(margin + 92, y - 3.8, 86, 4, 1, 1, "F");
        doc.setFillColor(45, 50, 119);
        doc.roundedRect(margin + 92, y - 3.8, barWidth, 4, 1, 1, "F");
        y += 7;
      });
      y += 4;
    }

    sectionTitle("Lançamentos do mês");
    if (transacoesFiltradas.length === 0) {
      setText([91, 100, 122], "normal", 9);
      doc.text("Nenhum Lançamento encontrado para este periodo.", margin, y);
      y += 10;
    } else {
      drawTransactionHeader();

      transacoesFiltradas.forEach((t, index) => {
        const descricao = doc.splitTextToSize(sanitize(t.description), 112);
        const categoria = doc.splitTextToSize(sanitize(t.category), 39);
        const rowHeight = Math.max(9, descricao.length * 4.2 + 4, categoria.length * 4.2 + 4);

        if (y + rowHeight > pageHeight - 18) {
          addPage();
          sectionTitle("Lançamentos do mês");
          drawTransactionHeader();
        }

        const bg = index % 2 === 0 ? 249 : 244;
        doc.setFillColor(bg, bg + 1, bg + 4);
        doc.rect(margin, y, contentWidth, rowHeight, "F");

        setText([31, 41, 55], "normal", 8);
        doc.text(t.date, margin + 3, y + 6);
        doc.text(descricao, margin + 28, y + 6);
        doc.text(categoria, margin + 151, y + 6);

        const isEntrada = Number(t.amount) > 0;
        setText(isEntrada ? [39, 174, 96] : [220, 53, 69], "bold", 8);
        doc.text(isEntrada ? "Entrada" : "Saida", margin + 198, y + 6);
        doc.text(`${isEntrada ? "+" : "-"} ${centsToMoney(t.amount)}`, pageWidth - margin - 3, y + 6, { align: "right" });

        y += rowHeight;
      });
      y += 7;
    }

    sectionTitle("Objetivos planejados");
    if (!Objetivos.all || Objetivos.all.length === 0) {
      setText([91, 100, 122], "normal", 9);
      doc.text("Nenhum objetivo planejado ate o momento.", margin, y);
      y += 10;
    } else {
      Objetivos.all.forEach((objetivo) => {
        const dados = calcularObjetivo(objetivo);
        const concluido = Number(objetivo.concluido) === 1;

        const status = concluido
          ? "Objetivo concluido"
          : (
              dados.cumprida
                ? "Meta cumprida"
                : (dados.prazoPassou ? "Meta nao cumprida" : "Em andamento")
            );

        const statusColor = concluido
          ? [39, 174, 96]
          : (
              dados.cumprida
                ? [46, 204, 113]
                : (dados.prazoPassou ? [220, 53, 69] : [45, 50, 119])
            );
        const rowHeight = 20;

        ensureSpace(rowHeight + 3);

        doc.setFillColor(249, 250, 253);
        doc.setDrawColor(224, 229, 239);
        doc.roundedRect(margin, y, contentWidth, rowHeight, 2, 2, "FD");

        setText([31, 41, 55], "bold", 9);
        doc.text(sanitize(objetivo.descricao), margin + 4, y + 6);

        setText([91, 100, 122], "normal", 8);
        doc.text(
  `Meta: ${formatMoney(objetivo.valor)} | Acumulado: ${
    concluido
      ? formatMoney(objetivo.valor)
      : formatMoney(dados.valorParaMeta)
  } | Faltam: ${
    concluido
      ? formatMoney(0)
      : formatMoney(dados.faltante)
  }`,
  margin + 4,
  y + 12
);
        doc.text(`Criada em: ${formatarDataObjetivo(dados.criadoEm)} | Prazo: ${formatarDataObjetivo(objetivo.prazo)}`,
        margin + 4, y + 17);
        if (!concluido) {

  doc.setFillColor(235, 239, 247);
  doc.roundedRect(pageWidth - margin - 82, y + 6, 40, 4, 1, 1, "F");

  doc.setFillColor(...statusColor);
  doc.roundedRect(
    pageWidth - margin - 82,
    y + 6,
    40 * (dados.percentual / 100),
    4,
    1,
    1,
    "F"
  );

}

setText(statusColor, "bold", 8);

doc.text(
  concluido
    ? "Parabens!"
    : `${dados.percentual.toFixed(0)}%`,
  pageWidth - margin - 36,
  y + 9
);

doc.text(status, pageWidth - margin - 4, y + 16, { align: "right" });

y += rowHeight + 8;
      });
    }

    if (typeof limitesDoBanco !== "undefined" && limitesDoBanco.length > 0) {
      sectionTitle("Limites por categoria");
      
      limitesDoBanco.forEach((limiteObj) => {
        ensureSpace(11);
        const categoria = sanitize(limiteObj.categoria);
        const limiteCentavos = Number(limiteObj.valor || 0);
        const gastoCentavos = Math.abs(transacoesFiltradas
          .filter(t => t.category === limiteObj.categoria)
          .reduce((acc, t) => acc + Number(t.amount || 0), 0));
        const porcentagem = limiteCentavos > 0 ? (gastoCentavos / limiteCentavos) * 100 : 0;
        const usado = Math.min(100, porcentagem);
        const status = porcentagem > 100 ? "Excedido" : porcentagem >= 80 ? "Atenção" : "OK";
        const statusColor = porcentagem > 100 ? [220, 53, 69] : porcentagem >= 80 ? [230, 126, 34] : [39, 174, 96];

        setText([31, 41, 55], "bold", 8.5);
        doc.text(categoria, margin, y);
        setText([91, 100, 122], "normal", 8);
        doc.text(`${centsToMoney(gastoCentavos)} de ${centsToMoney(limiteCentavos)} (${porcentagem.toFixed(0)}%)`, margin + 52, y);

        doc.setFillColor(235, 239, 247);
        doc.roundedRect(margin + 132, y - 3.8, 70, 4, 1, 1, "F");
        doc.setFillColor(...statusColor);
        doc.roundedRect(margin + 132, y - 3.8, 70 * (usado / 100), 4, 1, 1, "F");

        setText(statusColor, "bold", 8);
        doc.text(status, pageWidth - margin, y, { align: "right" });
        y += 8;
      });
    }

    addFooter();
    doc.save(`${nomeRelatorio}.pdf`);
    showNotification(`Relatorio de ${mesNome} baixado com sucesso!`);
  } catch (error) {
    console.error("Erro ao gerar relatorio:", error);
    alert("Erro ao gerar relatorio: " + error.message);
  }
}

// ========== Gerenciador de Modal de Parcelamentos ==========
const ModalInstallment = {
  toggle() {
    document.getElementById("modalInstallmentOverlay").classList.toggle("active");
  },
};

// Abre o modal e carrega a lista do banco
function openInstallmentModal() {
  const select = document.getElementById("selectInstallment");
  select.innerHTML = '<option value="">-- Escolha um parcelamento --</option>';

  // 'parcelamentosDoBanco' vem do PHP no topo do arquivo
  if (parcelamentosDoBanco.length === 0) {
    select.innerHTML = '<option value="">-- Nenhum parcelamento --</option>';
  } else {
    parcelamentosDoBanco.forEach(inst => {
      const option = document.createElement("option");
      option.value = inst.id;
      option.textContent = `${inst.description} (${inst.numParcelas}x)`;
      select.appendChild(option);
    });
  }
  document.getElementById("modalInstallmentOverlay").classList.add("active");
}

function closeInstallmentModal() {
  document.getElementById("modalInstallmentOverlay").classList.remove("active");
}

// Faz aparecer os campos extras no formulário
function toggleParcelamentoFields() {
  const category = document.getElementById("category").value;
  const fields = document.getElementById("parcelamentoFields");
  const form = document.getElementById("transactionForm");

  if (category === "Parcelamento") {
    fields.style.display = "block";
    form.action = "actions/salvar_parcelamento.php";
  } else {
    fields.style.display = "none";
    form.action = "actions/salvar_transacao.php";
  }
}

function inicioDoDia(data) {
    const normalizada = new Date(data);
    normalizada.setHours(0, 0, 0, 0);
    return normalizada;
}

function showInstallmentDetails() {
    const id = document.getElementById("selectInstallment").value;
    const detailsArea = document.getElementById("installmentDetails");
    const cardInfo = document.getElementById("installmentCardInfo");
    const tableContainer = document.getElementById("installmentTableContainer");

    if (!id) {
        detailsArea.style.display = "none";
        return;
    }

    // Busca no array que veio do MySQL
    const p = parcelamentosDoBanco.find(item => item.id == id);
    if (!p) return;

    detailsArea.style.display = "block";
    document.getElementById("installmentTitle").innerText = `Parcelas: ${p.description}`;

    // Preenche o Card de Resumo
    cardInfo.innerHTML = `
        <p><strong>Valor Total:</strong> - ${Utils.formatCurrency(p.totalAmount)}</p>
        <p><strong>Parcelas:</strong> ${p.numParcelas}x</p>
        <p><strong>Criado em:</strong> ${new Date(p.dataInicio).toLocaleDateString('pt-BR')}</p>
        <div class="installment-actions">
          <button type="button" class="action-icon action-edit" onclick="openEditInstallmentModal(${id})" aria-label="Editar parcelamento ${p.description}" title="Editar">
            <i class="fa-solid fa-pen-to-square" aria-hidden="true"></i>
          </button>
          <button type="button" class="action-icon action-delete" onclick="deleteInstallment(${id})" aria-label="Excluir parcelamento ${p.description}" title="Excluir">
            <i class="fa-solid fa-trash" aria-hidden="true"></i>
          </button>
        </div>
    `;

    // Gera a Tabela Dinâmica
    let tableHTML = `
        <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
            <thead>
                <tr style="background: #e1e1e1; text-align: left;">
                    <th style="padding: 8px;">Parcela</th>
                    <th style="padding: 8px;">Data</th>
                    <th style="padding: 8px;">Valor</th>
                    <th style="padding: 8px;">Status</th>
                </tr>
            </thead>
            <tbody>`;

    const valorCadaParcela = p.totalAmount / p.numParcelas;
    let dataParcela = new Date(p.dataInicio);
    const hoje = inicioDoDia(new Date());

    for (let i = 1; i <= p.numParcelas; i++) {
        const dataParcelaAtual = new Date(dataParcela);
        const parcelaVenceu = inicioDoDia(dataParcelaAtual) <= hoje;
        const statusClasse = parcelaVenceu ? "installment-status registered" : "installment-status pending";
        const statusTexto = parcelaVenceu ? "Registrada" : "Pendente";

        tableHTML += `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px;">${i}/${p.numParcelas}</td>
                <td style="padding: 8px;">${dataParcelaAtual.toLocaleDateString('pt-BR')}</td>
                <td style="padding: 8px; color: #e92929; font-weight: bold;">- ${Utils.formatCurrency(valorCadaParcela)}</td>
                <td style="padding: 8px;"><span class="${statusClasse}">${statusTexto}</span></td>
            </tr>`;
        dataParcela.setMonth(dataParcela.getMonth() + 1);
    }

    tableHTML += `</tbody></table>`;
    tableContainer.innerHTML = tableHTML;
}

function openEditInstallmentModal(id) {
  const installment = parcelamentosDoBanco.find(item => item.id == id);
  if (!installment) return;

  document.getElementById("modalInstallmentOverlay").classList.remove("active");
  document.getElementById("editInstallmentId").value = installment.id;
  document.getElementById("editInstallmentDescription").value = installment.description;
  document.getElementById("editInstallmentAmount").value = Math.abs(installment.totalAmount / 100).toFixed(2);
  document.getElementById("editInstallmentNumParcelas").value = installment.numParcelas;
  document.getElementById("editInstallmentDate").value = installment.dataInicio;
  document.getElementById("editInstallmentOverlay").classList.add("active");
}

function closeEditInstallmentModal() {
  document.getElementById("editInstallmentOverlay").classList.remove("active");
}

function deleteInstallment(id) {
  const p = parcelamentosDoBanco.find(item => item.id == id);
  if (!p) return;

  customConfirm(
    `Tem certeza que deseja excluir o parcelamento?\n\n"${p.description}"\n\nIsso removerá todas as ${p.numParcelas} parcelas registradas.`,
    () => { window.location.href = `actions/excluir_parcelamento.php?id=${id}&month=${mesAtualSelecionado}&year=${anoAtualSelecionado}`; }
  );
}

  // Gerencia usuários
const UserManager = {
    // Agora o controle de login é feito pelo PHP
    // JS apenas assume que se chegou na página, está logado
    isLoggedIn() {
        return true;
    },

    getCurrentUser() {
        return null;
    },
};

// Função de logout
function logout() {
  UserManager.logout();
  window.location.href = "pages/auth/login.php";
}

// Inicialização condicional
if (document.getElementById("user-status")) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", checkLoginStatus);
  } else {
    checkLoginStatus();
  }
}

// --- Funcionalidades da página de login ---
if (document.getElementById("loginForm")) {
  document.getElementById("loginForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const messageEl = document.getElementById("loginMessage");

    // Limpa mensagens anteriores
    messageEl.textContent = "";
    messageEl.style.color = "";

    // Validação básica
    if (!email || !password) {
      messageEl.textContent = "Preencha todos os campos";
      messageEl.style.color = "red";
      return;
    }

    if (!email.includes("@")) {
      messageEl.textContent = "Digite um email válido";
      messageEl.style.color = "red";
      return;
    }

    try {
      const user = UserManager.login(email, password);
      messageEl.textContent = `Bem-vindo, ${user.name}! Redirecionando...`;
      messageEl.style.color = "green";

      // Redireciona após um pequeno delay para mostrar a mensagem
      setTimeout(() => {
        window.location.href = "../../index.php";
      }, 1000);

    } catch (error) {
      messageEl.textContent = error.message;
      messageEl.style.color = "red";

      // Adiciona link para recuperação se for erro de senha
      if (error.message === "Email ou senha incorretos") {
        messageEl.innerHTML += '<br><a href="#" onclick="showForgotPassword()" style="color: #007bff; text-decoration: underline;">Esqueceu a senha?</a>';
      }
    }
  });
}

// --- Funcionalidades da página de cadastro ---
if (document.getElementById("cadastroForm")) {
  document.getElementById("cadastroForm").addEventListener("submit", function(e) {
    const name = document.getElementById("cadastroNome").value.trim();
    const email = document.getElementById("cadastroEmail").value.trim();
    const password = document.getElementById("cadastroPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const messageEl = document.getElementById("cadastroMessage");

    messageEl.textContent = "";
    messageEl.style.color = "";

    // Validações (mantém no JS)
    if (!name || !email || !password || !confirmPassword) {
      e.preventDefault();
      messageEl.textContent = "Preencha todos os campos";
      messageEl.style.color = "red";
      return;
    }

    if (name.length < 2) {
      e.preventDefault();
      messageEl.textContent = "Nome deve ter pelo menos 2 caracteres";
      messageEl.style.color = "red";
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      e.preventDefault();
      messageEl.textContent = "Digite um email válido";
      messageEl.style.color = "red";
      return;
    }

    if (password.length < 6) {
      e.preventDefault();
      messageEl.textContent = "Senha deve ter pelo menos 6 caracteres";
      messageEl.style.color = "red";
      return;
    }

    if (password !== confirmPassword) {
      e.preventDefault();
      messageEl.textContent = "Senhas não coincidem";
      messageEl.style.color = "red";
      return;
    }

    // ✅ NÃO chama mais UserManager
    // ✅ deixa o form seguir para cadastro.php
  });
}

// Função para mostrar recuperação de senha
function showForgotPassword() {
  const email = document.getElementById("loginEmail").value.trim();
  const messageEl = document.getElementById("loginMessage");

  if (!email) {
    messageEl.textContent = "Digite seu email primeiro";
    messageEl.style.color = "orange";
    document.getElementById("loginEmail").focus();
    return;
  }

  const users = UserManager.users;
  const user = users.find(u => u.email === email);

  if (user) {
    messageEl.innerHTML = `✅ Instruções enviadas para ${email}<br><small>Em produção, receberia um link para redefinir a senha.</small>`;
    messageEl.style.color = "green";
  } else {
    messageEl.textContent = "Email não encontrado. Verifique se digitou corretamente.";
    messageEl.style.color = "red";
  }
}

// Verifica se usuário já está logado na página de login
if (document.getElementById("loginForm") && UserManager.isLoggedIn()) {
  window.location.href = "../../index.php";
}
