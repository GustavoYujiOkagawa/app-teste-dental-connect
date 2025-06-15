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
  midline_analysis text, -- NOVO: Análise da linha média
  tooth_shape text, -- NOVO: Formato do dente
  tooth_size_estimate text, -- NOVO: Estimativa do tamanho do dente
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
      select 1 from public.conversation_participants cp
      where cp.conversation_id = conversations.id and cp.user_id = auth.uid()
    )
  );

create policy "Participantes são visíveis para membros da conversa"
  on public.conversation_participants for select
  using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = conversation_participants.conversation_id
      and cp.user_id = auth.uid()
    )
  );

-- Permite criar conversas (o insert de participantes é feito separadamente via RPC)
create policy "Usuários autenticados podem criar conversas (via RPC)"
  on public.conversations for insert
  with check (false); -- Bloqueia insert direto, força uso de RPC

-- Permite adicionar participantes (o insert de participantes é feito separadamente via RPC)
create policy "Usuários podem adicionar participantes a conversas (via RPC)"
  on public.conversation_participants for insert
   with check (false); -- Bloqueia insert direto, força uso de RPC

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
      select 1 from public.conversation_participants cp
      where cp.conversation_id = messages.conversation_id
      and cp.user_id = auth.uid()
    )
  );

create policy "Usuários podem enviar mensagens em conversas das quais participam"
  on public.messages for insert
  with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = messages.conversation_id
      and cp.user_id = auth.uid()
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
returns table (conversation_id uuid)
as $$
declare
  conv_id uuid;
begin
  select c.id into conv_id
  from conversations c
  join conversation_participants cp1 on c.id = cp1.conversation_id
  join conversation_participants cp2 on c.id = cp2.conversation_id
  where cp1.user_id = user_id_1 and cp2.user_id = user_id_2
  -- Check if it's a 1-on-1 chat (only 2 participants)
  and not exists (
      select 1
      from conversation_participants cp3
      where cp3.conversation_id = c.id
      and cp3.user_id not in (user_id_1, user_id_2)
  )
  limit 1;

  if conv_id is not null then
    return query select conv_id;
  end if;
end;
$$ language plpgsql security definer;

-- Função RPC para criar conversa e adicionar participantes (tratamento atômico)
create or replace function create_conversation_with_participants(recipient_id uuid)
returns uuid
as $$
declare
  new_conversation_id uuid;
  current_user_id uuid := auth.uid();
begin
  -- Insere a nova conversa
  insert into public.conversations (id) values (uuid_generate_v4()) returning id into new_conversation_id;

  -- Insere os participantes (usuário atual e destinatário)
  insert into public.conversation_participants (conversation_id, user_id)
  values (new_conversation_id, current_user_id), (new_conversation_id, recipient_id);

  return new_conversation_id;
exception
  when unique_violation then
    -- Se a conversa já existir (violando unique constraint em participants), retorna null ou a existente?
    -- Por segurança/simplicidade, vamos apenas retornar null e deixar o client lidar com isso.
    -- Ou podemos tentar buscar a existente aqui, mas get_conversation_between_users pode ser chamada antes.
    return null;
  when others then
    -- Log error maybe?
    raise exception 'Erro ao criar conversa e adicionar participantes: %', sqlerrm;
end;
$$ language plpgsql security definer;

-- Grant execute permission on the function to authenticated users
grant execute on function public.create_conversation_with_participants(uuid) to authenticated;


-- Storage Buckets (Certifique-se de que existam e tenham as políticas corretas)
-- Bucket: dental_images (para imagens de análise)
-- Bucket: profiles-avatars (para fotos de perfil)
-- Bucket: case_files (NOVO - para arquivos/imagens de casos)

-- Exemplo de política para bucket 'case_files' (ajuste conforme necessário)
-- create policy "Usuários podem gerenciar arquivos em suas próprias pastas de caso"
--   on storage.objects for all
--   using (bucket_id = 'case_files' and auth.uid()::text = (storage.foldername(name))[1])
--   with check (bucket_id = 'case_files' and auth.uid()::text = (storage.foldername(name))[1]);


-- Tabela para Notificações
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null, -- Usuário que recebe a notificação
  type text not null check (type in ('new_post', 'new_message', 'post_like', 'post_comment')), -- Tipo de notificação
  content text not null, -- Descrição breve (ex: "Fulano curtiu seu post")
  related_entity_id uuid, -- ID da entidade relacionada (post, conversa, etc.)
  related_entity_type text, -- Tipo da entidade ('post', 'conversation', 'user')
  sender_id uuid references auth.users on delete set null, -- Quem originou a ação (opcional, pode ser nulo para posts gerais)
  is_read boolean default false not null,
  created_at timestamp with time zone default now() not null
);

-- Habilitar RLS
alter table public.notifications enable row level security;

-- Políticas de acesso para notificações
create policy "Usuários podem ver suas próprias notificações"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Usuários podem marcar suas notificações como lidas"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id); -- Permite apenas atualizar is_read

create policy "Usuários podem deletar suas próprias notificações"
  on public.notifications for delete
  using (auth.uid() = user_id);

-- Permitir que triggers/funções (security definer) insiram notificações
-- Não é estritamente necessário se as funções/triggers forem security definer,
-- mas adiciona clareza ou permite triggers/funções security invoker se necessário.
create policy "Permitir inserção interna de notificações (Triggers/RPC)"
  on public.notifications for insert
  with check (true); -- Ou restrinja mais se souber a origem

-- Índices para otimizar queries
create index idx_notifications_user_id_created_at on public.notifications(user_id, created_at desc);
create index idx_notifications_user_id_is_read on public.notifications(user_id, is_read);

-- Função para marcar todas as notificações como lidas
create or replace function mark_all_notifications_as_read()
returns void as $$
begin
  update public.notifications
  set is_read = true
  where user_id = auth.uid() and is_read = false;
end;
$$ language plpgsql security definer;

-- Função para limpar (deletar) todas as notificações lidas
create or replace function clear_read_notifications()
returns void as $$
begin
  delete from public.notifications
  where user_id = auth.uid() and is_read = true;
end;
$$ language plpgsql security definer;

-- Função para limpar (deletar) TODAS as notificações
create or replace function clear_all_notifications()
returns void as $$
begin
  delete from public.notifications
  where user_id = auth.uid();
end;
$$ language plpgsql security definer;

-- Grant execute permission on functions to authenticated users
grant execute on function public.mark_all_notifications_as_read() to authenticated;
grant execute on function public.clear_read_notifications() to authenticated;
grant execute on function public.clear_all_notifications() to authenticated;


-- Trigger para criar notificação de novo post (exemplo simples, notifica o próprio poster)
-- Idealmente, notificaria seguidores ou outros usuários relevantes.
-- create or replace function notify_new_post()
-- returns trigger as $$
-- begin
--   insert into public.notifications (user_id, type, content, related_entity_id, related_entity_type, sender_id)
--   values (NEW.user_id, 'new_post', 'Você criou um novo post.', NEW.id, 'post', NEW.user_id);
--   return null;
-- end;
-- $$ language plpgsql security definer;
--
-- create trigger new_post_notification_trigger
-- after insert on public.posts
-- for each row execute procedure notify_new_post();

-- Trigger para criar notificação de nova mensagem (notifica os outros participantes da conversa)
create or replace function notify_new_message()
returns trigger as $$
declare
  participant_record record;
begin
  for participant_record in
    select user_id from public.conversation_participants cp
    where cp.conversation_id = NEW.conversation_id and cp.user_id != NEW.user_id
  loop
    -- Insere a notificação para o outro participante
    insert into public.notifications (user_id, type, content, related_entity_id, related_entity_type, sender_id)
    values (participant_record.user_id, 'new_message', 'Você recebeu uma nova mensagem.', NEW.conversation_id, 'conversation', NEW.user_id);
  end loop;
  return null;
end;
$$ language plpgsql security definer;

-- Certifique-se que o trigger existe e está correto
drop trigger if exists new_message_notification_trigger on public.messages;
create trigger new_message_notification_trigger
after insert on public.messages
for each row execute procedure notify_new_message();

