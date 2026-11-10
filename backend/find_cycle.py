import os
import sys

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")
django.setup()

from django.urls import get_resolver

sys.setrecursionlimit(300)


def walk(resolver, path):
    for pattern in getattr(resolver, "url_patterns", []):
        urlconf = getattr(pattern, "urlconf_module", None)
        if urlconf is not None:
            name = getattr(urlconf, "__name__", str(urlconf))
            if name in path:
                print("CYCLE:", " -> ".join(path + [name]))
                return True
            if walk(pattern, path + [name]):
                return True
    return False


if not walk(get_resolver(), ["config.urls"]):
    print("No cycle found in included modules.")