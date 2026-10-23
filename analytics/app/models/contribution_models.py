from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class MemberActivityRaw(BaseModel):
    user_id: str
    name: str
    tasks_assigned: int = 0
    tasks_completed: int = 0
    tasks_in_progress: int = 0
    estimated_hours_completed: float = 0.0
    actual_hours_logged: float = 0.0
    reviews_conducted: int = 0
    reviews_approved: int = 0
    reviews_rejected: int = 0
    blockers_reported: int = 0
    blockers_resolved: int = 0
    on_time_completions: int = 0
    late_completions: int = 0
    comments_posted: int = 0

class ContributionAnalysisRequest(BaseModel):
    project_id: str
    members_activity: List[MemberActivityRaw]
    total_project_tasks: int

class ContributionIndicator(BaseModel):
    user_id: str
    name: str
    task_completion_score: float # 0 - 100 based on completion ratio & commitment fulfillment
    effort_accuracy_score: float # 0 - 100 based on estimated vs actual hours ratio
    collaboration_review_score: float # 0 - 100 based on peer reviews conducted & approvals
    problem_solving_score: float # 0 - 100 based on blockers identified & resolved
    timeliness_score: float # 0 - 100 based on on-time delivery rate
    composite_contribution_index: float # 0 - 100 transparent weighted composite score
    key_strengths: List[str]
    transparency_notes: str # Explanation that this is an indicative signal, not a measure of individual worth

class ContributionAnalysisResponse(BaseModel):
    project_id: str
    team_indicators: List[ContributionIndicator]
    methodology_statement: str
