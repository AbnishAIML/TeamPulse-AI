import uuid
from typing import List
from ..models.health_models import (
    ProjectHealthRequest,
    ProjectHealthResponse,
    HealthFactor,
    ActionableRecommendation
)

def evaluate_project_health(req: ProjectHealthRequest) -> ProjectHealthResponse:
    factors: List[HealthFactor] = []
    recommendations: List[ActionableRecommendation] = []

    # 1. Milestone Delivery Factor (Weight: 25%)
    milestone_score = 100.0
    if req.milestones_total > 0:
        if req.milestones_overdue > 0:
            milestone_score -= min(60.0, req.milestones_overdue * 30.0)
        if req.milestones_at_risk > 0:
            milestone_score -= min(30.0, req.milestones_at_risk * 15.0)
    milestone_score = max(20.0, milestone_score)
    
    m_impact = "Positive" if milestone_score >= 80 else ("Degraded" if milestone_score >= 50 else "Severe")
    factors.append(HealthFactor(
        name="Milestone Schedule Variance",
        weight_pct=25.0,
        score=round(milestone_score, 1),
        impact=m_impact,
        detail=f"{req.milestones_overdue} milestone(s) overdue, {req.milestones_at_risk} at risk of delay."
    ))

    # 2. Critical & Overdue Tasks Factor (Weight: 25%)
    overdue_score = 100.0
    if req.overdue_critical_high_count > 0:
        overdue_score -= min(60.0, req.overdue_critical_high_count * 20.0)
    if req.overdue_tasks_count > req.overdue_critical_high_count:
        other_overdue = req.overdue_tasks_count - req.overdue_critical_high_count
        overdue_score -= min(25.0, other_overdue * 8.0)
    overdue_score = max(10.0, overdue_score)

    o_impact = "Positive" if overdue_score >= 80 else ("Degraded" if overdue_score >= 50 else "Severe")
    factors.append(HealthFactor(
        name="Overdue High-Priority Tasks",
        weight_pct=25.0,
        score=round(overdue_score, 1),
        impact=o_impact,
        detail=f"{req.overdue_critical_high_count} critical/high priority and {req.overdue_tasks_count} total task(s) overdue."
    ))

    # 3. Blocked Tasks & Dependencies Factor (Weight: 20%)
    blocked_score = 100.0
    if req.blocked_tasks_count > 0:
        blocked_score -= min(65.0, req.blocked_tasks_count * 25.0)
    blocked_score = max(20.0, blocked_score)

    b_impact = "Positive" if blocked_score >= 85 else ("Degraded" if blocked_score >= 50 else "Severe")
    factors.append(HealthFactor(
        name="Task Blockers & Dependency Chains",
        weight_pct=20.0,
        score=round(blocked_score, 1),
        impact=b_impact,
        detail=f"{req.blocked_tasks_count} active blocker(s) obstructing workflow."
    ))

    # 4. Critical Path Schedule Float (Weight: 15%)
    cp_score = 100.0
    if req.critical_path_delayed_count > 0:
        cp_score -= min(60.0, req.critical_path_delayed_count * 25.0)
    cp_score = max(30.0, cp_score)

    cp_impact = "Positive" if cp_score >= 80 else ("Degraded" if cp_score >= 50 else "Severe")
    factors.append(HealthFactor(
        name="Critical Path Execution",
        weight_pct=15.0,
        score=round(cp_score, 1),
        impact=cp_impact,
        detail=f"{req.critical_path_delayed_count} task(s) on the critical path experiencing schedule delay."
    ))

    # 5. Workload Capacity & Review Gates (Weight: 15%)
    cap_score = 100.0
    if req.average_utilization_pct > 100.0:
        excess = req.average_utilization_pct - 100.0
        cap_score -= min(40.0, excess * 1.5)
    elif req.average_utilization_pct < 40.0:
        cap_score -= 15.0 # Underutilized capacity

    if req.pending_reviews_count > 3:
        cap_score -= min(25.0, (req.pending_reviews_count - 3) * 6.0)
    cap_score = max(25.0, cap_score)

    cap_impact = "Positive" if cap_score >= 80 else ("Degraded" if cap_score >= 50 else "Severe")
    factors.append(HealthFactor(
        name="Team Capacity & Quality Review Flow",
        weight_pct=15.0,
        score=round(cap_score, 1),
        impact=cap_impact,
        detail=f"Average team utilization is {req.average_utilization_pct}%, with {req.pending_reviews_count} pending reviews."
    ))

    # Calculate overall health score
    health_score = sum((f.score * (f.weight_pct / 100.0)) for f in factors)
    health_score = round(min(100.0, max(0.0, health_score)), 1)

    if health_score >= 80.0:
        risk_level = "Healthy"
        risk_color = "green"
        summary = "Project is tracking well against targets with healthy velocity and minimal schedule variance."
    elif health_score >= 50.0:
        risk_level = "At Risk"
        risk_color = "orange"
        summary = "Project requires attention: active blockers or workload imbalances threaten upcoming milestones."
    else:
        risk_level = "Critical"
        risk_color = "red"
        summary = "Project is in critical condition with multiple overdue deliverables, severe blockers, or critical path slippage."

    # Actionable Recommendations
    if req.blocked_tasks_count > 0:
        recommendations.append(ActionableRecommendation(
            id=f"rec-{uuid.uuid4().hex[:8]}",
            category="Dependency",
            title="Resolve Upstream Dependency Blockers",
            description=f"There are {req.blocked_tasks_count} task(s) waiting on unfinished predecessors.",
            priority="High",
            suggested_action="Review the dependency view to inspect root-cause predecessors and reassign or expedite them.",
            impact_statement="Unblocks downstream tasks and prevents secondary schedule slippage."
        ))

    if req.overdue_critical_high_count > 0:
        recommendations.append(ActionableRecommendation(
            id=f"rec-{uuid.uuid4().hex[:8]}",
            category="Milestone",
            title="Fast-Track Overdue High Priority Items",
            description=f"{req.overdue_critical_high_count} high/critical priority item(s) are past their target deadlines.",
            priority="High",
            suggested_action="Pair program or reallocate team capacity to clear high-priority backlog.",
            impact_statement="Directly protects final delivery date and restores milestone velocity."
        ))

    if req.average_utilization_pct > 95.0:
        recommendations.append(ActionableRecommendation(
            id=f"rec-{uuid.uuid4().hex[:8]}",
            category="Workload",
            title="Rebalance Workload from Overloaded Teammates",
            description=f"Team utilization is at {req.average_utilization_pct}%, which creates burnout and delivery risks.",
            priority="Medium",
            suggested_action="Accept recommended task redistributions from the Workload Analysis module.",
            impact_statement="Levels team burden and prevents key-person bottlenecks."
        ))

    if req.pending_reviews_count > 2:
        recommendations.append(ActionableRecommendation(
            id=f"rec-{uuid.uuid4().hex[:8]}",
            category="Quality/Review",
            title="Clear Pending Review Queue",
            description=f"{req.pending_reviews_count} deliverable(s) are awaiting review and sign-off.",
            priority="Medium",
            suggested_action="Assign designated reviewers to unblock tasks awaiting approval to move to 'Done'.",
            impact_statement="Ensures quality standards while maintaining smooth throughput to 'Done'."
        ))

    if not recommendations:
        recommendations.append(ActionableRecommendation(
            id=f"rec-{uuid.uuid4().hex[:8]}",
            category="Scope",
            title="Maintain Steady Sprint Cadence",
            description="All key health indicators are in optimal ranges.",
            priority="Low",
            suggested_action="Continue daily standups and keep effort estimates updated as work progresses.",
            impact_statement="Sustains high velocity through milestone completion."
        ))

    return ProjectHealthResponse(
        project_id=req.project_id,
        health_score=health_score,
        risk_level=risk_level,
        risk_color=risk_color,
        summary=summary,
        factors=factors,
        recommendations=recommendations
    )
