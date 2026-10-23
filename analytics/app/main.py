from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from .models.dependency_models import (
    DependencyAnalysisRequest,
    DependencyAnalysisResponse
)
from .models.workload_models import (
    WorkloadAnalysisRequest,
    WorkloadAnalysisResponse
)
from .models.contribution_models import (
    ContributionAnalysisRequest,
    ContributionAnalysisResponse
)
from .models.health_models import (
    ProjectHealthRequest,
    ProjectHealthResponse
)
from .algorithms.dag import DependencyGraph
from .algorithms.cpm import calculate_cpm
from .services.workload_service import analyze_team_workload
from .services.contribution_service import analyze_team_contributions
from .services.health_service import evaluate_project_health

app = FastAPI(
    title="TeamPulse AI Analytics Engine",
    description="Intelligent analytics service for project management, DAG dependencies, CPM, workload balancing, and team contributions.",
    version="1.0.0"
)

# Enable CORS for backend and frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "service": "TeamPulse AI Analytics Engine",
        "status": "online",
        "version": "1.0.0"
    }

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "analytics"}

@app.post("/api/analytics/dependencies/analyze", response_model=DependencyAnalysisResponse)
def analyze_dependencies(request: DependencyAnalysisRequest):
    """
    Analyzes task dependencies using directed acyclic graph (DAG) algorithms.
    Detects cycles, calculates topological order, computes CPM metrics,
    and identifies directly blocked vs at-risk tasks.
    """
    try:
        dag = DependencyGraph(request.tasks)
        has_cycle, cycle_nodes = dag.detect_cycles()

        if has_cycle:
            return DependencyAnalysisResponse(
                project_id=request.project_id,
                has_cycle=True,
                cycle_nodes=cycle_nodes,
                topological_order=[],
                critical_path=[],
                project_duration_hours=0.0,
                blocked_tasks=[],
                at_risk_tasks=[],
                cpm_metrics={},
                summary=f"Dependency cycle detected involving tasks: {', '.join(cycle_nodes)}. Fix cyclical dependencies to enable scheduling."
            )

        topo_order = dag.get_topological_order()
        blocked_tasks, at_risk_tasks = dag.analyze_blockers()
        cpm_metrics, critical_path, total_duration = calculate_cpm(request.tasks, dag.graph)

        summary = (
            f"Analyzed {len(request.tasks)} tasks. Graph is a valid DAG. "
            f"Identified {len(blocked_tasks)} directly blocked task(s), {len(at_risk_tasks)} at-risk task(s), "
            f"and a critical path of {len(critical_path)} tasks with estimated duration {total_duration} hours."
        )

        return DependencyAnalysisResponse(
            project_id=request.project_id,
            has_cycle=False,
            cycle_nodes=[],
            topological_order=topo_order,
            critical_path=critical_path,
            project_duration_hours=total_duration,
            blocked_tasks=blocked_tasks,
            at_risk_tasks=at_risk_tasks,
            cpm_metrics=cpm_metrics,
            summary=summary
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dependency analysis failed: {str(e)}")

@app.post("/api/analytics/workload/analyze", response_model=WorkloadAnalysisResponse)
def analyze_workload(request: WorkloadAnalysisRequest):
    """
    Analyzes team capacity, remaining effort, and generates advisory redistribution recommendations.
    """
    try:
        return analyze_team_workload(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Workload analysis failed: {str(e)}")

@app.post("/api/analytics/contributions/analyze", response_model=ContributionAnalysisResponse)
def analyze_contributions(request: ContributionAnalysisRequest):
    """
    Calculates transparent multi-signal team and individual contribution indicators.
    """
    try:
        return analyze_team_contributions(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Contribution analysis failed: {str(e)}")

@app.post("/api/analytics/project-health/evaluate", response_model=ProjectHealthResponse)
def evaluate_health(request: ProjectHealthRequest):
    """
    Evaluates composite project health score (0-100), risk status, and actionable recommendations.
    """
    try:
        return evaluate_project_health(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Project health evaluation failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
