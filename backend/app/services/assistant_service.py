from __future__ import annotations

import re

from app.config import settings
from app.models.assistant import AssistantAction, AssistantReply
from app.services import blueprint_service, gamedata_service, plan_service

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
# Reply builders
# ---------------------------------------------------------------------------


def chat(message: str) -> AssistantReply:  # noqa: PLR0911
    intent = _detect_intent(message)

    if intent == "greet":
        return AssistantReply(
            reply=(
                "Bonjour ! Je suis l'assistant du Factory Manager. "
                "Je peux vous aider avec vos blueprints, plans de production et calculs. "
                "Que souhaitez-vous faire ?"
            ),
            actions=[
                AssistantAction(label="📁 Blueprints", url="/blueprints"),
                AssistantAction(label="📋 Plans", url="/plans"),
                AssistantAction(label="🧮 Calculateur", url="/calculator"),
            ],
        )

    if intent == "blueprints":
        try:
            bps = blueprint_service.list_blueprints(settings.blueprints_dir)
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
            plans = plan_service.list_plans(settings.data_dir)
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
            items = gamedata_service.list_items(settings.gamedata_dir, "")
            count = len(items)
            plural = "s" if count != 1 else ""
            reply = f"Il y a {count} item{plural} disponible{plural} dans les données de jeu."
        except Exception:  # noqa: BLE001
            reply = (
                "Aucune donnée de jeu importée. "
                "Importez un ZIP depuis la page Données de jeu pour commencer."
            )
        return AssistantReply(
            reply=reply,
            actions=[AssistantAction(label="🎮 Données de jeu", url="/gamedata")],
        )

    if intent == "recipes":
        try:
            recipes = gamedata_service.list_recipes(settings.gamedata_dir, "")
            count = len(recipes)
            plural = "s" if count != 1 else ""
            reply = f"Il y a {count} recette{plural} disponible{plural} dans les données de jeu."
        except Exception:  # noqa: BLE001
            reply = "Aucune donnée de jeu importée. Importez un ZIP pour accéder aux recettes."
        return AssistantReply(
            reply=reply,
            actions=[AssistantAction(label="🎮 Données de jeu", url="/gamedata")],
        )

    if intent == "gamedata":
        try:
            stats = gamedata_service.get_stats(settings.gamedata_dir)
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
            actions=[
                AssistantAction(label="📁 Blueprints", url="/blueprints"),
                AssistantAction(label="📋 Plans", url="/plans"),
                AssistantAction(label="🧮 Calculateur", url="/calculator"),
            ],
        )

    return AssistantReply(
        reply=(
            "Je n'ai pas bien compris votre demande. "
            "Essayez de me demander des informations sur vos blueprints, plans, "
            "le calculateur ou les données de jeu."
        ),
        actions=[
            AssistantAction(label="📁 Blueprints", url="/blueprints"),
            AssistantAction(label="📋 Plans", url="/plans"),
        ],
    )
