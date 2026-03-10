import copy
from fastapi.testclient import TestClient
from src import app, activities

client = TestClient(app.app)
INITIAL_ACTIVITIES = copy.deepcopy(activities.activities)


def setup_function():
    activities.activities.clear()
    activities.activities.update(copy.deepcopy(INITIAL_ACTIVITIES))


def test_get_activities_returns_all():
    # Arrange (setup_function resets data automatically)

    # Act
    response = client.get("/activities")

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert "Chess Club" in data
    assert isinstance(data["Chess Club"]["participants"], list)


def test_signup_adds_new_participant_and_returns_200():
    # Arrange
    email = "alice@mergington.edu"
    endpoint = "/activities/Chess%20Club/signup?email=" + email

    # Act
    response = client.post(endpoint)

    # Assert
    assert response.status_code == 200
    assert f"Signed up {email}" in response.json()["message"]
    assert email in activities.activities["Chess Club"]["participants"]


def test_signup_duplicate_returns_400():
    # Arrange
    email = "bob@mergington.edu"
    endpoint = "/activities/Chess%20Club/signup?email=" + email
    client.post(endpoint)

    # Act
    response = client.post(endpoint)

    # Assert
    assert response.status_code == 400
    assert "already signed up" in response.json()["detail"].lower()


def test_remove_participant_from_activity():
    # Arrange
    email = "carol@mergington.edu"
    signup_url = "/activities/Chess%20Club/signup?email=" + email
    client.post(signup_url)
    delete_url = "/activities/Chess%20Club/participants?email=" + email

    # Act
    response = client.delete(delete_url)

    # Assert
    assert response.status_code == 200
    assert f"Removed {email}" in response.json()["message"]
    assert email not in activities.activities["Chess Club"]["participants"]
