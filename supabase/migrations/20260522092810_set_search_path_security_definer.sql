-- Fixes Supabase advisor warning: function_search_path_mutable
-- https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable
--
-- Sets `SET search_path = public, pg_temp` on the 9 functions in the public
-- schema that lacked the configuration. Covers both SECURITY DEFINER and
-- SECURITY INVOKER functions (the advisor flags both — without a frozen
-- search_path an attacker who can write to an earlier schema could shadow
-- objects referenced by these functions).
--
-- Already-fixed (kept for reference, no-op here): check_rate_limit,
-- create_contact_message, create_reservation, expire_stale_reservations,
-- handle_new_user.

ALTER FUNCTION public.add_to_cart(uuid, uuid, integer, uuid)  SET search_path = public, pg_temp;
ALTER FUNCTION public.cleanup_banner_positions()              SET search_path = public, pg_temp;
ALTER FUNCTION public.get_messages_stats()                    SET search_path = public, pg_temp;
ALTER FUNCTION public.get_or_create_cart(uuid, uuid)          SET search_path = public, pg_temp;
ALTER FUNCTION public.is_user_admin(uuid)                     SET search_path = public, pg_temp;
ALTER FUNCTION public.mark_message_as_read(uuid)              SET search_path = public, pg_temp;
ALTER FUNCTION public.remove_from_cart(uuid, uuid)            SET search_path = public, pg_temp;
ALTER FUNCTION public.reorder_banners(uuid, integer, integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.update_updated_at_column()              SET search_path = public, pg_temp;
