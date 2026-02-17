-- Create storage buckets for athlete photos and documents
INSERT INTO storage.buckets (id, name, public) VALUES ('athlete-photos', 'athlete-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('athlete-docs', 'athlete-docs', true);

-- RLS: Anyone authenticated can upload to their org folder
CREATE POLICY "Authenticated users can upload athlete photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'athlete-photos');

CREATE POLICY "Authenticated users can update athlete photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'athlete-photos');

CREATE POLICY "Authenticated users can delete athlete photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'athlete-photos');

CREATE POLICY "Public read athlete photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'athlete-photos');

CREATE POLICY "Authenticated users can upload athlete docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'athlete-docs');

CREATE POLICY "Authenticated users can update athlete docs"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'athlete-docs');

CREATE POLICY "Authenticated users can delete athlete docs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'athlete-docs');

CREATE POLICY "Public read athlete docs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'athlete-docs');