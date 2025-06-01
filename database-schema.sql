-- Estrutura do banco de dados Supabase para DentalConnect
-- Inclui tabelas para autenticação, perfis, análises, posts, chat e casos

-- Tabela de perfis de usuário (extensão da tabela auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  user_id uuid references auth.users on delete cascade not null unique, -- Garante que user_id seja único
  name text not null,
  avatar_url text,
  type text not null check (type in ('dentist', 'technician')),
  specialty text,
  clinic_name text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Habilitar RLS (Row Level Security)
alter table public.profiles enable row level security;

-- Políticas de acesso para perfis
create policy "Perfis são visíveis para todos os usuários autenticados"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "Usuários podem inserir seus próprios perfis"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "Usuários podem editar seus próprios perfis"
  on public.profiles for update
  using (auth.uid() = user_id);

-- Tabela para análises de cor dental
create table public.dental_analyses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  image_url text not null,
  tooth_color_code text not null,
  tooth_color_hex text not null,
  gum_color_code text not null,
  gum_color_hex text not null,
  notes text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Habilitar RLS
alter table public.dental_analyses enable row level security;

-- Políticas de acesso para análises dentais
create policy "Análises dentais são visíveis para o próprio usuário"
  on public.dental_analyses for select
  using (auth.uid() = user_id);

create policy "Usuários podem inserir suas próprias análises dentais"
  on public.dental_analyses for insert
  with check (auth.uid() = user_id);

create policy "Usuários podem atualizar suas próprias análises dentais"
  on public.dental_analyses for update
  using (auth.uid() = user_id);

create policy "Usuários podem deletar suas próprias análises dentais"
  on public.dental_analyses for delete
  using (auth.uid() = user_id);

-- Tabela para Casos (Pacientes)
create table public.cases (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null, -- ID do profissional responsável
  patient_name text not null,
  description text,
  status text default 'active' check (status in ('active', 'archived', 'completed')),
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Habilitar RLS
alter table public.cases enable row level security;

-- Políticas de acesso para casos
create policy "Casos são visíveis apenas para o profissional responsável"
  on public.cases for select
  using (auth.uid() = user_id);

create policy "Profissionais podem inserir seus próprios casos"
  on public.cases for insert
  with check (auth.uid() = user_id);

create policy "Profissionais podem atualizar seus próprios casos"
  on public.cases for update
  using (auth.uid() = user_id);

create policy "Profissionais podem deletar seus próprios casos"
  on public.cases for delete
  using (auth.uid() = user_id);

-- Tabela para posts no feed
create table public.posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  post_type text not null default 'analysis' check (post_type in ('analysis', 'case')), -- Tipo de post
  dental_analysis_id uuid references public.dental_analyses on delete set null,
  case_id uuid references public.cases on delete set null, -- Referência ao caso, se for post de caso
  image_url text, -- Pode ser nulo para posts de caso sem imagem inicial
  description text not null,
  likes_count integer default 0 not null,
  comments_count integer default 0 not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  -- Garante que ou dental_analysis_id ou case_id esteja preenchido dependendo do tipo
  constraint check_post_type_link check (
    (post_type = 'analysis' and dental_analysis_id is not null and case_id is null) or
    (post_type = 'case' and case_id is not null and dental_analysis_id is null)
  )
);

-- Habilitar RLS
alter table public.posts enable row level security;

-- Políticas de acesso para posts
create policy "Posts são visíveis para todos os usuários autenticados"
  on public.posts for select
  using (auth.role() = 'authenticated');

create policy "Usuários podem inserir seus próprios posts"
  on public.posts for insert
  with check (auth.uid() = user_id);

create policy "Usuários podem atualizar seus próprios posts"
  on public.posts for update
  using (auth.uid() = user_id);

create policy "Usuários podem excluir seus próprios posts"
  on public.posts for delete
  using (auth.uid() = user_id);

-- Tabela para curtidas em posts
create table public.post_likes (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  created_at timestamp with time zone default now() not null,
  unique (post_id, user_id)
);

-- Habilitar RLS
alter table public.post_likes enable row level security;

-- Políticas de acesso para curtidas
create policy "Curtidas são visíveis para todos os usuários autenticados"
  on public.post_likes for select
  using (auth.role() = 'authenticated');

create policy "Usuários podem inserir suas próprias curtidas"
  on public.post_likes for insert
  with check (auth.uid() = user_id);

create policy "Usuários podem excluir suas próprias curtidas"
  on public.post_likes for delete
  using (auth.uid() = user_id);

-- Tabela para comentários em posts
create table public.post_comments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Habilitar RLS
alter table public.post_comments enable row level security;

-- Políticas de acesso para comentários
create policy "Comentários são visíveis para todos os usuários autenticados"
  on public.post_comments for select
  using (auth.role() = 'authenticated');

create policy "Usuários podem inserir seus próprios comentários"
  on public.post_comments for insert
  with check (auth.uid() = user_id);

create policy "Usuários podem atualizar seus próprios comentários"
  on public.post_comments for update
  using (auth.uid() = user_id);

create policy "Usuários podem excluir seus próprios comentários"
  on public.post_comments for delete
  using (auth.uid() = user_id);

-- Tabela para conversas
create table public.conversations (
  id uuid default uuid_generate_v4() primary key,
  title text, -- Pode ser nulo para chats 1-1
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Habilitar RLS
alter table public.conversations enable row level security;

-- Tabela para participantes de conversas
create table public.conversation_participants (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  created_at timestamp with time zone default now() not null,
  unique (conversation_id, user_id)
);

-- Habilitar RLS
alter table public.conversation_participants enable row level security;

-- Políticas de acesso para conversas e participantes
create policy "Usuários podem ver conversas das quais participam"
  on public.conversations for select
  using (
    exists (
      select 1 from public.conversation_participants
      where conversation_id = id and user_id = auth.uid()
    )
  );

create policy "Participantes são visíveis para membros da conversa"
  on public.conversation_participants for select
  using (
    exists (
      select 1 from public.conversation_participants
      where conversation_id = conversation_participants.conversation_id
      and user_id = auth.uid()
    )
  );

-- Permite criar conversas (o insert de participantes é feito separadamente)
create policy "Usuários autenticados podem criar conversas"
  on public.conversations for insert
  with check (auth.role() = 'authenticated');

create policy "Usuários podem adicionar participantes a conversas"
  on public.conversation_participants for insert
  with check (auth.role() = 'authenticated'); -- Poderia restringir mais se necessário

-- Tabela para mensagens
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  content text not null,
  type text not null default 'text' check (type in ('text', 'image', 'analysis', 'case_link')),
  read boolean default false not null,
  created_at timestamp with time zone default now() not null
);

-- Habilitar RLS
alter table public.messages enable row level security;

-- Políticas de acesso para mensagens
create policy "Usuários podem ver mensagens de conversas das quais participam"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversation_participants
      where conversation_id = messages.conversation_id
      and user_id = auth.uid()
    )
  );

create policy "Usuários podem enviar mensagens em conversas das quais participam"
  on public.messages for insert
  with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.conversation_participants
      where conversation_id = messages.conversation_id
      and user_id = auth.uid()
    )
  );

-- Triggers para atualizar contadores

-- Função para atualizar contador de curtidas
create or replace function update_post_likes_count()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update public.posts
    set likes_count = likes_count + 1
    where id = NEW.post_id;
  elsif (TG_OP = 'DELETE') then
    update public.posts
    set likes_count = likes_count - 1
    where id = OLD.post_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

-- Trigger para curtidas
create trigger post_likes_count_trigger
after insert or delete on public.post_likes
for each row execute procedure update_post_likes_count();

-- Função para atualizar contador de comentários
create or replace function update_post_comments_count()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update public.posts
    set comments_count = comments_count + 1
    where id = NEW.post_id;
  elsif (TG_OP = 'DELETE') then
    update public.posts
    set comments_count = comments_count - 1
    where id = OLD.post_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

-- Trigger para comentários
create trigger post_comments_count_trigger
after insert or delete on public.post_comments
for each row execute procedure update_post_comments_count();

-- Função para buscar conversa entre dois usuários
create or replace function get_conversation_between_users(user_id_1 uuid, user_id_2 uuid)
returns table (id uuid)
as $$
begin
  return query
  select c.id
  from conversations c
  join conversation_participants cp1 on c.id = cp1.conversation_id
  join conversation_participants cp2 on c.id = cp2.conversation_id
  where cp1.user_id = user_id_1 and cp2.user_id = user_id_2
  limit 1;
end;
$$ language plpgsql security definer;

-- Storage Buckets (Certifique-se de que existam e tenham as políticas corretas)
-- Bucket: dental_images (para imagens de análise)
-- Bucket: profiles-avatars (para fotos de perfil)
-- Bucket: case_files (NOVO - para arquivos/imagens de casos)

-- Exemplo de política para bucket 'case_files' (ajuste conforme necessário)
-- create policy "Usuários podem gerenciar arquivos em suas próprias pastas de caso"
--   on storage.objects for all
--   using (bucket_id = 'case_files' and auth.uid()::text = (storage.foldername(name))[1])
--   with check (bucket_id = 'case_files' and auth.uid()::text = (storage.foldername(name))[1]);


