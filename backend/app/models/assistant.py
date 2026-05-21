from __future__ import annotations

from pydantic import BaseModel


class AssistantMessage(BaseModel):
    message: str


class AssistantAction(BaseModel):
    label: str
    url: str


class AssistantReply(BaseModel):
    reply: str
    actions: list[AssistantAction] = []
