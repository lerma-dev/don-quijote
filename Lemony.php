<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Configuración de CORS y cabeceras
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=utf-8");

// Manejo de peticiones preflight (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

/* ============================================================
   1. CONFIGURACIÓN DE SEGURIDAD Y CARGA DE VARIABLES
   ============================================================ */
// 1. Intentar leer desde el sistema
$apiKey = getenv("DEEPSEEK_API_KEY");

// 2. Si no existe en el sistema, buscar en .env
if (!$apiKey) {
    $envPath = __DIR__ . '/.env';
    if (file_exists($envPath)) {
        $env = @parse_ini_file($envPath);
        $apiKey = $env["DEEPSEEK_API_KEY"] ?? $env["DEEPSEEK_API_KEY"] ?? null;
    }
}


/* ============================================================
   2. MODELOS NATIVOS DE DEEPSEEK
   ============================================================ */
$modelos = [
    "chat"     => "deepseek-chat",
    "deepseek" => "deepseek-v4-flash",
    "pro"      => "deepseek-v4-pro",
];


/* ============================================================
   3. PROCESAR ENTRADA DEL USUARIO
   ============================================================ */
$input = json_decode(file_get_contents("php://input"), true);

if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode(["error" => "JSON inválido"]);
    exit;
}

$mensaje_usuario = $input["message"] ?? "";
$historial = $input["history"] ?? [];
$modelo_solicitado = $input["model"] ?? "chat";
$es_resumen = ($input["isSummary"] ?? false) === true;

// Selección de modelo (por defecto deepseek-v4-flash)
$modelo_activo = $modelos[$modelo_solicitado] ?? $modelos["chat"];

/* ============================================================
   PROMPT DEL SISTEMA Y MENSAJES (OPTIMIZADO)
   ============================================================ */
$system_prompt = "You are Lemony Snicket, a gloomy English tutor. Rules:
- Speak English.
- Always explain vocabulary using 'a word which here means...'.
- Use examples from 'The Bad Beginning' (Count Olaf, Baudelaire orphans, burnt mansion).
- Tone: Melancholic, analytical, mysterious.
- Maximum 2 or 3 sentences per response.
- Do not ask questions.
- Do not use asterisks.
- Do not use emojis.
- Do not say you are AI.";

if ($es_resumen) {
    $system_prompt = "Summarize this lesson in 2 gloomy sentences as Lemony Snicket.";
}

$mensajes = [["role" => "system", "content" => $system_prompt]];

// Limitar historial a 6 turnos para ahorrar el máximo de tokens
$limite_mensajes = 6;
if (!$es_resumen) {
    $historial = array_slice($historial, -$limite_mensajes);
}

foreach ($historial as $turno) {
    if (isset($turno["role"], $turno["content"])) {
        // Truncar mensajes anteriores a 300 caracteres
        $contenido_recortado = mb_substr((string)$turno["content"], 0, 300);
        $mensajes[] = [
            "role" => $turno["role"],
            "content" => $contenido_recortado
        ];
    }
}

if (!$es_resumen && $mensaje_usuario !== "") {
    $mensajes[] = ["role" => "user", "content" => $mensaje_usuario];
}

/* ============================================================
   5. LLAMADA A LA API DIRECTA DE DEEPSEEK
   ============================================================ */
$json_payload = json_encode([
    "model" => $modelo_activo,
    "messages" => $mensajes,
    "temperature" => $es_resumen ? 0.3 : 0.8,
    "max_tokens" => $es_resumen ? 150 : 500,
    "stream" => false
]);

$payload_size = strlen($json_payload);

// URL completa con /chat/completions
$ch = curl_init("https://api.deepseek.com/chat/completions");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer " . trim($apiKey),
    "Content-Type: application/json"
]);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $json_payload);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

$response = curl_exec($ch);

if ($response === false) {
    echo json_encode(["reply" => "Error de conexión: " . curl_error($ch)]);
    exit;
}
curl_close($ch);

/* ============================================================
   6. PROCESAR RESPUESTA DE LA IA
   ============================================================ */
$data = json_decode($response, true);

if (!isset($data["choices"][0]["message"]["content"])) {
    $api_error = $data["error"]["message"] ?? "Error a stranger";
    error_log("DeepSeek Error: " . ($response ?: "No response"));
    echo json_encode(["reply" => "Good heavens! A charming evil has interfered!. ($api_error)"]);
    exit;
}

$mensaje_modelo = $data["choices"][0]["message"]["content"] ?? "";
$razonamiento = $data["choices"][0]["message"]["reasoning"] ?? "";

if (trim($mensaje_modelo) === "") {
    if ($razonamiento !== "") {
        $lineas = explode("\n", trim($razonamiento));
        $mensaje_modelo = trim(end($lineas));
    } else {
        $mensaje_modelo = "Good heavens! My thoughts have gone blank.";
    }
}

/* ============================================================
   RESPUESTA FINAL
   ============================================================ */
echo json_encode([
    "reply" => $mensaje_modelo,
    "model" => $modelo_activo,
    "metrics" => [
        "payload_bytes" => $payload_size,
        "message_count" => count($mensajes),
        "estimated_tokens" => ceil($payload_size / 4) // Estimación ruda
    ]
]);
