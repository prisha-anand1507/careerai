"""Resume text extraction for PDF and DOCX files."""
import io
import re

from docx import Document
from pypdf import PdfReader


class ExtractionError(Exception):
    pass


def _clean(text: str) -> str:
    text = text.replace("\r", "\n").replace("•", "•").replace(" ", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def extract_pdf(data: bytes) -> tuple[str, dict]:
    try:
        reader = PdfReader(io.BytesIO(data))
        pages = [(p.extract_text() or "") for p in reader.pages]
    except Exception as exc:  # corrupted / encrypted
        raise ExtractionError(f"Could not read PDF: {exc}") from exc
    text = _clean("\n".join(pages))
    return text, {"pages": len(pages), "scanned_suspected": len(text) < 200}


def extract_docx(data: bytes) -> tuple[str, dict]:
    try:
        doc = Document(io.BytesIO(data))
    except Exception as exc:
        raise ExtractionError(f"Could not read DOCX: {exc}") from exc
    parts = [p.text for p in doc.paragraphs]
    table_cells = 0
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                table_cells += 1
                parts.append(cell.text)
    text = _clean("\n".join(parts))
    return text, {"pages": None, "tables": len(doc.tables), "table_cells": table_cells, "scanned_suspected": False}


def extract_text(filename: str, data: bytes) -> tuple[str, dict]:
    name = filename.lower()
    if name.endswith(".pdf"):
        text, meta = extract_pdf(data)
    elif name.endswith(".docx"):
        text, meta = extract_docx(data)
    else:
        raise ExtractionError("Unsupported file type. Upload a PDF or DOCX.")
    if len(text) < 50:
        raise ExtractionError(
            "Very little text was extracted. If this is a scanned/image resume, export a text-based PDF or use DOCX."
        )
    meta["characters"] = len(text)
    meta["words"] = len(text.split())
    return text, meta
