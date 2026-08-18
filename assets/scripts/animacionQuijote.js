/**
 * animacionQuijote.js
 * --------------------------------------------------------------
 * Módulo encargado de inicializar y controlar el modelo 3D de 
 * Don Quijote, incluyendo su animación facial (movimiento de boca)
 * sincronizada con el audio del chatbot.
 *
 * Tecnologías:
 * - Three.js (r110)
 * - FBXLoader para cargar modelos animados
 * --------------------------------------------------------------
 */

import * as THREE from "https://cdn.jsdelivr.net/gh/mrdoob/three.js@r110/build/three.module.js";
import { FBXLoader } from "https://cdn.jsdelivr.net/gh/mrdoob/three.js@r110/examples/jsm/loaders/FBXLoader.js";

// Elementos principales de la escena 3D
let container, scene, camera, renderer, mixer, talkAction;
const clock = new THREE.Clock();

/**
 * Inicializa la escena 3D, la cámara, las luces y el modelo FBX.
 */
export function initQuijoteAnimacion() {
    container = document.getElementById("modelo-container");
    scene = new THREE.Scene();

    // Configuración de cámara
    camera = new THREE.PerspectiveCamera(
        60,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.set(0, 60, 170);

    // Renderizador WebGL
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Iluminación básica
    scene.add(new THREE.AmbientLight(0xffffff, 1));

    const dir = new THREE.DirectionalLight(0xffffff, 1);
    dir.position.set(11, 10, 0.5);
    scene.add(dir);

    // Carga del modelo FBX
    const loader = new FBXLoader();

    // Interceptamos console.warn SOLO durante el parseo del FBX
    const originalWarn = console.warn;
    console.warn = function (msg, ...args) {
        if (typeof msg === "string" && (msg.includes("skinning weights") || msg.includes("Texture has been resized"))) {
            return;
        }
        originalWarn.apply(console, [msg, ...args]);
    };

    loader.load("talking.fbx", obj => {
        // Restauramos console.warn inmediatamente tras cargar el objeto
        console.warn = originalWarn;

        obj.scale.set(0.1, 0.1, 0.1);
        obj.position.set(20, -15, 15);

        scene.add(obj);

        // Configuración del sistema de animación
        mixer = new THREE.AnimationMixer(obj);
        talkAction = mixer.clipAction(obj.animations[0]);

        talkAction.loop = THREE.LoopRepeat;
        talkAction.play();
        talkAction.paused = true; // La boca inicia detenida

        // Indicador global para otros módulos
        window.modeloListo = true;

        console.log("Modelo 3D cargado y listo.");
    }, undefined, err => {
        console.warn = originalWarn;
        console.error("Error al cargar el modelo 3D:", err);
    });

    // Inicia el ciclo de renderizado
    animate();

    // Ajuste automático al redimensionar ventana
    window.addEventListener("resize", onWindowResize);
}

/**
 * Bucle principal de animación.
 */
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    if (mixer) {
        mixer.update(delta);
    }

    renderer.render(scene, camera);
}

/**
 * Ajusta la cámara y el renderizador al redimensionar la ventana.
 */
function onWindowResize() {
    if (!container || !renderer || !camera) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

/**
 * Activa la animación de la boca.
 */
export function iniciarAnimacionBoca() {
    if (window.modeloListo && talkAction) {
        talkAction.paused = false;
    }
}

/**
 * Pausa la animación de la boca.
 */
export function detenerAnimacionBoca() {
    if (window.modeloListo && talkAction) {
        talkAction.paused = true;
    }
}

/**
 * Evento del modal de instrucciones.
 */
const btnAceptar = document.getElementById("btn-aceptar");
if (btnAceptar) {
    btnAceptar.addEventListener("click", () => {
        const modal = document.getElementById("modal-instrucciones");
        const contenido = document.getElementById("contenido-principal");
        if (modal) modal.style.display = "none";
        if (contenido) contenido.style.display = "block";  
        initQuijoteAnimacion();
    });
}