from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.routes import auth_router, tasks_router, users_router
from src.config import settings
from src.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
    # Only auto-create tables on local SQLite. For Postgres/Supabase, use schema.sql or migrations.
    if settings.DATABASE_URL.startswith("sqlite"):
        init_db()
    yield


app = FastAPI(
    title="Task Tracker API",
    description="A secure User Management & Task Tracker REST API built with FastAPI, SQLModel, and JWT Authentication.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.get("/", tags=["Health"])
def root():
    return {
        "status": "online",
        "documentation": "/docs",
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "database": "connected",
    }


app.include_router(auth_router)
app.include_router(users_router)
app.include_router(tasks_router)
