from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from src.database import get_db
from src.main import app
from src.models.user import User, UserRole
from src.services.auth_service import create_access_token, hash_password

# Use an in-memory SQLite database for isolated and fast testing
DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


@pytest.fixture(scope="function")
def db_session() -> Generator[Session]:
    """Create fresh database tables before each test and drop them afterward."""
    SQLModel.metadata.create_all(bind=engine)
    with Session(engine) as session:
        yield session
    SQLModel.metadata.drop_all(bind=engine)



@pytest.fixture(autouse=True)
def mock_init_db(monkeypatch):
    """Prevent FastAPI startup lifespan from calling production init_db."""
    monkeypatch.setattr("src.main.init_db", lambda: None)


@pytest.fixture(scope="function")
def client(db_session: Session) -> Generator[TestClient]:
    """TestClient fixture with get_db overridden to use test database session."""

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db_session: Session) -> User:
    """Creates a regular test user in the database."""
    user = User(
        username="regular_user",
        email="regular@example.com",
        hashed_password=hash_password("password123"),
        role=UserRole.USER,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def user_auth_headers(test_user: User) -> dict:
    """Returns Authorization header with Bearer token for regular test user."""
    token = create_access_token(
        data={"sub": str(test_user.id), "username": test_user.username, "role": "user"}
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def test_admin(db_session: Session) -> User:
    """Creates an admin test user in the database."""
    admin = User(
        username="admin_user",
        email="admin@example.com",
        hashed_password=hash_password("adminpass123"),
        role=UserRole.ADMIN,
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    return admin


@pytest.fixture
def admin_auth_headers(test_admin: User) -> dict:
    """Returns Authorization header with Bearer token for admin test user."""
    token = create_access_token(
        data={
            "sub": str(test_admin.id),
            "username": test_admin.username,
            "role": "admin",
        }
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def second_user(db_session: Session) -> User:
    """Creates a second regular test user for isolation checks."""
    user2 = User(
        username="second_user",
        email="second@example.com",
        hashed_password=hash_password("password123"),
        role=UserRole.USER,
    )
    db_session.add(user2)
    db_session.commit()
    db_session.refresh(user2)
    return user2


@pytest.fixture
def second_user_auth_headers(second_user: User) -> dict:
    """Returns Authorization header for the second regular test user."""
    token = create_access_token(
        data={
            "sub": str(second_user.id),
            "username": second_user.username,
            "role": "user",
        }
    )
    return {"Authorization": f"Bearer {token}"}
