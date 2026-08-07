-- ----------------------------------------------------------------------------
-- 002_add_interview_comments.sql
--
-- Adds a free-text "detailed feedback" field for Cabin interviewers, separate
-- from the existing 1-5 interview_rating. Safe to run on an already-deployed
-- database: purely additive, no data loss, no existing rows affected.
--
-- HOW TO RUN: Supabase Dashboard → SQL Editor → paste this file → Run.
-- ----------------------------------------------------------------------------

alter table public.candidates
  add column if not exists interview_comments text;

comment on column public.candidates.interview_comments is
  'Detailed written feedback from the Cabin interviewer, in addition to the 1-5 rating.';
