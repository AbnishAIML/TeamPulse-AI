from typing import List, Dict, Tuple, Set, Optional
import networkx as nx
from ..models.dependency_models import TaskNode, BlockedTaskDetail

class DependencyGraph:
    def __init__(self, tasks: List[TaskNode]):
        self.tasks_dict: Dict[str, TaskNode] = {t.id: t for t in tasks}
        self.graph = nx.DiGraph()
        self._build_graph()

    def _build_graph(self):
        for task_id in self.tasks_dict:
            self.graph.add_node(task_id)

        for task_id, task in self.tasks_dict.items():
            for pred_id in task.dependencies:
                if pred_id in self.tasks_dict and pred_id != task_id:
                    # Edge from predecessor to successor (pred_id -> task_id)
                    self.graph.add_edge(pred_id, task_id)

    def detect_cycles(self) -> Tuple[bool, List[str]]:
        """
        Detects if there is any cycle in the dependency graph.
        Returns (has_cycle, cycle_nodes)
        """
        if nx.is_directed_acyclic_graph(self.graph):
            return False, []

        try:
            # Check for simple cycles when graph is known to be cyclic
            cycles = list(nx.simple_cycles(self.graph))
            if cycles:
                flat_cycle = list(set([node for cycle in cycles for node in cycle]))
                return True, flat_cycle
            return True, []
        except Exception:
            return True, []

    def get_topological_order(self) -> List[str]:
        """
        Returns list of task IDs in valid execution order.
        If graph has cycles, returns empty list.
        """
        if not nx.is_directed_acyclic_graph(self.graph):
            return []
        return list(nx.topological_sort(self.graph))

    def analyze_blockers(self) -> Tuple[List[BlockedTaskDetail], List[BlockedTaskDetail]]:
        """
        Analyzes tasks to identify:
        1. Directly blocked tasks (tasks whose predecessors are not 'Done')
        2. At-risk tasks (downstream tasks whose predecessors are currently blocked or delayed)
        """
        blocked_tasks: List[BlockedTaskDetail] = []
        at_risk_tasks: List[BlockedTaskDetail] = []

        # Find directly blocked tasks
        directly_blocked_ids: Set[str] = set()

        for task_id, task in self.tasks_dict.items():
            if task.status == "Done":
                continue

            unmet_preds: List[str] = []
            for pred_id in task.dependencies:
                pred = self.tasks_dict.get(pred_id)
                if pred and pred.status != "Done":
                    unmet_preds.append(f"{pred.title} ({pred.status})")

            if unmet_preds:
                directly_blocked_ids.add(task_id)
                reason_str = f"Blocked by {len(unmet_preds)} unfinished predecessor task(s): {', '.join(unmet_preds)}"
                blocked_tasks.append(BlockedTaskDetail(
                    task_id=task_id,
                    task_title=task.title,
                    status=task.status,
                    block_type="direct_block",
                    reason=reason_str,
                    unmet_predecessors=unmet_preds,
                    delay_impact_hours=task.remaining_hours or task.estimated_hours
                ))

        # Identify at-risk tasks (downstream tasks whose predecessors are blocked)
        seen_at_risk: Set[str] = set()
        for blocked_id in directly_blocked_ids:
            try:
                descendants = nx.descendants(self.graph, blocked_id)
                for desc_id in descendants:
                    if desc_id not in seen_at_risk:
                        desc_task = self.tasks_dict.get(desc_id)
                        if desc_task and desc_task.status != "Done":
                            seen_at_risk.add(desc_id)
                            blocked_ancestor = self.tasks_dict.get(blocked_id)
                            ancestor_name = blocked_ancestor.title if blocked_ancestor else blocked_id
                            at_risk_tasks.append(BlockedTaskDetail(
                                task_id=desc_id,
                                task_title=desc_task.title,
                                status=desc_task.status,
                                block_type="at_risk",
                                reason=f"At risk of delay due to upstream blocker on '{ancestor_name}'",
                                unmet_predecessors=[ancestor_name],
                                delay_impact_hours=desc_task.remaining_hours or desc_task.estimated_hours
                            ))
            except Exception:
                pass

        return blocked_tasks, at_risk_tasks
