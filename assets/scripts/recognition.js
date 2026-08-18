import { addMsg } from "./ui.js";
import { speak } from "./tts.js";
import { enviarMensaje } from "./chat.js";

/* --- CONFIGURACIÓN DINÁMICA --- */
const isEnglishPage = window.location.pathname.includes("english.html");
const MIC_LANG = isEnglishPage ? "en-US" : "es-ES";

const WAKE_WORDS = isEnglishPage
  ? ["hello tutor", "hey tutor", "hello teacher", "tutor"]
  : ["oye quijote", "oye don quijote", "hola quijote", "quijote"];

const SEND_COMMANDS = isEnglishPage
  ? ["send message", "reply", "answer me", "send"]
  : ["responde quijote", "dime quijote", "contesta quijote", "enviar"];

const GREETING = isEnglishPage
  ? "Tell me, what words confuse you?"
  : "Decidme, ¿qué cuita os aflige?";
const INSTRUCTIONS = isEnglishPage
  ? "Speak, pupil. Say 'hey tutor' to start and 'reply' to finish."
  : "Hablad, caballero. Decid 'Oye Quijote' para iniciar y 'Responde Quijote' para enviar.";
const FAREWELL = isEnglishPage
  ? "Goodbye. Read carefully."
  : "Quedad con Dios. Mi lanza descansa.";

let modo = "idle";
let preguntaPendiente = "";
let escuchando = false;
let recognitionRunning = false;
let recog = null;

let intentosRed = 0;
const MAX_INTENTOS_RED = 2;

/**
 * Cancela cualquier reproducción TTS activa e interrumpe banderas
 */
function cancelarVozTTS() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  window.quijoteHablando = false;
}

/**
 * Asigna los eventos estándar de SpeechRecognition a la instancia activa
 */
function enlazarEventosReconocimiento(instancia) {
  instancia.onresult = async (evt) => {
    if (window.quijoteHablando) return;

    intentosRed = 0; // Reset tras recibir audio exitoso

    const lastResultIndex = evt.results.length - 1;
    const rawText = evt.results[lastResultIndex][0].transcript.trim();

    // Normalización: a minúsculas, sin acentos/tildes y sin puntuación
    const textLimpio = rawText
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
      .trim();

    console.log("🟩 [Audio capturado original]:", rawText);
    console.log("🧹 [Audio procesado]:", textLimpio);

    // -------------------------------------------------------------
    // PASO 1: Si el tutor ya está atento, evaluar PRIMERO los comandos de envío
    // -------------------------------------------------------------
    if (modo === "keyword") {
      const comandoEncontrado = SEND_COMMANDS.find((cmd) => {
        const cmdLimpio = cmd
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        return textLimpio.includes(cmdLimpio);
      });

      if (comandoEncontrado) {
        let textoCompleto = (preguntaPendiente + " " + rawText).trim();

        // Ordenamos comandos de mayor a menor longitud para borrar frases compuestas primero
        const todosLosComandos = [...SEND_COMMANDS, ...WAKE_WORDS].sort(
          (a, b) => b.length - a.length,
        );

        todosLosComandos.forEach((cmd) => {
          const cmdEscapado = cmd.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const regex = new RegExp(cmdEscapado, "gi");
          textoCompleto = textoCompleto.replace(regex, "");
        });

        let mensajeFinal = textoCompleto
          .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
          .trim();

        console.log("🔍 [Mensaje extraído]:", `"${mensajeFinal}"`);

        if (mensajeFinal.length > 2) {
          modo = "processing";
          preguntaPendiente = "";
          console.log("📤 [Enviando por Voz]:", mensajeFinal);
          procesarEntrada(mensajeFinal);
        } else {
          console.warn(
            "⚠️ [Aviso]: No hay suficiente texto útil después de remover el comando.",
          );
        }
        return; // Salida directa tras procesar comando
      }
    }

    // -------------------------------------------------------------
    // PASO 2: Si no fue comando de envío, evaluar Wake Word
    // -------------------------------------------------------------
    const wakeDetectado = WAKE_WORDS.some((word) => {
      const wordLimpia = word
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      return textLimpio.includes(wordLimpia);
    });

    if (wakeDetectado) {
      modo = "keyword";
      preguntaPendiente = "";
      escuchando = false; // Detiene reinicios automáticos en handlers

      console.log(
        "🔔 [Modo]: Wake Word detectada. Deteniendo reconocimiento...",
      );

      // Cierre limpio aislando handlers para no registrar falso error de red ni colisión en audio
      if (recog) {
        recog.onend = null;
        recog.onerror = null;
        try {
          recog.abort();
        } catch (e) {
          console.warn("Aviso al abortar recog:", e);
        }
        recognitionRunning = false;
      }

      // Espera breve para liberar el canal de audio del micro antes de activar TTS
      setTimeout(() => {
        console.log("🔊 Reproduciendo saludo...");
        speak(GREETING, () => {
          modo = "keyword";
          escuchando = true;
          console.log("🎤 Reanudando micrófono tras saludo.");
          iniciarReconocimiento();
        });
      }, 100);

      return;
    }

    if (modo !== "keyword") return;

    // -------------------------------------------------------------
    // PASO 3: Acumulación de texto cuando el usuario hace pausas
    // -------------------------------------------------------------
    preguntaPendiente += " " + rawText;
    console.log("📝 [Acumulado]:", preguntaPendiente.trim());
  };

  instancia.onstart = () => {
    recognitionRunning = true;
    console.log("✅ [Sistema]: Micrófono activo en el hardware.");

    if (modo === "idle" && escuchando && !window.quijoteHablando) {
      speak(INSTRUCTIONS);
    }
  };

  instancia.onend = () => {
    recognitionRunning = false;
    console.log("🔌 [Evento]: Micrófono detenido (onend).");

    if (
      escuchando &&
      modo !== "processing" &&
      !window.quijoteHablando &&
      intentosRed === 0
    ) {
      setTimeout(iniciarReconocimiento, 400);
    } else if (!escuchando || intentosRed >= MAX_INTENTOS_RED) {
      actualizarEstadoBotonUI(false);
    }
  };

  instancia.onerror = (event) => {
    console.error("❌ [Error Micro]:", event.error);
    recognitionRunning = false;

    cancelarVozTTS();

    if (event.error === "network") {
      intentosRed++;
      console.warn(
        `⚠️ Error de red en servicio de voz (${intentosRed}/${MAX_INTENTOS_RED}).`,
      );

      if (intentosRed >= MAX_INTENTOS_RED) {
        console.error("⛔ Servicio de voz bloqueado/no disponible.");

        escuchando = false;
        modo = "idle";
        preguntaPendiente = "";

        if (typeof hideSpinner === "function") hideSpinner();
        actualizarEstadoBotonUI(false);

        addMsg(
          "Sistema",
          isEnglishPage
            ? "Speech recognition is unavailable in this browser (Network block)."
            : "El servicio de voz no está disponible en este navegador (Bloqueo de red/privacidad).",
        );
        return;
      }

      if (escuchando) {
        setTimeout(() => {
          if (escuchando && !window.quijoteHablando) iniciarReconocimiento();
        }, 1200);
      }
    } else if (event.error === "no-speech" && escuchando) {
      setTimeout(iniciarReconocimiento, 500);
    } else if (
      event.error === "not-allowed" ||
      event.error === "service-not-allowed"
    ) {
      escuchando = false;
      modo = "idle";
      intentosRed = 0;
      preguntaPendiente = "";
      actualizarEstadoBotonUI(false);
    }
  };
}

/**
 * Inicializa la API de reconocimiento de voz de forma segura
 */
function obtenerInstanciaReconocimiento() {
  if (recog) return recog;

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    console.error("❌ [Error]: Este navegador no soporta SpeechRecognition.");
    return null;
  }

  recog = new SR();
  recog.lang = MIC_LANG;
  recog.interimResults = false;
  recog.continuous = true;

  return recog;
}

/**
 * Controla el encendido del micrófono de forma segura
 */
export function iniciarReconocimiento() {
  console.log("🛠️ [Intento]: Iniciando micrófono...");

  if (window.quijoteHablando) {
    console.warn("⏳ [Bloqueo]: IA hablando, reintentando en 1s...");
    setTimeout(iniciarReconocimiento, 1000);
    return;
  }

  if (recognitionRunning) {
    console.log("ℹ️ [Info]: El reconocimiento ya está en ejecución.");
    return;
  }

  const instancia = obtenerInstanciaReconocimiento();
  if (!instancia) return;

  // Re-vinculamos handlers asegurando eventos limpios antes del start
  enlazarEventosReconocimiento(instancia);

  try {
    instancia.start();
  } catch (e) {
    console.error("❌ [Error al arrancar micro]:", e);
    recognitionRunning = false;
  }
}


/**
 * Detiene el reconocimiento de forma limpia
 */
export function detenerReconocimiento() {
  if (!recog) return;
  try {
    recognitionRunning = false;
    recog.stop();
    console.log("🛑 [Sistema]: Micrófono pausado.");
  } catch (e) {
    console.warn("Aviso al detener micro:", e);
  }
}

/**
 * Procesa la instrucción enviada por voz mediante el motor de chat
 */
/**
 * Procesa la instrucción enviada por voz mediante el motor de chat
 */
async function procesarEntrada(texto) {
  // Silenciamos los handlers antes de detener para evitar el falso error de red en Chromium
  if (recog) {
    recog.onend = null;
    recog.onerror = null;
    detenerReconocimiento();
  }

  const respuesta = await enviarMensaje(texto, false, () => {
    modo = "idle";
    preguntaPendiente = "";
    if (escuchando) iniciarReconocimiento();
  });

  if (!respuesta) {
    modo = "idle";
    preguntaPendiente = "";
    if (escuchando) iniciarReconocimiento();
  }
}

/**
 * Cambia la clase active en el DOM
 */
function actualizarEstadoBotonUI(activo) {
  const btn = document.getElementById("mic-btn");
  if (!btn) return;
  if (activo) {
    btn.classList.add("active");
  } else {
    btn.classList.remove("active");
  }
}

/* --- VINCULACIÓN DIRECTA DE EVENTOS --- */
function inicializarBotonMic() {
  const btn = document.getElementById("mic-btn");
  if (!btn) {
    console.warn("⚠️ [Warning]: No se encontró el botón #mic-btn en el DOM.");
    return;
  }

  btn.addEventListener("click", () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      addMsg(
        "Sistema",
        isEnglishPage
          ? "Speech recognition is not supported in this browser."
          : "El reconocimiento de voz no está disponible en este navegador.",
      );
      return;
    }

    if (!escuchando) {
      escuchando = true;
      intentosRed = 0;
      actualizarEstadoBotonUI(true);

      iniciarReconocimiento();
    } else {
      escuchando = false;
      actualizarEstadoBotonUI(false);
      detenerReconocimiento();
      modo = "idle";
      preguntaPendiente = "";
      intentosRed = 0;

      cancelarVozTTS();
      speak(FAREWELL);
    }
  });
}

// Inicialización de escuchas cuando el DOM esté listo
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", inicializarBotonMic);
} else {
  inicializarBotonMic();
}
