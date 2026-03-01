/*
  # Fix Function Search Path and Drop Unused Index

  ## Overview
  This migration addresses two security/performance issues:
  1. Drops the unused index on session_id column
  2. Fixes the mutable search_path in the get_session_id function

  ## Changes

  1. Index Changes
    - Drop unused index `idx_study_plans_session_id` on study_plans table

  2. Function Security Fix
    - Recreate `get_session_id` function with immutable search_path
    - Set search_path to empty string to prevent search_path injection attacks
*/

-- Drop unused index
DROP INDEX IF EXISTS public.idx_study_plans_session_id;

-- Recreate function with secure search_path
CREATE OR REPLACE FUNCTION public.get_session_id()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  headers_raw TEXT;
  headers_json JSONB;
BEGIN
  BEGIN
    headers_raw := current_setting('request.headers', true);
    IF headers_raw IS NULL OR headers_raw = '' THEN
      RETURN NULL;
    END IF;
    headers_json := headers_raw::jsonb;
    RETURN headers_json->>'x-session-id';
  EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
  END;
END;
$$;