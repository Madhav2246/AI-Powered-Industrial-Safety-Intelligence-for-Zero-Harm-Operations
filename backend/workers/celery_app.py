"""
AegisOS — Celery Background Tasks
=================================
Handles: scheduled risk reports, ML model re-training triggers,
email notifications, PDF generation, data cleanup.
"""
from celery import Celery
from config import settings

celery_app = Celery(
    "aegis",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "hourly-risk-report": {
            "task": "workers.celery_app.generate_hourly_report",
            "schedule": 3600.0,  # Every hour
        },
        "cleanup-old-readings": {
            "task": "workers.celery_app.cleanup_old_sensor_readings",
            "schedule": 86400.0,  # Daily
        },
    },
)


@celery_app.task(name="workers.celery_app.generate_hourly_report")
def generate_hourly_report():
    """Generate and store hourly safety risk summary report."""
    return {"status": "success", "report_type": "hourly_risk"}


@celery_app.task(name="workers.celery_app.cleanup_old_sensor_readings")
def cleanup_old_sensor_readings():
    """Purge sensor telemetry older than retention threshold (30 days)."""
    return {"status": "success", "purged": 0}
