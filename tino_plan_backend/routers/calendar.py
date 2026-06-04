"""
Sprint 2: 캘린더 개인 일정 CRUD API 라우터
- GET    /api/calendar/events
- POST   /api/calendar/events
- PUT    /api/calendar/events/{event_id}
- DELETE /api/calendar/events/{event_id}
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/calendar", tags=["Sprint2 - 캘린더"])

# 인메모리 저장소 (실제 서비스에서는 DB로 교체)
_events: dict[str, dict] = {}


# ── 요청/응답 모델 ────────────────────────────────────────────────

class EventCreate(BaseModel):
    user_id: str
    title: str
    subject: Optional[str] = ""
    due_date: str          # ISO 8601: "2026-05-30T23:59:00"
    type: str = "personal" # personal | assignment | exam


class EventUpdate(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    due_date: Optional[str] = None
    type: Optional[str] = None


class EventResponse(BaseModel):
    id: str
    user_id: str
    title: str
    subject: str
    due_date: str
    type: str
    created_at: str


# ── 헬퍼 ─────────────────────────────────────────────────────────

def user_events(user_id: str) -> list[dict]:
    return [e for e in _events.values() if e["user_id"] == user_id]


# ── 엔드포인트 ───────────────────────────────────────────────────

@router.get("/events", response_model=list[EventResponse], summary="개인 일정 목록 조회")
async def get_events(user_id: str, type: Optional[str] = None):
    """
    사용자의 개인 일정 목록을 반환합니다.
    type 파라미터로 personal / assignment / exam 필터링 가능합니다.
    """
    events = user_events(user_id)
    if type:
        events = [e for e in events if e["type"] == type]
    return events


@router.post("/events", response_model=EventResponse, status_code=201, summary="개인 일정 추가")
async def create_event(event: EventCreate):
    """새 개인 일정을 추가합니다."""
    event_id = str(uuid.uuid4())
    new_event = {
        "id": event_id,
        "user_id": event.user_id,
        "title": event.title,
        "subject": event.subject or "",
        "due_date": event.due_date,
        "type": event.type,
        "created_at": datetime.now().isoformat(),
    }
    _events[event_id] = new_event
    return new_event


@router.put("/events/{event_id}", response_model=EventResponse, summary="개인 일정 수정")
async def update_event(event_id: str, update: EventUpdate):
    """기존 개인 일정을 수정합니다."""
    event = _events.get(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="일정을 찾을 수 없습니다.")

    if update.title is not None:
        event["title"] = update.title
    if update.subject is not None:
        event["subject"] = update.subject
    if update.due_date is not None:
        event["due_date"] = update.due_date
    if update.type is not None:
        event["type"] = update.type

    return event


@router.delete("/events/{event_id}", summary="개인 일정 삭제")
async def delete_event(event_id: str):
    """개인 일정을 삭제합니다."""
    if event_id not in _events:
        raise HTTPException(status_code=404, detail="일정을 찾을 수 없습니다.")
    del _events[event_id]
    return {"success": True, "message": "삭제 완료"}
