/* =========================================================
   MAIN — cabeçalho, menu mobile, contagem regressiva,
   revelação suave ao rolar e véu de entrada.
   ========================================================= */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    initVeil();
    initHeaderScroll();
    initMobileNav();
    initCountdown();
    initScrollReveal();
    initCursorGlow();
    initHistoriaMosaic();
  }

  /* ---------- Véu de entrada ---------- */
  function initVeil() {
    var veil = document.getElementById("veil");
    if (!veil) return;
    window.requestAnimationFrame(function () {
      setTimeout(function () { veil.classList.add("is-hidden"); }, 200);
    });
  }

  /* ---------- Cabeçalho: encolhe + glassmorphism ao rolar ---------- */
  function initHeaderScroll() {
    var header = document.getElementById("siteHeader");
    if (!header) return;
    var threshold = 40;

    function onScroll() {
      if (window.scrollY > threshold) {
        header.classList.add("is-scrolled");
      } else {
        header.classList.remove("is-scrolled");
      }
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Menu mobile ---------- */
  function initMobileNav() {
    var toggle = document.getElementById("navToggle");
    var nav = document.getElementById("primaryNav");
    var closeBtn = document.getElementById("navClose");
    if (!toggle || !nav) return;

    function closeNav() {
      nav.classList.remove("is-open");
      toggle.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }

    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("is-open");
      toggle.classList.toggle("is-open", isOpen);
      toggle.setAttribute("aria-expanded", String(isOpen));
      document.body.style.overflow = isOpen ? "hidden" : "";
    });

    if (closeBtn) closeBtn.addEventListener("click", closeNav);

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeNav);
    });
  }

  /* ---------- Contagem regressiva ---------- */
  function initCountdown() {
    var elDays = document.getElementById("cd-days");
    var elHours = document.getElementById("cd-hours");
    var elMinutes = document.getElementById("cd-minutes");
    var elSeconds = document.getElementById("cd-seconds");
    if (!elDays || !elHours || !elMinutes || !elSeconds) return;

    var targetDate = new Date("2027-04-24T16:00:00");

    function pad(n) { return String(n).padStart(2, "0"); }

    function update() {
      var now = new Date();
      var diff = targetDate.getTime() - now.getTime();

      if (diff <= 0) {
        elDays.textContent = "00";
        elHours.textContent = "00";
        elMinutes.textContent = "00";
        elSeconds.textContent = "00";
        clearInterval(timer);
        return;
      }

      var days = Math.floor(diff / (1000 * 60 * 60 * 24));
      var hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      var minutes = Math.floor((diff / (1000 * 60)) % 60);
      var seconds = Math.floor((diff / 1000) % 60);

      elDays.textContent = pad(days);
      elHours.textContent = pad(hours);
      elMinutes.textContent = pad(minutes);
      elSeconds.textContent = pad(seconds);
    }

    update();
    var timer = setInterval(update, 1000);
  }

  /* ---------- Revelação suave ao rolar ---------- */
  function initScrollReveal() {
    var targets = document.querySelectorAll(
      ".countdown__inner, .ceremony__inner, .historia__content, .farewell__content, .lp__reveal, .divider:not(.hero__divider)"
    );
    targets.forEach(function (el) { el.setAttribute("data-reveal", ""); });

    if (!("IntersectionObserver" in window)) {
      targets.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );

    targets.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Mosaico "Nossa História": zoom suave ao passar o mouse ou tocar/clicar ---------- */
  function initHistoriaMosaic() {
    var photos = document.querySelectorAll(".historia__photo");
    if (!photos.length) return;

    photos.forEach(function (photo) {
      photo.addEventListener("click", function () {
        var wasActive = photo.classList.contains("is-zoom");
        photos.forEach(function (other) { other.classList.remove("is-zoom"); });
        if (!wasActive) photo.classList.add("is-zoom");
      });
    });
  }

  /* ---------- Brilho suave que acompanha o mouse ----------
     Só roda em dispositivos com mouse de verdade (hover: hover):
     em telas de toque o efeito segue o dedo por uma fração de
     segundo e some, então é imperceptível — mas continuava
     consumindo CPU/bateria a cada frame. Também pausa quando a
     aba fica em segundo plano. ---------- */
  function initCursorGlow() {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    var glow = document.createElement("div");
    glow.className = "cursor-glow";
    glow.setAttribute("aria-hidden", "true");
    document.body.appendChild(glow);

    /* pontinhos de brilho que orbitam suavemente perto do cursor, piscando de forma espaçada */
    var DOT_COUNT = 6;
    var dots = [];
    for (var i = 0; i < DOT_COUNT; i++) {
      var dot = document.createElement("div");
      dot.className = "cursor-dot";
      dot.setAttribute("aria-hidden", "true");

      var core = document.createElement("span");
      core.className = "cursor-dot__core";
      core.style.animationDelay = (Math.random() * 4).toFixed(2) + "s";
      core.style.animationDuration = (3.2 + Math.random() * 2.6).toFixed(2) + "s";
      dot.appendChild(core);

      document.body.appendChild(dot);

      dots.push({
        el: dot,
        angle: Math.random() * Math.PI * 2,
        radius: 34 + Math.random() * 78,
        speed: (Math.random() < 0.5 ? -1 : 1) * (0.00012 + Math.random() * 0.00018)
      });
    }

    var targetX = window.innerWidth / 2;
    var targetY = window.innerHeight / 2;
    var currentX = targetX;
    var currentY = targetY;

    window.addEventListener("mousemove", function (e) {
      targetX = e.clientX;
      targetY = e.clientY;
    }, { passive: true });

    var rafId = null;

    function tick() {
      currentX += (targetX - currentX) * 0.09;
      currentY += (targetY - currentY) * 0.09;
      glow.style.transform = "translate3d(" + currentX.toFixed(1) + "px," + currentY.toFixed(1) + "px,0)";

      dots.forEach(function (d) {
        d.angle += d.speed * 16;
        var dx = currentX + Math.cos(d.angle) * d.radius;
        var dy = currentY + Math.sin(d.angle) * d.radius * 0.72;
        d.el.style.transform = "translate3d(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px,0)";
      });

      rafId = requestAnimationFrame(tick);
    }

    // pausa o loop quando a aba está em segundo plano — evita gastar
    // CPU/bateria com uma animação que ninguém está vendo
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        if (rafId !== null) cancelAnimationFrame(rafId);
        rafId = null;
      } else if (rafId === null) {
        rafId = requestAnimationFrame(tick);
      }
    });

    rafId = requestAnimationFrame(tick);
  }
})();
