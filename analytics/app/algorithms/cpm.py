from typing import List, Dict, Tuple, Set, Optional
import networkx as nx
from ..models.dependency_models import TaskNode, CPMTaskMetrics, AffectedTaskDetail

def calculate_cpm(tasks: List[TaskNode], graph: nx.DiGraph) -> Tuple[Dict[str, CPMTaskMetrics], List[str], float]:
    """
    Computes Critical Path Method (CPM) metrics:
    - Early Start (ES), Early Finish (EF) via forward pass
    - Late Finish (LF), Late Start (LS) via backward pass
    - Total Float = LS - ES
    - Critical Path = tasks with Total Float == 0
    Returns: (metrics_dict, critical_path_task_ids, total_project_duration_hours)
    """
    if not tasks:
        return {}, [], 0.0

    tasks_dict: Dict[str, TaskNode] = {t.id: t for t in tasks}
    
    # Check if graph is DAG
    if not nx.is_directed_acyclic_graph(graph):
        # Fallback if cycles exist
        metrics = {}
        for t in tasks:
            dur = t.remaining_hours if t.remaining_hours > 0 else (t.estimated_hours or 1.0)
            metrics[t.id] = CPMTaskMetrics(
                task_id=t.id,
                early_start=0.0,
                early_finish=dur,
                late_start=0.0,
                late_finish=dur,
                total_slack=0.0,
                is_critical=False,
                is_blocked=False,
                delay_hours=0.0
            )
        return metrics, [], 0.0

    topo_order = list(nx.topological_sort(graph))

    # Task durations
    durations: Dict[str, float] = {}
    for t_id in topo_order:
        t = tasks_dict.get(t_id)
        if t:
            if t.status == "Done":
                durations[t_id] = 0.0
            else:
                durations[t_id] = float(t.remaining_hours if t.remaining_hours > 0 else (t.estimated_hours if t.estimated_hours > 0 else 2.0))
        else:
            durations[t_id] = 1.0

    # 1. Forward Pass: compute Early Start (ES) and Early Finish (EF)
    es: Dict[str, float] = {}
    ef: Dict[str, float] = {}

    for node in topo_order:
        preds = list(graph.predecessors(node))
        if not preds:
            es[node] = 0.0
        else:
            es[node] = max(ef[p] for p in preds)
        ef[node] = es[node] + durations[node]

    # Total project duration is the maximum EF among all nodes
    total_project_duration = max(ef.values()) if ef else 0.0

    # 2. Backward Pass: compute Late Finish (LF) and Late Start (LS)
    ls: Dict[str, float] = {}
    lf: Dict[str, float] = {}

    for node in reversed(topo_order):
        succs = list(graph.successors(node))
        if not succs:
            lf[node] = total_project_duration
        else:
            lf[node] = min(ls[s] for s in succs)
        ls[node] = lf[node] - durations[node]

    # 3. Calculate Float / Slack and identify Critical Path
    metrics_map: Dict[str, CPMTaskMetrics] = {}
    critical_path: List[str] = []

    for node in topo_order:
        slack = round(ls[node] - es[node], 2)
        if abs(slack) < 0.01:
            slack = 0.0
        is_crit = (slack == 0.0 and durations[node] > 0)
        
        t = tasks_dict.get(node)
        is_blocked = False
        if t and t.status != "Done":
            for p_id in t.dependencies:
                p_task = tasks_dict.get(p_id)
                if p_task and p_task.status != "Done":
                    is_blocked = True
                    break

        if is_crit and t and t.status != "Done":
            critical_path.append(node)

        metrics_map[node] = CPMTaskMetrics(
            task_id=node,
            early_start=round(es[node], 1),
            early_finish=round(ef[node], 1),
            late_start=round(ls[node], 1),
            late_finish=round(lf[node], 1),
            total_slack=slack,
            is_critical=is_crit,
            is_blocked=is_blocked,
            delay_hours=0.0
        )

    return metrics_map, critical_path, round(total_project_duration, 1)

def simulate_delay_propagation(
    tasks: List[TaskNode],
    delayed_task_id: str,
    delay_hours: float
) -> Tuple[float, float, float, List[AffectedTaskDetail], List[str]]:
    """
    Simulates the cascading schedule impact of a delay on a specific task.
    Returns:
    (original_duration, new_duration, schedule_slippage, affected_tasks, new_critical_path)
    """
    from .dag import DependencyGraph

    dag = DependencyGraph(tasks)
    orig_metrics, orig_crit, orig_duration = calculate_cpm(tasks, dag.graph)

    # Build simulated task list with the added delay on delayed_task_id
    simulated_tasks: List[TaskNode] = []
    for t in tasks:
        t_copy = t.model_copy()
        if t.id == delayed_task_id:
            current_rem = t.remaining_hours if t.remaining_hours > 0 else (t.estimated_hours or 2.0)
            t_copy.remaining_hours = current_rem + delay_hours
            t_copy.estimated_hours = (t.estimated_hours or 0.0) + delay_hours
        simulated_tasks.append(t_copy)

    sim_dag = DependencyGraph(simulated_tasks)
    new_metrics, new_crit, new_duration = calculate_cpm(simulated_tasks, sim_dag.graph)

    slippage = round(max(0.0, new_duration - orig_duration), 1)

    affected_tasks: List[AffectedTaskDetail] = []
    tasks_dict = {t.id: t for t in tasks}

    for t_id, new_m in new_metrics.items():
        orig_m = orig_metrics.get(t_id)
        if orig_m:
            shift = round(new_m.early_finish - orig_m.early_finish, 1)
            if shift > 0.05 or t_id == delayed_task_id:
                task_title = tasks_dict[t_id].title if t_id in tasks_dict else t_id
                affected_tasks.append(AffectedTaskDetail(
                    task_id=t_id,
                    task_title=task_title,
                    original_early_start=orig_m.early_start,
                    new_early_start=new_m.early_start,
                    original_early_finish=orig_m.early_finish,
                    new_early_finish=new_m.early_finish,
                    delay_shift_hours=shift,
                    is_critical=new_m.is_critical
                ))

    # Sort affected tasks by new early start
    affected_tasks.sort(key=lambda x: x.new_early_start)

    return orig_duration, new_duration, slippage, affected_tasks, new_crit
