/* =========================================================
   LISTA DE PRESENTES — sugestões por ambiente
   Edite título/descrição e caminho da foto de cada item aqui.
   Fotos ficam em: imagens/lista_presente/
   ========================================================= */
(function () {
  "use strict";

  var KITCHEN_ITEMS = [
    { desc: "Jogo de panelas antiaderentes", photo: "imagens/lista_presente/cozinha-01.webp" },
    { desc: "Panela de pressão", photo: "imagens/lista_presente/cozinha-02.webp" },
    { desc: "Escorredor de macarrão", photo: "imagens/lista_presente/cozinha-03.webp" },
    { desc: "Jogo de talheres / Faqueiro", photo: "imagens/lista_presente/cozinha-04.webp" },
    { desc: "Kit de utensílios de silicone", photo: "imagens/lista_presente/cozinha-05.webp" },
    { desc: "Kit utensílios inox", photo: "imagens/lista_presente/cozinha-06.webp" },
    { desc: "Jogo de facas", photo: "imagens/lista_presente/cozinha-07.webp" },
    { desc: "Kit de espátula para bolo", photo: "imagens/lista_presente/cozinha-08.webp" },
    { desc: "Conjunto de travessas / saladeiras", photo: "imagens/lista_presente/cozinha-09.webp" },
    { desc: "Jogo de copos", photo: "imagens/lista_presente/cozinha-10.webp" },
    { desc: "Jogo de taças", photo: "imagens/lista_presente/cozinha-11.webp" },
    { desc: "Jogo para sobremesa", photo: "imagens/lista_presente/cozinha-12.webp" },
    { desc: "Potes herméticos organizadores", photo: "imagens/lista_presente/cozinha-13.webp" },
    { desc: "Potes organizadores de geladeira", photo: "imagens/lista_presente/cozinha-14.webp" },
    { desc: "Formas de bolo", photo: "imagens/lista_presente/cozinha-15.webp" },
    { desc: "Assadeiras de vidro", photo: "imagens/lista_presente/cozinha-16.webp" },
    { desc: "Jarra de suco", photo: "imagens/lista_presente/cozinha-17.webp" },
    { desc: "Açucareiro", photo: "imagens/lista_presente/cozinha-18.webp" },
    { desc: "Boleira", photo: "imagens/lista_presente/cozinha-19.webp" },
    { desc: "Fruteira / Centro de mesa", photo: "imagens/lista_presente/cozinha-20.webp" },
    { desc: "Garrafa de café", photo: "imagens/lista_presente/cozinha-21.webp" },
    { desc: "Escorredor de louça", photo: "imagens/lista_presente/cozinha-22.webp" },
    { desc: "Tábua de corte", photo: "imagens/lista_presente/cozinha-23.webp" },
    { desc: "Toalha de mesa", photo: "imagens/lista_presente/cozinha-24.webp" },
    { desc: "Porta tempero", photo: "imagens/lista_presente/cozinha-25.webp" },
    { desc: "Chaleira elétrica", photo: "imagens/lista_presente/cozinha-26.webp" },
    { desc: "Air fryer", photo: "imagens/lista_presente/cozinha-27.webp" },
    { desc: "Batedeira", photo: "imagens/lista_presente/cozinha-28.webp" },
    { desc: "Exaustor para fogão 5 bocas", photo: "imagens/lista_presente/cozinha-29.webp" },
    { desc: "Sanduicheira", photo: "imagens/lista_presente/cozinha-30.webp" },
    { desc: "Mixer", photo: "imagens/lista_presente/cozinha-31.webp" },
    { desc: "Liquidificador", photo: "imagens/lista_presente/cozinha-32.webp" },
    { desc: "Fogão cooktop 5 bocas", photo: "imagens/lista_presente/cozinha-33.webp" },
    { desc: "Forno elétrico", photo: "imagens/lista_presente/cozinha-34.webp" },
    { desc: "Microondas", photo: "imagens/lista_presente/cozinha-35.webp" }
  ];

  var BEDROOM_LIVING_ITEMS = [
    { desc: "Jogo de lençol casal queen", photo: "imagens/lista_presente/quarto-sala-01.webp" },
    { desc: "Edredom queen size", photo: "imagens/lista_presente/quarto-sala-02.webp" },
    { desc: "Cobertor queen size", photo: "imagens/lista_presente/quarto-sala-03.webp" },
    { desc: "Travesseiros", photo: "imagens/lista_presente/quarto-sala-04.webp" },
    { desc: "Tapete para quarto", photo: "imagens/lista_presente/quarto-sala-05.webp" },
    { desc: "Umidificador de ar", photo: "imagens/lista_presente/quarto-sala-06.webp" },
    { desc: "Caixa organizadora", photo: "imagens/lista_presente/quarto-sala-07.webp" },
    { desc: "Cabides", photo: "imagens/lista_presente/quarto-sala-08.webp" },
    { desc: "Cortinas blackout", photo: "imagens/lista_presente/quarto-sala-09.webp" },
    { desc: "Manta para sofá", photo: "imagens/lista_presente/quarto-sala-10.webp" },
    { desc: "Almofadas decorativas", photo: "imagens/lista_presente/quarto-sala-11.webp" },
    { desc: "Espelho decorativo", photo: "imagens/lista_presente/quarto-sala-12.webp" },
    { desc: "Tapete para sala", photo: "imagens/lista_presente/quarto-sala-13.webp" }
  ];

  var BATHROOM_LAUNDRY_ITEMS = [
    { desc: "Chuveiro", photo: "imagens/lista_presente/banheiro-lavanderia-01.webp" },
    { desc: "Tapete para banheiro", photo: "imagens/lista_presente/banheiro-lavanderia-02.webp" },
    { desc: "Lixeiro", photo: "imagens/lista_presente/banheiro-lavanderia-03.webp" },
    { desc: "Organizadores para banheiro", photo: "imagens/lista_presente/banheiro-lavanderia-04.webp" },
    { desc: "Cesto para roupa suja", photo: "imagens/lista_presente/banheiro-lavanderia-05.webp" },
    { desc: "Tábua de passar roupa", photo: "imagens/lista_presente/banheiro-lavanderia-06.webp" },
    { desc: "Ferro de passar", photo: "imagens/lista_presente/banheiro-lavanderia-07.webp" },
    { desc: "Passadeira / Vaporizador portátil", photo: "imagens/lista_presente/banheiro-lavanderia-08.webp" },
    { desc: "Varal retrátil", photo: "imagens/lista_presente/banheiro-lavanderia-09.webp" },
    { desc: "Aspirador de pó", photo: "imagens/lista_presente/banheiro-lavanderia-10.webp" },
    { desc: "Moop Spray", photo: "imagens/lista_presente/banheiro-lavanderia-11.webp" },
    { desc: "Robô aspirador", photo: "imagens/lista_presente/banheiro-lavanderia-12.webp" }
  ];

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    renderGrid("lpKitchenGrid", KITCHEN_ITEMS);
    renderGrid("lpBedroomGrid", BEDROOM_LIVING_ITEMS);
    renderGrid("lpBathroomGrid", BATHROOM_LAUNDRY_ITEMS);
  }

  function renderGrid(containerId, items) {
    var container = document.getElementById(containerId);
    if (!container || !items || !items.length) return;

    var fragment = document.createDocumentFragment();

    items.forEach(function (item) {
      var cell = document.createElement("div");
      cell.className = "lp__item";

      var photoWrap = document.createElement("div");
      photoWrap.className = "lp__item-photo";

      var img = document.createElement("img");
      img.src = item.photo;
      img.alt = item.desc;
      img.loading = "lazy";

      var desc = document.createElement("p");
      desc.className = "lp__item-desc";
      desc.textContent = item.desc;

      photoWrap.appendChild(img);
      cell.appendChild(photoWrap);
      cell.appendChild(desc);
      fragment.appendChild(cell);
    });

    container.appendChild(fragment);
  }
})();
