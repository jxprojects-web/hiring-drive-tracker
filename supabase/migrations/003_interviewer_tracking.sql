-- database: purely additive, no data loss, no existing rows affected.
--
-- HOW TO RUN: Supabase Dashboard → SQL Editor → paste this file → Run.
-- ----------------------------------------------------------------------------

alter table candidates
add column if not exists hr_interviewer text,
add column if not exists cabin_interviewer text,
add column if not exists loi_officer text,
add column if not exists comments_history text;

update candidates
set comments_history = ''
where comments_history is null;