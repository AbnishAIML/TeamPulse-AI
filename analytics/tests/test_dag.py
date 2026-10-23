import pytest
from app.models.dependency_models import TaskNode
from app.algorithms.dag import DependencyGraph
from app.algorithms.cpm import calculate_cpm

def test_dag_cycle_detection():
    # Task 1 -> Task 2 -> Task 3 -> Task 1 (Cycle)
    tasks = [
        TaskNode(id="t1", title="Task 1", dependencies=["t3"]),
        TaskNode(id="t2", title="Task 2", dependencies=["t1"]),
        TaskNode(id="t3", title="Task 3", dependencies=["t2"]),
    ]
    dag = DependencyGraph(tasks)
    has_cycle, cycle_nodes = dag.detect_cycles()
    assert has_cycle is True
    assert set(cycle_nodes).issubset({"t1", "t2", "t3"})
    assert dag.get_topological_order() == []

def test_dag_valid_topological_order():
    # Linear: t1 -> t2 -> t3
    tasks = [
        TaskNode(id="t1", title="Database Design", status="Done"),
        TaskNode(id="t2", title="Backend API", status="In Progress", dependencies=["t1"]),
        TaskNode(id="t3", title="Frontend Integration", status="To Do", dependencies=["t2"]),
    ]
    dag = DependencyGraph(tasks)
    has_cycle, cycle_nodes = dag.detect_cycles()
    assert has_cycle is False
    assert cycle_nodes == []
    
    order = dag.get_topological_order()
    assert order == ["t1", "t2", "t3"]

def test_blocker_detection_and_risk_propagation():
    # t1 (In Progress) -> t2 (Waiting on t1) -> t3 (Waiting on t2)
    tasks = [
        TaskNode(id="t1", title="Auth Module", status="In Progress", estimated_hours=6.0, remaining_hours=4.0),
        TaskNode(id="t2", title="User Profile API", status="To Do", dependencies=["t1"], estimated_hours=4.0),
        TaskNode(id="t3", title="Account Settings UI", status="To Do", dependencies=["t2"], estimated_hours=3.0),
    ]
    dag = DependencyGraph(tasks)
    blocked, at_risk = dag.analyze_blockers()

    # t2 should be directly blocked by t1
    assert any(b.task_id == "t2" and "Auth Module" in b.reason for b in blocked)
    # t3 should be at risk because its upstream predecessor t1 is not done
    assert any(r.task_id == "t3" for r in at_risk)

def test_cpm_critical_path():
    # Path A: t1 (4h) -> t2 (8h) [Total = 12h]
    # Path B: t3 (3h) -> t4 (3h) [Total = 6h]
    tasks = [
        TaskNode(id="t1", title="DB Schema", estimated_hours=4.0, remaining_hours=4.0, status="To Do"),
        TaskNode(id="t2", title="API Core", estimated_hours=8.0, remaining_hours=8.0, status="To Do", dependencies=["t1"]),
        TaskNode(id="t3", title="Docs", estimated_hours=3.0, remaining_hours=3.0, status="To Do"),
        TaskNode(id="t4", title="Landing Page", estimated_hours=3.0, remaining_hours=3.0, status="To Do", dependencies=["t3"]),
    ]
    dag = DependencyGraph(tasks)
    metrics, crit_path, duration = calculate_cpm(tasks, dag.graph)

    assert duration == 12.0
    assert "t1" in crit_path
    assert "t2" in crit_path
    assert metrics["t1"].total_slack == 0.0
    assert metrics["t2"].total_slack == 0.0
    # Non-critical tasks should have float/slack
    assert metrics["t3"].total_slack == 6.0
    assert metrics["t4"].total_slack == 6.0
