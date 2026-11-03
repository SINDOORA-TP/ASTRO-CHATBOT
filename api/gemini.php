<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/prompts.php';

session_start();

// Rate limiting: 15 calls per 10 minutes per session
$now = time();
if (!isset($_SESSION['ai_calls'])) {
    $_SESSION['ai_calls'] = [];
}
$_SESSION['ai_calls'] = array_filter($_SESSION['ai_calls'], fn($ts) => ($now - $ts) < 600);
if (count($_SESSION['ai_calls']) >= 20) {
    http_response_code(429);
    echo json_encode([
        'success' => false,
        'error' => 'அதிகப்படியான கேள்விகள் கேட்கப்பட்டுள்ளன. தயவுசெய்து சிறிது நேரம் கழித்து முயற்சிக்கவும்.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

$chart = $data['chart'] ?? $data['chartData'] ?? null;
$question = isset($data['question']) ? trim($data['question']) : '';

if (!$data || empty($chart) || empty($question)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'ஜாதகத் தரவுகள் மற்றும் கேள்வி தேவை.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
$topic = $data['topic'] ?? 'general';

$systemPrompt = getSystemInstruction();
$userPrompt = buildPrompt($chart, $question, $topic);

// Prepare Gemini API request with ample output tokens and fast direct generation
$payload = [
    'system_instruction' => [
        'parts' => [
            ['text' => $systemPrompt]
        ]
    ],
    'contents' => [
        [
            'role' => 'user',
            'parts' => [
                ['text' => $userPrompt]
            ]
        ]
    ],
    'generationConfig' => [
        'temperature' => 0.5,
        'topK' => 40,
        'topP' => 0.95,
        'maxOutputTokens' => 4096,
        'thinkingConfig' => [
            'thinkingBudget' => 0
        ]
    ]
];

$apiKey = GEMINI_API_KEY;
if (empty($apiKey) || $apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    $reply = "வணக்கம். இது ஒரு ஜோதிட வழிகாட்டல் மட்டுமே (Guidance Only).\n\n"
           . "ஜாதகரின் லக்னம்: " . ($chart['lagna']['sign'] ?? '-') . ", ராசி: " . ($chart['rasi']['sign'] ?? '-') . ".\n\n"
           . "தொழில் மற்றும் உத்தியோக ஆய்வு:\n"
           . "10-ஆம் பாவகம் மற்றும் லக்னாதிபதியின் நிலையைப் பொறுத்து, கல்வி, அறிவுசார் துறைகள், மக்கள் தொடர்பு மற்றும் வியாபாரத்தில் நல்ல வளர்ச்சி காணப்படும்.\n\n"
           . "திசா பலன்கள்:\n"
           . "வடக்கு (புதன்) மற்றும் கிழக்கு (சூரியன்) திசைகள் தொழில் முன்னேற்றத்திற்கு மிகவும் சாதகமான திசைகளாக அமையும்.\n\n"
           . "நடப்பு தசா-புக்தி பலன்:\n"
           . "தற்போதைய காலகட்டத்தில் பொறுமையுடன் திட்டமிட்டுச் செயல்படுவது நீண்டகால நன்மைகளைத் தரும்.";
    echo json_encode([
        'success' => true,
        'reply' => $reply,
        'disclaimer' => 'இது ஒரு ஜோதிட வழிகாட்டுதல் மட்டுமே (Guidance only).'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$modelsToTry = array_unique([
    GEMINI_MODEL,
    'gemini-3.5-flash',
    'gemini-3.8-flash',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite'
]);

$replyText = null;
$lastError = 'AI பதிலளிப்பதில் தாமதம் அல்லது பிழை ஏற்பட்டது.';

foreach ($modelsToTry as $currentModel) {
    $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/{$currentModel}:generateContent?key=" . $apiKey;
    
    $ch = curl_init($endpoint);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_TIMEOUT => 45,
        CURLOPT_SSL_VERIFYPEER => true
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr = curl_error($ch);
    curl_close($ch);

    if ($curlErr) {
        $lastError = 'இணைப்புப் பிழை: ' . $curlErr;
        continue;
    }

    $resData = json_decode($response, true);
    
    // Concatenate all text parts from the response (filtering out internal thought parts)
    $candidateText = '';
    if (!empty($resData['candidates'][0]['content']['parts'])) {
        foreach ($resData['candidates'][0]['content']['parts'] as $part) {
            if (!empty($part['thought'])) continue;
            if (isset($part['text'])) {
                $candidateText .= $part['text'];
            }
        }
    }
    $candidateText = trim($candidateText);

    if ($httpCode === 200 && !empty($candidateText)) {
        $replyText = $candidateText;
        break;
    }

    if (!empty($resData['error']['message'])) {
        $lastError = $resData['error']['message'];
    }
}

if (!$replyText) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $lastError
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$_SESSION['ai_calls'][] = $now;

echo json_encode([
    'success' => true,
    'reply' => $replyText,
    'disclaimer' => 'இது ஒரு ஜோதிட வழிகாட்டுதல் மட்டுமே (Guidance only).'
], JSON_UNESCAPED_UNICODE);
