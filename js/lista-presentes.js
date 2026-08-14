/* =========================================================
   LISTA DE PRESENTES — camada de apresentação
   Este arquivo NÃO possui mais nenhum catálogo local: os
   presentes (nome/foto) vêm exclusivamente da coleção
   "presentes" no Firestore, carregados por js/firebase.js.

   Este arquivo só sabe:
   - como transformar um presente em um card (reaproveitando
     o HTML/CSS já existentes: .lp__grid, .lp__item, etc.)
   - em qual grid (cozinha / quarto e sala / banheiro e
     lavanderia) cada presente deve entrar, com base no
     prefixo do ID do documento (ex.: "cozinha-01",
     "quarto-sala-04", "banheiro-lavanderia-02").
   ========================================================= */
(function () {
  "use strict";

  var GRID_BY_CATEGORY = {
    "cozinha": "lpKitchenGrid",
    "quarto-sala": "lpBedroomGrid",
    "banheiro-lavanderia": "lpBathroomGrid"
  };

  /* Extrai a categoria a partir do ID do documento, removendo
     o sufixo numérico final. Ex.: "cozinha-01" -> "cozinha" */
  function categoryFromId(id) {
    return String(id).replace(/-\d+$/, "");
  }

  /* ---------------------------------------------------------
     REGISTRY — ponte entre a apresentação (HTML/CSS já
     existentes) e a camada Firebase (js/firebase.js).
     --------------------------------------------------------- */
  var GiftsRegistry = (function () {
    var items = {};        // id -> { id, desc, photo, cardEl, photoEl, imgEl, descEl }
    var interactionOn = false;
    var clickHandler = null;

    function renderGifts(gifts) {
      // gifts: [{ id, nome, foto }, ...] — vindo do Firestore
      var byGrid = {};

      gifts.forEach(function (gift) {
        var category = categoryFromId(gift.id);
        var containerId = GRID_BY_CATEGORY[category];
        if (!containerId) {
          console.warn('[lista-presentes] Presente "' + gift.id + '" não corresponde a nenhuma seção conhecida e foi ignorado.');
          return;
        }
        if (!byGrid[containerId]) byGrid[containerId] = document.createDocumentFragment();
        byGrid[containerId].appendChild(buildCard(gift));
      });

      Object.keys(byGrid).forEach(function (containerId) {
        var container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = "";
        container.appendChild(byGrid[containerId]);
      });
    }

    function buildCard(gift) {
      var id = gift.id;
      var desc = gift.nome || "";
      var photo = gift.foto || "";

      var cell = document.createElement("div");
      cell.className = "lp__item";
      cell.setAttribute("data-gift-id", id);

      var photoWrap = document.createElement("div");
      photoWrap.className = "lp__item-photo";
      photoWrap.setAttribute("role", "button");
      photoWrap.setAttribute("tabindex", "0");
      photoWrap.setAttribute("aria-label", desc + " — carregando disponibilidade");

      var img = document.createElement("img");
      img.src = photo;
      img.alt = desc;
      img.loading = "lazy";

      var descEl = document.createElement("p");
      descEl.className = "lp__item-desc";
      descEl.textContent = desc;

      photoWrap.appendChild(img);
      cell.appendChild(photoWrap);
      cell.appendChild(descEl);

      photoWrap.addEventListener("click", function () {
        triggerActivate(id);
      });
      photoWrap.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          triggerActivate(id);
        }
      });

      items[id] = {
        id: id,
        desc: desc,
        photo: photo,
        cardEl: cell,
        photoEl: photoWrap,
        imgEl: img,
        descEl: descEl,
        reserved: false,
        badgeEl: null
      };

      return cell;
    }

    function getItem(id) {
      return items[id] || null;
    }

    function getAllIds() {
      return Object.keys(items);
    }

    function setInteractionEnabled(on) {
      interactionOn = !!on;
    }

    function isInteractionEnabled() {
      return interactionOn;
    }

    function onGiftActivate(handler) {
      clickHandler = handler;
    }

    function triggerActivate(id) {
      if (!interactionOn || typeof clickHandler !== "function") return;
      clickHandler(id);
    }

    function markReserved(id) {
      var entry = items[id];
      if (!entry || entry.reserved) return;
      entry.reserved = true;
      entry.photoEl.classList.add("lp__item-photo--reserved");
      entry.cardEl.classList.add("lp__item--reserved");
      if (!entry.badgeEl) {
        entry.badgeEl = document.createElement("span");
        entry.badgeEl.className = "lp__reserved-badge";
        entry.badgeEl.setAttribute("aria-hidden", "true");
        entry.badgeEl.innerHTML =
          '<svg viewBox="0 0 24 24" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">' +
          '<circle cx="12" cy="12" r="12" fill="currentColor"></circle>' +
          '<path d="M7 12.5l3.2 3.2L17 8.7" stroke="#fff" stroke-width="2.1" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
          "</svg>";
        entry.photoEl.appendChild(entry.badgeEl);
      }
      entry.photoEl.setAttribute("aria-label", entry.desc + " — presente já reservado");
    }

    function markAvailable(id) {
      var entry = items[id];
      if (!entry || !entry.reserved) return;
      entry.reserved = false;
      entry.photoEl.classList.remove("lp__item-photo--reserved");
      entry.cardEl.classList.remove("lp__item--reserved");
      if (entry.badgeEl) {
        entry.badgeEl.remove();
        entry.badgeEl = null;
      }
      entry.photoEl.setAttribute("aria-label", entry.desc + " — disponível para reserva");
    }

    return {
      renderGifts: renderGifts,
      getItem: getItem,
      getAllIds: getAllIds,
      setInteractionEnabled: setInteractionEnabled,
      isInteractionEnabled: isInteractionEnabled,
      onGiftActivate: onGiftActivate,
      markReserved: markReserved,
      markAvailable: markAvailable
    };
  })();

  // Exposto para js/firebase.js consumir (arquivo carregado com
  // `defer`, portanto o DOM já está pronto quando isto executa).
  window.GiftsRegistry = GiftsRegistry;

  /* ---------------------------------------------------------
     PIX — copiar chave para a área de transferência
     --------------------------------------------------------- */
  function showPixToast(message, isError) {
    var toast = document.querySelector(".lp-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "lp-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.remove("lp-toast--success", "lp-toast--error");
    toast.classList.add(isError ? "lp-toast--error" : "lp-toast--success");
    toast.classList.add("is-open");
    window.clearTimeout(showPixToast._t);
    showPixToast._t = window.setTimeout(function () {
      toast.classList.remove("is-open");
    }, 2400);
  }

  function initPixCopy() {
    var btn = document.getElementById("pixCopyBtn");
    var valueEl = document.getElementById("pixKeyValue");
    if (!btn || !valueEl) return;

    btn.addEventListener("click", function () {
      var key = valueEl.textContent.trim();
      var done = function () { showPixToast("Chave PIX copiada!"); };
      var fail = function () { showPixToast("Não foi possível copiar a chave.", true); };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(key).then(done).catch(fail);
      } else {
        try {
          var temp = document.createElement("textarea");
          temp.value = key;
          temp.style.position = "fixed";
          temp.style.opacity = "0";
          document.body.appendChild(temp);
          temp.select();
          document.execCommand("copy");
          document.body.removeChild(temp);
          done();
        } catch (err) {
          fail();
        }
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPixCopy);
  } else {
    initPixCopy();
  }
})();
