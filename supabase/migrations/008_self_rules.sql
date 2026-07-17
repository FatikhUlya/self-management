-- 008_self_rules.sql

CREATE TABLE self_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rule_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE self_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own self_rules" 
    ON self_rules FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own self_rules" 
    ON self_rules FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own self_rules" 
    ON self_rules FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own self_rules" 
    ON self_rules FOR DELETE 
    USING (auth.uid() = user_id);
