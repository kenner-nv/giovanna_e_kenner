/* =========================================================
   NOSSA HISTÓRIA — slider de capítulos + fundo sincronizado
   ========================================================= */
(function () {
  "use strict";

  /* ---------- Conteúdo dos capítulos ----------
     Edite títulos, textos e caminhos das fotos aqui.
     Cada capítulo usa 2 fotos: imagens/nossa_historia/*
  ------------------------------------------------ */
  var CHAPTERS = [
    {
      title: "O Primeiro Encontro",
      text: "Toda história de amor começa com um primeiro capítulo. A de Kenner e Giovanna começou de maneira inesperada: os dois se conheceram em um culto na igreja da noiva, em 2020. A partir dali, vieram vários passeios ao lado dos amigos. Kenner, cada vez mais encantado pelo jeito alegre e meigo da moça, e Giovanna, aos poucos, se interessando pelo menino tímido, mas de uma boa conversa.",
      photoA: "imagens/nossa_historia/capitulo-1-a.jpg",
      photoB: "imagens/nossa_historia/capitulo-1-b.jpg"
    },
    {
      title: "A Conversa que Mudou Tudo",
      text: "Depois de tantos passeios e cultos juntos, os dois estavam cada vez mais próximos, ainda como bons amigos. Até que, em uma longa conversa sobre a vida e os sonhos de cada um, mesmo à distância, em plena pandemia, a noite avançou pela madrugada. Foi então que perceberam que talvez tivessem encontrado a pessoa que tanto esperavam. A partir dali, já não havia mais como esconder o sentimento.",
      photoA: "imagens/nossa_historia/capitulo-2-a.jpg",
      photoB: "imagens/nossa_historia/capitulo-2-b.jpg"
    },
    {
      title: "O Primeiro Sim",
      text: "Não demorou para Kenner perceber que gostava cada vez mais daquela mocinha alegre e meiga. Logo, juntou suas economias para comprar uma aliança de namoro. Meio sem jeito, mas decidido, conversou com os pais de Giovanna e planejou uma surpresa: uma visita até a casa dela, em uma cidade vizinha. Quando chegou, a primeira reação de Giovanna foi pensar, surpresa: \u201cO que ele está fazendo aqui?\u201d. Ainda sem entender muito bem, ela acabou se rendendo às flores e ao discurso um tanto vergonhoso de Kenner. E então veio o primeiro sim.",
      photoA: "imagens/nossa_historia/capitulo-3-a.jpg",
      photoB: "imagens/nossa_historia/capitulo-3-b.jpg"
    },
    {
      title: "O Pedido que Ela Esperava",
      text: "Os anos passaram — parecendo ainda mais longos para Giovanna, que já não via a hora de se tornar noiva — e o sentimento entre os dois apenas cresceu e amadureceu. Até que, em 2025, Kenner decidiu oficializar aquilo que já não conseguia mais esconder: havia encontrado a pessoa com quem queria passar toda a sua vida. Apesar das desconfianças de Giovanna, que ficava ansiosa a cada final de semana, imaginando se aquele seria o grande dia, ela foi surpreendida quando o pedido finalmente aconteceu, na casa de Kenner, cercado por uma decoração inspirada em sua personagem favorita.",
      photoA: "imagens/nossa_historia/capitulo-4-a.jpg",
      photoB: "imagens/nossa_historia/capitulo-4-b.jpg"
    },
    {
      title: "E Eles Começam o Seu Para Sempre",
      text: "Agora, dando mais um passo nessa história, e talvez o mais importante de todos até aqui, os dois começam a escrever o seu próprio final feliz. E não poderiam imaginar um momento mais especial para iniciar esse novo capítulo do que ao lado das pessoas que, de alguma forma, também fizeram parte dessa história.",
      photoA: "imagens/nossa_historia/capitulo-5-a.jpg",
      photoB: "imagens/nossa_historia/capitulo-5-b.jpg"
    }
  ];

  var TOTAL_BG = 5; // uma imagem de fundo por card: imagens/nossa_historia/bg-01.webp..bg-05.webp
  var BG_STEP_DELAY = 420; // ms entre cada imagem, caso o alvo esteja a mais de 1 passo de distância
  var BG_CLEANUP_DELAY = 1750; // aguarda a transição de opacidade (1.7s) terminar antes de "limpar" camadas antigas
  var CARD_TRANSITION_MS = 380;

  var current = 0;
  var currentBgIndex = 0;
  var bgToken = 0;
  var isAnimating = false;

  var els = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    els.card = document.getElementById("nhCard");
    els.cardInner = document.getElementById("nhCardInner");
    els.title = document.getElementById("nhCardTitle");
    els.body = document.getElementById("nhCardBody");
    els.photoA = document.getElementById("nhPhotoA");
    els.photoB = document.getElementById("nhPhotoB");
    els.photoWrapA = document.querySelector(".nh__photo--a");
    els.photoWrapB = document.querySelector(".nh__photo--b");
    els.cardPhotos = document.getElementById("nhCardPhotos");
    els.prevBtn = document.getElementById("nhPrev");
    els.nextBtn = document.getElementById("nhNext");
    els.previewPrev = document.getElementById("nhPreviewPrev");
    els.previewNext = document.getElementById("nhPreviewNext");
    els.previewPrevTitle = document.getElementById("nhPreviewPrevTitle");
    els.previewNextTitle = document.getElementById("nhPreviewNextTitle");
    els.counterCurrent = document.getElementById("nhCounterCurrent");
    els.counterTotal = document.getElementById("nhCounterTotal");
    els.bgLayers = Array.prototype.slice.call(document.querySelectorAll(".nh__bg-layer"));
    els.stage = document.querySelector(".nh__stage");

    if (!els.card || !CHAPTERS.length) return;

    els.counterTotal.textContent = pad(CHAPTERS.length);

    els.prevBtn.addEventListener("click", function () { goTo(current - 1); });
    els.nextBtn.addEventListener("click", function () { goTo(current + 1); });
    els.previewPrev.addEventListener("click", function () { goTo(current - 1); });
    els.previewNext.addEventListener("click", function () { goTo(current + 1); });

    document.addEventListener("keydown", function (e) {
      if (!isInViewport(els.stage)) return;
      if (e.key === "ArrowLeft") goTo(current - 1);
      if (e.key === "ArrowRight") goTo(current + 1);
    });

    bindSwipe();
    bindPhotoFocus();

    renderChapter(current, false);
    setBackground(current, false);
  }

  function pad(n) { return String(n).padStart(2, "0"); }

  function isInViewport(el) {
    if (!el) return true;
    var r = el.getBoundingClientRect();
    return r.top < window.innerHeight && r.bottom > 0;
  }

  /* ---------- Navegação ---------- */
  function goTo(index) {
    if (isAnimating) return;
    var total = CHAPTERS.length;
    if (index < 0 || index >= total) return; // sem loop infinito
    if (index === current) return;

    isAnimating = true;
    current = index;

    els.cardInner.classList.add("is-transitioning");
    setTimeout(function () {
      renderChapter(current, true);
      els.cardInner.classList.remove("is-transitioning");
      isAnimating = false;
    }, CARD_TRANSITION_MS);

    setBackground(current, true);
  }

  /* ---------- Renderização do card ---------- */
  function renderChapter(index, animated) {
    var ch = CHAPTERS[index];
    var total = CHAPTERS.length;

    els.title.textContent = ch.title;
    els.body.textContent = ch.text;
    els.photoA.src = ch.photoA;
    els.photoA.alt = ch.title + " — foto 1";
    els.photoB.src = ch.photoB;
    els.photoB.alt = ch.title + " — foto 2";

    els.counterCurrent.textContent = pad(index + 1);

    // a foto A volta a ficar em destaque a cada troca de capítulo
    setFrontPhoto(els.photoWrapA);

    var hasPrev = index > 0;
    var hasNext = index < total - 1;

    els.prevBtn.style.visibility = hasPrev ? "visible" : "hidden";
    els.nextBtn.style.visibility = hasNext ? "visible" : "hidden";

    els.previewPrev.style.visibility = hasPrev ? "visible" : "hidden";
    els.previewNext.style.visibility = hasNext ? "visible" : "hidden";

    if (hasPrev) {
      els.previewPrevTitle.textContent = CHAPTERS[index - 1].title;
      els.previewPrev.style.backgroundImage = "url('" + CHAPTERS[index - 1].photoA + "')";
      els.previewPrev.style.backgroundSize = "cover";
      els.previewPrev.style.backgroundPosition = "center";
    }
    if (hasNext) {
      els.previewNextTitle.textContent = CHAPTERS[index + 1].title;
      els.previewNext.style.backgroundImage = "url('" + CHAPTERS[index + 1].photoA + "')";
      els.previewNext.style.backgroundSize = "cover";
      els.previewNext.style.backgroundPosition = "center";
    }
  }

  /* ---------- Foto em destaque (fica à frente até a outra ser passada) ---------- */
  function setFrontPhoto(wrapEl) {
    if (!els.photoWrapA || !els.photoWrapB || !wrapEl) return;
    els.photoWrapA.classList.toggle("is-front", wrapEl === els.photoWrapA);
    els.photoWrapB.classList.toggle("is-front", wrapEl === els.photoWrapB);
  }

  function bindPhotoFocus() {
    if (!els.cardPhotos) return;
    els.cardPhotos.addEventListener("mouseover", function (e) {
      var photo = e.target.closest(".nh__photo");
      if (!photo || !els.cardPhotos.contains(photo)) return;
      setFrontPhoto(photo);
    });
  }

  /* ---------- Fundo sincronizado ---------- */
  function slideToBgIndex(index, total) {
    // 1 imagem de fundo por card — mapeamento direto
    return Math.min(index, TOTAL_BG - 1);
  }

  function setBackground(index, animated) {
    var target = slideToBgIndex(index, CHAPTERS.length);
    if (!animated) {
      bgToken++; // invalida qualquer transição em andamento
      els.bgLayers.forEach(function (layer, i) {
        layer.classList.toggle("is-visible", i === target);
      });
      currentBgIndex = target;
      return;
    }
    crossfadeBackground(target);
  }

  function crossfadeBackground(target) {
    var start = currentBgIndex;
    currentBgIndex = target;
    var myToken = ++bgToken; // qualquer chamada nova invalida a anterior

    // mostra o alvo real IMEDIATAMENTE — garante que nunca fique tudo
    // invisível, mesmo se o usuário navegar mais rápido que a animação
    if (els.bgLayers[target]) els.bgLayers[target].classList.add("is-visible");

    if (target === start) return;

    var step = target > start ? 1 : -1;
    var i = start;

    function advance() {
      if (myToken !== bgToken) return; // uma transição mais nova assumiu — aborta esta
      i += step;
      if (els.bgLayers[i]) els.bgLayers[i].classList.add("is-visible");

      if (i !== target) {
        setTimeout(advance, BG_STEP_DELAY);
      } else {
        // depois de alcançar o alvo, aguarda a dissolução terminar e então
        // limpa as camadas intermediárias (sem cortes perceptíveis)
        setTimeout(function () {
          if (myToken !== bgToken) return; // não limpa se outra transição já assumiu
          els.bgLayers.forEach(function (layer, idx) {
            if (idx !== target) layer.classList.remove("is-visible");
          });
        }, BG_CLEANUP_DELAY);
      }
    }
    advance();
  }

  /* ---------- Suporte a swipe (toque) ---------- */
  function bindSwipe() {
    var startX = null;
    var startY = null;
    if (!els.card) return;

    els.card.addEventListener("touchstart", function (e) {
      if (!e.touches || !e.touches.length) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });

    els.card.addEventListener("touchend", function (e) {
      if (startX === null) return;
      var endX = (e.changedTouches && e.changedTouches[0].clientX) || startX;
      var endY = (e.changedTouches && e.changedTouches[0].clientY) || startY;
      var dx = endX - startX;
      var dy = endY - startY;

      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) goTo(current + 1);
        else goTo(current - 1);
      }
      startX = null;
      startY = null;
    }, { passive: true });
  }
})();
