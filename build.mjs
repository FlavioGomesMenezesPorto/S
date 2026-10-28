/* =========================================================
   MENTALIST CONSCIENTE — build de publicação
   ---------------------------------------------------------
   Gera a pasta dist/ que a Vercel publica:
   - junta os CSS e os JS locais de cada página em um único
     arquivo com nome aleatório (esconde a estrutura de pastas)
   - minifica o CSS e ofusca o JavaScript
   - minifica o HTML e remove todos os comentários
   Os arquivos originais continuam legíveis para edição.
   ========================================================= */
import { readFile, writeFile, mkdir, rm, cp, access } from "node:fs/promises";
import { createHash } from "node:crypto";
import { transform } from "esbuild";
import { minify as minifyHTML } from "html-minifier-terser";
import JavaScriptObfuscator from "javascript-obfuscator";

const PAGINAS = ["index.html", "forum.html", "admin.html", "privacidade.html"];
const COPIAR = ["robots.txt", "sitemap.xml", "img"];
const DIST = "dist";

const hash = (txt) => createHash("sha256").update(txt).digest("hex").slice(0, 12);
const existe = (p) => access(p).then(() => true, () => false);

// mesmo conjunto de arquivos em páginas diferentes → mesmo pacote (cache do navegador)
const pacotes = new Map();

async function empacotar(arquivos, tipo) {
  const chave = `${tipo}:${arquivos.join("|")}`;
  if (pacotes.has(chave)) return pacotes.get(chave);

  const fontes = await Promise.all(arquivos.map((f) => readFile(f, "utf8")));
  let codigo;
  if (tipo === "css") {
    codigo = (await transform(fontes.join("\n"), { loader: "css", minify: true })).code;
  } else {
    // ";" entre arquivos evita que um script "cole" no outro
    codigo = JavaScriptObfuscator.obfuscate(fontes.join("\n;\n"), {
      compact: true,
      renameGlobals: false, // PRODUTOS, MC etc. são compartilhados entre os arquivos
      stringArray: true,
      stringArrayEncoding: ["base64"],
      stringArrayThreshold: 0.75,
      controlFlowFlattening: false, // mantém o site leve
      deadCodeInjection: false,
      selfDefending: false,
      target: "browser",
    }).getObfuscatedCode();
  }

  const nome = `assets/${hash(codigo)}.${tipo}`;
  await writeFile(`${DIST}/${nome}`, codigo);
  pacotes.set(chave, nome);
  return nome;
}

async function processar(pagina) {
  let html = await readFile(pagina, "utf8");

  // CSS locais (os do Google Fonts ficam como estão)
  const css = [...html.matchAll(/<link rel="stylesheet" href="((?!https?:)[^"]+)"\s*\/?>/g)];
  if (css.length) {
    const nome = await empacotar(css.map((m) => m[1]), "css");
    css.forEach((m, i) => { html = html.replace(m[0], i === 0 ? `<link rel="stylesheet" href="/${nome}">` : ""); });
  }

  // JS locais (o Supabase do CDN fica como está)
  const js = [...html.matchAll(/<script src="((?!https?:)[^"]+)"><\/script>/g)];
  if (js.length) {
    const nome = await empacotar(js.map((m) => m[1]), "js");
    js.forEach((m, i) => { html = html.replace(m[0], i === 0 ? `<script src="/${nome}"></script>` : ""); });
  }

  html = await minifyHTML(html, {
    collapseWhitespace: true,
    conservativeCollapse: true,
    removeComments: true,
    minifyCSS: true,
    minifyJS: true,
  });

  await writeFile(`${DIST}/${pagina}`, html);
  console.log(`✓ ${pagina}`);
}

await rm(DIST, { recursive: true, force: true });
await mkdir(`${DIST}/assets`, { recursive: true });
for (const p of PAGINAS) await processar(p);
for (const f of COPIAR) if (await existe(f)) await cp(f, `${DIST}/${f}`, { recursive: true });
console.log(`Pronto: ${pacotes.size} pacotes em ${DIST}/assets`);
