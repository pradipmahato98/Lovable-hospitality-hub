-- Allow staff with inventory management permissions to update inventory UI settings
CREATE POLICY "Allow inventory managers to update inventory settings"
ON public.settings
FOR UPDATE
TO authenticated
USING (
  (key = 'inventory_ui_settings')
  AND
  (public.has_permission(auth.uid(), 'inventory:manage'))
)
WITH CHECK (
  (key = 'inventory_ui_settings')
  AND
  (public.has_permission(auth.uid(), 'inventory:manage'))
);

-- Also allow them to insert if it doesn't exist
CREATE POLICY "Allow inventory managers to insert inventory settings"
ON public.settings
FOR INSERT
TO authenticated
WITH CHECK (
  (key = 'inventory_ui_settings')
  AND
  (public.has_permission(auth.uid(), 'inventory:manage'))
);
