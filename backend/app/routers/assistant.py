from __future__ import annotations

from fastapi import APIRouter, Depends

from app.db.models import User
from app.dependencies.auth import get_current_user_optional
from app.models.assistant import AssistantMessage, AssistantReply
from app.models.factory_plan import GeneratePlanRequest, GeneratePlanResponse
from app.services import assistant_service

router = APIRouter(prefix="/assistant", tags=["assistant"])


@router.post(
    "/chat",
    response_model=AssistantReply,
    summary="Chat with the factory assistant",
)
async def chat(
    payload: AssistantMessage,
    current_user: User | None = Depends(get_current_user_optional),
) -> AssistantReply:
    """Send a message to the virtual assistant and receive a contextual reply.

    Auth is optional: the widget is reachable on public pages, so an anonymous
    request still works (it just has no per-user blueprints/plans). With a JWT
    (or in demo mode) the assistant reports the user's own data.
    """
    return await assistant_service.chat(payload.message, current_user)


@router.post(
    "/generate-plan",
    response_model=GeneratePlanResponse,
    summary="Generate a factory plan from a natural-language prompt",
)
async def generate_plan(payload: GeneratePlanRequest) -> GeneratePlanResponse:
    """Map a free-text request (e.g. "120 iron plates/min") to a deterministic plan.

    The LLM only extracts the target items; every machine count, ratio and raw
    input is computed by the deterministic calculator. Calculation only — it does
    not persist anything, so it is reachable anonymously and in demo mode. Saving
    the result as a plan goes through the normal (auth + demo-guarded) /plans API.
    """
    return await assistant_service.generate_plan(payload.prompt)
