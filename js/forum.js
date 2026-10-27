/* =========================================================
   MENTALIST CONSCIENTE — mural da comunidade
   ========================================================= */
(() => {
  "use strict";

  const { $, esc, sb, configurado, tempo, avatarHTML, nomeDe, fotoDe, toast, botaoGoogle, renderConta } = MC;

  const MAX = 500;
  const POR_PAGINA = 20;
  const ICON_OLHO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';

  let user = null;
  let ordem = "recentes";
  let posts = [];
  let total = 0;
  let curtidos = new Set();

  /* ---------- modo demonstração ---------- */
  const agora = Date.now();
  const DEMO = [
    { id: "d1", author_name: "Exemplo · Marina", content: "Quem observa em silêncio enxerga o que os outros só escutam.", likes: 42, created_at: new Date(agora - 36e5 * 2).toISOString() },
    { id: "d2", author_name: "Exemplo · Rafael", content: "Hoje percebi que a pessoa que mais fala na reunião raramente é a que decide. Os olhos de todos iam para outra cadeira.", likes: 31, created_at: new Date(agora - 36e5 * 7).toISOString() },
    { id: "d3", author_name: "Exemplo · Júlia", content: "A atenção é o único superpoder que todo mundo tem e quase ninguém treina.", likes: 58, created_at: new Date(agora - 864e5).toISOString() },
    { id: "d4", author_name: "Exemplo · Caio", content: "Memorizei os nomes das 12 pessoas do curso usando o palácio da memória. Ninguém acreditou.", likes: 19, created_at: new Date(agora - 864e5 * 2).toISOString() },
    { id: "d5", author_name: "Exemplo · Bea", content: "Ler pessoas não é adivinhar. É prestar atenção de verdade.", likes: 27, created_at: new Date(agora - 864e5 * 4).toISOString() },
  ];

  /* ---------- carregamento ---------- */
  async function carregar(reset = true) {
    if (reset) { posts = []; $("#mural").innerHTML = '<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>'; }

    if (!configurado) {
      const lista = [...DEMO].sort((a, b) => ordem === "curtidos" ? b.likes - a.likes : new Date(b.created_at) - new Date(a.created_at));
      posts = lista; total = lista.length;
      renderMural();
      return;
    }

    let q = sb.from("forum_posts").select("*", { count: "exact" }).eq("status", "approved");
    q = ordem === "curtidos"
      ? q.order("likes", { ascending: false }).order("created_at", { ascending: false })
      : q.order("created_at", { ascending: false });
    const { data, error, count } = await q.range(posts.length, posts.length + POR_PAGINA - 1);

    if (error) {
      $("#mural").innerHTML = `<div class="mural__vazio"><span>◉</span>Não foi possível carregar o mural agora. Tente novamente em instantes.</div>`;
      console.error(error);
      return;
    }
    posts = posts.concat(data);
    total = count ?? posts.length;
    renderMural();
  }

  async function carregarCurtidos() {
    curtidos = new Set();
    if (!configurado || !user) return;
    const { data } = await sb.from("likes").select("post_id").eq("user_id", user.id);
    (data || []).forEach((l) => curtidos.add(l.post_id));
  }

  async function carregarPendentes() {
    const box = $("#pendentes");
    if (!configurado || !user) { box.hidden = true; return; }
    const { data } = await sb.from("posts").select("id, content, created_at")
      .eq("user_id", user.id).eq("status", "pending").order("created_at", { ascending: false });
    if (!data || !data.length) { box.hidden = true; return; }
    box.hidden = false;
    box.innerHTML = `<h4>Seus posts aguardando aprovação</h4>` + data.map((p) => `
      <div class="pendente">
        <p>${esc(p.content)}</p>
        <div class="pendente__acoes">
          <span class="selo">Em revisão</span>
          <button class="post__apagar" data-apagar="${p.id}">Excluir</button>
        </div>
      </div>`).join("");
  }

  /* ---------- render ---------- */
  function renderOficiais() {
    const lista = typeof FRASES !== "undefined" ? FRASES : [];
    if (!lista.length) return;
    $("#oficiaisGrid").innerHTML = lista.map((f) => `
      <figure class="frase">
        <span class="frase__marca">Consciente</span>
        <span class="frase__aspas" aria-hidden="true">“</span>
        <blockquote>${esc(f)}</blockquote>
        <span class="frase__assinatura">Inconsciente</span>
        <figcaption>@mentalistconsciente</figcaption>
      </figure>`).join("");
    $("#oficiais").hidden = false;
  }

  function renderCompose() {
    const el = $("#compose");
    if (!user) {
      el.className = "compose compose--login";
      el.innerHTML = `
        <h3>Compartilhe uma <em>percepção</em></h3>
        <p>Entre com sua conta Google para postar frases e curtir as da comunidade.</p>
        ${botaoGoogle()}`;
      return;
    }
    el.className = "compose";
    el.innerHTML = `
      <form id="postForm">
        <div class="compose__head">
          ${avatarHTML(nomeDe(user), fotoDe(user))}
          <div><strong>${esc(nomeDe(user))}</strong><small>Seu post será revisado antes de aparecer no mural.</small></div>
        </div>
        <label class="sr-only" for="postTexto">Sua frase</label>
        <textarea id="postTexto" maxlength="${MAX}" placeholder="O que a sua mente percebeu hoje?" required></textarea>
        <div class="compose__foot">
          <span class="compose__count" id="postCount">0 / ${MAX}</span>
          <button type="submit" class="btn btn--gold" id="postEnviar">Enviar para o mural</button>
        </div>
      </form>`;
  }

  function postHTML(p, i) {
    const liked = curtidos.has(p.id);
    const meu = user && p.user_id === user.id;
    return `
      <article class="post" style="animation-delay:${Math.min(i, 8) * 60}ms">
        <p class="post__texto">${esc(p.content)}</p>
        <div class="post__foot">
          <div class="post__autor">
            ${avatarHTML(p.author_name, p.author_avatar, true)}
            <div><strong>${esc(p.author_name)}</strong><small>${tempo(p.created_at)}</small></div>
          </div>
          <div class="post__acoes">
            ${meu ? `<button class="post__apagar" data-apagar="${p.id}">Excluir</button>` : ""}
            <button class="like ${liked ? "is-liked" : ""}" data-curtir="${p.id}" aria-pressed="${liked}" aria-label="${liked ? "Remover curtida" : "Curtir"}">
              ${ICON_OLHO}<span>${p.likes}</span>
            </button>
          </div>
        </div>
      </article>`;
  }

  function renderMural() {
    const mural = $("#mural");
    if (!posts.length) {
      mural.innerHTML = `<div class="mural__vazio"><span>◉</span>O mural ainda está em silêncio.<br>Seja a primeira pessoa a compartilhar uma frase.</div>`;
    } else {
      mural.innerHTML = posts.map(postHTML).join("");
    }
    $("#forumCount").textContent = total ? `${total} ${total === 1 ? "post" : "posts"}` : "";
    $("#carregarMais").hidden = posts.length >= total;
  }

  /* ---------- ações ---------- */
  async function enviar(e) {
    e.preventDefault();
    const txt = $("#postTexto");
    const conteudo = txt.value.trim();
    if (conteudo.length < 3) { toast("Escreva pelo menos 3 caracteres."); txt.focus(); return; }
    if (conteudo.length > MAX) { toast(`Use no máximo ${MAX} caracteres.`); return; }

    const btn = $("#postEnviar");
    btn.disabled = true; btn.textContent = "Enviando…";
    const { error } = await sb.from("posts").insert({ content: conteudo });
    btn.disabled = false; btn.textContent = "Enviar para o mural";

    if (error) { toast(error.message || "Não foi possível enviar. Tente de novo."); return; }
    txt.value = "";
    $("#postCount").textContent = `0 / ${MAX}`;
    toast("Enviado! Seu post aparece no mural assim que for aprovado. ✦");
    carregarPendentes();
  }

  async function curtir(id, btn) {
    const p = posts.find((x) => x.id === id);
    if (!p) return;

    if (configurado && !user) { toast("Entre com Google para curtir."); return; }

    const vaiCurtir = !curtidos.has(id);
    vaiCurtir ? curtidos.add(id) : curtidos.delete(id);
    p.likes += vaiCurtir ? 1 : -1;
    btn.classList.toggle("is-liked", vaiCurtir);
    btn.setAttribute("aria-pressed", vaiCurtir);
    btn.querySelector("span").textContent = p.likes;
    btn.classList.remove("pop"); void btn.offsetWidth; btn.classList.add("pop");

    if (!configurado) return;
    const { error } = vaiCurtir
      ? await sb.from("likes").insert({ post_id: id })
      : await sb.from("likes").delete().eq("post_id", id).eq("user_id", user.id);
    if (error) {
      // desfaz em caso de erro
      vaiCurtir ? curtidos.delete(id) : curtidos.add(id);
      p.likes += vaiCurtir ? -1 : 1;
      renderMural();
      toast("Não foi possível registrar a curtida.");
    }
  }

  async function apagar(id) {
    if (!confirm("Excluir este post? Isso não pode ser desfeito.")) return;
    const { error } = await sb.from("posts").delete().eq("id", id);
    if (error) { toast("Não foi possível excluir."); return; }
    toast("Post excluído.");
    carregarPendentes();
    carregar();
  }

  /* ---------- eventos ---------- */
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-curtir],[data-apagar],[data-ordem]");
    if (!t) return;
    if (t.dataset.curtir) curtir(t.dataset.curtir, t);
    else if (t.dataset.apagar) apagar(t.dataset.apagar);
    else if (t.dataset.ordem && t.dataset.ordem !== ordem) {
      ordem = t.dataset.ordem;
      document.querySelectorAll("[data-ordem]").forEach((b) => {
        const ativo = b.dataset.ordem === ordem;
        b.classList.toggle("is-active", ativo);
        b.setAttribute("aria-selected", ativo);
      });
      carregar();
    }
  });

  document.addEventListener("submit", (e) => { if (e.target.id === "postForm") enviar(e); });
  document.addEventListener("input", (e) => {
    if (e.target.id !== "postTexto") return;
    const n = e.target.value.length;
    const c = $("#postCount");
    c.textContent = `${n} / ${MAX}`;
    c.classList.toggle("is-over", n > MAX);
  });

  $("#carregarMais").addEventListener("click", () => carregar(false));

  /* ---------- init ---------- */
  async function atualizarUsuario(u) {
    user = u;
    renderConta(user);
    renderCompose();
    await carregarCurtidos();
    carregarPendentes();
    carregar();
  }

  renderOficiais();
  if (!configurado) $("#demoBanner").hidden = false;
  MC.aoMudarLogin(atualizarUsuario);
})();
