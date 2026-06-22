"""
Single shared Supabase client, built with the SERVICE ROLE key.

The service role key bypasses Row Level Security, so this module — and
everything that imports it — must only ever run on the server. Never send
this key to the React app.
"""

import os
from supabase import create_client, Client

_url = os.environ.get("SUPABASE_URL")
_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not _url or not _key:
    raise RuntimeError(
        "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set. "
        "Copy server/.env.example to server/.env and fill them in."
    )

supabase: Client = create_client(_url, _key)
