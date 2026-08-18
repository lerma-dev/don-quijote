/**
 * layout.js
 * ----------------------------------------------------------------------------
 * El header y el mini-player son fijos; <main> es la única zona con scroll,
 * encajada exactamente entre los dos. Como ambos cambian de alto según el
 * tamaño de pantalla (el nav se envuelve, el mini-player gana/pierde filas,
 * etc.), medimos su alto real y lo exponemos como variables CSS para que
 * <main> siempre calce sin taparlos ni dejar huecos.
 */
(function () {
  function syncLayoutHeights() {
    const header = document.querySelector("header");
    const player = document.getElementById("reproductor-fijo");
    const root = document.documentElement;

    if (header) {
      root.style.setProperty("--header-h", `${header.offsetHeight}px`);
    }
    if (player) {
      root.style.setProperty("--footer-h", `${player.offsetHeight}px`);
    }
  }

  document.addEventListener("DOMContentLoaded", syncLayoutHeights);
  window.addEventListener("load", syncLayoutHeights);
  window.addEventListener("resize", syncLayoutHeights);
  window.addEventListener("orientationchange", syncLayoutHeights);

  // El mini-player cambia de alto cuando aparece el panel de capítulos u
  // otro contenido dinámico; un observer cubre esos casos también.
  document.addEventListener("DOMContentLoaded", () => {
    const player = document.getElementById("reproductor-fijo");
    const header = document.querySelector("header");
    const observer = new MutationObserver(syncLayoutHeights);

    if (player) {
      observer.observe(player, { childList: true, subtree: true, attributes: true });
    }
    if (header) {
      observer.observe(header, { childList: true, subtree: true, attributes: true });
    }

    // Pequeño reintento por si las fuentes/imagenes cambian el alto tras el
    // primer render.
    setTimeout(syncLayoutHeights, 300);
    setTimeout(syncLayoutHeights, 1000);
  });
})();
