// Activity Logger Utility for Students, Staff, and CEO

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Log a user action to the backend database
 * @param {string} action - Human-readable description (e.g. "Viewed Materials for Level 5")
 * @param {string} activityType - Type (e.g. "page_view", "test_submit", "material_view", "video_watch", "class_schedule")
 * @param {object} details - Optional payload/metadata
 */
export async function logActivity(action, activityType = 'page_view', details = {}) {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        await fetch(`${API_BASE}/api/activity/log`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                action,
                activity_type: activityType,
                details
            }),
            keepalive: true
        });
    } catch (e) {
        // Silently handle network errors for background logging
    }
}

/**
 * Send a lightweight heartbeat to keep the user's online status and last_seen_at fresh
 */
export async function sendHeartbeat() {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        await fetch(`${API_BASE}/api/activity/heartbeat`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            keepalive: true
        });
    } catch (e) {}
}

/**
 * Perform a clean logout: Notifies the backend to record logout timestamp and mark offline,
 * clears local session data, and immediately redirects to the login landing page.
 */
export function performLogout(router) {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');

    // 1. Immediately clear local tokens and state
    try {
        localStorage.clear();
        sessionStorage.clear();
    } catch (e) {}

    // 2. Fire backend logout in background with keepalive (non-blocking)
    if (token) {
        try {
            fetch(`${API_BASE}/api/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                keepalive: true
            }).catch(() => {});
        } catch (e) {}
    }

    // 3. Clean navigation to landing page
    if (router && typeof router.push === 'function') {
        router.push('/');
    } else {
        window.location.href = '/';
    }
}
