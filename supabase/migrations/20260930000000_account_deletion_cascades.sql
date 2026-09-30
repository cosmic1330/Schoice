-- Allow Auth account deletion to remove all user-owned application rows.
-- Run this migration before deploying the delete-account Edge Function.

alter table if exists public.fundamental_condition
  drop constraint if exists fundamental_condition_user_id_fkey,
  add constraint fundamental_condition_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

alter table if exists public.watch_stock
  drop constraint if exists watch_stock_user_id_fkey,
  add constraint watch_stock_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

alter table if exists public.user_prompts
  drop constraint if exists user_prompts_user_id_fkey,
  add constraint user_prompts_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

alter table if exists public.profiles
  drop constraint if exists profiles_user_id_fkey,
  add constraint profiles_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;
