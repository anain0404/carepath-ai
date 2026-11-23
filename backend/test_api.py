from fastapi.testclient import TestClient
from main import app
from resources import retrieve

client = TestClient(app)


def test_health():
    response = client.get('/api/health')
    assert response.status_code == 200
    assert response.json()['status'] == 'ok'


def test_retrieval():
    assert any(item['id'] == 'tests' for item in retrieve('blood test results'))


def test_ai_needs_key(monkeypatch):
    monkeypatch.delenv('OPENAI_API_KEY', raising=False)
    response = client.post('/api/chat', json={
        'messages': [{'role': 'user', 'text': 'I want to prepare for an appointment'}],
        'details': {},
        'document_text': '',
    })
    assert response.status_code == 503


def test_document_rejects_non_pdf():
    response = client.post('/api/document', files={'file': ('notes.txt', b'Test notes', 'text/plain')})
    assert response.status_code == 400
