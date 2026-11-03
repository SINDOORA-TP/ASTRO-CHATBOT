<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'POST method required']);
    exit;
}

$bookingId = isset($_POST['booking_id']) ? (int)$_POST['booking_id'] : 0;
$upiRef = trim($_POST['upi_ref'] ?? '');

if ($bookingId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid booking ID']);
    exit;
}

$newFileName = null;

// Screenshot upload is OPTIONAL: Process file only if provided
if (isset($_FILES['screenshot']) && !empty($_FILES['screenshot']['name']) && $_FILES['screenshot']['error'] === UPLOAD_ERR_OK) {
    $file = $_FILES['screenshot'];

    if ($file['size'] > MAX_UPLOAD_BYTES) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'File size exceeds 5MB limit']);
        exit;
    }

    // Verify MIME type using finfo
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->file($file['tmp_name']);
    $allowedMimes = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/webp' => 'webp'
    ];

    if (!isset($allowedMimes[$mimeType])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'JPG, PNG அல்லது WebP படங்கள் மட்டுமே அனுமதிக்கப்படும்.']);
        exit;
    }

    $ext = $allowedMimes[$mimeType];
    $uploadDir = rtrim(UPLOAD_DIR, '/\\') . DIRECTORY_SEPARATOR;
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $newFileName = 'pay_' . $bookingId . '_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
    $targetPath = $uploadDir . $newFileName;

    if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to save screenshot file']);
        exit;
    }
}

try {
    $pdo = getDbConnection();
    
    if ($newFileName) {
        // Updated with screenshot and upi_ref
        $stmt = $pdo->prepare("
            UPDATE payments 
            SET screenshot_path = ?, upi_ref = ?, status = 'pending', uploaded_at = CURRENT_TIMESTAMP
            WHERE booking_id = ?
        ");
        $stmt->execute([$newFileName, $upiRef, $bookingId]);
    } else {
        // Updated with upi_ref only (screenshot optional)
        $stmt = $pdo->prepare("
            UPDATE payments 
            SET upi_ref = ?, status = 'pending', uploaded_at = CURRENT_TIMESTAMP
            WHERE booking_id = ?
        ");
        $stmt->execute([$upiRef, $bookingId]);
    }

    echo json_encode([
        'success' => true,
        'message' => 'பதிவு விவரங்கள் வெற்றிகரமாகப் பெறப்பட்டன! ஜோதிடரின் சரிபார்ப்பிற்குப் பின் உங்கள் ஆலோசனை உறுதி செய்யப்படும்.',
        'file' => $newFileName,
        'upi_ref' => $upiRef
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database update error: ' . $e->getMessage()]);
}
