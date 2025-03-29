-- Add character information fields to bots table
ALTER TABLE bots
ADD COLUMN background_story TEXT,
ADD COLUMN bot_character_description TEXT;

-- Add comment explaining the purpose of these fields
COMMENT ON COLUMN bots.background_story IS 'Detailed backstory for the trading bot character';
COMMENT ON COLUMN bots.bot_character_description IS 'Brief description of the bot''s character traits and trading style';
