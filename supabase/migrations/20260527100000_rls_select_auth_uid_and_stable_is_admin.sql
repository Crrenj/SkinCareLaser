-- Wrap auth.uid() in (SELECT auth.uid()) for all RLS policies to avoid
-- per-row re-evaluation. Also mark is_user_admin as STABLE.

-- ── is_user_admin → STABLE ──────────────────────────────────────────
ALTER FUNCTION is_user_admin(uuid) STABLE;

-- ── banners ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin manage banners" ON banners;
CREATE POLICY "Admin manage banners" ON banners
  FOR ALL USING (is_user_admin((SELECT auth.uid())));

DROP POLICY IF EXISTS "Public view active banners" ON banners;
CREATE POLICY "Public view active banners" ON banners
  FOR SELECT USING (is_active = true OR is_user_admin((SELECT auth.uid())));

-- ── brands ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin manage brands" ON brands;
CREATE POLICY "Admin manage brands" ON brands
  FOR ALL USING (is_user_admin((SELECT auth.uid())));

-- ── cart_items ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Manage own cart items" ON cart_items;
CREATE POLICY "Manage own cart items" ON cart_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
        AND (carts.user_id = (SELECT auth.uid())
             OR carts.anonymous_id::text = (auth.jwt() ->> 'anonymous_id'))
    )
  );

DROP POLICY IF EXISTS "View own cart items" ON cart_items;
CREATE POLICY "View own cart items" ON cart_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
        AND (carts.user_id = (SELECT auth.uid())
             OR carts.anonymous_id::text = (auth.jwt() ->> 'anonymous_id'))
    )
  );

-- ── carts ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Create own cart" ON carts;
CREATE POLICY "Create own cart" ON carts
  FOR INSERT WITH CHECK (
    (SELECT auth.uid()) = user_id
    OR anonymous_id::text = (auth.jwt() ->> 'anonymous_id')
  );

DROP POLICY IF EXISTS "Update own cart" ON carts;
CREATE POLICY "Update own cart" ON carts
  FOR UPDATE USING (
    (SELECT auth.uid()) = user_id
    OR anonymous_id::text = (auth.jwt() ->> 'anonymous_id')
  );

DROP POLICY IF EXISTS "View own cart" ON carts;
CREATE POLICY "View own cart" ON carts
  FOR SELECT USING (
    (SELECT auth.uid()) = user_id
    OR anonymous_id::text = (auth.jwt() ->> 'anonymous_id')
  );

-- ── contact_messages ────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin manage messages" ON contact_messages;
CREATE POLICY "Admin manage messages" ON contact_messages
  FOR ALL USING (is_user_admin((SELECT auth.uid())));

DROP POLICY IF EXISTS "Admin view messages" ON contact_messages;
CREATE POLICY "Admin view messages" ON contact_messages
  FOR SELECT USING (is_user_admin((SELECT auth.uid())));

DROP POLICY IF EXISTS "Users view own messages" ON contact_messages;
CREATE POLICY "Users view own messages" ON contact_messages
  FOR SELECT USING (
    user_email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))::text
  );

-- ── order_items ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Order items owner" ON order_items;
CREATE POLICY "Order items owner" ON order_items
  FOR ALL USING (
    order_id IN (
      SELECT id FROM orders WHERE user_id = (SELECT auth.uid())
    )
    OR is_user_admin((SELECT auth.uid()))
  );

-- ── orders ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Order owner" ON orders;
CREATE POLICY "Order owner" ON orders
  FOR ALL USING (
    user_id = (SELECT auth.uid())
    OR is_user_admin((SELECT auth.uid()))
  );

-- ── product_images ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin manage product_images" ON product_images;
CREATE POLICY "Admin manage product_images" ON product_images
  FOR ALL USING (is_user_admin((SELECT auth.uid())));

-- ── product_tags ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin manage product_tags" ON product_tags;
CREATE POLICY "Admin manage product_tags" ON product_tags
  FOR ALL USING (is_user_admin((SELECT auth.uid())));

-- ── products ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin manage products" ON products;
CREATE POLICY "Admin manage products" ON products
  FOR ALL USING (is_user_admin((SELECT auth.uid())));

DROP POLICY IF EXISTS "View active products" ON products;
CREATE POLICY "View active products" ON products
  FOR SELECT USING (is_active = true OR is_user_admin((SELECT auth.uid())));

-- ── profiles ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin manage all" ON profiles;
CREATE POLICY "Admin manage all" ON profiles
  FOR ALL USING (is_user_admin((SELECT auth.uid())));

DROP POLICY IF EXISTS "Admin view all" ON profiles;
CREATE POLICY "Admin view all" ON profiles
  FOR SELECT USING (is_user_admin((SELECT auth.uid())));

DROP POLICY IF EXISTS "Create own profile" ON profiles;
CREATE POLICY "Create own profile" ON profiles
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Update own profile" ON profiles;
CREATE POLICY "Update own profile" ON profiles
  FOR UPDATE
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "View own profile" ON profiles;
CREATE POLICY "View own profile" ON profiles
  FOR SELECT USING ((SELECT auth.uid()) = id);

-- ── ranges ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin manage ranges" ON ranges;
CREATE POLICY "Admin manage ranges" ON ranges
  FOR ALL USING (is_user_admin((SELECT auth.uid())));

-- ── reservation_items ───────────────────────────────────────────────
DROP POLICY IF EXISTS "Users read own reservation items" ON reservation_items;
CREATE POLICY "Users read own reservation items" ON reservation_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM reservations r
      WHERE r.id = reservation_items.reservation_id
        AND r.user_id = (SELECT auth.uid())
    )
  );

-- ── reservations ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users read own reservations" ON reservations;
CREATE POLICY "Users read own reservations" ON reservations
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- ── tag_types ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin manage tag_types" ON tag_types;
CREATE POLICY "Admin manage tag_types" ON tag_types
  FOR ALL USING (is_user_admin((SELECT auth.uid())));

-- ── tags ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin manage tags" ON tags;
CREATE POLICY "Admin manage tags" ON tags
  FOR ALL USING (is_user_admin((SELECT auth.uid())));

-- ── wishlists ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users manage own wishlists" ON wishlists;
CREATE POLICY "Users manage own wishlists" ON wishlists
  FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
