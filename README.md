# 📜 QuijoteIA

**Experiencia interactiva para leer, escuchar y conversar con Don Quijote de la Mancha**, potenciada por inteligencia artificial. Disponible en español (Don Quijote) e inglés (una versión educativa narrada por Lemony Snicket, basada en *A Series of Unfortunate Events*).

> Proyecto desarrollado como parte de la estadía profesional en **MECH ROBOTIX AC**, TSU en Desarrollo de Software Multiplataforma — Universidad Tecnológica de Ciudad Juárez.

---

## ✨ Características principales

- **Lectura sincronizada con audio**: el texto de cada capítulo se resalta en tiempo real conforme avanza la narración.
- **Asistente conversacional (chatbot)**: permite hacer preguntas sobre la lectura y recibir respuestas en el tono y lenguaje del personaje, impulsado por modelos de IA a través de [DeepSeek](https://deepseek.com/en/).
- **Reconocimiento de voz**: activación por palabra clave (*"Oye Quijote"*) y envío de mensajes por comandos de voz, además de texto por micrófono.
- **Síntesis de voz (TTS)** para las respuestas del asistente.
- **Avatar 3D animado** de Don Quijote (modelo `talking.fbx`, renderizado con Three.js).
- **Reproductor de audiolibro (mini-player)** con control de reproducción, barra de progreso y salto a un tiempo específico.
- **Navegación de 52 capítulos**, adaptada según el tamaño de pantalla (ver sección de *Diseño responsivo*).
- **Dos idiomas**: versión en español (`index.html`, personaje Don Quijote) y versión en inglés (`english.html`, tutor Lemony Snicket), cada una con su propio backend, audios y textos.
- **Diseño responsivo** desde 300px hasta pantallas 4K, con capítulos como panel flotante en móvil y sidebars dedicados en pantallas grandes.

---

## 🧱 Estructura del proyecto

```
QUIJOTE/
├── assets/
│   ├── images/         # Ilustraciones y recursos gráficos de la interfaz
│   ├── l-icon/          # Componente web personalizado de íconos (SVG)
│   ├── scripts/         # Lógica de la aplicación (chat, audio, capítulos, UI, etc.)
│   └── styles/          # Hojas de estilo (paleta de colores, layout, responsive)
├── audios/
│   ├── split_audios/            # Narración en español, dividida por capítulo
│   └── split_audios_english/    # Narración en inglés, dividida por capítulo
├── lyrics/
│   ├── capitulos/               # Texto + tiempos de sincronización (JSON) — español
│   └── capitulos_english/       # Texto + tiempos de sincronización (JSON) — inglés
├── .env                  # Variables de entorno (no versionado)
├── .gitignore
├── Dockerfile             # Imagen para despliegue en contenedor
├── english.html           # Punto de entrada — versión en inglés
├── index.html              # Punto de entrada — versión en español
├── Lemony.php              # Backend del chatbot (versión en inglés)
├── Quijote.php              # Backend del chatbot (versión en español)
├── README.md
└── talking.fbx              # Modelo 3D animado de Don Quijote
```

### Scripts principales (`assets/scripts/`)

| Archivo | Responsabilidad |
|---|---|
| `chat.js` | Envío/recepción de mensajes con el backend del chatbot |
| `chatToggle.js` | Abrir/cerrar la burbuja flotante del chat |
| `chaptersToggle.js` | Panel flotante de capítulos en móvil |
| `sync.js` | Carga de capítulos y sincronización del texto con el audio |
| `recognition.js` | Reconocimiento de voz y palabras de activación |
| `tts.js` | Síntesis de voz de las respuestas del asistente |
| `animacionQuijote.js` | Renderizado del avatar 3D (Three.js) |
| `layout.js` | Mide el alto real del header y el mini-player para que el contenido central tenga su propio scroll |
| `icons.js` | Define el componente `<l-icon>` usado en toda la interfaz |
| `ui.js` / `voices.js` | Utilidades de interfaz y listado de voces disponibles |

---

## ⚙️ Requisitos

- Servidor con **PHP** (para `Quijote.php` y `Lemony.php`)
- Una **API key de DeepSeek* (https://deepseek.com/)
- Navegador moderno (Chrome, Edge, Safari o Firefox actualizado)
- *(Opcional)* Docker, si se despliega mediante el `Dockerfile` incluido

---

## 🔑 Variables de entorno

Crear un archivo `.env` en la raíz del proyecto con:

```.env
DEEPSEEK_API_KEY=<Aqui va la api de deepseek>
```

El backend (`Quijote.php` / `Lemony.php`) primero intenta leer `DEEPSEEK_API_KEY` como variable de entorno del sistema (por ejemplo, configurada en el contenedor o en el panel del proveedor de hosting); si no la encuentra, recurre al archivo `.env` local.

> ⚠️ El archivo `.env` **no debe subirse al repositorio**. Verifica que esté incluido en `.gitignore`.

---

## 🚀 Ejecución local

1. Clonar el repositorio en la carpeta de tu servidor local ejemplo:
   - /var/www/html -  **Linux**
   - C:/xampp/htdocs/ - **XAMPP**
   ```bash
   git clone https://github.com/lerma-dev/don-quijote.git
   ```
2. Crear el archivo `.env` con tu API key de DeepSeek.
3. Abrir en el navegador en `http://localhost/don-quijote/`


## 📱 Diseño responsivo

La interfaz se adapta en cinco rangos de ancho de pantalla:

| Rango | Comportamiento |
|---|---|
| 300px – 479px | Chat y capítulos como burbujas/paneles flotantes; `<main>` con scroll propio entre header y mini-player, ambos fijos |
| 480px – 767px | Mismo patrón, ajustado a tabletas pequeñas |
| 768px – 1023px | Los capítulos regresan a una fila visible dentro del mini-player |
| 1024px – 1439px | El mini-player se divide: controles de audio a la izquierda, capítulos en cuadrícula a la derecha |
| 1440px en adelante | Layout de tres columnas: sidebar de capítulos, columna del avatar 3D, y sidebar del reproductor de audio |

---

## 🧠 Modelos de IA disponibles

El backend permite seleccionar entre distintos modelos servidos por DeepSeek Platfotms definidos en `Quijote.php` / `Lemony.php`:

- `deepseek-chat` *(modelo por defecto)*
- `deepseek-v4-flash` 
- `ddeepseek-v4-pro`

---


## ⚖️ Licencia
Este proyecto se distribuye bajo la **Licencia MIT**. Siéntete libre de usarlo, estudiarlo y mejorarlo con fines educativos.

---

## 👤  Autor

proyecto desarrollado para el concurso **Código Ciencia / Infomatrix 2026**.

## 👤  Colaborador de la actualización
**Héctor Alejandro Lerma Cruz**
TSU en Desarrollo de Software Multiplataforma — Universidad Tecnológica de Ciudad Juárez
Estadía profesional en MECH ROBOTIX AC

---