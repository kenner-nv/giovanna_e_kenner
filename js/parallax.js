/* =========================================================
   PARALLAX ENGINE
   Camadas de profundidade (data-depth) reagem ao mouse em
   telas com ponteiro fino (desktop) e a um movimento
   automático muito lento em telas de toque (mobile).
   ========================================================= */
(function () {
  "use strict";

  // Detecta dispositivo de toque pela ausência real de hover/ponteiro fino —
  // NUNCA pela largura da janela. Uma janela de desktop redimensionada ou
  // dividida ainda tem mouse, e deve continuar usando o parallax por mouse.
  var useAutoMode = window.matchMedia("(hover: none), (pointer: coarse)").matches;

  var scenes = Array.prototype.slice.call(document.querySelectorAll("[data-parallax-scene]"));
  if (!scenes.length) return;

  var sceneData = scenes.map(function (scene) {
    var layers = Array.prototype.slice.call(scene.querySelectorAll("[data-depth]")).map(function (el) {
      return {
        el: el,
        depth: parseFloat(el.getAttribute("data-depth")) || 10
      };
    });
    return {
      scene: scene,
      layers: layers,
      targetX: 0,
      targetY: 0,
      currentX: 0,
      currentY: 0,
      inView: true
    };
  });

  /* ---------- Visibility (pause offscreen scenes) ---------- */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var match = sceneData.filter(function (s) { return s.scene === entry.target; })[0];
        if (match) match.inView = entry.isIntersecting;
      });
    }, { threshold: 0.05 });
    sceneData.forEach(function (s) { io.observe(s.scene); });
  }

  /* ---------- Desktop: mouse-driven parallax ---------- */
  function bindMouse() {
    window.addEventListener("mousemove", function (e) {
      var vw = window.innerWidth;
      var vh = window.innerHeight;
      var nx = (e.clientX / vw) * 2 - 1; // -1 .. 1
      var ny = (e.clientY / vh) * 2 - 1;

      sceneData.forEach(function (s) {
        s.targetX = nx;
        s.targetY = ny;
      });
    }, { passive: true });

    window.addEventListener("mouseleave", function () {
      sceneData.forEach(function (s) {
        s.targetX = 0;
        s.targetY = 0;
      });
    });
  }

  /* ---------- Mobile: slow automatic ambient drift ---------- */
  var autoT = 0;
  function stepAuto(dt) {
    autoT += dt * 0.00028; // lento e contínuo, mas perceptível em poucos segundos
    var nx = Math.sin(autoT) * 0.6;
    var ny = Math.cos(autoT * 0.8) * 0.6;
    sceneData.forEach(function (s) {
      s.targetX = nx;
      s.targetY = ny;
    });
  }

  /* ---------- Render loop ---------- */
  var lastTime = performance.now();
  var rafId = null;

  function tick(now) {
    var dt = now - lastTime;
    lastTime = now;

    if (useAutoMode) stepAuto(dt);

    sceneData.forEach(function (s) {
      if (!s.inView) return;

      var ease = useAutoMode ? 0.02 : 0.11;
      s.currentX += (s.targetX - s.currentX) * ease;
      s.currentY += (s.targetY - s.currentY) * ease;

      s.layers.forEach(function (layer) {
        var strength = useAutoMode ? layer.depth * 0.35 : layer.depth;
        var tx = s.currentX * strength;
        var ty = s.currentY * strength * 0.6;

        layer.el.style.transform =
          "translate3d(" + tx.toFixed(2) + "px," + ty.toFixed(2) + "px,0) scale(0.9)";
      });
    });

    rafId = requestAnimationFrame(tick);
  }

  // pausa o loop quando a aba está em segundo plano — no modo automático
  // (mobile) ele rodaria para sempre em background sem necessidade
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = null;
    } else {
      lastTime = performance.now();
      if (rafId === null) rafId = requestAnimationFrame(tick);
    }
  });

  if (!useAutoMode) bindMouse();
  rafId = requestAnimationFrame(tick);
})();
