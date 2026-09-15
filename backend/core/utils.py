import secrets

from django.conf import settings


def generate_unique_code(model, field_name="joining_code", length=None, alphabet=None):
    """
    Generate a random alphanumeric code and guarantee it's unique against
    `model`'s `field_name` column, checking against ALL rows (including
    soft-deleted ones, via all_objects if present) so a retired code is
    never silently reissued.

    Uses `secrets.choice` (CSPRNG) rather than `random` since this code
    grants access to a class roster.
    """
    length = length or getattr(settings, "JOINING_CODE_LENGTH", 6)
    alphabet = alphabet or getattr(
        settings, "JOINING_CODE_ALPHABET", "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    )

    manager = getattr(model, "all_objects", model.objects)

    for _ in range(50):  # sane upper bound; collision odds are astronomically low
        code = "".join(secrets.choice(alphabet) for _ in range(length))
        if not manager.filter(**{field_name: code}).exists():
            return code

    raise RuntimeError(
        f"Could not generate a unique {field_name} for {model.__name__} "
        f"after 50 attempts — consider increasing JOINING_CODE_LENGTH."
    )
