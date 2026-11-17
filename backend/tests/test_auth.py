"""UC05 – Đăng nhập / đăng xuất (kèm Đổi mật khẩu)."""
from tests.conftest import ADMIN_PASSWORD, login


def test_login_and_me(client, admin):
    """Đăng nhập đúng -> token; /me trả thông tin admin."""
    assert client.get("/api/auth/me", headers=admin).json()["email"] == "admin@zooguide.vn"


def test_login_wrong_password_generic_message(client):
    """UC05 E1: sai email hoặc mật khẩu -> 401 cùng một thông báo."""
    wrong_pw = client.post("/api/auth/login", json={"email": "admin@zooguide.vn", "password": "sai-mat-khau"})
    wrong_email = client.post("/api/auth/login", json={"email": "khong@co.vn", "password": "abc"})
    assert wrong_pw.status_code == wrong_email.status_code == 401
    assert wrong_pw.json() == wrong_email.json() == {"detail": "Email hoặc mật khẩu không đúng"}


def test_login_bad_email_format(client):
    """UC05 E2: sai định dạng email -> 422."""
    assert client.post("/api/auth/login", json={"email": "abc", "password": "x"}).status_code == 422


def test_admin_api_requires_token(client):
    """Tiêu chí UC05: không có token thì mọi API quản trị trả 401."""
    for method, url in (("get", "/api/systems/dashboard"), ("patch", "/api/zones/1"), ("delete", "/api/animals/1"),
                        ("post", "/api/translate"), ("get", "/api/auth/me")):
        assert getattr(client, method)(url).status_code == 401, url
    assert client.get("/api/systems/dashboard", headers={"Authorization": "Bearer abc"}).status_code == 401


def test_change_password_invalidates_old_token(client, admin):
    """Tiêu chí UC05: sau khi đổi mật khẩu, token cũ bị từ chối và mật khẩu mới đăng nhập được."""
    body = {"old_password": ADMIN_PASSWORD, "new_password": "matkhaumoi1", "confirm_password": "matkhaumoi1"}
    assert client.patch("/api/auth/password", json=body, headers=admin).status_code == 204
    assert client.get("/api/auth/me", headers=admin).status_code == 401
    assert client.post("/api/auth/login", json={"email": "admin@zooguide.vn", "password": ADMIN_PASSWORD}).status_code == 401
    new = login(client, password="matkhaumoi1")
    assert client.get("/api/auth/me", headers=new).status_code == 200


def test_change_password_errors(client, admin):
    """UC05 E3: sai mật khẩu cũ -> 400; mật khẩu mới < 8 ký tự hoặc xác nhận không khớp -> 422."""
    bad_old = {"old_password": "sai", "new_password": "matkhaumoi1", "confirm_password": "matkhaumoi1"}
    assert client.patch("/api/auth/password", json=bad_old, headers=admin).status_code == 400
    short = {"old_password": ADMIN_PASSWORD, "new_password": "abc", "confirm_password": "abc"}
    assert client.patch("/api/auth/password", json=short, headers=admin).status_code == 422
    mismatch = {"old_password": ADMIN_PASSWORD, "new_password": "matkhaumoi1", "confirm_password": "khac12345"}
    assert client.patch("/api/auth/password", json=mismatch, headers=admin).status_code == 422


def test_no_register_endpoint(client):
    """Không có đăng ký (chỉ một admin nạp sẵn)."""
    assert client.post("/api/auth/register", json={}).status_code in (404, 405)
