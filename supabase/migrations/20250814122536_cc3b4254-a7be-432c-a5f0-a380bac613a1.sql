
-- Create wishlist table
CREATE TABLE public.wishlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('course', 'event')),
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_id, item_type)
);

-- Enable RLS
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own wishlist items" 
  ON public.wishlists 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add items to their own wishlist" 
  ON public.wishlists 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove items from their own wishlist" 
  ON public.wishlists 
  FOR DELETE 
  USING (auth.uid() = user_id);
