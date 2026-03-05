from crowd_backend.supabase_config import supabase

res = supabase.auth.admin.list_users()
print('ALL USERS:')
for u in res:
    confirmed = bool(getattr(u, "email_confirmed_at", None))
    print(f"Email: {u.email} | Confirmed: {confirmed} | ID: {u.id}")
