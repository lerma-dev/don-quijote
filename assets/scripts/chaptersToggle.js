/**
 * chaptersToggle.js
 * ----------------------------------------------------------------------------
 * En móvil, la lista de capítulos vive oculta y aparece como un panel
 * flotante -igual que la burbuja del chat- al tocar el botón con el ícono
 * de lista. Se vuelve a ocultar fácilmente tocándolo de nuevo, eligiendo un
 * capítulo, presionando Escape o tocando fuera del panel.
 */
document.addEventListener("DOMContentLoaded", () => {
  const fab = document.getElementById("btn-capitulos-flotante");
  const panel = document.getElementById("chapter-container");
  const fabIcon = fab ? fab.querySelector("l-icon") : null;

  if (!fab || !panel) return;

  const labelOpen = fab.getAttribute("aria-label") || "Mostrar capítulos";
  const labelClose = "Ocultar capítulos";

  function setOpen(isOpen) {
    panel.classList.toggle("visible", isOpen);
    fab.setAttribute("aria-expanded", String(isOpen));
    fab.setAttribute("aria-label", isOpen ? labelClose : labelOpen);
    if (fabIcon) {
      fabIcon.setAttribute("name", isOpen ? "close" : "list");
    }
  }

  fab.addEventListener("click", () => {
    setOpen(!panel.classList.contains("visible"));
  });

  // Elegir un capítulo desde el panel móvil lo cierra automáticamente,
  // para volver de inmediato a la lectura sin tapar la pantalla.
  panel.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (btn && panel.classList.contains("visible")) {
      setOpen(false);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && panel.classList.contains("visible")) {
      setOpen(false);
    }
  });

  // Tocar fuera del panel (y fuera del propio botón) también lo cierra.
  document.addEventListener("click", (e) => {
    if (!panel.classList.contains("visible")) return;
    if (panel.contains(e.target) || fab.contains(e.target)) return;
    setOpen(false);
  });
});
