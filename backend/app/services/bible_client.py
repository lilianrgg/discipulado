from typing import List, Dict, Any, Optional
import httpx
from pydantic import BaseModel, Field

BASE_URL = "https://api.midvash.com/v1"
DEFAULT_TRANSLATION = "rvr1960"

# The midvash API uses English book slugs.
_SLUG_ES_TO_EN: dict[str, str] = {
    "genesis": "genesis", "exodo": "exodus", "exo": "exodus",
    "levitico": "leviticus", "numeros": "numbers", "deuteronomio": "deuteronomy",
    "josue": "joshua", "jueces": "judges", "rut": "ruth",
    "1-samuel": "1-samuel", "2-samuel": "2-samuel",
    "1-reyes": "1-kings", "2-reyes": "2-kings",
    "1-cronicas": "1-chronicles", "2-cronicas": "2-chronicles",
    "esdras": "ezra", "nehemias": "nehemiah", "ester": "esther",
    "job": "job", "salmos": "psalms", "salmo": "psalms",
    "proverbios": "proverbs", "eclesiastes": "ecclesiastes",
    "cantares": "song-of-solomon", "isaias": "isaiah", "jeremias": "jeremiah",
    "lamentaciones": "lamentations", "ezequiel": "ezekiel", "daniel": "daniel",
    "oseas": "hosea", "joel": "joel", "amos": "amos", "abdias": "obadiah",
    "jonas": "jonah", "miqueas": "micah", "nahum": "nahum", "habacuc": "habakkuk",
    "sofonias": "zephaniah", "hageo": "haggai", "zacarias": "zechariah",
    "malaquias": "malachi", "mateo": "matthew", "marcos": "mark",
    "lucas": "luke", "juan": "john", "hechos": "acts", "romanos": "romans",
    "1-corintios": "1-corinthians", "2-corintios": "2-corinthians",
    "galatas": "galatians", "efesios": "ephesians", "filipenses": "philippians",
    "colosenses": "colossians", "1-tesalonicenses": "1-thessalonians",
    "2-tesalonicenses": "2-thessalonians", "1-timoteo": "1-timothy",
    "2-timoteo": "2-timothy", "tito": "titus", "filemon": "philemon",
    "hebreos": "hebrews", "santiago": "james", "1-pedro": "1-peter",
    "2-pedro": "2-peter", "1-juan": "1-john", "2-juan": "2-john",
    "3-juan": "3-john", "judas": "jude", "apocalipsis": "revelation",
}

# Map legacy rv1960 alias to the token the API accepts.
_TRANSLATION_ALIASES: dict[str, str] = {
    "rv1960": "rvr1960",
}


def _normalize_slug(slug: str) -> str:
    key = slug.strip().lower()
    return _SLUG_ES_TO_EN.get(key, key)


def _normalize_translation(translation: str) -> str:
    return _TRANSLATION_ALIASES.get(translation.lower(), translation.lower())

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
        url = f"{self.base_url}/books?language=es&version=rvr1960"
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(url)
                response.raise_for_status()
                raw = response.json()
                items = raw if isinstance(raw, list) else raw.get("data", [])
                
                books: List[BibleBook] = []
                for b in items:
                    name_field = b.get("name", {})
                    if isinstance(name_field, dict):
                        es_name = name_field.get("es") or name_field.get("en") or ""
                        en_name = name_field.get("en") or es_name
                        names = [es_name, en_name]
                    elif isinstance(name_field, list):
                        names = name_field
                    else:
                        names = [str(name_field)]
                    
                    slug_field = b.get("slug", {})
                    if isinstance(slug_field, dict):
                        slug_val = slug_field.get("es") or slug_field.get("en") or ""
                    else:
                        slug_val = str(slug_field)

                    books.append(BibleBook(
                        names=[n for n in names if n],
                        slug=slug_val,
                        chapters=b.get("chapters", 0)
                    ))
                return books
            except httpx.HTTPStatusError as e:
                raise BibleApiException(f"HTTP error fetching books: {e.response.status_code}", status_code=e.response.status_code)
            except Exception as e:
                raise BibleApiException(f"Error fetching Bible books: {str(e)}")

    async def read_chapter(self, book_slug: str, chapter: int, translation: str = DEFAULT_TRANSLATION) -> List[Dict[str, Any]]:
        if not book_slug or not book_slug.strip():
            raise ValueError("book_slug must not be empty.")
        if chapter <= 0:
            raise ValueError("chapter must be greater than 0.")

        clean_slug = _normalize_slug(book_slug)
        api_translation = _normalize_translation(translation)
        url = f"{self.base_url}/{api_translation}/{clean_slug}/{chapter}"
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(url)
                response.raise_for_status()
                raw = response.json()
                payload = raw.get("data", raw) if isinstance(raw, dict) else raw
                
                verses_raw = payload.get("verses", payload) if isinstance(payload, dict) else payload
                if isinstance(verses_raw, list):
                    normalized = []
                    for idx, v in enumerate(verses_raw):
                        if isinstance(v, str):
                            normalized.append({"number": idx + 1, "text": v})
                        elif isinstance(v, dict):
                            normalized.append({
                                "number": v.get("number") or v.get("verse") or (idx + 1),
                                "text": v.get("text", ""),
                                "study": v.get("study"),
                                "id": v.get("id")
                            })
                    return normalized
                return []
            except httpx.HTTPStatusError as e:
                raise BibleApiException(f"HTTP error fetching chapter {chapter} for {book_slug}: {e.response.status_code}", status_code=e.response.status_code)
            except Exception as e:
                raise BibleApiException(f"Error reading chapter {chapter} for {book_slug}: {str(e)}")

    async def read_verse(self, book_slug: str, chapter: int, verse: int, translation: str = DEFAULT_TRANSLATION) -> Dict[str, Any]:
        if verse <= 0:
            raise ValueError("verse must be greater than 0.")

        clean_slug = _normalize_slug(book_slug)
        api_translation = _normalize_translation(translation)
        url = f"{self.base_url}/{api_translation}/{clean_slug}/{chapter}/{verse}"
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(url)
                response.raise_for_status()
                raw = response.json()
                payload = raw.get("data", raw) if isinstance(raw, dict) else raw
                text = payload.get("text", "")
                if not text and isinstance(payload.get("verses"), list) and payload["verses"]:
                    text = payload["verses"][0]
                return {
                    "number": payload.get("verse") or payload.get("number") or verse,
                    "text": text
                }
            except httpx.HTTPStatusError as e:
                raise BibleApiException(f"HTTP error fetching verse {chapter}:{verse} for {book_slug}: {e.response.status_code}", status_code=e.response.status_code)
            except Exception as e:
                raise BibleApiException(f"Error reading verse {chapter}:{verse} for {book_slug}: {str(e)}")
