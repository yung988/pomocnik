-- Create chats table
create table if not exists public.chats (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    title text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    is_archived boolean default false not null,
    messages jsonb default '[]'::jsonb not null,
    model text,
    template text
);

-- Create indexes
create index chats_user_id_idx on public.chats(user_id);
create index chats_created_at_idx on public.chats(created_at);
create index chats_is_archived_idx on public.chats(is_archived);

-- Enable RLS
alter table public.chats enable row level security;

-- Create RLS policies
create policy "Users can view their own chats"
    on public.chats for select
    using (auth.uid() = user_id);

create policy "Users can insert their own chats"
    on public.chats for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own chats"
    on public.chats for update
    using (auth.uid() = user_id);

create policy "Users can delete their own chats"
    on public.chats for delete
    using (auth.uid() = user_id);

-- Create updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

create trigger handle_updated_at
    before update on public.chats
    for each row
    execute function public.handle_updated_at(); 