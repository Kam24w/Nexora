from flask import request


def json_object_body():
    """The JSON body when it is an object; an empty dict for anything else."""
    payload = request.get_json(silent=True)
    return payload if isinstance(payload, dict) else {}
