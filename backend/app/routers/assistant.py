from __future__ import annotations

from fastapi import APIRouter

from app.models.assistant import AssistantMessage, AssistantReply
from app.services import assistant_service

router = APIRouter(prefix="/assistant", tags=["assistant"])


@router.post(
    "/chat",
    response_model=AssistantReply,
    summary="Chat with the factory assistant",
)
def chat(payload: AssistantMessage) -> AssistantReply:
    """Send a message to the virtual assistant and receive a contextual reply."""
    return assistant_service.chat(payload.message)
