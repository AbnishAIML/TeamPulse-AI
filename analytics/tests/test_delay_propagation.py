import pytest
from app.models.dependency_models import TaskNode, DelayPropagationRequest
from app.algorithms.cpm import simulate_delay_propagation
from app.main import simulate_delay

def test_delay_propagation_algorithm():
    tasks = [
        TaskNode(id="T1", title="Design API", remaining_hours=10.0, estimated_hours=10.0, status="In Progress"),
        TaskNode(id="T2", title="Build Frontend", remaining_hours=20.0, estimated_hours=20.0, dependencies=["T1"], status="To Do"),
        TaskNode(id="T3", title="QA Test", remaining_hours=5.0, estimated_hours=5.0, dependencies=["T2"], status="To Do"),
    ]

    # Delay T1 by 5 hours
    orig_dur, new_dur, slippage, affected, crit = simulate_delay_propagation(tasks, "T1", 5.0)

    # Initial duration = 10 + 20 + 5 = 35.0
    assert orig_dur == 35.0
    # New duration = 15 + 20 + 5 = 40.0
    assert new_dur == 40.0
    # Slippage = 5.0
    assert slippage == 5.0
    # T1, T2, T3 are all affected
    affected_ids = [a.task_id for a in affected]
    assert "T1" in affected_ids
    assert "T2" in affected_ids
    assert "T3" in affected_ids

def test_delay_propagation_handler():
    req = DelayPropagationRequest(
        project_id="proj_123",
        tasks=[
            TaskNode(id="A", title="Task A", remaining_hours=8.0, status="In Progress", dependencies=[]),
            TaskNode(id="B", title="Task B", remaining_hours=12.0, status="To Do", dependencies=["A"]),
        ],
        delayed_task_id="A",
        delay_hours=4.0
    )

    res = simulate_delay(req)
    assert res.project_id == "proj_123"
    assert res.delayed_task_id == "A"
    assert res.delay_hours == 4.0
    assert res.schedule_slippage_hours == 4.0
    assert len(res.affected_tasks) >= 2
