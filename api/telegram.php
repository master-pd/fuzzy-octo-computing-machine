<?php
// telegram.php - Backend API for Telegram
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Configuration
$config = [
    'bot_token' => getenv('TELEGRAM_BOT_TOKEN') ?: 'YOUR_BOT_TOKEN_HERE',
    'chat_id' => getenv('TELEGRAM_CHAT_ID') ?: 'YOUR_CHAT_ID_HERE',
    'encryption_key' => getenv('ENCRYPTION_KEY') ?: 'auto_backup_secure_key',
    'max_file_size' => 50 * 1024 * 1024, // 50MB
    'rate_limit' => 10, // requests per minute
    'log_errors' => true,
    'save_backups' => true,
    'backup_dir' => __DIR__ . '/../backups/'
];

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Main request handler
try {
    $request = getRequestData();
    $response = handleRequest($request, $config);
    
    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    error_log('API Error: ' . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Internal server error',
        'error' => $config['log_errors'] ? $e->getMessage() : null
    ]);
}

// Functions
function getRequestData() {
    $method = $_SERVER['REQUEST_METHOD'];
    
    if ($method === 'GET') {
        return $_GET;
    }
    
    if ($method === 'POST') {
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        
        if (strpos($contentType, 'application/json') !== false) {
            $input = file_get_contents('php://input');
            return json_decode($input, true) ?: [];
        }
        
        if (strpos($contentType, 'multipart/form-data') !== false) {
            return array_merge($_POST, $_FILES);
        }
        
        return $_POST;
    }
    
    return [];
}

function handleRequest($request, $config) {
    $action = $request['action'] ?? 'send_message';
    
    switch ($action) {
        case 'send_message':
            return sendMessage($request, $config);
            
        case 'send_document':
            return sendDocument($request, $config);
            
        case 'get_backup':
            return getBackup($request, $config);
            
        case 'test_connection':
            return testConnection($config);
            
        case 'webhook':
            return handleWebhook($request, $config);
            
        default:
            throw new Exception('Unknown action: ' . $action);
    }
}

function sendMessage($request, $config) {
    // Validate request
    $message = $request['message'] ?? '';
    $chat_id = $request['chat_id'] ?? $config['chat_id'];
    $parse_mode = $request['parse_mode'] ?? 'HTML';
    
    if (empty($message)) {
        throw new Exception('Message is required');
    }
    
    if (empty($chat_id)) {
        throw new Exception('Chat ID is required');
    }
    
    // Check rate limit
    checkRateLimit($chat_id);
    
    // Prepare message (truncate if too long)
    if (strlen($message) > 4096) {
        $message = substr($message, 0, 4000) . "\n\n...[MESSAGE TRUNCATED]";
    }
    
    // Send to Telegram
    $url = "https://api.telegram.org/bot{$config['bot_token']}/sendMessage";
    
    $data = [
        'chat_id' => $chat_id,
        'text' => $message,
        'parse_mode' => $parse_mode,
        'disable_web_page_preview' => true,
        'disable_notification' => false
    ];
    
    $result = makeTelegramRequest($url, $data);
    
    // Save backup if enabled
    if ($config['save_backups'] && $result['ok']) {
        saveBackup([
            'type' => 'message',
            'chat_id' => $chat_id,
            'message' => $message,
            'message_id' => $result['result']['message_id'] ?? null,
            'timestamp' => date('c')
        ], $config);
    }
    
    return [
        'status' => 'success',
        'message_id' => $result['result']['message_id'] ?? null,
        'timestamp' => date('c')
    ];
}

function sendDocument($request, $config) {
    // Validate request
    $document = $request['document'] ?? null;
    $chat_id = $request['chat_id'] ?? $config['chat_id'];
    $caption = $request['caption'] ?? 'Backup Data';
    
    if (!$document || !isset($document['tmp_name'])) {
        throw new Exception('Document file is required');
    }
    
    // Check file size
    $file_size = filesize($document['tmp_name']);
    if ($file_size > $config['max_file_size']) {
        throw new Exception('File too large. Max size: ' . formatBytes($config['max_file_size']));
    }
    
    // Check rate limit
    checkRateLimit($chat_id);
    
    // Send to Telegram
    $url = "https://api.telegram.org/bot{$config['bot_token']}/sendDocument";
    
    $data = [
        'chat_id' => $chat_id,
        'caption' => $caption,
        'parse_mode' => 'HTML'
    ];
    
    $files = [
        'document' => new CURLFile($document['tmp_name'], $document['type'], $document['name'])
    ];
    
    $result = makeTelegramRequest($url, $data, $files);
    
    // Save backup
    if ($config['save_backups'] && $result['ok']) {
        saveBackup([
            'type' => 'document',
            'chat_id' => $chat_id,
            'file_name' => $document['name'],
            'file_size' => $file_size,
            'document_id' => $result['result']['document']['file_id'] ?? null,
            'timestamp' => date('c')
        ], $config);
    }
    
    return [
        'status' => 'success',
        'document_id' => $result['result']['document']['file_id'] ?? null,
        'file_name' => $document['name'],
        'file_size' => formatBytes($file_size),
        'timestamp' => date('c')
    ];
}

function getBackup($request, $config) {
    $backup_id = $request['backup_id'] ?? null;
    
    if (!$backup_id) {
        throw new Exception('Backup ID is required');
    }
    
    $backup_file = $config['backup_dir'] . $backup_id . '.json';
    
    if (!file_exists($backup_file)) {
        throw new Exception('Backup not found');
    }
    
    $backup_data = json_decode(file_get_contents($backup_file), true);
    
    return [
        'status' => 'success',
        'backup_id' => $backup_id,
        'data' => $backup_data,
        'timestamp' => date('c', filemtime($backup_file))
    ];
}

function testConnection($config) {
    $url = "https://api.telegram.org/bot{$config['bot_token']}/getMe";
    
    try {
        $result = makeTelegramRequest($url);
        
        return [
            'status' => 'success',
            'bot_username' => $result['result']['username'] ?? null,
            'bot_name' => $result['result']['first_name'] ?? null,
            'can_join_groups' => $result['result']['can_join_groups'] ?? false,
            'can_read_all_group_messages' => $result['result']['can_read_all_group_messages'] ?? false,
            'supports_inline_queries' => $result['result']['supports_inline_queries'] ?? false,
            'timestamp' => date('c')
        ];
        
    } catch (Exception $e) {
        return [
            'status' => 'error',
            'message' => 'Connection test failed',
            'error' => $e->getMessage()
        ];
    }
}

function handleWebhook($request, $config) {
    // Telegram sends updates via webhook
    $update = $request;
    
    if (!isset($update['message'])) {
        return ['status' => 'no_message'];
    }
    
    $message = $update['message'];
    $chat_id = $message['chat']['id'];
    $text = $message['text'] ?? '';
    
    // Handle commands
    switch ($text) {
        case '/start':
            $response = "🤖 *Auto Backup Bot*\n\n";
            $response .= "I can help you backup your data securely.\n";
            $response .= "Send /backup to start a new backup.\n";
            $response .= "Send /help for more information.";
            break;
            
        case '/backup':
            $response = "🔗 Start Backup:\n";
            $response .= "Click this link to start automatic backup:\n";
            $response .= "https://your-domain.com/backup.html";
            break;
            
        case '/help':
            $response = "📖 *Help*\n\n";
            $response .= "Available commands:\n";
            $response .= "/start - Start the bot\n";
            $response .= "/backup - Start new backup\n";
            $response .= "/help - Show this help\n";
            $response .= "/status - Check bot status";
            break;
            
        case '/status':
            $response = "✅ *Bot Status*\n\n";
            $response .= "Status: Online\n";
            $response .= "Version: 2.0\n";
            $response .= "Last backup: " . date('Y-m-d H:i:s');
            break;
            
        default:
            $response = "❓ I didn't understand that command.\n";
            $response .= "Send /help for available commands.";
    }
    
    // Send response
    sendMessage([
        'chat_id' => $chat_id,
        'message' => $response,
        'parse_mode' => 'Markdown'
    ], $config);
    
    return ['status' => 'webhook_processed'];
}

function makeTelegramRequest($url, $data = [], $files = []) {
    $ch = curl_init($url);
    
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    if (!empty($data) || !empty($files)) {
        curl_setopt($ch, CURLOPT_POST, true);
        
        if (!empty($files)) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, array_merge($data, $files));
        } else {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json'
            ]);
        }
    }
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    
    curl_close($ch);
    
    if ($http_code !== 200) {
        throw new Exception("Telegram API HTTP $http_code: $error");
    }
    
    $result = json_decode($response, true);
    
    if (!$result['ok']) {
        throw new Exception("Telegram API error: " . ($result['description'] ?? 'Unknown error'));
    }
    
    return $result;
}

function checkRateLimit($chat_id) {
    $key = 'rate_limit_' . $chat_id;
    $cache_file = sys_get_temp_dir() . '/' . md5($key) . '.cache';
    
    if (file_exists($cache_file)) {
        $data = json_decode(file_get_contents($cache_file), true);
        
        if (time() - $data['timestamp'] < 60) {
            if ($data['count'] >= 10) {
                throw new Exception('Rate limit exceeded. Please wait a minute.');
            }
            $data['count']++;
        } else {
            $data = ['count' => 1, 'timestamp' => time()];
        }
    } else {
        $data = ['count' => 1, 'timestamp' => time()];
    }
    
    file_put_contents($cache_file, json_encode($data));
}

function saveBackup($data, $config) {
    // Create backup directory if it doesn't exist
    if (!is_dir($config['backup_dir'])) {
        mkdir($config['backup_dir'], 0755, true);
    }
    
    $backup_id = uniqid('bkp_', true);
    $backup_file = $config['backup_dir'] . $backup_id . '.json';
    
    $backup_data = [
        'id' => $backup_id,
        'timestamp' => date('c'),
        'data' => $data
    ];
    
    file_put_contents($backup_file, json_encode($backup_data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    
    return $backup_id;
}

function formatBytes($bytes, $precision = 2) {
    $units = ['B', 'KB', 'MB', 'GB', 'TB'];
    
    $bytes = max($bytes, 0);
    $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
    $pow = min($pow, count($units) - 1);
    
    $bytes /= pow(1024, $pow);
    
    return round($bytes, $precision) . ' ' . $units[$pow];
}

// Error handling
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    throw new ErrorException($errstr, 0, $errno, $errfile, $errline);
});

set_exception_handler(function($exception) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Unhandled exception',
        'error' => $exception->getMessage()
    ]);
});
