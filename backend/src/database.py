from collections.abc import Generator

from sqlmodel import Session, SQLModel, create_engine

from src.config import settings

engine_kwargs = {"echo": False}
engine = create_engine(
    settings.DATABASE_URL,
    echo=False,
)


def get_db() -> Generator[Session]:
    """Dependency that yields a SQLModel Session for request lifecycle."""
    with Session(engine) as session:
        yield session


def init_db() -> None:
    SQLModel.metadata.create_all(engine)

