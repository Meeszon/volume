-- Add per-activity session duration (minutes).
-- Used by climb activities; null for warmup / train (their duration is
-- implicit in the prescribed block).

alter table activities
  add column duration_minutes integer;
