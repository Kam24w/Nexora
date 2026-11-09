"""Validation and sanitization of text that reaches the local service.

Passwords are validated but never altered: changing a credential would make it
stop matching what the user typed.
"""

import re
import unicodedata

EMAIL_MAX_LENGTH = 100
PASSWORD_MIN_LENGTH = 8
PASSWORD_MAX_LENGTH = 20
FULL_NAME_MAX_LENGTH = 100

_EMAIL = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}")
_HTML_TAG = re.compile(r"<[^>]*>")

AUTH_MODES = ("signIn", "signUp", "reset")


def sanitize_text(value, max_length):
    """Drops control/format characters (newlines, zero-width, bidi overrides) and collapses spaces."""
    if not isinstance(value, str):
        return ""
    visible = "".join(" " if char.isspace() else char for char in value if char.isspace() or unicodedata.category(char)[0] != "C")
    return " ".join(visible.split())[:max_length].strip()


def sanitize_multiline(value, max_length):
    """Like sanitize_text, but keeps line breaks (chat messages)."""
    if not isinstance(value, str):
        return ""
    lines = [sanitize_text(line, max_length) for line in value.replace("\r\n", "\n").split("\n")]
    text = "\n".join(lines)
    while "\n\n\n" in text:
        text = text.replace("\n\n\n", "\n\n")
    return text.strip()[:max_length].strip()


def validate_email(value):
    """Returns (normalized_email, error_code)."""
    if not isinstance(value, str):
        return None, "invalid"
    email = value.strip()
    if len(email) > EMAIL_MAX_LENGTH:
        return None, "too_long"
    if not _EMAIL.fullmatch(email) or ".." in email:
        return None, "invalid"
    return email, None


def validate_password(value):
    """Returns an error code, or None when the password is acceptable."""
    if not isinstance(value, str):
        return "length"
    if not PASSWORD_MIN_LENGTH <= len(value) <= PASSWORD_MAX_LENGTH:
        return "length"
    if any(unicodedata.category(char)[0] == "C" for char in value):
        return "composition"
    if not any(char.isalpha() for char in value) or not any(char.isascii() and char.isdigit() for char in value):
        return "composition"
    return None


def sanitize_full_name(value):
    if not isinstance(value, str):
        return ""
    return sanitize_text(_HTML_TAG.sub(" ", value).replace("<", " ").replace(">", " "), FULL_NAME_MAX_LENGTH)


def validate_auth_payload(payload):
    """Validates a login/signup/reset form.

    Returns (clean_fields, field_errors); exactly one of them is meaningful.
    """
    mode = payload.get("mode")
    if mode not in AUTH_MODES:
        return None, {"mode": "invalid"}

    errors = {}
    email, email_error = validate_email(payload.get("email"))
    if email_error:
        errors["email"] = email_error

    if mode != "reset":
        password_error = validate_password(payload.get("password"))
        if password_error:
            errors["password"] = password_error

    full_name = None
    if mode == "signUp":
        full_name = sanitize_full_name(payload.get("full_name"))
        if not full_name:
            errors["full_name"] = "required"

    if errors:
        return None, errors
    return {"email": email, "full_name": full_name}, None
