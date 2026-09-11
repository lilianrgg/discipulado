from supabase import create_client, Client
from app.core.config import settings

def get_supabase_client() -> Client:
    """Returns a standard Supabase client with anon key for user-scoped operations."""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)

def get_supabase_admin_client() -> Client:
    """Returns an administrative Supabase client using service role key (bypasses RLS)."""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
