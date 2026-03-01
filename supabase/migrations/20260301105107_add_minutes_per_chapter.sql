/*
  # Add minutes_per_chapter column to study_plans

  1. Changes
    - Add `minutes_per_chapter` column to `study_plans` table
    - Default value of 60 minutes for existing plans

  2. Purpose
    - Stores user's estimated time to complete one chapter
    - Used to calculate chapters per day based on available study time
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'study_plans' AND column_name = 'minutes_per_chapter'
  ) THEN
    ALTER TABLE study_plans ADD COLUMN minutes_per_chapter integer DEFAULT 60;
  END IF;
END $$;