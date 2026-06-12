# PlanixFinance

[![GitHub Repo stars](https://img.shields.io/github/stars/VitorRodrig15/PlanixFinance_Gestao_pessoal?style=social)](https://github.com/VitorRodrig15/PlanixFinance_Gestao_pessoal)
[![Repo size](https://img.shields.io/github/repo-size/VitorRodrig15/PlanixFinance_Gestao_pessoal)](https://github.com/VitorRodrig15/PlanixFinance_Gestao_pessoal)
[![Language](https://img.shields.io/github/languages/top/VitorRodrig15/PlanixFinance_Gestao_pessoal)](https://github.com/VitorRodrig15/PlanixFinance_Gestao_pessoal)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

## 🚀 Overview

**PlanixFinance** é um painel de gestão financeira pessoal com foco em controle local via XAMPP. Ele combina PHP, MySQL, JavaScript e uma interface moderna para ajudar a visualizar gastos, metas e parcelamentos de forma simples.

## ✨ Destaques

- Login e cadastro seguro com senha hash
- Controle de despesas e receitas
- Histórico mensal de transações
- Parcelamentos automáticos com geração de parcelas
- Metas financeiras com ativação e conclusão
- Limites por categoria para controle de gastos
- Dashboard resumido com saldo, entradas e saídas
- Conteúdo de estudos e ajuda financeira

## 🧩 Funcionalidades principais

### Autenticação
- Cadastro de usuário
- Login seguro com senha criptografada
- Redirecionamento para painel após login

### Transações
- Registro de entradas e saídas
- Edição e exclusão de lançamentos
- Visualização de histórico por mês
- Geração de alertas e insights financeiros

### Parcelamentos
- Cadastro de parcelamentos em série
- Inclusão das parcelas automaticamente em `transacoes`
- Exclusão de parcelamento com remoção de parcelas

### Objetivos
- Criação de metas financeiras com valor e prazo
- Ativação do objetivo ativo para controle prioritário
- Registro de conclusão de metas com data

### Limites e indicadores
- Definição de limites por categoria
- Cálculo de saldo anterior, entradas, saídas e saldo total
- Painel de inteligência com dados do mês atual

## 🛠 Tecnologias usadas

- PHP 7.x / 8.x
- MySQL / MariaDB
- HTML5
- CSS3
- JavaScript
- Font Awesome
- Google Fonts
- XAMPP (Apache + MySQL)

## ⚙️ Requisitos

- XAMPP instalado no Windows
- Apache e MySQL ativos
- PHP habilitado
- Banco de dados local com suporte MySQL

## 🧱 Configuração local

1. Copie o projeto para `C:\xampp\htdocs\Site_final`
2. Abra o painel do XAMPP e inicie o Apache e o MySQL
3. Acesse `http://localhost/phpmyadmin`
4. Crie o banco de dados `projeto_gestao`
5. Importe as tabelas usando o script SQL no `config/database.php`

### Tabelas necessárias

- `usuarios`
- `transacoes`
- `parcelamentos`
- `limites`
- `objetivos`

> O arquivo `config/database.php` já usa `localhost`, `root` e senha vazia por padrão. Ajuste se estiver usando outro usuário.

## ▶️ Como executar

1. Abra no navegador: `http://localhost/Site_final/index.php`
2. Crie uma conta em `pages/auth/cadastro.php`
3. Faça login e use o painel financeiro

## 📁 Estrutura de pastas

- `actions/` - ações em PHP para salvar, editar e excluir dados
- `config/` - configuração do banco de dados
- `pages/auth/` - páginas de autenticação e perfil
- `src/css/` - estilos do projeto
- `src/js/` - lógica e interatividade do painel
- `src/assets/` - imagens, vídeos e arquivos estáticos

## 📌 Observações importantes

- O projeto exige backend PHP e banco de dados MySQL, então não roda no GitHub Pages.
- Use o GitHub para versionar o código e compartilhar apenas o projeto.
- Sempre mantenha o banco de dados local sincronizado ao clonar ou mover o projeto.

ças pessoais de forma prática, local e com visual moderno. Se quiser, posso adicionar também um `LICENSE` ou um guia de contribuições para o seu repositório.
