from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ProjectHealthRequest(BaseModel):
    project_id: str
    total_tasks: int
    completed_tasks: int
    overdue_tasks_count: int
    overdue_critical_high_count: int = 0
    blocked_tasks_count: int
    critical_path_delayed_count: int = 0
    average_utilization_pct: float = 75.0
    pending_reviews_count: int = 0
    milestones_total: int = 0
    milestones_overdue: int = 0
    milestones_at_risk: int = 0

class HealthFactor(BaseModel):
    name: str
    weight_pct: float
    score: float # 0 - 100
    impact: str # "Positive", "Neutral", "Degraded", "Severe"
    detail: str

class ActionableRecommendation(BaseModel):
    id: str
    category: str # "Dependency", "Workload", "Milestone", "Quality/Review", "Scope"
    title: str
    description: str
    priority: str # "High", "Medium", "Low"
    suggested_action: str
    impact_statement: str

class ProjectHealthResponse(BaseModel):
    project_id: str
    health_score: float # 0 - 100
    risk_level: str # "Healthy" (>=80), "At Risk" (50-79), "Critical" (<50)
    risk_color: str # "green", "orange", "red"
    summary: str
    factors: List[HealthFactor]
    recommendations: List[ActionableRecommendation]
