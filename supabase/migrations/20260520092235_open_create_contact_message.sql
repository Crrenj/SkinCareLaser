-- Open create_contact_message to any email (anonymous + non-registered users)
-- and add SET search_path for security (was flagged in audit, RPC is SECURITY DEFINER).
--
-- Before: RPC checked auth.users by email and refused to insert if no account → enabled
--         account enumeration (response differed for known vs unknown emails) and blocked
--         pre-purchase leads from people who never signed up.
-- After:  RPC accepts any valid email; if it matches a registered account we still link
--         user_id (nullable column), otherwise user_id stays NULL. Always returns success.

CREATE OR REPLACE FUNCTION public.create_contact_message(
  p_email   text,
  p_subject text,
  p_message text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id    UUID;
  v_message_id UUID;
BEGIN
  -- Link to an existing account when the email matches, but never block submission.
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;

  INSERT INTO public.contact_messages (user_email, user_id, subject, message)
  VALUES (p_email, v_user_id, p_subject, p_message)
  RETURNING id INTO v_message_id;

  RETURN json_build_object(
    'success', true,
    'message_id', v_message_id,
    'message', 'Message envoyé avec succès!'
  );
END;
$$;
