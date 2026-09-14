import pytest
import httpx
from unittest.mock import AsyncMock, patch, call
from app.services.bible_client import BibleClient, BibleBook, BibleApiException


def _make_response(status_code: int, json_data) -> httpx.Response:
    """Build an httpx.Response with a dummy request so raise_for_status() works."""
    dummy_request = httpx.Request("GET", "https://example.com")
    return httpx.Response(status_code, json=json_data, request=dummy_request)


# ---------------------------------------------------------------------------
# get_books
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_books_success():
    mock_data = [{"names": ["Génesis"], "slug": "genesis", "chapters": 50}]

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = _make_response(200, mock_data)

        client = BibleClient()
        books = await client.get_books()

        assert len(books) == 1
        assert books[0].slug == "genesis"
        assert books[0].chapters == 50
        mock_get.assert_called_once_with(
            "https://api.midvash.com/v1/books?language=es&version=rvr1960"
        )


# ---------------------------------------------------------------------------
# read_chapter
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_read_chapter_success_spanish_slug():
    """Spanish slug 'juan' must be mapped to 'john', rv1960 alias to rvr1960."""
    mock_data = [{"number": 16, "text": "Porque de tal manera amó Dios al mundo..."}]

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = _make_response(200, mock_data)

        client = BibleClient()
        verses = await client.read_chapter("juan", 3, "rv1960")

        assert len(verses) == 1
        assert verses[0]["number"] == 16
        mock_get.assert_called_once_with(
            "https://api.midvash.com/v1/rvr1960/john/3"
        )


@pytest.mark.asyncio
async def test_read_chapter_http_error():
    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = _make_response(404, {"error": "not found"})

        client = BibleClient()
        with pytest.raises(BibleApiException) as exc_info:
            await client.read_chapter("juan", 999, "rvr1960")

        assert exc_info.value.status_code == 404


# ---------------------------------------------------------------------------
# read_verse
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_read_verse_url():
    mock_data = {"number": 16, "text": "Porque de tal manera amó Dios al mundo..."}

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = _make_response(200, mock_data)

        client = BibleClient()
        await client.read_verse("juan", 3, 16, "rv1960")

        mock_get.assert_called_once_with(
            "https://api.midvash.com/v1/rvr1960/john/3/16"
        )


# ---------------------------------------------------------------------------
# Validation errors
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_validation_errors():
    client = BibleClient()
    with pytest.raises(ValueError):
        await client.read_chapter("", 1)
    with pytest.raises(ValueError):
        await client.read_chapter("juan", -1)
    with pytest.raises(ValueError):
        await client.read_verse("juan", 3, 0)
