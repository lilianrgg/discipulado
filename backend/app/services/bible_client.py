from typing import List, Dict, Any, Optional
import httpx
from pydantic import BaseModel, Field

BASE_URL = "https://bible-api.deno.dev/api"
DEFAULT_TRANSLATION = "rv1960"

class BibleBook(BaseModel):
    names: List[str]
    slug: str
    chapters: int

class BibleVerse(BaseModel):
    number: Optional[int] = None
    text: Optional[str] = None
    study: Optional[str] = None
    id: Optional[int] = None

class BibleApiException(Exception):
    def __init__(self, message: str, status_code: Optional[int] = None):
        super().__init__(message)
        self.status_code = status_code

class BibleClient:
    def __init__(self, base_url: str = BASE_URL, timeout: float = 10.0):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    async def get_books(self) -> List[BibleBook]:
        url = f"{self.base_url}/books"
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(url)
                response.raise_for_status()
                data = response.json()
                return [BibleBook(**book) for book in data]
            except httpx.HTTPStatusError as e:
                raise BibleApiException(f"HTTP error fetching books: {e.response.status_code}", status_code=e.response.status_code)
            except Exception as e:
                raise BibleApiException(f"Error fetching Bible books: {str(e)}")

    async def read_chapter(self, book_slug: str, chapter: int, translation: str = DEFAULT_TRANSLATION) -> List[Dict[str, Any]]:
        if not book_slug or not book_slug.strip():
            raise ValueError("book_slug must not be empty.")
        if chapter <= 0:
            raise ValueError("chapter must be greater than 0.")

        clean_slug = book_slug.strip().lower()
        url = f"{self.base_url}/read/{translation}/{clean_slug}/{chapter}"
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(url)
                response.raise_for_status()
                data = response.json()
                return data if isinstance(data, list) else data.get("verses", [data])
            except httpx.HTTPStatusError as e:
                raise BibleApiException(f"HTTP error fetching chapter {chapter} for {book_slug}: {e.response.status_code}", status_code=e.response.status_code)
            except Exception as e:
                raise BibleApiException(f"Error reading chapter {chapter} for {book_slug}: {str(e)}")

    async def read_verse(self, book_slug: str, chapter: int, verse: int, translation: str = DEFAULT_TRANSLATION) -> Dict[str, Any]:
        if verse <= 0:
            raise ValueError("verse must be greater than 0.")

        clean_slug = book_slug.strip().lower()
        url = f"{self.base_url}/read/{translation}/{clean_slug}/{chapter}/{verse}"
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(url)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                raise BibleApiException(f"HTTP error fetching verse {chapter}:{verse} for {book_slug}: {e.response.status_code}", status_code=e.response.status_code)
            except Exception as e:
                raise BibleApiException(f"Error reading verse {chapter}:{verse} for {book_slug}: {str(e)}")
