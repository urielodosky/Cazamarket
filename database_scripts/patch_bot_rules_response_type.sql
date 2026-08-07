-- Add 'file_options' to the check constraint for bot_rules response_type
ALTER TABLE public.bot_rules DROP CONSTRAINT IF EXISTS bot_rules_response_type_check;
ALTER TABLE public.bot_rules ADD CONSTRAINT bot_rules_response_type_check CHECK (response_type IN ('text', 'options', 'file', 'whatsapp', 'goto', 'file_options'));
