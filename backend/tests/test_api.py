from fastapi.testclient import TestClient

from src.models.user import User


def test_health_check_endpoint(client: TestClient):
    """API Test: Verify health check endpoint returns 200 OK."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_user_registration_success(client: TestClient):
    """API Test: Register new user with hashed password returns 201 Created."""
    payload = {
        "username": "alice_smith",
        "email": "alice@example.com",
        "password": "Password123!",
        "role": "user",
    }
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "alice_smith"
    assert data["email"] == "alice@example.com"
    assert data["role"] == "user"
    assert "hashed_password" not in data
    assert "password" not in data
    assert "id" in data


def test_user_registration_duplicate_username_or_email_fails(
    client: TestClient, test_user: User
):
    """API Test: Attempting to register existing username or email returns 400."""
    # Duplicate username
    response = client.post(
        "/auth/register",
        json={
            "username": test_user.username,
            "email": "different@example.com",
            "password": "ValidPass123!",
        },
    )
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"].lower()

    # Duplicate email
    response2 = client.post(
        "/auth/register",
        json={
            "username": "different_username",
            "email": test_user.email,
            "password": "ValidPass123!",
        },
    )
    assert response2.status_code == 400
    assert "already registered" in response2.json()["detail"].lower()


def test_user_login_success_and_jwt_issuance(client: TestClient, test_user: User):
    """API Test: User login with correct credentials returns valid JWT token."""
    response = client.post(
        "/auth/login",
        json={
            "username_or_email": test_user.username,
            "password": "password123",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert len(data["access_token"]) > 20


def test_user_login_invalid_password_fails(client: TestClient, test_user: User):
    """API Test: User login with wrong password returns 401 Unauthorized."""
    response = client.post(
        "/auth/login",
        json={
            "username_or_email": test_user.username,
            "password": "WrongPassword999",
        },
    )
    assert response.status_code == 401
    assert "invalid credentials" in response.json()["detail"].lower()


def test_get_current_user_profile(
    client: TestClient, test_user: User, user_auth_headers: dict
):
    """API Test: Authenticated user can view their own profile."""
    response = client.get("/users/me", headers=user_auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(test_user.id)
    assert data["username"] == test_user.username
    assert data["email"] == test_user.email
    assert data["role"] == "user"


def test_protected_route_without_token_returns_401(client: TestClient):
    """API Test: Accessing protected endpoint without JWT returns 401 Unauthorized."""
    response = client.get("/users/me")
    assert response.status_code == 401


def test_admin_can_view_all_users(
    client: TestClient, admin_auth_headers: dict, test_user: User
):
    """API Test: Admin role can view all registered users."""
    response = client.get("/users", headers=admin_auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 2


def test_normal_user_cannot_view_all_users(client: TestClient, user_auth_headers: dict):
    """API Test: Normal user cannot view all users (403 Forbidden)."""
    response = client.get("/users", headers=user_auth_headers)
    assert response.status_code == 403
    assert "admin" in response.json()["detail"].lower()


def test_admin_can_delete_user(
    client: TestClient, admin_auth_headers: dict, second_user: User
):
    """API Test: Admin role can delete a user."""
    response = client.delete(f"/users/{second_user.id}", headers=admin_auth_headers)
    assert response.status_code == 200
    assert "deleted successfully" in response.json()["message"]

    # Verify user is actually deleted
    verify_response = client.delete(
        f"/users/{second_user.id}", headers=admin_auth_headers
    )
    assert verify_response.status_code == 404


def test_normal_user_cannot_delete_users(
    client: TestClient, user_auth_headers: dict, second_user: User
):
    """API Test: Normal user cannot delete users (403 Forbidden)."""
    response = client.delete(f"/users/{second_user.id}", headers=user_auth_headers)
    assert response.status_code == 403


def test_task_crud_lifecycle_for_user(client: TestClient, user_auth_headers: dict):
    """API Test: Full CRUD lifecycle for user's own tasks."""
    # 1. Create task (POST /tasks)
    create_payload = {
        "title": "Complete unit testing",
        "description": "Write pytest fixtures and assertion tests",
        "status": "pending",
    }
    create_resp = client.post("/tasks", json=create_payload, headers=user_auth_headers)
    assert create_resp.status_code == 201
    task = create_resp.json()
    assert task["title"] == create_payload["title"]
    assert task["status"] == "pending"
    assert "id" in task
    assert "created_at" in task
    task_id = task["id"]

    # 2. Get task list (GET /tasks)
    list_resp = client.get("/tasks", headers=user_auth_headers)
    assert list_resp.status_code == 200
    tasks = list_resp.json()
    assert any(t["id"] == task_id for t in tasks)

    # 3. Update task (PUT /tasks/{id})
    update_payload = {
        "title": "Complete unit testing - Updated",
        "status": "completed",
    }
    update_resp = client.put(
        f"/tasks/{task_id}", json=update_payload, headers=user_auth_headers
    )
    assert update_resp.status_code == 200
    updated_task = update_resp.json()
    assert updated_task["title"] == update_payload["title"]
    assert updated_task["status"] == "completed"

    # 4. Delete task (DELETE /tasks/{id})
    del_resp = client.delete(f"/tasks/{task_id}", headers=user_auth_headers)
    assert del_resp.status_code == 200
    assert f"Task {task_id} deleted successfully" in del_resp.json()["message"]

    # Verify task is deleted
    get_again = client.get(f"/tasks/{task_id}", headers=user_auth_headers)
    assert get_again.status_code == 404


def test_task_isolation_user_cannot_access_or_modify_other_tasks(
    client: TestClient,
    user_auth_headers: dict,
    second_user_auth_headers: dict,
):
    """API Test: User 1 cannot view, update, or delete User 2's tasks."""
    # User 2 creates a task
    create_resp = client.post(
        "/tasks",
        json={"title": "Private Task User 2", "status": "pending"},
        headers=second_user_auth_headers,
    )
    assert create_resp.status_code == 201
    task_id = create_resp.json()["id"]

    # User 1 lists tasks: User 2's task must NOT appear
    list_resp = client.get("/tasks", headers=user_auth_headers)
    user1_task_ids = [t["id"] for t in list_resp.json()]
    assert task_id not in user1_task_ids

    # User 1 tries to view User 2's task: 403 Forbidden
    view_resp = client.get(f"/tasks/{task_id}", headers=user_auth_headers)
    assert view_resp.status_code == 403

    # User 1 tries to update User 2's task: 403 Forbidden
    put_resp = client.put(
        f"/tasks/{task_id}",
        json={"title": "Hacked Title"},
        headers=user_auth_headers,
    )
    assert put_resp.status_code == 403

    # User 1 tries to delete User 2's task: 403 Forbidden
    del_resp = client.delete(f"/tasks/{task_id}", headers=user_auth_headers)
    assert del_resp.status_code == 403


def test_admin_can_access_and_delete_all_tasks(
    client: TestClient,
    user_auth_headers: dict,
    admin_auth_headers: dict,
):
    """API Test: Admin role can see all users' tasks and delete any task."""
    # Regular user creates a task
    create_resp = client.post(
        "/tasks",
        json={"title": "User task seen by admin", "status": "pending"},
        headers=user_auth_headers,
    )
    task_id = create_resp.json()["id"]

    # Admin lists tasks and sees the task
    admin_list = client.get("/tasks", headers=admin_auth_headers)
    assert admin_list.status_code == 200
    admin_task_ids = [t["id"] for t in admin_list.json()]
    assert task_id in admin_task_ids

    # Admin deletes the task
    admin_del = client.delete(f"/tasks/{task_id}", headers=admin_auth_headers)
    assert admin_del.status_code == 200


def test_input_validation_failure(client: TestClient, user_auth_headers: dict):
    """API Test: Invalid inputs trigger validation error (422 Unprocessable Entity)."""
    # Empty title
    response = client.post(
        "/tasks",
        json={"title": "", "status": "pending"},
        headers=user_auth_headers,
    )
    assert response.status_code == 422
    data = response.json()
    assert data["error"] == "Validation Error"

    # Invalid status value
    response2 = client.post(
        "/tasks",
        json={"title": "Valid Title", "status": "invalid_status_value"},
        headers=user_auth_headers,
    )
    assert response2.status_code == 422
