import uuid
from typing import List, Dict, Optional
from ..models.workload_models import (
    WorkloadAnalysisRequest,
    WorkloadAnalysisResponse,
    MemberWorkloadMetrics,
    RedistributionRecommendation,
    MemberWorkloadInput,
    TaskWorkloadInput
)

def analyze_team_workload(request: WorkloadAnalysisRequest) -> WorkloadAnalysisResponse:
    members_dict: Dict[str, MemberWorkloadInput] = {m.user_id: m for m in request.members}
    
    # Track stats per member
    member_stats: Dict[str, Dict] = {}
    for user_id, m in members_dict.items():
        member_stats[user_id] = {
            "name": m.name,
            "capacity": m.weekly_capacity_hours if m.weekly_capacity_hours > 0 else 20.0,
            "total_tasks": 0,
            "open_tasks": 0,
            "in_progress": 0,
            "blocked": 0,
            "overdue": 0,
            "review": 0,
            "remaining_hours": 0.0,
            "actual_hours": 0.0,
            "assigned_task_objs": []
        }

    for task in request.tasks:
        if task.assignee_id and task.assignee_id in member_stats:
            stats = member_stats[task.assignee_id]
            stats["total_tasks"] += 1
            stats["actual_hours"] += (task.actual_hours or 0.0)
            
            if task.status != "Done":
                stats["open_tasks"] += 1
                rem = task.remaining_hours if task.remaining_hours > 0 else (task.estimated_hours or 3.0)
                stats["remaining_hours"] += rem
                stats["assigned_task_objs"].append(task)

                if task.status == "In Progress":
                    stats["in_progress"] += 1
                elif task.status == "Blocked" or task.is_blocked:
                    stats["blocked"] += 1
                elif task.status == "In Review":
                    stats["review"] += 1

    # Build member metrics
    metrics_list: List[MemberWorkloadMetrics] = []
    overloaded_members: List[MemberWorkloadMetrics] = []
    underloaded_members: List[MemberWorkloadMetrics] = []
    warnings: List[str] = []

    total_capacity = 0.0
    total_assigned_hours = 0.0

    for user_id, stats in member_stats.items():
        cap = stats["capacity"]
        rem_hrs = stats["remaining_hours"]
        total_capacity += cap
        total_assigned_hours += rem_hrs

        # Safe division
        util_pct = round((rem_hrs / cap * 100.0) if cap > 0 else 0.0, 1)

        is_over = util_pct > request.overload_threshold_pct
        is_under = util_pct < request.underload_threshold_pct

        if is_over:
            status_label = "Over capacity"
            warnings.append(f"{stats['name']} is operating at {util_pct}% capacity ({rem_hrs}h remaining / {cap}h weekly capacity).")
        elif is_under:
            status_label = "Underutilized"
        else:
            status_label = "Optimal"

        m_metric = MemberWorkloadMetrics(
            user_id=user_id,
            name=stats["name"],
            weekly_capacity_hours=cap,
            total_assigned_tasks=stats["total_tasks"],
            open_tasks=stats["open_tasks"],
            in_progress_tasks=stats["in_progress"],
            blocked_tasks=stats["blocked"],
            overdue_tasks=stats["overdue"],
            review_tasks=stats["review"],
            estimated_remaining_hours=round(rem_hrs, 1),
            actual_logged_hours=round(stats["actual_hours"], 1),
            utilization_pct=util_pct,
            is_overloaded=is_over,
            is_underutilized=is_under,
            status_label=status_label
        )
        metrics_list.append(m_metric)

        if is_over:
            overloaded_members.append(m_metric)
        elif is_under:
            underloaded_members.append(m_metric)

    team_avg_util = round((total_assigned_hours / total_capacity * 100.0) if total_capacity > 0 else 0.0, 1)

    # Generate Advisory Redistribution Recommendations
    recommendations: List[RedistributionRecommendation] = []

    # Sort overloaded by highest utilization first
    overloaded_copy = [m.model_copy() for m in overloaded_members]
    underloaded_copy = [m.model_copy() for m in underloaded_members]
    overloaded_copy.sort(key=lambda m: m.utilization_pct, reverse=True)
    underloaded_copy.sort(key=lambda m: m.utilization_pct)

    for over_m in overloaded_copy:
        over_tasks: List[TaskWorkloadInput] = member_stats[over_m.user_id]["assigned_task_objs"]
        reassignable = [t for t in over_tasks if t.status in ["To Do", "Backlog"] and not t.is_blocked]
        if not reassignable:
            reassignable = [t for t in over_tasks if t.status != "In Review"]

        for cand_task in reassignable:
            task_hrs = cand_task.remaining_hours if cand_task.remaining_hours > 0 else (cand_task.estimated_hours or 3.0)
            
            best_target: Optional[MemberWorkloadMetrics] = None
            for under_m in underloaded_copy:
                new_under_hrs = under_m.estimated_remaining_hours + task_hrs
                new_under_util = round((new_under_hrs / under_m.weekly_capacity_hours * 100.0), 1)
                if new_under_util <= request.overload_threshold_pct:
                    best_target = under_m
                    break

            if best_target:
                curr_before = over_m.utilization_pct
                curr_after = round(((over_m.estimated_remaining_hours - task_hrs) / over_m.weekly_capacity_hours * 100.0), 1)
                prop_before = best_target.utilization_pct
                prop_after = round(((best_target.estimated_remaining_hours + task_hrs) / best_target.weekly_capacity_hours * 100.0), 1)

                target_skills = members_dict[best_target.user_id].skills
                matched_skills = [tag for tag in cand_task.tags if any(tag.lower() in s.lower() for s in target_skills)]

                rec = RedistributionRecommendation(
                    id=f"rec-{uuid.uuid4().hex[:8]}",
                    task_id=cand_task.id,
                    task_title=cand_task.title,
                    priority=cand_task.priority,
                    estimated_remaining_hours=task_hrs,
                    current_assignee_id=over_m.user_id,
                    current_assignee_name=over_m.name,
                    current_assignee_utilization_before=curr_before,
                    current_assignee_utilization_after=max(0.0, curr_after),
                    proposed_assignee_id=best_target.user_id,
                    proposed_assignee_name=best_target.name,
                    proposed_assignee_utilization_before=prop_before,
                    proposed_assignee_utilization_after=prop_after,
                    reason=f"Rebalance workload: {over_m.name} is overloaded at {curr_before}% capacity ({over_m.estimated_remaining_hours}h). Reassigning '{cand_task.title}' ({task_hrs}h) brings {best_target.name} to {prop_after}% capacity and relieves bottleneck.",
                    matching_skills=matched_skills,
                    risk_assessment="Low risk. Proposed assignee has sufficient schedule headroom.",
                    priority_level="High" if cand_task.priority in ["High", "Critical"] else "Medium"
                )
                recommendations.append(rec)
                
                # Update simulated working copy for next recommendation
                over_m.estimated_remaining_hours -= task_hrs
                over_m.utilization_pct = curr_after
                best_target.estimated_remaining_hours += task_hrs
                best_target.utilization_pct = prop_after
                break

    summary = (
        f"Team total capacity: {total_capacity}h, assigned remaining effort: {round(total_assigned_hours, 1)}h "
        f"({team_avg_util}% average utilization). {len(overloaded_members)} member(s) over capacity, "
        f"{len(underloaded_members)} member(s) available for rebalancing."
    )

    return WorkloadAnalysisResponse(
        project_id=request.project_id,
        team_total_capacity_hours=total_capacity,
        team_total_assigned_hours=round(total_assigned_hours, 1),
        team_average_utilization_pct=team_avg_util,
        members_metrics=metrics_list,
        recommendations=recommendations,
        warnings=warnings,
        summary=summary
    )
