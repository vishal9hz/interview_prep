create table if not exists prep_sets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  jd text not null,
  role text,
  experience text,
  salary text,
  domain text,
  language text default 'en-IN',
  parent_set_id uuid references prep_sets(id),
  attempt int default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  set_id uuid references prep_sets(id) on delete cascade,
  parent_question_id uuid references questions(id),
  position int not null,
  text text not null,
  type text,
  tip text,
  bookmarked boolean default false
);

create table if not exists answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references questions(id) on delete cascade unique,
  text text not null default '',
  mode text default 'typed',
  duration_secs int,
  words int,
  wpm int,
  fillers int,
  filler_list text,
  score int,
  content_score int,
  structure_score int,
  communication_score int,
  strengths jsonb,
  improvements jsonb,
  delivery text,
  model_answer text,
  updated_at timestamptz default now()
);

create index if not exists idx_prep_sets_created on prep_sets (created_at desc);
create index if not exists idx_questions_set on questions (set_id);
create index if not exists idx_questions_bookmarked on questions (bookmarked) where bookmarked = true;
