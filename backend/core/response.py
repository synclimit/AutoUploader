from datetime import datetime

def success_response(data: dict = None):
    return {
        "success": True,
        "data": data if data is not None else {},
        "meta": {
            "timestamp": datetime.utcnow().isoformat(),
            "version": "1.0"
        }
    }

def error_response(code: str, message: str, details: dict = None):
    return {
        "success": False,
        "error": {
            "code": code,
            "message": message,
            "details": details if details is not None else {}
        }
    }
