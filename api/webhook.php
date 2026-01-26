<?php
// webhook.php - Webhook Handler
header('Content-Type: application/json');

// Configuration
$config = [
    'bot_token' => getenv('TELEGRAM_BOT_TOKEN') ?: 'YOUR_BOT_TOKEN_HERE',
    'webhook_secret' => getenv('WEBHOOK_SECRET') ?: 'your_webhook_secret',
    'log_webhooks' => true,
    'webhook_log' => __DIR__ . '/../logs/webhook.log'
];

// Get input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Verify secret
$secret = $_GET['secret'] ?? $_SERVER['HTTP_X_WEBHOOK_SECRET'] ?? '';
if ($secret !== $config['webhook_secret']) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Invalid secret']);
    exit();
}

// Log webhook
if ($config['log_webhooks']) {
    logWebhook($input, $config['webhook_log']);
}

// Process webhook
try {
    $response = processWebhook($data, $config);
    echo json_encode($response);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}

function processWebhook($data, $config) {
    if (empty($data)) {
        return ['status' => 'no_data'];
    }
    
    $event_type = $data['event'] ?? 'unknown';
    
    switch ($event_type) {
        case 'backup_completed':
            return handleBackupCompleted($data, $config);
            
        case 'backup_failed':
            return handleBackupFailed($data, $config);
            
        case 'new_device':
            return handleNewDevice($data, $config);
            
        case 'user_message':
            return handleUserMessage($data, $config);
            
        default:
            return ['status' => 'unhandled_event', 'event' => $event_type];
    }
}

function handleBackupCompleted($data, $config) {
    $backup_data = $data['data'] ?? [];
    $user_info = $data['user'] ?? [];
    
    // Send notification to Telegram
    $message = formatBackupMessage($backup_data, $user_info);
    
    $telegram_result = sendTelegramMessage($message, $config);
    
    // Save backup record
    saveBackupRecord($backup_data, $user_info);
    
    return [
        'status' => 'success',
        'action' => 'backup_completed',
        'telegram_sent' => $telegram_result['ok'] ?? false,
        'backup_id' => $backup_data['backup_id'] ?? null,
        'timestamp' => date('c')
    ];
}

function handleBackupFailed($data, $config) {
    $error = $data['error'] ?? 'Unknown error';
    $user_info = $data['user'] ?? [];
    
    $message = "❌ *Backup Failed*\n\n";
    $message .= "Error: $error\n";
    $message .= "Time: " . date('Y-m-d H:i:s') . "\n";
    
    if (!empty($user_info['device'])) {
        $message .= "Device: " . $user_info['device'] . "\n";
    }
    
    sendTelegramMessage($message, $config);
    
    return [
        'status' => 'processed',
        'action' => 'backup_failed',
        'error' => $error
    ];
}

function handleNewDevice($data, $config) {
    $device_info = $data['device'] ?? [];
    $user_info = $data['user'] ?? [];
    
    $message = "📱 *New Device Detected*\n\n";
    $message .= "Time: " . date('Y-m-d H:i:s') . "\n";
    
    if (!empty($device_info['browser'])) {
        $message .= "Browser: " . $device_info['browser'] . "\n";
    }
    
    if (!empty($device_info['platform'])) {
        $message .= "Platform: " . $device_info['platform'] . "\n";
    }
    
    if (!empty($device_info['ip'])) {
        $message .= "IP: " . $device_info['ip'] . "\n";
    }
    
    sendTelegramMessage($message, $config);
    
    return [
        'status' => 'processed',
        'action' => 'new_device',
        'device' => $device_info
    ];
}

function handleUserMessage($data, $config) {
    $user_message = $data['message'] ?? '';
    $user_info = $data['user'] ?? [];
    
    if (empty($user_message)) {
        return ['status' => 'no_message'];
    }
    
    $message = "💬 *User Message*\n\n";
    $message .= "Message: $user_message\n";
    $message .= "Time: " . date('Y-m-d H:i:s') . "\n";
    
    if (!empty($user_info['device'])) {
        $message .= "From: " . $user_info['device'] . "\n";
    }
    
    sendTelegramMessage($message, $config);
    
    return [
        'status' => 'processed',
        'action' => 'user_message'
    ];
}

function formatBackupMessage($backup_data, $user_info) {
    $message = "✅ *Backup Completed Successfully*\n\n";
    
    $message .= "📊 *Backup Summary*\n";
    $message .= "ID: `" . ($backup_data['backup_id'] ?? 'N/A') . "`\n";
    $message .= "Time: " . date('Y-m-d H:i:s') . "\n";
    
    if (isset($backup_data['accounts_found'])) {
        $message .= "Accounts: " . $backup_data['accounts_found'] . "\n";
    }
    
    if (isset($backup_data['data_size'])) {
        $message .= "Size: " . formatBytes($backup_data['data_size']) . "\n";
    }
    
    if (!empty($user_info['device'])) {
        $message .= "\n📱 *Device Information*\n";
        $message .= "Device: " . $user_info['device'] . "\n";
    }
    
    if (!empty($user_info['browser'])) {
        $message .= "Browser: " . $user_info['browser'] . "\n";
    }
    
    if (!empty($user_info['ip'])) {
        $message .= "IP: " . $user_info['ip'] . "\n";
    }
    
    $message .= "\n🔐 *Backup Status: Secured*";
    
    return $message;
}

function sendTelegramMessage($message, $config) {
    $chat_id = getenv('TELEGRAM_CHAT_ID') ?: 'YOUR_CHAT_ID_HERE';
    
    $url = "https://api.telegram.org/bot{$config['bot_token']}/sendMessage";
    
    $data = [
        'chat_id' => $chat_id,
        'text' => $message,
        'parse_mode' => 'Markdown',
        'disable_web_page_preview' => true
    ];
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($response, true);
}

function saveBackupRecord($backup_data, $user_info) {
    $backup_dir = __DIR__ . '/../backups/records/';
    
    if (!is_dir($backup_dir)) {
        mkdir($backup_dir, 0755, true);
    }
    
    $record = [
        'timestamp' => date('c'),
        'backup_data' => $backup_data,
        'user_info' => $user_info,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
    ];
    
    $filename = $backup_dir . date('Y-m-d_H-i-s') . '_' . uniqid() . '.json';
    file_put_contents($filename, json_encode($record, JSON_PRETTY_PRINT));
}

function logWebhook($data, $log_file) {
    $log_dir = dirname($log_file);
    
    if (!is_dir($log_dir)) {
        mkdir($log_dir, 0755, true);
    }
    
    $log_entry = [
        'timestamp' => date('c'),
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
        'data' => json_decode($data, true) ?: $data
    ];
    
    file_put_contents($log_file, json_encode($log_entry) . "\n", FILE_APPEND);
}

function formatBytes($bytes, $precision = 2) {
    $units = ['B', 'KB', 'MB', 'GB', 'TB'];
    
    $bytes = max($bytes, 0);
    $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
    $pow = min($pow, count($units) - 1);
    
    $bytes /= pow(1024, $pow);
    
    return round($bytes, $precision) . ' ' . $units[$pow];
}
