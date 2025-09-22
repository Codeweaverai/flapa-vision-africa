-- Create community_post_images table for storing image metadata
CREATE TABLE public.community_post_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_path TEXT NOT NULL,
  alt_text TEXT,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  upload_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create community_followers table for user follow relationships
CREATE TABLE public.community_followers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Create indexes for performance
CREATE INDEX idx_community_post_images_post_id ON public.community_post_images(post_id);
CREATE INDEX idx_community_post_images_upload_order ON public.community_post_images(post_id, upload_order);
CREATE INDEX idx_community_followers_follower_id ON public.community_followers(follower_id);
CREATE INDEX idx_community_followers_following_id ON public.community_followers(following_id);

-- Enable Row Level Security
ALTER TABLE public.community_post_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_followers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_post_images
CREATE POLICY "Users can view all post images" 
ON public.community_post_images 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create images for their own posts" 
ON public.community_post_images 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.community_posts 
    WHERE id = post_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update images for their own posts" 
ON public.community_post_images 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.community_posts 
    WHERE id = post_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete images for their own posts" 
ON public.community_post_images 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.community_posts 
    WHERE id = post_id AND user_id = auth.uid()
  )
);

-- RLS Policies for community_followers
CREATE POLICY "Users can view all follow relationships" 
ON public.community_followers 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own follow relationships" 
ON public.community_followers 
FOR INSERT 
WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Users can delete their own follow relationships" 
ON public.community_followers 
FOR DELETE 
USING (follower_id = auth.uid());

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_community_post_images_updated_at
BEFORE UPDATE ON public.community_post_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_community_followers_updated_at
BEFORE UPDATE ON public.community_followers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();