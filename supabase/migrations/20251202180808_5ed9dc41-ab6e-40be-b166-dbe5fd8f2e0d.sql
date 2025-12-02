-- Enable RLS on document_embeddings table
ALTER TABLE public.document_embeddings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read document embeddings (for AI search functionality)
CREATE POLICY "Authenticated users can read document embeddings"
ON public.document_embeddings
FOR SELECT
TO authenticated
USING (true);

-- Allow service role full access for AI embedding generation
CREATE POLICY "Service role has full access to document embeddings"
ON public.document_embeddings
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');