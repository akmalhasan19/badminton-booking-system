CREATE TABLE match_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  court_name TEXT NOT NULL,
  match_date TIMESTAMPTZ NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('RANKED', 'CASUAL', 'DRILLING')),
  level_requirement TEXT NOT NULL CHECK (level_requirement IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PRO')),
  game_format TEXT NOT NULL CHECK (game_format IN ('SINGLE', 'DOUBLE', 'MIXED')),
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'PLAYING', 'COMPLETED', 'CANCELLED')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE room_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES match_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  team_side TEXT CHECK (team_side IN ('A', 'B')),
  court_slot TEXT CHECK (court_slot IN ('A_FRONT', 'A_BACK', 'B_FRONT', 'B_BACK')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE room_participants
ADD CONSTRAINT unique_slot_per_room UNIQUE (room_id, court_slot);

ALTER TABLE match_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can see match rooms" 
ON match_rooms FOR SELECT 
USING (true);

CREATE POLICY "Host can insert match rooms" 
ON match_rooms FOR INSERT 
WITH CHECK (auth.uid() = host_user_id);

CREATE POLICY "Host can update their match rooms" 
ON match_rooms FOR UPDATE 
USING (auth.uid() = host_user_id);

CREATE POLICY "Everyone can see room participants" 
ON room_participants FOR SELECT 
USING (true);

CREATE POLICY "Users can join rooms" 
ON room_participants FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms or Host can kick" 
ON room_participants FOR DELETE 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM match_rooms 
    WHERE id = room_participants.room_id AND host_user_id = auth.uid()
  )
);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_match_rooms_updated_at
    BEFORE UPDATE ON match_rooms
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_room_participants_updated_at
    BEFORE UPDATE ON room_participants
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();