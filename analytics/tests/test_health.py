import pytest
from app.models.health_models import ProjectHealthRequest
from app.services.health_service import evaluate_project_health

def test_project_health_evaluation():
    # Healthy scenario
    req_healthy = ProjectHealthRequest(
        project_id="proj-1",
        total_tasks=20,
        completed_tasks=14,
        overdue_tasks_count=0,
        overdue_critical_high_count=0,
        blocked_tasks_count=0,
        critical_path_delayed_count=0,
        average_utilization_pct=80.0,
        pending_reviews_count=1,
        milestones_total=3,
        milestones_overdue=0,
        milestones_at_risk=0
    )
    resp_healthy = evaluate_project_health(req_healthy)
    assert resp_healthy.risk_level == "Healthy"
    assert resp_healthy.health_score >= 80.0

    # At Risk scenario with blockers and overdue tasks
    req_risky = ProjectHealthRequest(
        project_id="proj-2",
        total_tasks=20,
        completed_tasks=8,
        overdue_tasks_count=3,
        overdue_critical_high_count=2,
        blocked_tasks_count=2,
        critical_path_delayed_count=1,
        average_utilization_pct=115.0,
        pending_reviews_count=4,
        milestones_total=4,
        milestones_overdue=1,
        milestones_at_risk=1
    )
    resp_risky = evaluate_project_health(req_risky)
    assert resp_risky.risk_level in ["At Risk", "Critical"]
    assert resp_risky.health_score < 75.0
    assert len(resp_risky.recommendations) >= 2
