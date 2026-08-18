/**
 * chatToggle.js
 * ----------------------------------------------------------------------------
 * Controla la burbuja flotante del chat: permite abrirlo para conversar con
 * Don Quijote y volver a ocultarlo fácilmente para seguir leyendo, sin tocar
 * la lógica existente de chat.js, ui.js, tts.js, etc.
 */
document.addEventListener("DOMContentLoaded", () => {
  const fab = document.getElementById("chat-fab-btn");
  const panel = document.getElementById("chat-container");
  const closeBtn = document.getElementById("chat-close-btn");
  const input = document.getElementById("chat-input");
  const fabIcon = document.getElementById("fab-button"); // el <l-icon>

  if (!fab || !panel) return;

  const labelOpen = fab.getAttribute("aria-label") || "Abrir chat";
  const labelClose = closeBtn ? closeBtn.getAttribute("aria-label") : "Cerrar chat";

  function setOpen(isOpen) {
    panel.classList.toggle("chat-open", isOpen);
    fab.setAttribute("aria-expanded", String(isOpen));

    if (fabIcon) {
      fabIcon.setAttribute("name", isOpen ? "close" : "chatbubble");
    }

    fab.setAttribute("aria-label", isOpen ? labelClose : labelOpen);
    fab.classList.remove("has-unread");

    if (isOpen && input) {
      setTimeout(() => input.focus(), 150);
    }
  }

  fab.addEventListener("click", () => {
    setOpen(!panel.classList.contains("chat-open"));
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", () => setOpen(false));
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && panel.classList.contains("chat-open")) {
      setOpen(false);
    }
  });
});
