import pytest
from app.models.contribution_models import (
    ContributionAnalysisRequest,
    MemberActivityRaw
)
from app.services.contribution_service import analyze_team_contributions

def test_contribution_analysis_fair_signals():
    members = [
        MemberActivityRaw(
            user_id="u1",
            name="Priya Mehta",
            tasks_assigned=6,
            tasks_completed=5,
            tasks_in_progress=1,
            estimated_hours_completed=18.0,
            actual_hours_logged=19.0,
            reviews_conducted=4,
            reviews_approved=3,
            blockers_reported=1,
            blockers_resolved=2,
            on_time_completions=5,
            late_completions=0
        )
    ]

    req = ContributionAnalysisRequest(
        project_id="proj-1",
        members_activity=members,
        total_project_tasks=6
    )

    resp = analyze_team_contributions(req)
    assert len(resp.team_indicators) == 1
    ind = resp.team_indicators[0]

    assert ind.user_id == "u1"
    assert ind.timeliness_score == 100.0
    assert ind.composite_contribution_index > 75.0
    assert len(ind.key_strengths) > 0
    assert "heuristic" in ind.transparency_notes.lower() or "indicator" in ind.transparency_notes.lower()
