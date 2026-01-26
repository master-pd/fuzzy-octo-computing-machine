<?php
// backup.php - Backup Management API
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Configuration
$config = [
    'backup_dir' => __DIR__ . '/../backups/',
    'max_backups' => 1000,
    'max_backup_size' => 100 * 1024 * 1024, // 100MB
    'encryption_key' => getenv('ENCRYPTION_KEY') ?: 'auto_backup_secure_key',
    'enable_encryption' => true,
    'enable_compression' => true
];

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $request = getRequestData();
    $response = handleBackupRequest($request, $config);
    
    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}

function getRequestData() {
    $method = $_SERVER['REQUEST_METHOD'];
    
    if ($method === 'GET') {
        return $_GET;
    }
    
    $input = file_get_contents('php://input');
    
    if (empty($input)) {
        return [];
    }
    
    return json_decode($input, true) ?: [];
}

function handleBackupRequest($request, $config) {
    $action = $request['action'] ?? 'create';
    
    switch ($action) {
        case 'create':
            return createBackup($request, $config);
            
        case 'get':
            return getBackup($request, $config);
            
        case 'list':
            return listBackups($request, $config);
            
        case 'delete':
            return deleteBackup($request, $config);
            
        case 'stats':
            return getStats($config);
            
        case 'cleanup':
            return cleanupBackups($config);
            
        default:
            throw new Exception('Unknown action');
    }
}

function createBackup($request, $config) {
    $data = $request['data'] ?? null;
    $metadata = $request['metadata'] ?? [];
    
    if (!$data) {
        throw new Exception('Backup data is required');
    }
    
    // Validate backup size
    $data_size = strlen(json_encode($data));
    if ($data_size > $config['max_backup_size']) {
        throw new Exception('Backup data too large');
    }
    
    // Generate backup ID
    $backup_id = generateBackupId();
    
    // Prepare backup
    $backup = [
        'id' => $backup_id,
        'timestamp' => date('c'),
        'metadata' => array_merge($metadata, [
            'size' => $data_size,
            'items' => count($data, COUNT_RECURSIVE),
            'source' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
        ]),
        'data' => $data
    ];
    
    // Encrypt if enabled
    if ($config['enable_encryption']) {
        $backup['data'] = encryptData($backup['data'], $config['encryption_key']);
        $backup['encrypted'] = true;
    }
    
    // Compress if enabled
    if ($config['enable_compression']) {
        $backup['data'] = base64_encode(gzcompress(json_encode($backup['data'])));
        $backup['compressed'] = true;
    }
    
    // Save backup
    $backup_file = $config['backup_dir'] . $backup_id . '.json';
    
    if (!is_dir($config['backup_dir'])) {
        mkdir($config['backup_dir'], 0755, true);
    }
    
    file_put_contents($backup_file, json_encode($backup, JSON_PRETTY_PRINT));
    
    // Cleanup old backups
    cleanupOldBackups($config);
    
    return [
        'status' => 'success',
        'backup_id' => $backup_id,
        'timestamp' => $backup['timestamp'],
        'size' => $data_size,
        'url' => getBackupUrl($backup_id)
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
    
    $backup = json_decode(file_get_contents($backup_file), true);
    
    // Decrypt if needed
    if (isset($backup['encrypted']) && $backup['encrypted']) {
        $backup['data'] = decryptData($backup['data'], $config['encryption_key']);
        unset($backup['encrypted']);
    }
    
    // Decompress if needed
    if (isset($backup['compressed']) && $backup['compressed']) {
        $backup['data'] = json_decode(gzuncompress(base64_decode($backup['data'])), true);
        unset($backup['compressed']);
    }
    
    return [
        'status' => 'success',
        'backup' => $backup
    ];
}

function listBackups($request, $config) {
    $limit = min($request['limit'] ?? 50, 100);
    $offset = $request['offset'] ?? 0;
    
    if (!is_dir($config['backup_dir'])) {
        return ['backups' => [], 'total' => 0];
    }
    
    $files = glob($config['backup_dir'] . '*.json');
    $backups = [];
    
    // Sort by modification time (newest first)
    usort($files, function($a, $b) {
        return filemtime($b) - filemtime($a);
    });
    
    $files = array_slice($files, $offset, $limit);
    
    foreach ($files as $file) {
        $content = json_decode(file_get_contents($file), true);
        $backup_id = basename($file, '.json');
        
        $backups[] = [
            'id' => $backup_id,
            'timestamp' => $content['timestamp'] ?? date('c', filemtime($file)),
            'size' => filesize($file),
            'metadata' => $content['metadata'] ?? []
        ];
    }
    
    return [
        'status' => 'success',
        'backups' => $backups,
        'total' => count(glob($config['backup_dir'] . '*.json')),
        'limit' => $limit,
        'offset' => $offset
    ];
}

function deleteBackup($request, $config) {
    $backup_id = $request['backup_id'] ?? null;
    
    if (!$backup_id) {
        throw new Exception('Backup ID is required');
    }
    
    $backup_file = $config['backup_dir'] . $backup_id . '.json';
    
    if (!file_exists($backup_file)) {
        throw new Exception('Backup not found');
    }
    
    if (unlink($backup_file)) {
        return [
            'status' => 'success',
            'message' => 'Backup deleted'
        ];
    }
    
    throw new Exception('Failed to delete backup');
}

function getStats($config) {
    if (!is_dir($config['backup_dir'])) {
        return [
            'total_backups' => 0,
            'total_size' => '0 B',
            'oldest_backup' => null,
            'newest_backup' => null
        ];
    }
    
    $files = glob($config['backup_dir'] . '*.json');
    $total_size = 0;
    $timestamps = [];
    
    foreach ($files as $file) {
        $total_size += filesize($file);
        $timestamps[] = filemtime($file);
    }
    
    return [
        'status' => 'success',
        'total_backups' => count($files),
        'total_size' => formatBytes($total_size),
        'oldest_backup' => count($timestamps) ? date('c', min($timestamps)) : null,
        'newest_backup' => count($timestamps) ? date('c', max($timestamps)) : null,
        'directory' => $config['backup_dir'],
        'max_backups' => $config['max_backups']
    ];
}

function cleanupBackups($config) {
    return cleanupOldBackups($config, true);
}

function cleanupOldBackups($config, $force = false) {
    if (!is_dir($config['backup_dir'])) {
        return ['deleted' => 0];
    }
    
    $files = glob($config['backup_dir'] . '*.json');
    
    // Sort by modification time (oldest first)
    usort($files, function($a, $b) {
        return filemtime($a) - filemtime($b);
    });
    
    $deleted = 0;
    
    // Delete old backups if we have more than max_backups
    if (count($files) > $config['max_backups'] || $force) {
        $to_delete = array_slice($files, 0, count($files) - $config['max_backups']);
        
        foreach ($to_delete as $file) {
            if (unlink($file)) {
                $deleted++;
            }
        }
    }
    
    // Also delete backups older than 30 days
    $thirty_days_ago = time() - (30 * 24 * 60 * 60);
    
    foreach ($files as $file) {
        if (filemtime($file) < $thirty_days_ago) {
            if (unlink($file)) {
                $deleted++;
            }
        }
    }
    
    return [
        'status' => 'success',
        'deleted' => $deleted,
        'remaining' => count(glob($config['backup_dir'] . '*.json'))
    ];
}

function generateBackupId() {
    return uniqid('bkp_', true) . '_' . bin2hex(random_bytes(4));
}

function encryptData($data, $key) {
    $iv = openssl_random_pseudo_bytes(16);
    $encrypted = openssl_encrypt(
        json_encode($data),
        'AES-256-CBC',
        hash('sha256', $key, true),
        0,
        $iv
    );
    
    return base64_encode($iv . $encrypted);
}

function decryptData($encrypted, $key) {
    $data = base64_decode($encrypted);
    $iv = substr($data, 0, 16);
    $encrypted = substr($data, 16);
    
    $decrypted = openssl_decrypt(
        $encrypted,
        'AES-256-CBC',
        hash('sha256', $key, true),
        0,
        $iv
    );
    
    return json_decode($decrypted, true);
}

function getBackupUrl($backup_id) {
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https://' : 'http://';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    
    return $protocol . $host . '/api/backup.php?action=get&backup_id=' . urlencode($backup_id);
}

function formatBytes($bytes, $precision = 2) {
    $units = ['B', 'KB', 'MB', 'GB', 'TB'];
    
    $bytes = max($bytes, 0);
    $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
    $pow = min($pow, count($units) - 1);
    
    $bytes /= pow(1024, $pow);
    
    return round($bytes, $precision) . ' ' . $units[$pow];
}
