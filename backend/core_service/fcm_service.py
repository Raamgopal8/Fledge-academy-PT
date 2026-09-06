"""
Firebase Cloud Messaging (FCM) Service for Fledge Academy
Dispatches real-time push notifications to mobile PWA and desktop browsers.
"""

import os
import json
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("fcm_service")

_firebase_initialized = False

def get_firebase_app():
    """Initializes and returns Firebase Admin App instance safely."""
    global _firebase_initialized
    if _firebase_initialized:
        return True

    try:
        import firebase_admin
        from firebase_admin import credentials

        if firebase_admin._apps:
            _firebase_initialized = True
            return True

        # Check for service account JSON path or JSON content in environment
        sa_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")
        sa_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")

        if sa_path and os.path.exists(sa_path):
            cred = credentials.Certificate(sa_path)
            firebase_admin.initialize_app(cred)
            _firebase_initialized = True
            logger.info(f"Firebase Admin initialized from service account file: {sa_path}")
            return True
        elif sa_json:
            try:
                cert_dict = json.loads(sa_json)
                cred = credentials.Certificate(cert_dict)
                firebase_admin.initialize_app(cred)
                _firebase_initialized = True
                logger.info("Firebase Admin initialized from environment JSON string.")
                return True
            except Exception as e:
                logger.warning(f"Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON: {e}")

        # Fallback to Google Application Default Credentials (e.g., Cloud Run runtime)
        try:
            firebase_admin.initialize_app()
            _firebase_initialized = True
            logger.info("Firebase Admin initialized using Google Application Default Credentials.")
            return True
        except Exception as adc_err:
            logger.warning(f"Firebase default credentials not available: {adc_err}")

    except ImportError:
        logger.info("firebase_admin package not installed. Push notifications will operate in mock/log mode.")
    except Exception as err:
        logger.warning(f"Could not initialize Firebase Admin: {err}")

    return False


async def send_fcm_push(
    tokens: List[str],
    title: str,
    body: str,
    data: Optional[Dict[str, str]] = None,
    link: Optional[str] = "/dashboard"
) -> Dict[str, Any]:
    """
    Sends push notification to a list of device FCM registration tokens.
    Returns summary of success and failed token counts.
    """
    if not tokens:
        return {"success_count": 0, "failure_count": 0, "message": "No tokens provided"}

    # Ensure all data values are strings for FCM compatibility
    safe_data = {
        "title": str(title),
        "body": str(body),
        "link": str(link or "/dashboard"),
        "icon": "/icon-192.png",
        "tag": "fledge-notification",
        "timestamp": str(int(os.path.getmtime(__file__) if os.path.exists(__file__) else 0))
    }
    if data:
        for k, v in data.items():
            safe_data[str(k)] = str(v)

    if not get_firebase_app():
        logger.info(f"[FCM Mock Push] To {len(tokens)} devices: '{title}' - '{body}' (link: {link})")
        return {
            "success_count": len(tokens),
            "failure_count": 0,
            "mock": True,
            "message": "FCM credentials not configured, mock dispatched successfully"
        }

    try:
        from firebase_admin import messaging

        notification = messaging.Notification(
            title=title,
            body=body
        )

        android = messaging.AndroidConfig(
            priority="high",
            notification=messaging.AndroidNotification(
                title=title,
                body=body,
                icon="stock_ticker_update",
                color="#5D8BCC",
                sound="default",
                click_action=link or "/dashboard"
            )
        )

        webpush = messaging.WebpushConfig(
            headers={"Urgency": "high"},
            notification=messaging.WebpushNotification(
                title=title,
                body=body,
                icon="/icon-192.png",
                badge="/icon-192.png",
                vibrate=[100, 50, 100],
                require_interaction=True
            ),
            fcm_options=messaging.WebpushFCMOptions(
                link=link or "/dashboard"
            )
        )

        # Batch multicast message for Android, iOS, and Web
        message = messaging.MulticastMessage(
            tokens=tokens,
            notification=notification,
            data=safe_data,
            android=android,
            webpush=webpush
        )

        response = messaging.send_each_for_multicast(message)
        logger.info(f"[FCM Dispatch] Successfully sent {response.success_count} messages; {response.failure_count} failed.")

        return {
            "success_count": response.success_count,
            "failure_count": response.failure_count,
            "message": f"Sent {response.success_count}/{len(tokens)} push notifications."
        }
    except Exception as e:
        logger.error(f"[FCM Error] Failed sending push notification: {e}")
        return {
            "success_count": 0,
            "failure_count": len(tokens),
            "error": str(e)
        }
