/* =========================================================
   MENTALIST CONSCIENTE — base da comunidade (fórum + admin)
   ========================================================= */
const MC = (() => {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const configurado = Boolean(SUPABASE_URL && SUPABASE_KEY && window.supabase);
  const sb = configurado ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

  const GOOGLE_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7Z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z"/><path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1Z"/><path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.8 3.6-4.9 6.7-4.9Z"/></svg>';

  /* ---------- utilidades ---------- */
  const rtf = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
  function tempo(iso) {
    const s = (new Date(iso) - Date.now()) / 1000;
    const passos = [[60, "second"], [3600, "minute", 60], [86400, "hour", 3600], [604800, "day", 86400], [2629800, "week", 604800], [31557600, "month", 2629800], [Infinity, "year", 31557600]];
    for (const [lim, un, div = 1] of passos) {
      if (Math.abs(s) < lim) return rtf.format(Math.round(s / div), un);
    }
  }

  function avatarHTML(nome, url, sm = false) {
    const cls = `avatar${sm ? " avatar--sm" : ""}`;
    if (url && /^https:\/\//.test(url)) {
      return `<img class="${cls}" src="${esc(url)}" alt="" referrerpolicy="no-referrer" loading="lazy">`;
    }
    return `<span class="${cls}" aria-hidden="true">${esc((nome || "?").trim().charAt(0).toUpperCase())}</span>`;
  }

  const nomeDe = (user) =>
    user?.user_metadata?.full_name || user?.user_metadata?.name || (user?.email || "").split("@")[0] || "Observador";
  const fotoDe = (user) => user?.user_metadata?.avatar_url || user?.user_metadata?.picture || "";

  let toastTimer;
  function toast(msg) {
    const el = $("#toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("is-visible"), 3200);
  }

  /* ---------- autenticação ---------- */
  async function entrar() {
    if (!sb) { toast("O login estará disponível quando o fórum for conectado."); return; }
    const { error } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: location.href.split("#")[0] },
    });
    if (error) toast("Não foi possível entrar: " + error.message);
  }

  async function sair() {
    if (sb) await sb.auth.signOut();
  }

  // Chama cb(user) ao abrir a página e sempre que a pessoa entra ou sai.
  function aoMudarLogin(cb) {
    if (!sb) { cb(null); return; }
    let ultimo;
    sb.auth.onAuthStateChange((_evento, session) => {
      const u = session?.user ?? null;
      const id = u ? u.id : "";
      if (id === ultimo) return;
      ultimo = id;
      // fora do callback, como recomenda a documentação do Supabase
      setTimeout(() => cb(u), 0);
    });
  }

  function botaoGoogle(texto = "Entrar com Google") {
    return `<button class="btn btn--google" data-entrar>${GOOGLE_SVG}<span>${esc(texto)}</span></button>`;
  }

  function renderConta(user) {
    const el = $("#conta");
    if (!el) return;
    el.innerHTML = user
      ? `<div class="conta__user">${avatarHTML(nomeDe(user), fotoDe(user), true)}<span class="conta__nome">${esc(nomeDe(user).split(" ")[0])}</span><button class="conta__sair" data-sair>Sair</button></div>`
      : botaoGoogle("Entrar");
    if (user) mostrarModerar(el);
  }

  // Botão "Moderar" para administradores (fora da própria página de moderação)
  async function mostrarModerar(el) {
    if (!sb || location.pathname.endsWith("admin.html")) return;
    const { data: admin } = await sb.rpc("is_admin");
    if (!admin) return;
    const { count } = await sb.from("posts").select("id", { count: "exact", head: true }).eq("status", "pending");
    if (el.querySelector(".moderar")) return;
    el.insertAdjacentHTML("afterbegin", `
      <a href="admin.html" class="moderar" title="Aprovar ou recusar posts">
        Moderar${count ? `<span class="moderar__count">${count}</span>` : ""}
      </a>`);
  }

  /* ---------- eventos globais ---------- */
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-entrar]")) entrar();
    if (e.target.closest("[data-sair]")) sair();
  });

  const menuBtn = $("#menuBtn");
  const nav = $("#nav");
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", () => {
      const aberto = nav.classList.toggle("is-open");
      menuBtn.setAttribute("aria-expanded", aberto);
    });
  }

  const ano = $("#ano");
  if (ano) ano.textContent = new Date().getFullYear();

  return { $, esc, sb, configurado, tempo, avatarHTML, nomeDe, fotoDe, toast, entrar, sair, aoMudarLogin, botaoGoogle, renderConta };
})();
