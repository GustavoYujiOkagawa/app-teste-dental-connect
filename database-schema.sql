-- Estrutura do banco de dados Supabase para DentalConnect
-- Inclui tabelas para autenticação, análises dentais, análises de mordida, posts e chat

-- Tabela de perfis de usuário (extensão da tabela auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  user_id uuid references auth.users on delete cascade not null,
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
  bite_analysis_id uuid,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Habilitar RLS
alter table public.dental_analyses enable row level security;

-- Políticas de acesso para análises dentais
create policy "Análises dentais são visíveis para todos os usuários autenticados"
  on public.dental_analyses for select
  using (auth.role() = 'authenticated');

create policy "Usuários podem inserir suas próprias análises dentais"
  on public.dental_analyses for insert
  with check (auth.uid() = user_id);

create policy "Usuários podem atualizar suas próprias análises dentais"
  on public.dental_analyses for update
  using (auth.uid() = user_id);

-- Tabela para análises de mordida
create table public.bite_analyses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  image_url text not null,
  midline_angle numeric not null,
  midline_confidence numeric not null,
  face_shape text not null,
  face_shape_confidence numeric not null,
  central_incisors_width numeric not null,
  lateral_incisors_width numeric not null,
  canines_width numeric not null,
  proportions_confidence numeric not null,
  recommendations jsonb,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Habilitar RLS
alter table public.bite_analyses enable row level security;

-- Políticas de acesso para análises de mordida
create policy "Análises de mordida são visíveis para todos os usuários autenticados"
  on public.bite_analyses for select
  using (auth.role() = 'authenticated');

create policy "Usuários podem inserir suas próprias análises de mordida"
  on public.bite_analyses for insert
  with check (auth.uid() = user_id);

create policy "Usuários podem atualizar suas próprias análises de mordida"
  on public.bite_analyses for update
  using (auth.uid() = user_id);

-- Adicionar referência na tabela de análises dentais
alter table public.dental_analyses 
  add constraint dental_analyses_bite_analysis_id_fkey 
  foreign key (bite_analysis_id) 
  references public.bite_analyses (id) 
  on delete set null;

-- Tabela para posts no feed
create table public.posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  dental_analysis_id uuid references public.dental_analyses on delete set null,
  bite_analysis_id uuid references public.bite_analyses on delete set null,
  image_url text not null,
  description text not null,
  likes_count integer default 0 not null,
  comments_count integer default 0 not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
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
  title text not null,
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

create policy "Usuários podem adicionar-se como participantes"
  on public.conversation_participants for insert
  with check (auth.uid() = user_id);

-- Tabela para mensagens
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  content text not null,
  type text not null check (type in ('text', 'image', 'analysis')),
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
