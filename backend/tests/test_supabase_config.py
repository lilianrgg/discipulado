from app.core.config import settings
from app.core.supabase import get_supabase_client, get_supabase_admin_client

def test_supabase_config_defaults():
    assert settings.PROJECT_NAME == "Discipulado API"
    assert settings.SUPABASE_URL is not None
    assert settings.SUPABASE_ANON_KEY is not None

def test_supabase_client_initialization():
    client = get_supabase_client()
    assert client is not None
    admin_client = get_supabase_admin_client()
    assert admin_client is not None
