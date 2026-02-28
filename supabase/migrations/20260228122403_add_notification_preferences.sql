/*
  # Add Notification Preferences to Study Plans

  1. Changes to study_plans table
    - Add `notification_sound_enabled` column (boolean) - Whether to play sound with notification
    - Add `notification_title` column (text) - Custom notification title
    - Add `notification_message` column (text) - Custom notification message
    - Add default values for new columns
    
  2. Notes
    - Existing `reminder_time` and `reminder_enabled` columns will continue to work
    - New columns allow users to customize their notification experience
    - All columns have sensible defaults for existing records
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'study_plans' AND column_name = 'notification_sound_enabled'
  ) THEN
    ALTER TABLE study_plans ADD COLUMN notification_sound_enabled boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'study_plans' AND column_name = 'notification_title'
  ) THEN
    ALTER TABLE study_plans ADD COLUMN notification_title text DEFAULT 'Time to Study!';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'study_plans' AND column_name = 'notification_message'
  ) THEN
    ALTER TABLE study_plans ADD COLUMN notification_message text DEFAULT 'Open your study plan and get started with today''s tasks!';
  END IF;
END $$;
