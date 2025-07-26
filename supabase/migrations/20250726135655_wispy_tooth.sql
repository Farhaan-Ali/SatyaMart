@@ .. @@
 -- Create RLS policies for supplier_profiles
 create policy "Users can view their own supplier profile" on supplier_profiles
-  for select using (auth.uid() = user_id);
+  for select using (auth.uid() = user_id OR exists (
+    select 1 from user_roles ur 
+    where ur.user_id = auth.uid() and ur.role = 'superadmin'
+  ));
 
 create policy "Users can insert their own supplier profile" on supplier_profiles
   for insert with check (auth.uid() = user_id);
@@ .. @@
 -- Create RLS policies for vendor_profiles
 create policy "Users can view their own vendor profile" on vendor_profiles
-  for select using (auth.uid() = user_id);
+  for select using (auth.uid() = user_id OR exists (
+    select 1 from user_roles ur 
+    where ur.user_id = auth.uid() and ur.role = 'superadmin'
+  ));
 
 create policy "Users can insert their own vendor profile" on vendor_profiles
   for insert with check (auth.uid() = user_id);