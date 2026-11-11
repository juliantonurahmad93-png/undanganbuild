<?php
// Simple upload handler for Skatim Invitation (place on your PHP hosting, no symlink).
// Saves to ./uploads/ (same directory level) and returns {"url":"https://.../uploads/<file>"}.
// Configure allowed origins/types/size as needed.
header('Content-Type: application/json; charset=utf-8');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin) { header('Access-Control-Allow-Origin: ' . $origin); header('Vary: Origin'); }
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error'=>'Method not allowed']); exit; }

$dir = __DIR__ . '/uploads';
if (!is_dir($dir)) { @mkdir($dir, 0755, true); }
if (!is_dir($dir) || !is_writable($dir)) { http_response_code(500); echo json_encode(['error'=>'Upload directory not writable']); exit; }

if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) { http_response_code(400); echo json_encode(['error'=>'No file uploaded']); exit; }
$max = 20 * 1024 * 1024; // 20MB
if ($_FILES['file']['size'] > $max) { http_response_code(400); echo json_encode(['error'=>'File too large (max 20MB)']); exit; }

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($_FILES['file']['tmp_name']);
$allowed = [
  'image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp','image/gif'=>'gif','image/svg+xml'=>'svg',
  'audio/mpeg'=>'mp3','audio/mp3'=>'mp3','audio/ogg'=>'ogg','audio/wav'=>'wav','audio/x-wav'=>'wav','audio/mp4'=>'m4a','audio/aac'=>'aac'
];
if (!isset($allowed[$mime])) { http_response_code(400); echo json_encode(['error'=>'File type not allowed']); exit; }
$ext = $allowed[$mime];
$name = bin2hex(random_bytes(8)) . '_' . time() . '.' . $ext;
$dest = $dir . '/' . $name;
if (!move_uploaded_file($_FILES['file']['tmp_name'], $dest)) { http_response_code(500); echo json_encode(['error'=>'Failed to save file']); exit; }

$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'] ?? '';
$base = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\');
$url = $host ? ($scheme . '://' . $host . $base . '/uploads/' . $name) : ($base . '/uploads/' . $name);
echo json_encode(['url'=>$url, 'name'=>$name]);
?>
