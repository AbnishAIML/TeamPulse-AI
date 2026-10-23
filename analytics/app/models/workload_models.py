from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class MemberWorkloadInput(BaseModel):
    user_id: str
    name: str
    weekly_capacity_hours: float = 20.0
    skills: List[str] = Field(default_factory=list)
    project_role: str = "Team Member"

class TaskWorkloadInput(BaseModel):
    id: str
    title: str
    assignee_id: Optional[str] = None
    assignee_name: Optional[str] = None
    status: str = "To Do"
    priority: str = "Medium" # Low, Medium, High, Critical
    estimated_hours: float = 0.0
    remaining_hours: float = 0.0
    actual_hours: float = 0.0
    deadline: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    is_blocked: bool = False
    dependencies: List[str] = Field(default_factory=list)

class WorkloadAnalysisRequest(BaseModel):
    project_id: str
    members: List[MemberWorkloadInput]
    tasks: List[TaskWorkloadInput]
    overload_threshold_pct: float = 100.0
    underload_threshold_pct: float = 50.0

class MemberWorkloadMetrics(BaseModel):
    user_id: str
    name: str
    weekly_capacity_hours: float
    total_assigned_tasks: int
    open_tasks: int
    in_progress_tasks: int
    blocked_tasks: int
    overdue_tasks: int
    review_tasks: int
    estimated_remaining_hours: float
    actual_logged_hours: float
    utilization_pct: float
    is_overloaded: bool
    is_underutilized: bool
    status_label: str # "Over capacity", "Optimal", "Underutilized"

class RedistributionRecommendation(BaseModel):
    id: str
    task_id: str
    task_title: str
    priority: str
    estimated_remaining_hours: float
    current_assignee_id: str
    current_assignee_name: str
    current_assignee_utilization_before: float
    current_assignee_utilization_after: float
    proposed_assignee_id: str
    proposed_assignee_name: str
    proposed_assignee_utilization_before: float
    proposed_assignee_utilization_after: float
    reason: str
    matching_skills: List[str] = Field(default_factory=list)
    risk_assessment: str
    priority_level: str # "High", "Medium", "Low"

class WorkloadAnalysisResponse(BaseModel):
    project_id: str
    team_total_capacity_hours: float
    team_total_assigned_hours: float
    team_average_utilization_pct: float
    members_metrics: List[MemberWorkloadMetrics]
    recommendations: List[RedistributionRecommendation]
    warnings: List[str]
    summary: str
