from __future__ import annotations

import logging
import re

from app.config import settings
from app.db.models import User
from app.fixtures import (
    demo_blueprints,
    demo_gamedata_stats,
    demo_items_filtered,
    demo_plans,
    demo_recipes_filtered,
)
from app.models.assistant import AssistantAction, AssistantReply
from app.models.blueprint import BlueprintRead
from app.models.factory_plan import GeneratePlanResponse
from app.models.gamedata import GameDataStats, ItemSummary, RecipeIngredient, RecipeSummary
from app.models.plan import PlanRead
from app.services import (
    ai_client,
    blueprint_service,
    gamedata_service,
    plan_generator,
    plan_service,
)
from app.services.user_storage import user_blueprints_dir, user_data_dir

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Data sources — demo-aware and per-user, mirroring the routers so the
# assistant reports the same numbers the rest of the app shows. In demo mode
# everything comes from fixtures; otherwise blueprints/plans are scoped to the
# authenticated user (None → empty, e.g. the public pages without a session).
# ---------------------------------------------------------------------------


def _user_blueprints(user: User | None) -> list[BlueprintRead]:
    if settings.demo_mode:
        return demo_blueprints()
    if user is None:
        return []
    return blueprint_service.list_blueprints(user_blueprints_dir(user.id))


def _user_plans(user: User | None) -> list[PlanRead]:
    if settings.demo_mode:
        return demo_plans()
    if user is None:
        return []
    return plan_service.list_plans(user_data_dir(user.id))


def _gamedata_stats() -> GameDataStats:
    if settings.demo_mode:
        return demo_gamedata_stats()
    return gamedata_service.get_stats(settings.gamedata_dir)


def _gamedata_items(query: str = "") -> list[ItemSummary]:
    if settings.demo_mode:
        return demo_items_filtered(query)
    return gamedata_service.list_items(settings.gamedata_dir, query)


def _gamedata_recipes(query: str = "") -> list[RecipeSummary]:
    if settings.demo_mode:
        return demo_recipes_filtered(query)
    return gamedata_service.list_recipes(settings.gamedata_dir, query)


# ---------------------------------------------------------------------------
# Intent detection — ordered: first match wins
# ---------------------------------------------------------------------------

_INTENTS: list[tuple[str, list[str]]] = [
    ("greet", ["bonjour", "salut", "hello", "hi", "hey", "coucou"]),
    ("blueprints", ["blueprint", "schéma", "schema", "fichier", "sbp"]),
    ("plans", ["plan", "plans"]),
    ("calculator", ["calcul", "calculer", "calculateur", "fabriquer", "craft", "fabriqu"]),
    ("items", ["item", "items", "objet", "ressource", "matériau", "mineral", "minerai"]),
    ("recipes", ["recette", "recipe", "recipes", "recettes"]),
    ("gamedata", ["données", "data", "jeu", "game", "importer", "import", "zip"]),
    ("help", ["aide", "help", "quoi", "what", "comment", "capable", "fonctionn"]),
]


def _detect_intent(message: str) -> str:
    msg = message.lower()
    for intent, keywords in _INTENTS:
        if any(re.search(r"\b" + kw, msg) for kw in keywords):
            return intent
    return "fallback"


# ---------------------------------------------------------------------------
# Navigation actions attached to a reply
# ---------------------------------------------------------------------------

_ACTION_BLUEPRINTS = AssistantAction(label="📁 Blueprints", url="/blueprints")
_ACTION_PLANS = AssistantAction(label="📋 Plans", url="/plans")
_ACTION_CALCULATOR = AssistantAction(label="🧮 Calculateur", url="/calculator")
_ACTION_GAMEDATA = AssistantAction(label="🎮 Données de jeu", url="/gamedata")

_DEFAULT_ACTIONS = [_ACTION_BLUEPRINTS, _ACTION_PLANS, _ACTION_CALCULATOR]

_INTENT_ACTIONS: dict[str, list[AssistantAction]] = {
    "blueprints": [_ACTION_BLUEPRINTS],
    "plans": [_ACTION_PLANS],
    "calculator": [_ACTION_CALCULATOR],
    "items": [_ACTION_GAMEDATA],
    "recipes": [_ACTION_GAMEDATA],
    "gamedata": [_ACTION_GAMEDATA],
}


def _actions_for_intent(intent: str) -> list[AssistantAction]:
    return _INTENT_ACTIONS.get(intent, _DEFAULT_ACTIONS)


# ---------------------------------------------------------------------------
# LLM path (L10) — grounded prompt + ai-aggregator, falls back to rules
# ---------------------------------------------------------------------------

_SYSTEM_PROMPT = (
    "You are the in-app assistant of a Satisfactory (Coffee Stain Studios) factory "
    "planning tool. Answer the player's question about production chains, machine "
    "ratios, alternate recipes and bottlenecks. Be concrete and concise (a few short "
    "paragraphs or a short list). Reply in the same language as the question. Use ONLY "
    "the game data provided below — if it is insufficient, say so plainly instead of "
    "inventing recipes or numbers."
)

MAX_CONTEXT_RECIPES = 8
MIN_KEYWORD_LEN = 4


def _match_recipes(message: str) -> list[RecipeSummary]:
    """Find recipes whose name/id contains a significant word from the message."""
    tokens = re.findall(r"[a-zàâäéèêëïîôöùûüç]+", message.lower())
    words = {w for w in tokens if len(w) >= MIN_KEYWORD_LEN}
    if not words:
        return []
    matched: dict[str, RecipeSummary] = {}
    try:
        for word in words:
            for recipe in _gamedata_recipes(word):
                matched[recipe.id] = recipe
                if len(matched) >= MAX_CONTEXT_RECIPES:
                    return list(matched.values())
    except Exception:  # noqa: BLE001 — context is best-effort; missing data is fine
        return []
    return list(matched.values())


def _item_names(recipes: list[RecipeSummary]) -> dict[str, str]:
    needed = {ing.item_id for r in recipes for ing in (r.ingredients + r.products)}
    if not needed:
        return {}
    try:
        items = _gamedata_items()
    except Exception:  # noqa: BLE001
        return {}
    return {i.id: i.name for i in items if i.id in needed}


def _format_recipe(recipe: RecipeSummary, names: dict[str, str]) -> str:
    def side(parts: list[RecipeIngredient]) -> str:
        return ", ".join(f"{p.amount:g}x {names.get(p.item_id, p.item_id)}" for p in parts)

    duration = f" in {recipe.time:g}s" if recipe.time else ""
    return f"  * {recipe.name}: [{side(recipe.ingredients)}] -> [{side(recipe.products)}]{duration}"


def _gather_context(message: str) -> str:
    lines: list[str] = []
    try:
        stats = _gamedata_stats()
    except Exception:  # noqa: BLE001
        stats = None
    if stats and (stats.item_count or stats.recipe_count):
        lines.append(
            f"- Imported game data: {stats.item_count} items, {stats.recipe_count} recipes."
        )
    else:
        lines.append("- No game data imported yet.")

    recipes = _match_recipes(message)
    if recipes:
        names = _item_names(recipes)
        lines.append("- Recipes relevant to the question:")
        lines.extend(_format_recipe(r, names) for r in recipes)
    return "\n".join(lines)


def _build_prompt(message: str) -> str:
    return (
        f"{_SYSTEM_PROMPT}\n\n"
        f"## Game data context\n{_gather_context(message)}\n\n"
        f"## Player question\n{message}\n\n"
        f"## Answer\n"
    )


async def chat(message: str, user: User | None = None) -> AssistantReply:
    """Answer a player question, preferring the LLM and falling back to rules."""
    if settings.assistant_llm_enabled:
        text = await ai_client.complete(_build_prompt(message))
        if text:
            return AssistantReply(reply=text, actions=_actions_for_intent(_detect_intent(message)))
    return _rule_based_chat(message, user)


def _catalog() -> tuple[list[ItemSummary], list[RecipeSummary]]:
    """All items + recipes for plan generation; empty when no data is available."""
    try:
        return _gamedata_items(), _gamedata_recipes()
    except Exception:  # noqa: BLE001 — missing/unreadable gamedata → degrade to "no data"
        return [], []


async def generate_plan(prompt: str) -> GeneratePlanResponse:
    """Turn a natural-language prompt into a deterministic factory plan (L10b).

    Calculation only — it never persists anything, so it is allowed in demo mode
    (saving the result as a plan stays behind the demo-write guard on /plans).
    """
    items, recipes = _catalog()
    return await plan_generator.generate_plan(prompt, items, recipes)


# ---------------------------------------------------------------------------
# Rule-based fallback — deterministic, offline, no LLM required
# ---------------------------------------------------------------------------


def _rule_based_chat(message: str, user: User | None = None) -> AssistantReply:  # noqa: PLR0911
    intent = _detect_intent(message)

    if intent == "greet":
        return AssistantReply(
            reply=(
                "Bonjour ! Je suis l'assistant du Factory Manager. "
                "Je peux vous aider avec vos blueprints, plans de production et calculs. "
                "Que souhaitez-vous faire ?"
            ),
            actions=[_ACTION_BLUEPRINTS, _ACTION_PLANS, _ACTION_CALCULATOR],
        )

    if intent == "blueprints":
        try:
            bps = _user_blueprints(user)
            count = len(bps)
            plural = "s" if count != 1 else ""
            reply = f"Vous avez {count} blueprint{plural} dans votre collection."
        except Exception:  # noqa: BLE001
            reply = "Impossible d'accéder à vos blueprints pour l'instant."
        return AssistantReply(
            reply=reply,
            actions=[AssistantAction(label="📁 Gérer les blueprints", url="/blueprints")],
        )

    if intent == "plans":
        try:
            plans = _user_plans(user)
            count = len(plans)
            plural = "s" if count != 1 else ""
            reply = f"Vous avez {count} plan{plural} de production."
        except Exception:  # noqa: BLE001
            reply = "Impossible d'accéder à vos plans pour l'instant."
        return AssistantReply(
            reply=reply,
            actions=[AssistantAction(label="📋 Voir les plans", url="/plans")],
        )

    if intent == "calculator":
        return AssistantReply(
            reply=(
                "Le calculateur vous permet de planifier votre chaîne de production. "
                "Sélectionnez un item et une quantité cible pour obtenir la liste des "
                "ressources nécessaires et une vue graphique du flux."
            ),
            actions=[AssistantAction(label="🧮 Ouvrir le calculateur", url="/calculator")],
        )

    if intent == "items":
        try:
            items = _gamedata_items("")
            count = len(items)
            plural = "s" if count != 1 else ""
            reply = f"Il y a {count} item{plural} disponible{plural} dans les données de jeu."
        except Exception:  # noqa: BLE001
            reply = (
                "Aucune donnée de jeu importée. "
                "Importez un ZIP depuis la page Données de jeu pour commencer."
            )
        return AssistantReply(reply=reply, actions=[_ACTION_GAMEDATA])

    if intent == "recipes":
        try:
            recipes = _gamedata_recipes("")
            count = len(recipes)
            plural = "s" if count != 1 else ""
            reply = f"Il y a {count} recette{plural} disponible{plural} dans les données de jeu."
        except Exception:  # noqa: BLE001
            reply = "Aucune donnée de jeu importée. Importez un ZIP pour accéder aux recettes."
        return AssistantReply(reply=reply, actions=[_ACTION_GAMEDATA])

    if intent == "gamedata":
        try:
            stats = _gamedata_stats()
            reply = (
                f"Les données de jeu contiennent {stats.item_count} items "
                f"et {stats.recipe_count} recettes."
            )
        except Exception:  # noqa: BLE001
            reply = (
                "Aucune donnée de jeu n'est encore importée. "
                "Rendez-vous sur la page Données de jeu pour importer un fichier ZIP "
                "Satisfactory Tools."
            )
        return AssistantReply(
            reply=reply,
            actions=[AssistantAction(label="🎮 Aller aux données de jeu", url="/gamedata")],
        )

    if intent == "help":
        return AssistantReply(
            reply=(
                "Je peux vous aider à :\n"
                "• Consulter vos blueprints et plans de production\n"
                "• Planifier une production avec le calculateur\n"
                "• Vérifier les données de jeu importées\n"
                "• Naviguer dans l'application"
            ),
            actions=[_ACTION_BLUEPRINTS, _ACTION_PLANS, _ACTION_CALCULATOR],
        )

    return AssistantReply(
        reply=(
            "Je n'ai pas bien compris votre demande. "
            "Essayez de me demander des informations sur vos blueprints, plans, "
            "le calculateur ou les données de jeu."
        ),
        actions=[_ACTION_BLUEPRINTS, _ACTION_PLANS],
    )
