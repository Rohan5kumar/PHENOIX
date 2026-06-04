import os
import pkgutil

# Compute the path to the actual implementation inside packages/ml-core/ml_core
_real_pkg_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "packages", "ml-core", "ml_core"))
# Extend this package's __path__ to support namespace packages
__path__ = pkgutil.extend_path(__path__, __name__)
if _real_pkg_path not in __path__:
    __path__.append(_real_pkg_path)

# Package version
__version__ = "0.1.0"

