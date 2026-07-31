-- 016_learning_paths.sql

CREATE TABLE IF NOT EXISTS learning_subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE learning_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own learning_subjects" 
    ON learning_subjects FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own learning_subjects" 
    ON learning_subjects FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning_subjects" 
    ON learning_subjects FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own learning_subjects" 
    ON learning_subjects FOR DELETE 
    USING (auth.uid() = user_id);


CREATE TABLE IF NOT EXISTS learning_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID NOT NULL REFERENCES learning_subjects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content_material TEXT,
    content_video_link TEXT,
    content_image_url TEXT,
    is_completed BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE learning_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own learning_modules" 
    ON learning_modules FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own learning_modules" 
    ON learning_modules FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning_modules" 
    ON learning_modules FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own learning_modules" 
    ON learning_modules FOR DELETE 
    USING (auth.uid() = user_id);
