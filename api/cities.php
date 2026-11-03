<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$dataFile = __DIR__ . '/../data/cities.json';
if (!file_exists($dataFile)) {
    http_response_code(500);
    echo json_encode(['error' => 'Cities database not found']);
    exit;
}

$json = file_get_contents($dataFile);
$cities = json_decode($json, true);

if (!is_array($cities)) {
    http_response_code(500);
    echo json_encode(['error' => 'Invalid cities data']);
    exit;
}

$query = isset($_GET['q']) ? trim(mb_strtolower($_GET['q'], 'UTF-8')) : '';

if ($query === '') {
    echo json_encode(array_slice($cities, 0, 50));
    exit;
}

$results = [];
foreach ($cities as $city) {
    $cityName = mb_strtolower($city['name'], 'UTF-8');
    $state = mb_strtolower($city['state'], 'UTF-8');
    $country = mb_strtolower($city['country'], 'UTF-8');

    if (strpos($cityName, $query) !== false || strpos($state, $query) !== false || strpos($country, $query) !== false) {
        $results[] = $city;
    }
}

echo json_encode(array_slice($results, 0, 20));

