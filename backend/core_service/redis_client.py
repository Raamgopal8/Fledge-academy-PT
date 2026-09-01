import os
import json
import time
import asyncio
from typing import Any, Optional, Dict
from datetime import datetime

# Try importing redis
try:
    import redis.asyncio as aioredis
except ImportError:
    aioredis = None

REDIS_URL = os.environ.get("REDIS_URL") or os.environ.get("REDISCLOUD_URL")

# Fallback In-Memory Cache with TTL
_in_memory_cache: Dict[str, Dict[str, Any]] = {}
_redis_client = None
_redis_connected = False

async def get_redis_client():
    global _redis_client, _redis_connected
    if _redis_client is not None and _redis_connected:
        return _redis_client

    if not REDIS_URL or not aioredis:
        return None

    try:
        _redis_client = aioredis.from_url(
            REDIS_URL,
            decode_responses=True,
            socket_timeout=3.0,
            socket_connect_timeout=3.0
        )
        # Test connection
        await _redis_client.ping()
        _redis_connected = True
        print("Connected to Redis successfully.")
        return _redis_client
    except Exception as e:
        print(f"Redis connection notice: {e}. Utilizing fast in-memory caching fallback.")
        _redis_connected = False
        return None

async def get_cache(key: str) -> Optional[Any]:
    """Retrieve cached data from Redis or in-memory fallback"""
    client = await get_redis_client()
    if client and _redis_connected:
        try:
            val = await client.get(key)
            if val is not None:
                return json.loads(val)
        except Exception as e:
            pass

    # Fallback in-memory check
    entry = _in_memory_cache.get(key)
    if entry:
        if entry["expires_at"] is None or entry["expires_at"] > time.time():
            return entry["data"]
        else:
            del _in_memory_cache[key]
    return None

async def set_cache(key: str, data: Any, ttl: int = 60):
    """Store data in Redis or in-memory fallback with TTL (seconds)"""
    client = await get_redis_client()
    serialized = json.dumps(data, default=str)
    
    if client and _redis_connected:
        try:
            if ttl > 0:
                await client.setex(key, ttl, serialized)
            else:
                await client.set(key, serialized)
            return
        except Exception as e:
            pass

    # In-memory storage fallback
    _in_memory_cache[key] = {
        "data": data,
        "expires_at": time.time() + ttl if ttl > 0 else None
    }

async def delete_cache(key: str):
    """Delete a specific cache key"""
    client = await get_redis_client()
    if client and _redis_connected:
        try:
            await client.delete(key)
        except Exception:
            pass

    if key in _in_memory_cache:
        del _in_memory_cache[key]

async def delete_pattern(pattern: str):
    """Delete all keys matching a prefix or wildcard pattern (e.g. 'dashboard:*')"""
    client = await get_redis_client()
    if client and _redis_connected:
        try:
            keys = await client.keys(pattern)
            if keys:
                await client.delete(*keys)
        except Exception:
            pass

    # Clean in-memory
    clean_prefix = pattern.replace("*", "")
    to_del = [k for k in _in_memory_cache.keys() if k.startswith(clean_prefix)]
    for k in to_del:
        del _in_memory_cache[k]

# ==========================================
# User Session & Account Data Helpers
# ==========================================

async def get_user_session(user_identifier: str) -> Optional[dict]:
    """Fetch user active session data"""
    key = f"user:session:{user_identifier.lower()}"
    return await get_cache(key)

async def set_user_session(user_identifier: str, session_data: dict, ttl: int = 86400):
    """Cache user session (default 24 hours)"""
    key = f"user:session:{user_identifier.lower()}"
    await set_cache(key, session_data, ttl=ttl)

async def invalidate_user_session(user_identifier: str):
    """Invalidate session upon logout or revocation"""
    key = f"user:session:{user_identifier.lower()}"
    await delete_cache(key)

async def get_user_account(user_identifier: str) -> Optional[dict]:
    """Fetch cached user account & profile data"""
    key = f"user:account:{user_identifier.lower()}"
    return await get_cache(key)

async def set_user_account(user_identifier: str, account_data: dict, ttl: int = 3600):
    """Cache user account & profile info (default 1 hour)"""
    key = f"user:account:{user_identifier.lower()}"
    await set_cache(key, account_data, ttl=ttl)

async def invalidate_user_account(user_identifier: str):
    """Invalidate user account cache upon profile / permissions change"""
    key = f"user:account:{user_identifier.lower()}"
    await delete_cache(key)
