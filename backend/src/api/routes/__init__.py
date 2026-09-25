from src.api.routes.auth import router as auth_router
from src.api.routes.tasks import router as tasks_router
from src.api.routes.users import router as users_router

__all__ = ["auth_router", "tasks_router", "users_router"]
