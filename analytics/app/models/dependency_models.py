from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class DependencyEdge(BaseModel):
    predecessor_id: str
    successor_id: str
    dependency_type: str = "finish_to_start"

class TaskNode(BaseModel):
    id: str
    title: str
    status: str = "To Do" # Backlog, To Do, In Progress, In Review, Blocked, Done
    priority: str = "Medium" # Low, Medium, High, Critical
    estimated_hours: float = 0.0
    remaining_hours: float = 0.0
    actual_hours: float = 0.0
    start_date: Optional[str] = None
    deadline: Optional[str] = None
    dependencies: List[str] = Field(default_factory=list) # IDs of tasks this task depends on (predecessors)
    assignee_id: Optional[str] = None
    assignee_name: Optional[str] = None

class DependencyAnalysisRequest(BaseModel):
    project_id: str
    tasks: List[TaskNode]
    project_start_date: Optional[str] = None
    project_target_deadline: Optional[str] = None

class BlockedTaskDetail(BaseModel):
    task_id: str
    task_title: str
    status: str
    block_type: str # "direct_block", "at_risk", "critical_path_delay"
    reason: str
    unmet_predecessors: List[str]
    delay_impact_hours: float = 0.0

class CPMTaskMetrics(BaseModel):
    task_id: str
    early_start: float
    early_finish: float
    late_start: float
    late_finish: float
    total_slack: float
    is_critical: bool
    is_blocked: bool
    delay_hours: float = 0.0
    projected_finish_date: Optional[str] = None

class DependencyAnalysisResponse(BaseModel):
    project_id: str
    has_cycle: bool
    cycle_nodes: List[str] = Field(default_factory=list)
    topological_order: List[str] = Field(default_factory=list)
    critical_path: List[str] = Field(default_factory=list)
    project_duration_hours: float = 0.0
    blocked_tasks: List[BlockedTaskDetail] = Field(default_factory=list)
    at_risk_tasks: List[BlockedTaskDetail] = Field(default_factory=list)
    cpm_metrics: Dict[str, CPMTaskMetrics] = Field(default_factory=dict)
    summary: str

class AffectedTaskDetail(BaseModel):
    task_id: str
    task_title: str
    original_early_start: float
    new_early_start: float
    original_early_finish: float
    new_early_finish: float
    delay_shift_hours: float
    is_critical: bool

class DelayPropagationRequest(BaseModel):
    project_id: str
    tasks: List[TaskNode]
    delayed_task_id: str
    delay_hours: float

class DelayPropagationResponse(BaseModel):
    project_id: str
    delayed_task_id: str
    delay_hours: float
    original_duration_hours: float
    new_duration_hours: float
    schedule_slippage_hours: float
    affected_tasks: List[AffectedTaskDetail] = Field(default_factory=list)
    critical_path: List[str] = Field(default_factory=list)
    summary: str
