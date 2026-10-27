/* =========================================================
   MENTALIST CONSCIENTE — interações
   ========================================================= */
(() => {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const byId = (id) => PRODUTOS.find((p) => p.id === id);

  const ICON_PLUS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
  const ICON_CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>';

  /* ---------- capa ---------- */
  function capaHTML(p) {
    if (p.capa) {
      return `<div class="capa capa--img"><img src="${esc(p.capa)}" alt="Capa do ebook ${esc(p.titulo)}" loading="lazy"></div>`;
    }
    const [c1, c2] = p.cores || ["#1a2c52", "#080d1a"];
    return `
      <div class="capa" style="--c1:${c1};--c2:${c2}" role="img" aria-label="Capa do ebook ${esc(p.titulo)}">
        <span class="capa__marca">Mentalist Consciente</span>
        <span class="capa__simbolo">${p.simbolo || "◉"}</span>
        <span class="capa__titulo">${esc(p.titulo)}</span>
      </div>`;
  }

  function precoHTML(p) {
    return `<div class="preco"><strong>${brl(p.preco)}</strong>${p.precoAntigo ? `<s>${brl(p.precoAntigo)}</s>` : ""}</div>`;
  }

  /* ---------- carrinho (estado) ---------- */
  const STORAGE_KEY = "mc-carrinho";
  let carrinho = [];
  try {
    carrinho = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]").filter(byId);
  } catch (_) { carrinho = []; }

  const salvar = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(carrinho)); } catch (_) {} };
  const noCarrinho = (id) => carrinho.includes(id);

  function adicionar(id) {
    if (noCarrinho(id)) { abrirCarrinho(); return; }
    carrinho.push(id);
    salvar();
    atualizarCarrinho();
    toast(`“${byId(id).titulo}” foi adicionado ao carrinho`);
    const btn = $("#cartOpen");
    btn.classList.remove("bump"); void btn.offsetWidth; btn.classList.add("bump");
  }

  function remover(id) {
    carrinho = carrinho.filter((x) => x !== id);
    salvar();
    atualizarCarrinho();
  }

  function comprarAgora(id) {
    const p = byId(id);
    if (p.linkCompra) { window.open(p.linkCompra, "_blank", "noopener"); return; }
    if (!noCarrinho(id)) adicionar(id);
    fecharModal();
    abrirCarrinho();
  }

  function atualizarCarrinho() {
    const count = $("#cartCount");
    count.textContent = carrinho.length;
    count.classList.toggle("has-items", carrinho.length > 0);

    const lista = $("#cartItems");
    if (!carrinho.length) {
      lista.innerHTML = `<li class="cart__empty"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 7h12l-1 13H7L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>Seu carrinho está vazio.<br>Que tal começar pela <a href="#ebooks" data-cart-close>biblioteca</a>?</li>`;
    } else {
      lista.innerHTML = carrinho.map((id) => {
        const p = byId(id);
        return `
          <li class="cart__item">
            ${capaHTML(p)}
            <div><h4>${esc(p.titulo)}</h4><small>${brl(p.preco)}</small></div>
            <button class="cart__remove" data-remove="${p.id}">Remover</button>
          </li>`;
      }).join("");
    }

    const total = carrinho.reduce((s, id) => s + byId(id).preco, 0);
    $("#cartTotal").textContent = brl(total);
    $("#checkoutBtn").disabled = carrinho.length === 0;
    $("#checkoutNote").innerHTML = "";

    // sincroniza os botões "+" dos cards
    $$("[data-add]").forEach((b) => {
      const added = noCarrinho(b.dataset.add);
      b.classList.toggle("is-added", added);
      b.innerHTML = added ? ICON_CHECK : ICON_PLUS;
      b.setAttribute("aria-label", added ? "No carrinho — ver carrinho" : "Adicionar ao carrinho");
    });
  }

  function finalizar() {
    if (!carrinho.length) return;
    // Um único item com link de checkout configurado → vai direto para o pagamento
    if (carrinho.length === 1 && byId(carrinho[0]).linkCompra) {
      window.open(byId(carrinho[0]).linkCompra, "_blank", "noopener");
      return;
    }
    // Pagamento ainda não configurado
    $("#checkoutNote").innerHTML =
      `O checkout online está em implantação. Para concluir agora, fale com a gente pelo direct do <a href="${CONFIG.instagram}" target="_blank" rel="noopener">${CONFIG.usuarioInstagram}</a>.`;
  }

  /* ---------- painel do carrinho ---------- */
  const cart = $("#cart");
  function abrirCarrinho() {
    cart.classList.add("is-open");
    cart.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
  }
  function fecharCarrinho() {
    cart.classList.remove("is-open");
    cart.setAttribute("aria-hidden", "true");
    if (!modal.classList.contains("is-open")) document.body.classList.remove("no-scroll");
  }

  /* ---------- modal ---------- */
  const modal = $("#modal");
  let ultimoFoco = null;

  function abrirModal(id) {
    const p = byId(id);
    if (!p) return;
    ultimoFoco = document.activeElement;
    const meta = [p.categoria, p.paginas ? `${p.paginas} páginas` : null, "PDF", "Acesso imediato"].filter(Boolean);
    $("#modalBody").innerHTML = `
      <div>${capaHTML(p)}</div>
      <div>
        ${p.selo ? `<span class="selo">${esc(p.selo)}</span>` : ""}
        <h2 id="modalTitle">${esc(p.titulo)}</h2>
        <p class="sub">${esc(p.subtitulo)}</p>
        <div class="modal__meta">${meta.map((m) => `<span>${esc(m)}</span>`).join("")}</div>
        <p class="desc">${esc(p.descricao)}</p>
        <h4>O que você vai aprender</h4>
        <ul class="destaque__topicos">${p.topicos.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
        <div class="destaque__acoes">
          ${precoHTML(p)}
          <button class="btn btn--gold" data-buy="${p.id}">Comprar agora</button>
          <button class="btn btn--ghost" data-add-modal="${p.id}">${noCarrinho(p.id) ? "Ver no carrinho" : "Adicionar ao carrinho"}</button>
        </div>
      </div>`;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
    $(".modal__close", modal).focus();
  }

  function fecharModal() {
    if (!modal.classList.contains("is-open")) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    if (!cart.classList.contains("is-open")) document.body.classList.remove("no-scroll");
    if (ultimoFoco) ultimoFoco.focus();
  }

  /* ---------- catálogo ---------- */
  let filtroAtual = "Todos";

  function renderFiltros() {
    const cats = ["Todos", ...new Set(PRODUTOS.map((p) => p.categoria))];
    $("#filtros").innerHTML = cats.map((c) =>
      `<button class="filtro ${c === filtroAtual ? "is-active" : ""}" role="tab" aria-selected="${c === filtroAtual}" data-filtro="${esc(c)}">${esc(c)}</button>`
    ).join("");
  }

  function renderGrid() {
    const lista = PRODUTOS.filter((p) => filtroAtual === "Todos" || p.categoria === filtroAtual);
    $("#gridEbooks").innerHTML = lista.map((p, i) => `
      <article class="card" style="animation-delay:${i * 70}ms">
        ${p.selo ? `<span class="selo">${esc(p.selo)}</span>` : ""}
        <div class="card__capa-wrap" data-open="${p.id}" tabindex="0" role="button" aria-label="Ver detalhes de ${esc(p.titulo)}">
          ${capaHTML(p)}
        </div>
        <span class="card__cat">${esc(p.categoria)}</span>
        <h3>${esc(p.titulo)}</h3>
        <p class="card__sub">${esc(p.subtitulo)}</p>
        <div class="card__foot">
          ${precoHTML(p)}
          <button class="icon-btn" data-add="${p.id}" aria-label="Adicionar ao carrinho">${ICON_PLUS}</button>
        </div>
        <button class="card__more" data-open="${p.id}">Ver detalhes</button>
      </article>`).join("");
    atualizarCarrinho();
  }

  function renderDestaque() {
    const p = PRODUTOS.find((x) => x.destaque) || PRODUTOS[0];
    if (!p) { $("#destaque").remove(); return; }
    $("#destaqueBox").innerHTML = `
      <div class="destaque__capa reveal">${capaHTML(p)}</div>
      <div class="destaque__info">
        <p class="eyebrow reveal">Em destaque</p>
        <h2 class="reveal">${esc(p.titulo)}</h2>
        <p class="sub reveal">${esc(p.subtitulo)}</p>
        <ul class="destaque__topicos reveal">${p.topicos.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
        <div class="destaque__acoes reveal">
          ${precoHTML(p)}
          <button class="btn btn--gold" data-buy="${p.id}">Quero este ebook</button>
          <button class="btn btn--ghost" data-open="${p.id}">Saiba mais</button>
        </div>
      </div>`;
  }

  /* ---------- eventos (delegação) ---------- */
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-add],[data-add-modal],[data-buy],[data-open],[data-remove],[data-filtro],[data-close],[data-cart-close]");
    if (!t) return;
    const d = t.dataset;

    if (d.add) { noCarrinho(d.add) ? abrirCarrinho() : adicionar(d.add); }
    else if (d.addModal) {
      if (noCarrinho(d.addModal)) { fecharModal(); abrirCarrinho(); }
      else { adicionar(d.addModal); t.textContent = "Ver no carrinho"; }
    }
    else if (d.buy) comprarAgora(d.buy);
    else if (d.open) abrirModal(d.open);
    else if (d.remove) remover(d.remove);
    else if (d.filtro) { filtroAtual = d.filtro; renderFiltros(); renderGrid(); }
    else if ("close" in d) fecharModal();
    else if ("cartClose" in d) fecharCarrinho();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { fecharModal(); fecharCarrinho(); }
    if ((e.key === "Enter" || e.key === " ") && e.target.matches(".card__capa-wrap")) {
      e.preventDefault();
      abrirModal(e.target.dataset.open);
    }
  });

  $("#cartOpen").addEventListener("click", abrirCarrinho);
  $("#checkoutBtn").addEventListener("click", finalizar);

  /* ---------- toast ---------- */
  let toastTimer;
  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("is-visible"), 2600);
  }

  /* ---------- header e menu ---------- */
  const header = $(".header");
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 20);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const menuBtn = $("#menuBtn");
  const nav = $("#nav");
  menuBtn.addEventListener("click", () => {
    const aberto = nav.classList.toggle("is-open");
    menuBtn.setAttribute("aria-expanded", aberto);
  });
  $$("a", nav).forEach((a) => a.addEventListener("click", () => {
    nav.classList.remove("is-open");
    menuBtn.setAttribute("aria-expanded", "false");
  }));

  /* ---------- newsletter ---------- */
  // Sem backend por enquanto: conecte depois a Mailchimp, Brevo, ConvertKit, etc.
  $("#newsForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = $("#newsEmail");
    const msg = $("#newsMsg");
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
    msg.classList.toggle("is-error", !ok);
    if (!ok) { msg.textContent = "Digite um e-mail válido."; input.focus(); return; }
    msg.textContent = "Inscrição confirmada. Obrigado!";
    input.value = "";
  });

  /* ---------- reveal on scroll ---------- */
  function observarReveal() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    $$(".reveal:not(.is-visible)").forEach((el) => io.observe(el));
  }

  /* ---------- capas no hero ---------- */
  function renderHeroCapas() {
    const box = $("#heroCapas");
    if (!box) return;
    const principal = PRODUTOS.find((x) => x.destaque) || PRODUTOS[0];
    const outros = PRODUTOS.filter((x) => x !== principal && x.categoria !== "Kits").slice(0, 2);
    if (!principal) { box.remove(); return; }
    box.innerHTML = [outros[0], principal, outros[1]]
      .filter(Boolean)
      .map((p) => `<div class="hero__capa${p === principal ? " is-main" : ""}">${capaHTML(p)}</div>`)
      .join("");
  }

  /* ---------- frases ---------- */
  function renderFrases() {
    const lista = typeof FRASES !== "undefined" ? FRASES : [];
    if (!lista.length) { $("#frases").remove(); return; }
    $("#frasesGrid").innerHTML = lista.map((f) => `
      <figure class="frase reveal">
        <span class="frase__marca">Consciente</span>
        <span class="frase__aspas" aria-hidden="true">“</span>
        <blockquote>${esc(f)}</blockquote>
        <span class="frase__assinatura">Inconsciente</span>
        <figcaption>@mentalistconsciente</figcaption>
      </figure>`).join("");
  }

  /* ---------- números ---------- */
  function renderStats() {
    const ebooks = PRODUTOS.filter((p) => p.categoria !== "Kits");
    const paginas = ebooks.reduce((s, p) => s + (p.paginas || 0), 0);
    $("#statEbooks").textContent = ebooks.length;
    $("#statPaginas").textContent = paginas >= 100 ? `${Math.floor(paginas / 50) * 50}+` : paginas;
  }

  /* ---------- constelação no hero ---------- */
  function constelacao() {
    const canvas = $("#constelacao");
    if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    let w, h, pontos, raf;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function init() {
      w = canvas.offsetWidth; h = canvas.offsetHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(60, (w * h) / 24000));
      pontos = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.12, vy: (Math.random() - 0.5) * 0.12,
        r: Math.random() * 1.4 + 0.4,
      }));
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (const p of pontos) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
      for (let i = 0; i < pontos.length; i++) {
        const a = pontos[i];
        for (let j = i + 1; j < pontos.length; j++) {
          const b = pontos[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 130) {
            ctx.strokeStyle = `rgba(201,164,92,${(1 - d / 130) * 0.1})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        ctx.fillStyle = "rgba(236,211,154,.4)";
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }

    const hero = $(".hero");

    // pausa a animação quando o hero sai da tela
    new IntersectionObserver(([en]) => {
      cancelAnimationFrame(raf);
      if (en.isIntersecting) raf = requestAnimationFrame(frame);
    }).observe(hero);

    let rt;
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(init, 200); });
    init();
  }

  /* ---------- init ---------- */
  $("#ano").textContent = new Date().getFullYear();
  renderHeroCapas();
  renderStats();
  renderFrases();
  renderDestaque();
  renderFiltros();
  renderGrid();
  observarReveal();
  constelacao();
})();
