<?php
// Configuration for Astrology Chatbot Backend
error_reporting(E_ALL);
ini_set('display_errors', '0');

define('DB_HOST', 'localhost');
define('DB_NAME', 'astro_db');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_PORT', 3306);

// Load local configuration override if available (ignored by git to protect credentials)
if (file_exists(__DIR__ . '/config.local.php')) {
    require_once __DIR__ . '/config.local.php';
}

// Gemini API Key - Server side only, never exposed to client
if (!defined('GEMINI_API_KEY')) {
    define('GEMINI_API_KEY', getenv('GEMINI_API_KEY') ?: 'YOUR_GEMINI_API_KEY_HERE');
}
define('GEMINI_MODEL', 'gemini-2.5-flash');
define('GEMINI_ENDPOINT', 'https://generativelanguage.googleapis.com/v1beta/models/' . GEMINI_MODEL . ':generateContent?key=' . GEMINI_API_KEY);

// File uploads
define('UPLOAD_DIR', __DIR__ . '/../uploads/payments/');
define('MAX_UPLOAD_BYTES', 5 * 1024 * 1024); // 5 MB

// Admin credentials
define('ADMIN_USER', 'admin');
define('ADMIN_PASS_HASH', '$2y$10$wT8B1oP.qfWnklkZlBvG0e3a/W7c9n9H3B2tD0PqA3eL9oR3yS9G6'); // default password: admin / astro2025

/**
 * Universal Database Connection Helper:
 * Attempts MySQL first; if unavailable, seamlessly falls back to local SQLite.
 */
function getDbConnection(): PDO {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    // 1. Try MySQL first if accessible
    try {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        return $pdo;
    } catch (Throwable $e) {
        // MySQL server not available or refused -> fallback to SQLite
    }

    // 2. Local SQLite database provider
    $dataDir = dirname(__DIR__) . '/data';
    if (!is_dir($dataDir)) {
        @mkdir($dataDir, 0777, true);
    }
    $sqlitePath = $dataDir . '/astro.sqlite';
    $isNew = !file_exists($sqlitePath) || filesize($sqlitePath) < 50;

    $pdo = new PDO("sqlite:" . $sqlitePath, null, null, $options);
    $pdo->exec("PRAGMA journal_mode = WAL;");
    $pdo->exec("PRAGMA foreign_keys = ON;");

    if ($isNew) {
        initSqliteTables($pdo);
    }

    return $pdo;
}

/**
 * Initialize SQLite schema compatible with the application
 */
function initSqliteTables(PDO $pdo): void {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            email TEXT,
            dob TEXT NOT NULL,
            tob TEXT NOT NULL,
            pob TEXT NOT NULL,
            lat REAL,
            lon REAL,
            slot_date TEXT NOT NULL,
            slot_time TEXT NOT NULL,
            question TEXT,
            status TEXT NOT NULL DEFAULT 'pending',
            chart_json TEXT,
            report_text TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS slot_locks (
            slot_date TEXT NOT NULL,
            slot_time TEXT NOT NULL,
            booking_id INTEGER NOT NULL,
            locked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (slot_date, slot_time)
        );

        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id INTEGER NOT NULL,
            screenshot_path TEXT,
            amount REAL NOT NULL DEFAULT 500.00,
            upi_ref TEXT,
            status TEXT NOT NULL DEFAULT 'pending',
            uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            reviewed_at DATETIME,
            notes TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_b_slot ON bookings (slot_date, slot_time);
        CREATE INDEX IF NOT EXISTS idx_b_status ON bookings (status);
        CREATE INDEX IF NOT EXISTS idx_b_phone ON bookings (phone);
    ");
}
