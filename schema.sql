-- Create profiles table
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  full_name text,
  fragments_used integer default 0 not null,
  fragments_used_reset_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table profiles enable row level security;

-- Create profiles policies
create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update their own profile." on profiles
  for update using (auth.uid() = id);

-- Create chats table
create table chats (
  id uuid default gen_random_uuid() primary key not null,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  is_archived boolean default false not null,
  last_message text,
  model text,
  template text
);

-- Enable RLS on chats
alter table chats enable row level security;

-- Create chats policies
create policy "Users can view their own chats." on chats
  for select using (auth.uid() = user_id);

create policy "Users can insert their own chats." on chats
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own chats." on chats
  for update using (auth.uid() = user_id);

create policy "Users can delete their own chats." on chats
  for delete using (auth.uid() = user_id);

-- Create messages table
create table messages (
  id uuid default gen_random_uuid() primary key not null,
  chat_id uuid references chats on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  tokens_used integer
);

-- Enable RLS on messages
alter table messages enable row level security;

-- Create messages policies
create policy "Users can view messages from their chats." on messages
  for select using (
    exists (
      select 1 from chats
      where chats.id = messages.chat_id
      and chats.user_id = auth.uid()
    )
  );

create policy "Users can insert messages to their chats." on messages
  for insert with check (
    exists (
      select 1 from chats
      where chats.id = messages.chat_id
      and chats.user_id = auth.uid()
    )
  );

create policy "Users can update messages in their chats." on messages
  for update using (
    exists (
      select 1 from chats
      where chats.id = messages.chat_id
      and chats.user_id = auth.uid()
    )
  );

create policy "Users can delete messages from their chats." on messages
  for delete using (
    exists (
      select 1 from chats
      where chats.id = messages.chat_id
      and chats.user_id = auth.uid()
    )
  );

-- Create function to handle user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user(); 