<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');

function respond(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function textLength(string $text): int
{
    return function_exists('mb_strlen') ? mb_strlen($text, 'UTF-8') : strlen($text);
}

$adminUser = trim((string)($_SERVER['REMOTE_USER'] ?? ''));
if ($adminUser === '') {
    respond(401, ['error' => 'Admin authentication is required.']);
}

$isHttps = (!empty($_SERVER['HTTPS']) && strtolower((string)$_SERVER['HTTPS']) !== 'off')
    || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
session_name('verseluft_admin');
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/dashboard/',
    'secure' => $isHttps,
    'httponly' => true,
    'samesite' => 'Strict',
]);
session_start();
if (!isset($_SESSION['csrf_token']) || !is_string($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

$dataFile = dirname(__DIR__, 2) . '/projects/data/projects.json';
$method = strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));

if ($method === 'GET') {
    if (!is_file($dataFile) || !is_readable($dataFile)) {
        respond(500, ['error' => 'Project data is unavailable on the server.']);
    }
    $contents = file_get_contents($dataFile);
    $data = $contents === false ? null : json_decode($contents, true);
    if (!is_array($data) || !isset($data['projects']) || !is_array($data['projects'])) {
        respond(500, ['error' => 'Project data is not valid JSON.']);
    }
    respond(200, ['projects' => $data['projects'], 'csrfToken' => $_SESSION['csrf_token']]);
}

if ($method !== 'PUT') {
    header('Allow: GET, PUT');
    respond(405, ['error' => 'Use GET or PUT for this endpoint.']);
}

$host = (string)($_SERVER['HTTP_HOST'] ?? '');
$origin = (string)($_SERVER['HTTP_ORIGIN'] ?? '');
$expectedOrigin = ($isHttps ? 'https://' : 'http://') . $host;
if ($host === '' || !hash_equals($expectedOrigin, $origin)) {
    respond(403, ['error' => 'The request origin was rejected.']);
}
if (!str_starts_with(strtolower((string)($_SERVER['CONTENT_TYPE'] ?? '')), 'application/json')) {
    respond(415, ['error' => 'Send project changes as JSON.']);
}
$csrf = (string)($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
if ($csrf === '' || !hash_equals((string)$_SESSION['csrf_token'], $csrf)) {
    respond(403, ['error' => 'Your secure session expired. Refresh the dashboard and try again.']);
}
$length = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($length <= 0 || $length > 1000000) {
    respond(413, ['error' => 'The project list is empty or too large.']);
}
$body = file_get_contents('php://input');
$request = $body === false ? null : json_decode($body, true);
if (!is_array($request) || !isset($request['projects']) || !is_array($request['projects']) || count($request['projects']) > 100) {
    respond(400, ['error' => 'The project list has an invalid format.']);
}

$cleanProjects = [];
$seenIds = [];
foreach ($request['projects'] as $project) {
    if (!is_array($project)) {
        respond(400, ['error' => 'Every project must be an object.']);
    }
    $id = trim((string)($project['id'] ?? ''));
    $section = (string)($project['section'] ?? '');
    $title = trim((string)($project['title'] ?? ''));
    $description = trim((string)($project['description'] ?? ''));
    $image = trim((string)($project['image'] ?? ''));
    $imageAlt = trim((string)($project['imageAlt'] ?? ''));
    $status = trim((string)($project['status'] ?? ''));
    $link = trim((string)($project['link'] ?? ''));
    if (!preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $id) || isset($seenIds[$id])) {
        respond(400, ['error' => 'Project IDs must be unique lowercase letters, numbers, and hyphens.']);
    }
    if (!in_array($section, ['live', 'upcoming'], true) || $title === '' || textLength($title) > 100 || textLength($description) > 500) {
        respond(400, ['error' => 'A project has a missing or overlong title, description, or section.']);
    }
    if (!str_starts_with($image, '/assets/') || str_contains($image, '..') || textLength($image) > 500 || textLength($imageAlt) > 160) {
        respond(400, ['error' => 'Use an image path inside /assets/ and keep its alt text under 160 characters.']);
    }
    if ($status === '' || textLength($status) > 40 || ($link !== '' && (!filter_var($link, FILTER_VALIDATE_URL) || strtolower((string)parse_url($link, PHP_URL_SCHEME)) !== 'https'))) {
        respond(400, ['error' => 'The status or campaign link is invalid. Campaign links must use HTTPS.']);
    }
    $funding = filter_var($project['fundingPercent'] ?? null, FILTER_VALIDATE_INT);
    $days = filter_var($project['daysRemaining'] ?? null, FILTER_VALIDATE_INT);
    $backers = filter_var($project['backers'] ?? null, FILTER_VALIDATE_INT);
    $progress = filter_var($project['progressWidth'] ?? null, FILTER_VALIDATE_INT);
    if ($funding === false || $funding < 0 || $funding > 100000 || $days === false || $days < 0 || $days > 3650 || $backers === false || $backers < 0 || $backers > 10000000 || $progress === false || $progress < 0 || $progress > 100) {
        respond(400, ['error' => 'Funding, days, backers, or progress is outside its allowed range.']);
    }
    $seenIds[$id] = true;
    $cleanProjects[] = [
        'id' => $id,
        'section' => $section,
        'title' => $title,
        'description' => $description,
        'image' => $image,
        'imageAlt' => $imageAlt !== '' ? $imageAlt : $title . ' artwork',
        'status' => $status,
        'fundingPercent' => $funding,
        'daysRemaining' => $days,
        'backers' => $backers,
        'progressWidth' => $progress,
        'link' => $link,
    ];
}

$directory = dirname($dataFile);
$lockPath = __DIR__ . '/projects.lock';
$lock = fopen($lockPath, 'c');
if ($lock === false || !flock($lock, LOCK_EX)) {
    respond(500, ['error' => 'Could not obtain the project data lock.']);
}
$temporary = tempnam($directory, '.projects-');
$encoded = json_encode(['schemaVersion' => 1, 'projects' => $cleanProjects], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
if ($temporary === false || $encoded === false || file_put_contents($temporary, $encoded . "\n", LOCK_EX) === false) {
    if (is_string($temporary) && is_file($temporary)) unlink($temporary);
    flock($lock, LOCK_UN);
    fclose($lock);
    respond(500, ['error' => 'Could not write project changes. Check cPanel file permissions.']);
}
@chmod($temporary, 0644);
if (!rename($temporary, $dataFile)) {
    unlink($temporary);
    flock($lock, LOCK_UN);
    fclose($lock);
    respond(500, ['error' => 'Could not publish project changes. Check cPanel file permissions.']);
}
flock($lock, LOCK_UN);
fclose($lock);
respond(200, ['saved' => true]);
