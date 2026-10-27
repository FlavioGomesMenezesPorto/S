# Como ativar o fórum (Comunidade)

Leva uns 15 minutos e é tudo gratuito. São 4 etapas.

## 1. Criar o projeto no Supabase

1. Acesse https://supabase.com e clique em **Start your project** (pode entrar com o GitHub ou o e-mail).
2. **New project** → dê o nome `mentalistconsciente`, crie uma senha para o banco (guarde-a) e escolha a região **South America (São Paulo)**.
3. Espere uns 2 minutos até o projeto ficar pronto.

## 2. Criar as tabelas

1. Abra o arquivo `supabase/schema.sql` desta pasta.
2. **Troque `SEU_EMAIL@gmail.com`** pelo e-mail da conta Google com que você vai moderar.
3. No Supabase: menu lateral **SQL Editor** → **New query** → cole todo o conteúdo → **Run**.
   Deve aparecer "Success. No rows returned".

## 3. Ativar o login com Google

**No Google Cloud:**
1. Acesse https://console.cloud.google.com e crie um projeto (ex.: "Mentalist Consciente").
2. Menu **APIs e serviços → Tela de consentimento OAuth** (ou "Google Auth Platform"):
   tipo **Externo**, nome do app "Mentalist Consciente", seu e-mail de suporte → salvar.
   Depois, em **Público-alvo**, clique em **Publicar app**. Sem isso, só contas de teste conseguem entrar.
3. **APIs e serviços → Credenciais → Criar credenciais → ID do cliente OAuth**:
   - Tipo: **Aplicativo da Web**
   - Em **URIs de redirecionamento autorizados**, adicione:
     `https://SEU-PROJETO.supabase.co/auth/v1/callback`
     (o endereço exato aparece no Supabase no passo seguinte, em "Callback URL")
4. Copie o **ID do cliente** e a **Chave secreta do cliente**.

**No Supabase:**
1. **Authentication → Sign In / Providers → Google** → ative, cole o ID e a chave secreta → **Save**.
2. **Authentication → URL Configuration**:
   - **Site URL:** `https://mentalistconsciente.vercel.app`
   - **Redirect URLs:** adicione `https://mentalistconsciente.vercel.app/**` e `https://*-flavio-gomes-projects.vercel.app/**` (para as prévias)

## 4. Me mandar 2 dados

No Supabase: **Project Settings → API** (ou **Data API / API Keys**):
- **Project URL** (ex.: `https://abcdxyz.supabase.co`)
- Chave **anon public** (ou **publishable**)

Essas duas são públicas por natureza, então pode mandar no chat. A segurança vem das regras do banco.
**Nunca mande a `service_role` / `secret` key nem a senha do banco.**

Com isso eu preencho o `js/config.js` e publico.

## Depois de ativo

- **Mural:** `/forum.html`
- **Moderação:** `/admin.html` (entre com a conta Google que você colocou no passo 2)
- Para adicionar outra pessoa como moderadora, rode no SQL Editor:
  `insert into admins (email) values ('outra@gmail.com');`
