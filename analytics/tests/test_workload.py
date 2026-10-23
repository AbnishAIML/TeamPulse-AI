import pytest
from app.models.workload_models import (
    WorkloadAnalysisRequest,
    MemberWorkloadInput,
    TaskWorkloadInput
)
from app.services.workload_service import analyze_team_workload

def test_workload_analysis_and_overload_warning():
    members = [
        MemberWorkloadInput(user_id="u1", name="Rahul Sharma", weekly_capacity_hours=20.0, skills=["Backend", "API"]),
        MemberWorkloadInput(user_id="u2", name="Arjun Verma", weekly_capacity_hours=20.0, skills=["Backend", "Testing"]),
    ]
    # Rahul has 26 hours assigned (overloaded), Arjun has 6 hours assigned (underutilized)
    tasks = [
        TaskWorkloadInput(id="t1", title="Task 1", assignee_id="u1", status="In Progress", remaining_hours=14.0),
        TaskWorkloadInput(id="t2", title="Task 2", assignee_id="u1", status="To Do", remaining_hours=12.0, tags=["Backend"]),
        TaskWorkloadInput(id="t3", title="Task 3", assignee_id="u2", status="To Do", remaining_hours=6.0, tags=["Testing"]),
    ]

    req = WorkloadAnalysisRequest(
        project_id="proj-1",
        members=members,
        tasks=tasks,
        overload_threshold_pct=100.0,
        underload_threshold_pct=50.0
    )

    resp = analyze_team_workload(req)

    rahul_metric = next(m for m in resp.members_metrics if m.user_id == "u1")
    arjun_metric = next(m for m in resp.members_metrics if m.user_id == "u2")

    assert rahul_metric.is_overloaded is True
    assert rahul_metric.utilization_pct == 130.0 # 26 / 20 * 100
    assert arjun_metric.is_underutilized is True
    assert arjun_metric.utilization_pct == 30.0 # 6 / 20 * 100

    # There should be an advisory redistribution recommendation
    assert len(resp.recommendations) >= 1
    rec = resp.recommendations[0]
    assert rec.current_assignee_id == "u1"
    assert rec.proposed_assignee_id == "u2"
    assert rec.task_id == "t2"
    assert rec.current_assignee_utilization_after < rahul_metric.utilization_pct
