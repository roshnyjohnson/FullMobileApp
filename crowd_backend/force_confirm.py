from crowd_backend.supabase_config import supabase

for u in supabase.auth.admin.list_users():
    if not getattr(u, 'email_confirmed_at', None):
        try:
            supabase.auth.admin.update_user_by_id(u.id, {'email_confirm': True})
            print(f'Confirmed: {u.email}')
        except Exception as e:
            print(f'Failed {u.email}: {e}')
