"""
AegisOS — Neo4j Graph Database Client
======================================
Async-compatible wrapper for Neo4j operations.
Used by agents for causal reasoning and knowledge graph queries.
"""
from neo4j import AsyncGraphDatabase
from loguru import logger
from config import settings

_driver = None


async def get_neo4j():
    global _driver
    if _driver is None:
        try:
            _driver = AsyncGraphDatabase.driver(
                settings.neo4j_uri,
                auth=(settings.neo4j_user, settings.neo4j_password),
            )
            await _driver.verify_connectivity()
            logger.info("✅ Neo4j connected")
        except Exception as e:
            logger.warning(f"Neo4j unavailable ({e}) — graph features disabled")
            _driver = None
    return _driver


async def query_zone_incidents(zone_id: str, limit: int = 5) -> list:
    """Fetch incidents linked to a zone from the knowledge graph."""
    driver = await get_neo4j()
    if not driver:
        return []

    cypher = """
    MATCH (z:Zone {id: $zone_id})<-[:OCCURRED_IN]-(i:Incident)
    RETURN i.title AS title, i.severity AS severity, i.root_cause AS root_cause
    LIMIT $limit
    """
    async with driver.session() as session:
        result = await session.run(cypher, zone_id=zone_id, limit=limit)
        records = await result.data()
        return records


async def close_neo4j():
    global _driver
    if _driver:
        await _driver.close()
        _driver = None
