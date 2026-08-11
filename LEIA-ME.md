# Site de Casamento — Giovanna & Kenner

## Como trocar as imagens

Todas as imagens ficam na pasta **`imagens/`**. Basta substituir o arquivo
mantendo **exatamente o mesmo nome**, formato (jpg/png) e, se possível, uma
proporção parecida com a original. Não é necessário alterar HTML, CSS ou JS.

| Arquivo                    | Onde aparece                          | Formato recomendado                          |
|-----------------------------|----------------------------------------|-----------------------------------------------|
| `imagens/logo.png`          | Logo no cabeçalho                     | PNG com fundo transparente, quadrado          |
| `imagens/hero-back.jpg`     | Seção inicial — camada mais distante (céu/horizonte) | JPG, 1920×1080 (16:9) |
| `imagens/hero-mid.png`      | Seção inicial — camada intermediária (campo de lavanda) | PNG transparente, 1920×1080 |
| `imagens/hero-front.png`    | Seção inicial — camada mais próxima (lavandas em primeiro plano) | PNG transparente, 1920×1080 |
| `imagens/historia-back.jpg` | Nossa História — camada mais distante  | JPG, 1920×1080 |
| `imagens/historia-mid.jpg`  | Nossa História — foto principal do casal | JPG, 1920×1080 |
| `imagens/historia-front.png`| Nossa História — camada de destaque em primeiro plano | PNG transparente, 1920×1080 |
| `imagens/mapa-preview.jpg`  | Prévia do mapa na seção de cerimônia  | JPG, proporção ~3:2 |
| `imagens/final-bg.jpg`      | Fundo fixo da seção final "Esperamos você" | JPG, 1920×1080 |

> Dica: para o melhor efeito de parallax em 3 camadas (seções "Início" e
> "Nossa História"), use imagens PNG com fundo transparente nas camadas
> `mid` e `front`, recortando apenas os elementos que devem parecer "mais
> próximos" (ex.: hastes de lavanda, folhagem). Isso reforça a sensação de
> profundidade ao mover o mouse.

## Estrutura de arquivos

```
wedding-site/
├── index.html          → página inicial
├── css/
│   └── style.css       → todo o estilo do site
├── js/
│   ├── parallax.js      → motor de parallax (mouse no desktop / automático no mobile)
│   └── main.js           → menu, contagem regressiva, animações de rolagem
└── imagens/              → todas as imagens do site
```

## Links para o Google Maps

O botão "ver localização" já aponta para o endereço cadastrado
(Av. Dr. José Neto Carneiro, Nº400, Crimeia Leste, Goiânia-GO). Caso o
endereço mude, edite apenas o atributo `href` do link `.map-btn` no
`index.html`.

## Próximas páginas

Os links do menu para **Nossa História**, **Lista de Presentes** e
**Confirmar Presença** apontam para `nossa-historia.html`,
`lista-presentes.html` e `confirmar-presenca.html`, que ainda serão
criadas. Ao criá-las, marque o item correspondente do menu com a classe
`is-active` (como feito em "Início" nesta página) para manter o destaque
lavanda na aba certa.
