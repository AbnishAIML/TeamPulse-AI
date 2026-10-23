from typing import List
from ..models.contribution_models import (
    ContributionAnalysisRequest,
    ContributionAnalysisResponse,
    ContributionIndicator,
    MemberActivityRaw
)

def analyze_team_contributions(request: ContributionAnalysisRequest) -> ContributionAnalysisResponse:
    indicators: List[ContributionIndicator] = []

    for mem in request.members_activity:
        # 1. Task Completion Score (0-100)
        # Based on proportion of assigned tasks completed and hours completed
        if mem.tasks_assigned > 0:
            task_ratio = min(1.0, mem.tasks_completed / mem.tasks_assigned)
            completion_score = task_ratio * 70.0 + min(30.0, (mem.estimated_hours_completed / 10.0) * 10.0)
        else:
            completion_score = 50.0 if mem.tasks_completed > 0 else 0.0

        # 2. Effort Accuracy Score (0-100)
        # Measures realistic planning vs actual logged effort (closeness to 1.0 ratio)
        if mem.estimated_hours_completed > 0 and mem.actual_hours_logged > 0:
            ratio = mem.actual_hours_logged / mem.estimated_hours_completed
            # Deviation penalty
            deviation = abs(1.0 - ratio)
            effort_accuracy = max(40.0, 100.0 - (deviation * 45.0))
        elif mem.tasks_completed > 0:
            effort_accuracy = 75.0
        else:
            effort_accuracy = 60.0

        # 3. Collaboration & Peer Review Score (0-100)
        # Recognizes code review, providing feedback, and quality gate stewardship
        review_volume = mem.reviews_conducted
        review_score = min(100.0, (review_volume * 25.0) + (mem.reviews_approved * 10.0) + (mem.comments_posted * 3.0))
        if review_score == 0 and mem.tasks_completed > 0:
            review_score = 45.0 # baseline participation

        # 4. Problem Solving Score (0-100)
        # Recognizes surfacing blockers early and actively resolving them
        problem_score = min(100.0, (mem.blockers_resolved * 35.0) + (mem.blockers_reported * 15.0) + 40.0)

        # 5. Timeliness Score (0-100)
        total_finished = mem.on_time_completions + mem.late_completions
        if total_finished > 0:
            timeliness = (mem.on_time_completions / total_finished) * 100.0
        else:
            timeliness = 80.0 # Neutral initial expectation

        # Weighted Composite Index:
        # 35% Completion, 20% Timeliness, 15% Review/Collaboration, 15% Effort Accuracy, 15% Problem Solving
        composite = (
            (completion_score * 0.35) +
            (timeliness * 0.20) +
            (review_score * 0.15) +
            (effort_accuracy * 0.15) +
            (problem_score * 0.15)
        )
        composite = round(min(100.0, max(0.0, composite)), 1)

        # Identify strengths
        strengths: List[str] = []
        if completion_score >= 80:
            strengths.append("High completion commitment fulfillment")
        if timeliness >= 85:
            strengths.append("Exceptional on-time milestone delivery")
        if review_score >= 70:
            strengths.append("Active peer reviewer and quality guardian")
        if problem_score >= 75:
            strengths.append("Effective unblocker and problem solver")
        if effort_accuracy >= 80:
            strengths.append("High estimation accuracy and reliable scoping")
        if not strengths:
            strengths.append("Steady active contributor to ongoing sprint")

        indicator = ContributionIndicator(
            user_id=mem.user_id,
            name=mem.name,
            task_completion_score=round(completion_score, 1),
            effort_accuracy_score=round(effort_accuracy, 1),
            collaboration_review_score=round(review_score, 1),
            problem_solving_score=round(problem_score, 1),
            timeliness_score=round(timeliness, 1),
            composite_contribution_index=composite,
            key_strengths=strengths,
            transparency_notes=(
                "Multi-dimensional indicator reflecting deliverable completions, peer review participation, "
                "estimation precision, and blocker resolution. This metric is intended to assist equitable work "
                "distribution and does not substitute for holistic team reflection."
            )
        )
        indicators.append(indicator)

    return ContributionAnalysisResponse(
        project_id=request.project_id,
        team_indicators=indicators,
        methodology_statement=(
            "Contribution Analysis evaluates five distinct dimensions (Completion, Timeliness, Collaboration, "
            "Estimation Accuracy, and Problem Solving) rather than simplistic task counts or raw hours logged."
        )
    )
