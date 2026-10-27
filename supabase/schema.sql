-- =========================================================
-- MENTALIST CONSCIENTE — banco de dados do fórum
-- Cole tudo no Supabase → SQL Editor → New query → Run
-- ANTES de rodar: troque SEU_EMAIL@gmail.com pelo e-mail
-- da conta Google que você vai usar como administrador.
-- =========================================================

-- ---------- administradores ----------
create table if not exists public.admins (
  email text primary key
);

insert into public.admins (email) values ('flavioporto203@gmail.com')
on conflict do nothing;

alter table public.admins enable row level security;
-- (sem políticas: ninguém lê esta tabela pelo site; só a função abaixo)

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.admins where email = (auth.jwt() ->> 'email'));
$$;

-- ---------- posts ----------
create table if not exists public.posts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade,
  author_name   text not null,
  author_avatar text,
  content       text not null check (char_length(trim(content)) between 3 and 500),
  status        text not null default 'pending' check (status in ('pending', 'approved')),
  created_at    timestamptz not null default now()
);

create index if not exists posts_status_created_idx on public.posts (status, created_at desc);

-- Preenche autor a partir da conta Google (não dá para falsificar o nome)
-- e limita a 3 posts aguardando aprovação por pessoa.
create or replace function public.posts_before_insert()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'É preciso estar logado para postar.';
  end if;

  if (select count(*) from public.posts where user_id = auth.uid() and status = 'pending') >= 3 then
    raise exception 'Você já tem 3 posts aguardando aprovação. Aguarde a revisão.';
  end if;

  new.user_id    := auth.uid();
  new.status     := 'pending';
  new.created_at := now();
  new.content    := trim(new.content);

  select coalesce(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name', split_part(email, '@', 1)),
         raw_user_meta_data ->> 'avatar_url'
    into new.author_name, new.author_avatar
    from auth.users where id = auth.uid();

  return new;
end;
$$;

drop trigger if exists posts_before_insert on public.posts;
create trigger posts_before_insert
  before insert on public.posts
  for each row execute function public.posts_before_insert();

alter table public.posts enable row level security;

drop policy if exists "ler aprovados, proprios ou admin" on public.posts;
create policy "ler aprovados, proprios ou admin" on public.posts
  for select using (status = 'approved' or user_id = auth.uid() or public.is_admin());

drop policy if exists "logado cria post" on public.posts;
create policy "logado cria post" on public.posts
  for insert to authenticated with check (true); -- o gatilho acima garante autor e status

drop policy if exists "admin modera" on public.posts;
create policy "admin modera" on public.posts
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "autor ou admin apaga" on public.posts;
create policy "autor ou admin apaga" on public.posts
  for delete using (user_id = auth.uid() or public.is_admin());

-- ---------- curtidas ----------
create table if not exists public.likes (
  post_id uuid not null references public.posts on delete cascade,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  primary key (post_id, user_id)
);

alter table public.likes enable row level security;

drop policy if exists "ver curtidas" on public.likes;
create policy "ver curtidas" on public.likes for select using (true);

drop policy if exists "curtir post aprovado" on public.likes;
create policy "curtir post aprovado" on public.likes
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.posts p where p.id = post_id and p.status = 'approved')
  );

drop policy if exists "descurtir" on public.likes;
create policy "descurtir" on public.likes for delete using (user_id = auth.uid());

-- ---------- visão com contagem de curtidas ----------
create or replace view public.forum_posts
with (security_invoker = true) as
  select p.*, (select count(*) from public.likes l where l.post_id = p.id)::int as likes
  from public.posts p;

grant select on public.forum_posts to anon, authenticated;
