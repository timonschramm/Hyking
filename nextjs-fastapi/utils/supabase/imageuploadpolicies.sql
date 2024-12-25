CREATE POLICY "Allow authenticated uploads of profile images"
ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'images' AND
  auth.role() = 'authenticated' AND
  owner_id = (select auth.uid()::text)  -- Cast auth.uid() to text
);

CREATE POLICY "Allow authenticated updates to own profile images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'images' AND
  owner_id = (select auth.uid()::text)  -- Cast auth.uid() to text
);

CREATE POLICY "Allow authenticated deletes of own profile images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'images' AND
  owner_id = (select auth.uid()::text)  -- Cast auth.uid() to text
);