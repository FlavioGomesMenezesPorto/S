/* =========================================================
   MENTALIST CONSCIENTE — painel de moderação
   A proteção real está no banco (função is_admin e regras RLS):
   mesmo que alguém abra esta página, não consegue moderar.
   ========================================================= */
(() => {
  "use strict";

  const { $, esc, sb, configurado, tempo, avatarHTML, botaoGoogle, renderConta, toast } = MC;
  const app = $("#adminApp");

  let aba = "pending";
  let contagem = { pending: 0, approved: 0 };

  function aviso(titulo, texto, extra = "") {
    app.innerHTML = `<div class="aviso"><h3>${titulo}</h3><p>${texto}</p>${extra}</div>`;
  }

  async function contar() {
    const [p, a] = await Promise.all([
      sb.from("posts").select("id", { count: "exact", head: true }).eq("status", "pending"),
      sb.from("posts").select("id", { count: "exact", head: true }).eq("status", "approved"),
    ]);
    contagem = { pending: p.count ?? 0, approved: a.count ?? 0 };
  }

  async function render() {
    await contar();
    const { data, error } = await sb.from("forum_posts").select("*")
      .eq("status", aba).order("created_at", { ascending: aba === "pending" }).limit(100);

    if (error) { aviso("Erro ao carregar", esc(error.message)); return; }

    const itens = data.length
      ? data.map((p) => `
          <div class="admin-item">
            <div>
              <p class="post__texto">${esc(p.content)}</p>
              <div class="post__autor">
                ${avatarHTML(p.author_name, p.author_avatar, true)}
                <div><strong>${esc(p.author_name)}</strong><small>${tempo(p.created_at)}${aba === "approved" ? ` · ${p.likes} curtidas` : ""}</small></div>
              </div>
            </div>
            <div class="admin-item__acoes">
              ${aba === "pending"
                ? `<button class="btn btn--gold" data-aprovar="${p.id}">Aprovar</button>
                   <button class="btn btn--ghost btn--danger" data-remover="${p.id}">Recusar</button>`
                : `<button class="btn btn--ghost" data-ocultar="${p.id}">Voltar p/ revisão</button>
                   <button class="btn btn--ghost btn--danger" data-remover="${p.id}">Remover</button>`}
            </div>
          </div>`).join("")
      : `<div class="mural__vazio"><span>◉</span>${aba === "pending" ? "Nenhum post aguardando aprovação." : "Nenhum post aprovado ainda."}</div>`;

    app.innerHTML = `
      <div class="admin-tabs filtros" role="tablist">
        <button class="filtro ${aba === "pending" ? "is-active" : ""}" data-aba="pending" role="tab">Aguardando<span>(${contagem.pending})</span></button>
        <button class="filtro ${aba === "approved" ? "is-active" : ""}" data-aba="approved" role="tab">Aprovados<span>(${contagem.approved})</span></button>
      </div>
      <div class="admin-lista">${itens}</div>`;
  }

  async function mudarStatus(id, status, msg) {
    const { error } = await sb.from("posts").update({ status }).eq("id", id);
    if (error) { toast("Erro: " + error.message); return; }
    toast(msg);
    render();
  }

  async function remover(id) {
    if (!confirm("Remover este post definitivamente?")) return;
    const { error } = await sb.from("posts").delete().eq("id", id);
    if (error) { toast("Erro: " + error.message); return; }
    toast("Post removido.");
    render();
  }

  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-aprovar],[data-remover],[data-ocultar],[data-aba]");
    if (!t) return;
    const d = t.dataset;
    if (d.aprovar) mudarStatus(d.aprovar, "approved", "Post aprovado e publicado no mural. ✦");
    else if (d.ocultar) mudarStatus(d.ocultar, "pending", "Post voltou para revisão.");
    else if (d.remover) remover(d.remover);
    else if (d.aba) { aba = d.aba; render(); }
  });

  async function iniciar(user) {
    renderConta(user);
    if (!configurado) {
      aviso("Fórum ainda não conectado", "Preencha o arquivo <strong>js/config.js</strong> com os dados do Supabase para ativar a moderação.");
      return;
    }
    if (!user) {
      aviso("Entre para moderar", "Use a conta Google cadastrada como administradora.", botaoGoogle());
      return;
    }
    const { data: ehAdmin } = await sb.rpc("is_admin");
    if (!ehAdmin) {
      aviso("Sem acesso", "Esta conta não tem permissão de moderação.", '<button class="btn btn--ghost" data-sair>Sair</button>');
      return;
    }
    render();
  }

  MC.aoMudarLogin(iniciar);
})();
