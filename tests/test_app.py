import copy

import pytest
from fastapi.testclient import TestClient

from src.app import activities as activities_data, app

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_activities():
    original_activities = copy.deepcopy(activities_data)
    yield
    activities_data.clear()
    activities_data.update(copy.deepcopy(original_activities))


def test_root_redirect():
    # Arrange
    url = "/"

    # Act
    response = client.get(url, follow_redirects=False)

    # Assert
    assert response.status_code == 307
    assert response.headers["location"] == "/static/index.html"


def test_get_activities():
    # Arrange
    url = "/activities"

    # Act
    response = client.get(url)
    json_data = response.json()

    # Assert
    assert response.status_code == 200
    assert "Chess Club" in json_data
    assert json_data["Chess Club"]["description"] == "Learn strategies and compete in chess tournaments"


def test_signup_for_activity_success():
    # Arrange
    url = "/activities/Chess Club/signup"
    email = "newstudent@mergington.edu"

    # Act
    response = client.post(url, params={"email": email})

    # Assert
    assert response.status_code == 200
    assert response.json() == {"message": f"Signed up {email} for Chess Club"}
    assert email in activities_data["Chess Club"]["participants"]


def test_signup_for_activity_missing_activity():
    # Arrange
    url = "/activities/Nonexistent/signup"
    email = "student@mergington.edu"

    # Act
    response = client.post(url, params={"email": email})

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_signup_for_activity_duplicate_email():
    # Arrange
    url = "/activities/Chess Club/signup"
    email = "michael@mergington.edu"

    # Act
    response = client.post(url, params={"email": email})

    # Assert
    assert response.status_code == 400
    assert response.json()["detail"] == "Student already signed up"


def test_signup_for_activity_when_full():
    # Arrange
    url = "/activities/Tennis Club/signup"
    activities_data["Tennis Club"]["participants"] = [f"user{i}@example.com" for i in range(10)]
    email = "student@mergington.edu"

    # Act
    response = client.post(url, params={"email": email})

    # Assert
    assert response.status_code == 400
    assert response.json()["detail"] == "Activity is full"


def test_remove_participant_success():
    # Arrange
    url = "/activities/Chess Club/participants"
    email = "michael@mergington.edu"

    # Act
    response = client.delete(url, params={"email": email})

    # Assert
    assert response.status_code == 200
    assert response.json() == {"message": f"Removed {email} from Chess Club"}
    assert email not in activities_data["Chess Club"]["participants"]


def test_remove_participant_missing_activity():
    # Arrange
    url = "/activities/Nonexistent/participants"
    email = "student@mergington.edu"

    # Act
    response = client.delete(url, params={"email": email})

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_remove_participant_not_found():
    # Arrange
    url = "/activities/Chess Club/participants"
    email = "absent@mergington.edu"

    # Act
    response = client.delete(url, params={"email": email})

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Participant not found"
