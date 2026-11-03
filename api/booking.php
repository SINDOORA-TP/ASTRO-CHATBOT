<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/config.php';

// GET request: fetch booked slots for a given date
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $date = $_GET['date'] ?? null;
    if (!$date || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
        http_response_code(400);
        echo json_encode(['error' => 'Valid date (YYYY-MM-DD) required']);
        exit;
    }

    try {
        $pdo = getDbConnection();
        $stmt = $pdo->prepare("SELECT slot_time FROM slot_locks WHERE slot_date = ?");
        $stmt->execute([$date]);
        $booked = $stmt->fetchAll(PDO::FETCH_COLUMN);
        echo json_encode(['booked_slots' => $booked]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
    exit;
}

// POST request: create booking and lock slot atomically
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);

    if (!$data) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid JSON input']);
        exit;
    }

    $name = trim($data['name'] ?? '');
    $phone = trim($data['phone'] ?? '');
    $email = trim($data['email'] ?? '');
    $dob = trim($data['dob'] ?? '');
    $tob = trim($data['tob'] ?? '');
    $pob = trim($data['pob'] ?? '');
    $lat = isset($data['lat']) ? floatval($data['lat']) : null;
    $lon = isset($data['lon']) ? floatval($data['lon']) : null;
    $slotDate = trim($data['slot_date'] ?? '');
    $slotTime = trim($data['slot_time'] ?? '');
    $question = trim($data['question'] ?? '');
    $chartJson = isset($data['chart_json']) ? json_encode($data['chart_json'], JSON_UNESCAPED_UNICODE) : null;

    if (empty($name) || empty($phone) || empty($slotDate) || empty($slotTime)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'பெயர், தொலைபேசி, Slot தேதி மற்றும் நேரம் அவசியம்.']);
        exit;
    }

    // Validate booking window: 13:00 to 18:00 in 30-min increments
    $validSlots = [
        '13:00', '13:30', '14:00', '14:30',
        '15:00', '15:30', '16:00', '16:30',
        '17:00', '17:30', '18:00'
    ];
    $timeFormatted = substr($slotTime, 0, 5);
    if (!in_array($timeFormatted, $validSlots)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Slot நேரம் 1:00 PM முதல் 6:00 PM வரை மட்டுமே அனுமதிக்கப்படும்.']);
        exit;
    }

    // Format DOB/TOB for MySQL
    // Support DD/MM/YYYY or YYYY-MM-DD
    if (preg_match('/^(\d{2})\/(\d{2})\/(\d{4})$/', $dob, $m)) {
        $dobFormatted = "{$m[3]}-{$m[2]}-{$m[1]}";
    } elseif (preg_match('/^\d{4}-\d{2}-\d{2}$/', $dob)) {
        $dobFormatted = $dob;
    } else {
        $dobFormatted = date('Y-m-d');
    }

    $tobFormatted = strlen($tob) === 5 ? $tob . ':00' : ($tob ?: '12:00:00');
    $slotTimeFull = $timeFormatted . ':00';
    $pdo = null;

    try {
        $pdo = getDbConnection();
        $pdo->beginTransaction();

        // Check if slot is already locked
        $isSqlite = ($pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite');
        $lockSql = $isSqlite
            ? "SELECT booking_id FROM slot_locks WHERE slot_date = ? AND slot_time = ?"
            : "SELECT booking_id FROM slot_locks WHERE slot_date = ? AND slot_time = ? FOR UPDATE";

        $checkStmt = $pdo->prepare($lockSql);
        $checkStmt->execute([$slotDate, $slotTimeFull]);
        if ($checkStmt->fetch()) {
            $pdo->rollBack();
            http_response_code(409);
            echo json_encode([
                'success' => false,
                'error' => 'மன்னிக்கவும்! இந்த நேரம் ஏற்கெனவே பதிவு செய்யப்பட்டுள்ளது. வேறு நேரத்தைத் தேர்வு செய்யவும்.'
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // Insert booking record
        $insBooking = $pdo->prepare("
            INSERT INTO bookings (name, phone, email, dob, tob, pob, lat, lon, slot_date, slot_time, question, status, chart_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
        ");
        $insBooking->execute([
            $name, $phone, $email, $dobFormatted, $tobFormatted, $pob,
            $lat, $lon, $slotDate, $slotTimeFull, $question, $chartJson
        ]);
        $bookingId = (int)$pdo->lastInsertId();

        // Lock slot in slot_locks table
        $insLock = $pdo->prepare("INSERT INTO slot_locks (slot_date, slot_time, booking_id) VALUES (?, ?, ?)");
        $insLock->execute([$slotDate, $slotTimeFull, $bookingId]);

        // Create pending payment record
        $insPay = $pdo->prepare("INSERT INTO payments (booking_id, amount, status) VALUES (?, 500.00, 'pending')");
        $insPay->execute([$bookingId]);

        $pdo->commit();

        echo json_encode([
            'success' => true,
            'booking_id' => $bookingId,
            'message' => 'Slot வெற்றிகரமாக பதிவு செய்யப்பட்டது! கட்டண விவரங்களைப் பூர்த்தி செய்யவும்.',
            'slot_date' => $slotDate,
            'slot_time' => $timeFormatted
        ], JSON_UNESCAPED_UNICODE);

    } catch (Exception $e) {
        if ($pdo && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'பதிவு செய்வதில் பிழை: ' . $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
    }
}

