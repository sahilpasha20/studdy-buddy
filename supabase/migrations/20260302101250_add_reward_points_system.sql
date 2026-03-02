/*
  # Add Reward Points System
  
  1. New Columns on study_plans
    - `total_points` (integer) - Accumulated points for completing chapters
    - `chapters_completed_today` (integer) - Track daily progress
    - `last_reward_date` (date) - Track when last reward was given
  
  2. Purpose
    - Track student progress with a points system
    - Reward students for completing 2-3 chapters per day
    - Encourage breaks after milestones
*/

ALTER TABLE study_plans
ADD COLUMN IF NOT EXISTS total_points integer DEFAULT 0;

ALTER TABLE study_plans
ADD COLUMN IF NOT EXISTS chapters_completed_today integer DEFAULT 0;

ALTER TABLE study_plans
ADD COLUMN IF NOT EXISTS last_activity_date date DEFAULT CURRENT_DATE;
