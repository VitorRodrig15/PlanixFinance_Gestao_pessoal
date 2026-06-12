# PlanixFinance

Bem-Vindo ao nosso projeto, agradecemos o apoio, se possivel avaliar com a estrela para ajudar ainda mais nossa ideia.

Projeto de site de gestão financeira pessoal em PHP, SQL, HTML, CSS e JavaScript.

## Sobre o projeto

O PlanixFinance é um painel financeiro completo para uso local com autenticação, controle de transações, metas financeiras, parcelamentos e limites de categoria. O projeto foi desenvolvido para ser executado em um ambiente local como XAMPP, com PHP, Apache e MySQL.

## Funcionalidades

- Autenticação de usuários:
  - cadastro de nova conta
  - login com senha criptografada
  - recuperação de senha (fluxo não estando disponivel devido precisar de hospedagem para atribuir)
- Controle de transações:
  - entrada e saída de valores
  - lançamentos de despesas e receitas
  - edição e exclusão de transações
  - histórico mensal de transações
- Gestão de parcelamentos:
  - cadastro de parcelamentos
  - criação automática de parcelas no histórico
  - exclusão de parcelamento com remoção das parcelas relacionadas
- Gestão de objetivos financeiros:
  - criação de metas com valor e prazo
  - ativação de um objetivo ativo
  - conclusão de objetivo com registro de data
- Limites de categoria:
  - definição de limite de gasto por categoria para monitoramento
- Painel visual:
  - cálculo de saldo anterior, entradas, saídas e saldo total
  - resumo de indicadores financeiros
  - notificações e alertas de objetivos urgentes
- Conteúdo adicional:
  - página de estudos (`pages/estudos.html`)
  - recursos estáticos de CSS e JS em `src/css` e `src/js`

## Tecnologias utilizadas

- PHP 7.x/8.x
- MySQL / MariaDB
- HTML5
- CSS3
- JavaScript
- Font Awesome
- Google Fonts
- XAMPP para servidor local

## Requisitos

- XAMPP instalado no Windows
- Apache e MySQL ativados no painel do XAMPP
- PHP habilitado
- Banco de dados local MySQL(as tables necessarias deixei como comentario em database.php)

## Configuração do ambiente local

1. Copie a pasta do projeto para a pasta do XAMPP, por exemplo:
   - `C:\xampp\htdocs\Site_final`
2. Inicie o Apache e o MySQL no painel do XAMPP.
3. Acesse o phpMyAdmin em `http://localhost/phpmyadmin`.
4. Crie um banco de dados chamado `projeto_gestao`.
5. Importe as tabelas necessárias usando o script SQL presente em `config/database.php`.

### Estrutura de tabelas esperada

- `usuarios`
- `transacoes`
- `parcelamentos`
- `limites`
- `objetivos`

> O arquivo `config/database.php` já contém o host padrão `localhost`, usuário `root` e senha vazia. Ajuste se necessário.

## Como rodar o projeto

1. Abra o navegador e acesse: `http://localhost/Site_final/index.php`
2. Faça cadastro de usuário em `pages/auth/cadastro.php`.
3. Faça login para acessar o painel financeiro.

## Notas sobre publicação no GitHub

- O GitHub aceita este projeto como repositório de código.
- Como ele usa PHP e MySQL, o site não roda diretamente no GitHub Pages.
- Publique o código no GitHub para versionamento e colaboração.
- Para executar localmente, use o XAMPP com o banco de dados configurado.

## Estrutura de pastas

- `actions/` - scripts PHP que salvam, editam e excluem dados
- `config/` - configuração do banco de dados
- `pages/auth/` - páginas de login, cadastro, recuperação de senha e perfil
- `src/css/` - estilos do site
- `src/js/` - lógica do painel e interação do usuário
- `src/assets/` - imagens, vídeos e conteúdos estáticos

## Sugestão de commit inicial para GitHub

1. Adicione todos os arquivos:
   - `git add .`
2. Faça o commit:
   - `git commit -m "Initial commit - PlanixFinance local dashboard"`
3. Crie o repositório remoto no GitHub e envie os arquivos:
   - `git remote add origin <URL_DO_REPOSITORIO>`
   - `git push -u origin main`

## Observações

- Mantenha o banco de dados local atualizado ao mover ou clonar o projeto.
- Caso use outro usuário MySQL, atualize `config/database.php`.
- Verifique os detalhes de autenticação e senha ao migrar o projeto.

---

Obrigado por usar o PlanixFinance!, nosso projeto pensado para a sociedade, ajudando a quem precisa e apoiando quem não conheçe sobre gestão pessoal.