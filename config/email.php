<?php
// Configurações de e-mail para envio via SMTP
// Preencha com os dados do seu provedor (ex: Mailgun, SendGrid, Gmail/Workspace, etc.)

$email_config = [
    // host do servidor SMTP
    'host' => 'smtp.example.com',
    // porta: 587 (STARTTLS) ou 465 (SMTPS)
    'port' => 587,
    // encryption: 'tls' ou 'ssl'
    'secure' => 'tls',
    // usuário e senha SMTP
    'username' => 'your-smtp-user@example.com',
    'password' => 'your-smtp-password',
    // remetente padrão
    'from_email' => 'no-reply@planixfinance.local',
    'from_name' => 'PlanixFinance'
];

// Observação: para envio via PHPMailer, instale via composer:
// composer require phpmailer/phpmailer
// Em ambientes XAMPP locais, você pode também configurar sendmail.ini para usar mail().

?>
