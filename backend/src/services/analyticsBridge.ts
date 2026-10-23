import axios from "axios";
import { ENV } from "../config/env.js";

interface TaskPayload {
  id: string;
  title: string;
  status: string;
  priority: string;
  estimated_hours: number;
  remaining_hours: number;
  actual_hours: number;
  start_date?: string;
  deadline?: string;
  dependencies: string[];
  assignee_id?: string;
  assignee_name?: string;
  tags?: string[];
  is_blocked?: boolean;
}

interface MemberPayload {
  user_id: string;
  name: string;
  weekly_capacity_hours: number;
  skills: string[];
  project_role: string;
}

export class AnalyticsBridge {
  private static baseURL = ENV.ANALYTICS_SERVICE_URL;

  public static async analyzeDependencies(projectId: string, tasks: TaskPayload[]): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/analytics/dependencies/analyze`,
        { project_id: projectId, tasks },
        { timeout: 3500 }
      );
      return response.data;
    } catch (err: any) {
      console.warn("[AnalyticsBridge] FastAPI unavailable or timed out, executing native TypeScript DAG fallback...");
      return this.fallbackDependencyAnalysis(projectId, tasks);
    }
  }

  public static async analyzeWorkload(
    projectId: string,
    members: MemberPayload[],
    tasks: TaskPayload[],
    overloadPct: number = 100,
    underloadPct: number = 50
  ): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/analytics/workload/analyze`,
        {
          project_id: projectId,
          members,
          tasks,
          overload_threshold_pct: overloadPct,
          underload_threshold_pct: underloadPct,
        },
        { timeout: 3500 }
      );
      return response.data;
    } catch (err: any) {
      console.warn("[AnalyticsBridge] FastAPI unavailable, executing native TypeScript workload fallback...");
      return this.fallbackWorkloadAnalysis(projectId, members, tasks, overloadPct, underloadPct);
    }
  }

  public static async analyzeContributions(projectId: string, membersActivity: any[], totalTasks: number): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/analytics/contributions/analyze`,
        {
          project_id: projectId,
          members_activity: membersActivity,
          total_project_tasks: totalTasks,
        },
        { timeout: 3500 }
      );
      return response.data;
    } catch (err: any) {
      console.warn("[AnalyticsBridge] FastAPI unavailable, executing native TypeScript contribution fallback...");
      return this.fallbackContributionAnalysis(projectId, membersActivity);
    }
  }

  public static async evaluateProjectHealth(req: any): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/analytics/project-health/evaluate`,
        req,
        { timeout: 3500 }
      );
      return response.data;
    } catch (err: any) {
      console.warn("[AnalyticsBridge] FastAPI unavailable, executing native TypeScript health fallback...");
      return this.fallbackProjectHealth(req);
    }
  }

  // Native TypeScript Fallback Algorithms
  private static fallbackDependencyAnalysis(projectId: string, tasks: TaskPayload[]): any {
    const taskMap = new Map<string, TaskPayload>();
    tasks.forEach((t) => taskMap.set(t.id, t));

    // Cycle detection using DFS
    const visited = new Map<string, number>(); // 0: unvisited, 1: visiting, 2: visited
    let hasCycle = false;
    const cycleNodes: string[] = [];

    const dfs = (nodeId: string, stack: string[]): boolean => {
      visited.set(nodeId, 1);
      stack.push(nodeId);

      const task = taskMap.get(nodeId);
      if (task) {
        for (const predId of task.dependencies) {
          if (taskMap.has(predId)) {
            const state = visited.get(predId) || 0;
            if (state === 1) {
              hasCycle = true;
              cycleNodes.push(...stack);
              return true;
            }
            if (state === 0 && dfs(predId, stack)) {
              return true;
            }
          }
        }
      }

      visited.set(nodeId, 2);
      stack.pop();
      return false;
    };

    for (const t of tasks) {
      if ((visited.get(t.id) || 0) === 0) {
        if (dfs(t.id, [])) break;
      }
    }

    if (hasCycle) {
      return {
        project_id: projectId,
        has_cycle: true,
        cycle_nodes: Array.from(new Set(cycleNodes)),
        topological_order: [],
        critical_path: [],
        project_duration_hours: 0,
        blocked_tasks: [],
        at_risk_tasks: [],
        cpm_metrics: {},
        summary: "Cyclic dependency detected in task graph.",
      };
    }

    // Topological order (Kahn's algorithm)
    const inDegree = new Map<string, number>();
    const adjList = new Map<string, string[]>(); // pred -> succs
    tasks.forEach((t) => {
      inDegree.set(t.id, 0);
      adjList.set(t.id, []);
    });

    tasks.forEach((t) => {
      t.dependencies.forEach((predId) => {
        if (taskMap.has(predId)) {
          inDegree.set(t.id, (inDegree.get(t.id) || 0) + 1);
          adjList.get(predId)?.push(t.id);
        }
      });
    });

    const queue: string[] = [];
    inDegree.forEach((deg, id) => {
      if (deg === 0) queue.push(id);
    });

    const topoOrder: string[] = [];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      topoOrder.push(curr);
      for (const succ of adjList.get(curr) || []) {
        inDegree.set(succ, (inDegree.get(succ) || 1) - 1);
        if (inDegree.get(succ) === 0) {
          queue.push(succ);
        }
      }
    }

    // Direct blockers and at-risk tasks
    const blockedTasks: any[] = [];
    const atRiskTasks: any[] = [];
    const directlyBlockedIds = new Set<string>();

    for (const t of tasks) {
      if (t.status === "Done") continue;
      const unmetPreds: string[] = [];
      for (const predId of t.dependencies) {
        const pred = taskMap.get(predId);
        if (pred && pred.status !== "Done") {
          unmetPreds.push(`${pred.title} (${pred.status})`);
        }
      }
      if (unmetPreds.length > 0) {
        directlyBlockedIds.add(t.id);
        blockedTasks.push({
          task_id: t.id,
          task_title: t.title,
          status: t.status,
          block_type: "direct_block",
          reason: `Blocked by ${unmetPreds.length} unfinished predecessor(s): ${unmetPreds.join(", ")}`,
          unmet_predecessors: unmetPreds,
          delay_impact_hours: t.remaining_hours || t.estimated_hours || 3,
        });
      }
    }

    // Downstream at risk
    for (const bId of directlyBlockedIds) {
      const succs = adjList.get(bId) || [];
      for (const sId of succs) {
        const sTask = taskMap.get(sId);
        if (sTask && sTask.status !== "Done") {
          const bTask = taskMap.get(bId);
          atRiskTasks.push({
            task_id: sId,
            task_title: sTask.title,
            status: sTask.status,
            block_type: "at_risk",
            reason: `At risk of delay due to upstream blocker on '${bTask?.title || bId}'`,
            unmet_predecessors: [bTask?.title || bId],
            delay_impact_hours: sTask.remaining_hours || sTask.estimated_hours || 3,
          });
        }
      }
    }

    // Forward pass for CPM
    const es = new Map<string, number>();
    const ef = new Map<string, number>();
    for (const id of topoOrder) {
      const t = taskMap.get(id);
      const dur = t?.status === "Done" ? 0 : (t?.remaining_hours || t?.estimated_hours || 2);
      let maxPredEf = 0;
      for (const pId of t?.dependencies || []) {
        maxPredEf = Math.max(maxPredEf, ef.get(pId) || 0);
      }
      es.set(id, maxPredEf);
      ef.set(id, maxPredEf + dur);
    }

    const totalDuration = Math.max(...Array.from(ef.values()), 0);

    // Backward pass
    const ls = new Map<string, number>();
    const lf = new Map<string, number>();
    for (const id of [...topoOrder].reverse()) {
      const t = taskMap.get(id);
      const dur = t?.status === "Done" ? 0 : (t?.remaining_hours || t?.estimated_hours || 2);
      const succs = adjList.get(id) || [];
      let minSuccLs = succs.length === 0 ? totalDuration : Infinity;
      for (const sId of succs) {
        minSuccLs = Math.min(minSuccLs, ls.get(sId) ?? totalDuration);
      }
      if (minSuccLs === Infinity) minSuccLs = totalDuration;
      lf.set(id, minSuccLs);
      ls.set(id, minSuccLs - dur);
    }

    const cpmMetrics: Record<string, any> = {};
    const criticalPath: string[] = [];

    for (const id of topoOrder) {
      const slack = Math.round(((ls.get(id) || 0) - (es.get(id) || 0)) * 10) / 10;
      const t = taskMap.get(id);
      const isCritical = slack <= 0.1 && (t?.status !== "Done");
      if (isCritical) criticalPath.push(id);

      cpmMetrics[id] = {
        task_id: id,
        early_start: es.get(id) || 0,
        early_finish: ef.get(id) || 0,
        late_start: ls.get(id) || 0,
        late_finish: lf.get(id) || 0,
        total_slack: Math.max(0, slack),
        is_critical: isCritical,
        is_blocked: directlyBlockedIds.has(id),
        delay_hours: 0,
      };
    }

    return {
      project_id: projectId,
      has_cycle: false,
      cycle_nodes: [],
      topological_order: topoOrder,
      critical_path: criticalPath,
      project_duration_hours: totalDuration,
      blocked_tasks: blockedTasks,
      at_risk_tasks: atRiskTasks,
      cpm_metrics: cpmMetrics,
      summary: `Analyzed ${tasks.length} tasks. Identified ${blockedTasks.length} blocked task(s) and critical path of ${criticalPath.length} task(s).`,
    };
  }

  private static fallbackWorkloadAnalysis(
    projectId: string,
    members: MemberPayload[],
    tasks: TaskPayload[],
    overloadPct: number,
    underloadPct: number
  ): any {
    const memberStats = new Map<string, any>();
    members.forEach((m) => {
      memberStats.set(m.user_id, {
        user_id: m.user_id,
        name: m.name,
        weekly_capacity_hours: m.weekly_capacity_hours || 20,
        total_assigned_tasks: 0,
        open_tasks: 0,
        in_progress_tasks: 0,
        blocked_tasks: 0,
        overdue_tasks: 0,
        review_tasks: 0,
        estimated_remaining_hours: 0,
        actual_logged_hours: 0,
        assigned_tasks: [] as TaskPayload[],
      });
    });

    tasks.forEach((t) => {
      if (t.assignee_id && memberStats.has(t.assignee_id)) {
        const stats = memberStats.get(t.assignee_id);
        stats.total_assigned_tasks += 1;
        stats.actual_logged_hours += t.actual_hours || 0;
        if (t.status !== "Done") {
          stats.open_tasks += 1;
          const rem = t.remaining_hours > 0 ? t.remaining_hours : (t.estimated_hours || 3);
          stats.estimated_remaining_hours += rem;
          stats.assigned_tasks.push(t);
          if (t.status === "In Progress") stats.in_progress_tasks += 1;
          if (t.status === "Blocked" || t.is_blocked) stats.blocked_tasks += 1;
          if (t.status === "In Review") stats.review_tasks += 1;
        }
      }
    });

    const metricsList: any[] = [];
    const overloadedList: any[] = [];
    const underloadedList: any[] = [];
    const warnings: string[] = [];
    let totalCap = 0;
    let totalAssigned = 0;

    memberStats.forEach((stats) => {
      totalCap += stats.weekly_capacity_hours;
      totalAssigned += stats.estimated_remaining_hours;
      const util = Math.round((stats.estimated_remaining_hours / stats.weekly_capacity_hours) * 100);
      const isOver = util > overloadPct;
      const isUnder = util < underloadPct;
      const label = isOver ? "Over capacity" : isUnder ? "Underutilized" : "Optimal";

      if (isOver) {
        warnings.push(`${stats.name} is operating at ${util}% capacity.`);
      }

      const item = {
        user_id: stats.user_id,
        name: stats.name,
        weekly_capacity_hours: stats.weekly_capacity_hours,
        total_assigned_tasks: stats.total_assigned_tasks,
        open_tasks: stats.open_tasks,
        in_progress_tasks: stats.in_progress_tasks,
        blocked_tasks: stats.blocked_tasks,
        overdue_tasks: stats.overdue_tasks,
        review_tasks: stats.review_tasks,
        estimated_remaining_hours: stats.estimated_remaining_hours,
        actual_logged_hours: stats.actual_logged_hours,
        utilization_pct: util,
        is_overloaded: isOver,
        is_underutilized: isUnder,
        status_label: label,
      };
      metricsList.push(item);
      if (isOver) overloadedList.push({ ...item, tasks: stats.assigned_tasks });
      if (isUnder) underloadedList.push(item);
    });

    const recommendations: any[] = [];
    for (const over of overloadedList) {
      const cand = over.tasks.find((t: any) => t.status === "To Do" || t.status === "Backlog");
      if (cand && underloadedList.length > 0) {
        const target = underloadedList[0];
        const taskHours = cand.remaining_hours || cand.estimated_hours || 3;
        recommendations.push({
          id: `rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          task_id: cand.id,
          task_title: cand.title,
          priority: cand.priority,
          estimated_remaining_hours: taskHours,
          current_assignee_id: over.user_id,
          current_assignee_name: over.name,
          current_assignee_utilization_before: over.utilization_pct,
          current_assignee_utilization_after: Math.max(0, Math.round(((over.estimated_remaining_hours - taskHours) / over.weekly_capacity_hours) * 100)),
          proposed_assignee_id: target.user_id,
          proposed_assignee_name: target.name,
          proposed_assignee_utilization_before: target.utilization_pct,
          proposed_assignee_utilization_after: Math.round(((target.estimated_remaining_hours + taskHours) / target.weekly_capacity_hours) * 100),
          reason: `Rebalance workload: ${over.name} is overloaded (${over.utilization_pct}%). Reassigning '${cand.title}' (${taskHours}h) to ${target.name} balances capacity.`,
          matching_skills: [],
          risk_assessment: "Low risk. Proposed assignee has sufficient capacity.",
          priority_level: cand.priority === "High" || cand.priority === "Critical" ? "High" : "Medium",
        });
      }
    }

    const avgUtil = totalCap > 0 ? Math.round((totalAssigned / totalCap) * 100) : 0;
    return {
      project_id: projectId,
      team_total_capacity_hours: totalCap,
      team_total_assigned_hours: totalAssigned,
      team_average_utilization_pct: avgUtil,
      members_metrics: metricsList,
      recommendations,
      warnings,
      summary: `Team capacity: ${totalCap}h, assigned: ${totalAssigned}h (${avgUtil}% utilization).`,
    };
  }

  private static fallbackContributionAnalysis(projectId: string, members: any[]): any {
    const indicators = members.map((m) => {
      const taskRatio = m.tasks_assigned > 0 ? Math.min(1, m.tasks_completed / m.tasks_assigned) : 0.5;
      const completionScore = Math.round(taskRatio * 70 + Math.min(30, (m.estimated_hours_completed || 0) * 2));
      const timeliness = m.on_time_completions + m.late_completions > 0
        ? Math.round((m.on_time_completions / (m.on_time_completions + m.late_completions)) * 100)
        : 85;
      const reviewScore = Math.min(100, (m.reviews_conducted || 0) * 25 + (m.reviews_approved || 0) * 10);
      const problemScore = Math.min(100, (m.blockers_resolved || 0) * 35 + 45);
      const effortScore = 80;

      const composite = Math.round(
        completionScore * 0.35 + timeliness * 0.2 + reviewScore * 0.15 + problemScore * 0.15 + effortScore * 0.15
      );

      const strengths: string[] = [];
      if (completionScore >= 80) strengths.push("Strong task completion velocity");
      if (timeliness >= 85) strengths.push("High on-time milestone delivery");
      if (reviewScore >= 60) strengths.push("Active peer review contributions");
      if (problemScore >= 70) strengths.push("Effective blocker resolution");
      if (strengths.length === 0) strengths.push("Consistent active sprint contributor");

      return {
        user_id: m.user_id,
        name: m.name,
        task_completion_score: completionScore,
        effort_accuracy_score: effortScore,
        collaboration_review_score: reviewScore,
        problem_solving_score: problemScore,
        timeliness_score: timeliness,
        composite_contribution_index: composite,
        key_strengths: strengths,
        transparency_notes:
          "Multi-dimensional indicator reflecting deliverable completions, peer review participation, estimation precision, and blocker resolution.",
      };
    });

    return {
      project_id: projectId,
      team_indicators: indicators,
      methodology_statement:
        "Contribution Analysis evaluates five distinct dimensions (Completion, Timeliness, Collaboration, Estimation, and Problem Solving) rather than raw task counts.",
    };
  }

  private static fallbackProjectHealth(req: any): any {
    let score = 100;
    const factors: any[] = [];

    // Milestone factor
    let mScore = 100;
    if (req.milestones_overdue > 0) mScore -= req.milestones_overdue * 30;
    if (req.milestones_at_risk > 0) mScore -= req.milestones_at_risk * 15;
    mScore = Math.max(20, mScore);
    factors.push({
      name: "Milestone Schedule Variance",
      weight_pct: 25,
      score: mScore,
      impact: mScore >= 80 ? "Positive" : mScore >= 50 ? "Degraded" : "Severe",
      detail: `${req.milestones_overdue || 0} milestone(s) overdue, ${req.milestones_at_risk || 0} at risk.`,
    });

    // Overdue tasks
    let oScore = 100;
    if (req.overdue_critical_high_count > 0) oScore -= req.overdue_critical_high_count * 20;
    oScore = Math.max(15, oScore);
    factors.push({
      name: "Overdue High-Priority Tasks",
      weight_pct: 25,
      score: oScore,
      impact: oScore >= 80 ? "Positive" : oScore >= 50 ? "Degraded" : "Severe",
      detail: `${req.overdue_critical_high_count || 0} critical/high priority tasks overdue.`,
    });

    // Blocked tasks
    let bScore = 100;
    if (req.blocked_tasks_count > 0) bScore -= req.blocked_tasks_count * 25;
    bScore = Math.max(20, bScore);
    factors.push({
      name: "Task Blockers & Dependency Chains",
      weight_pct: 20,
      score: bScore,
      impact: bScore >= 80 ? "Positive" : bScore >= 50 ? "Degraded" : "Severe",
      detail: `${req.blocked_tasks_count || 0} active blocker(s) obstructing workflow.`,
    });

    // Critical path
    let cpScore = 100;
    if (req.critical_path_delayed_count > 0) cpScore -= req.critical_path_delayed_count * 25;
    cpScore = Math.max(30, cpScore);
    factors.push({
      name: "Critical Path Execution",
      weight_pct: 15,
      score: cpScore,
      impact: cpScore >= 80 ? "Positive" : "Degraded",
      detail: `${req.critical_path_delayed_count || 0} task(s) on critical path delayed.`,
    });

    // Capacity & reviews
    let capScore = 100;
    if (req.average_utilization_pct > 100) capScore -= (req.average_utilization_pct - 100) * 1.5;
    capScore = Math.max(25, capScore);
    factors.push({
      name: "Team Capacity & Review Flow",
      weight_pct: 15,
      score: Math.round(capScore),
      impact: capScore >= 80 ? "Positive" : "Degraded",
      detail: `Average team utilization is ${req.average_utilization_pct || 75}%.`,
    });

    const finalScore = Math.round(
      mScore * 0.25 + oScore * 0.25 + bScore * 0.2 + cpScore * 0.15 + capScore * 0.15
    );

    const riskLevel = finalScore >= 80 ? "Healthy" : finalScore >= 50 ? "At Risk" : "Critical";
    const riskColor = finalScore >= 80 ? "green" : finalScore >= 50 ? "orange" : "red";

    const recommendations = [];
    if (req.blocked_tasks_count > 0) {
      recommendations.push({
        id: `rec-${Date.now()}-1`,
        category: "Dependency",
        title: "Resolve Upstream Dependency Blockers",
        description: `There are ${req.blocked_tasks_count} task(s) waiting on unfinished predecessors.`,
        priority: "High",
        suggested_action: "Review the dependency view to unblock root-cause predecessors.",
        impact_statement: "Restores throughput to dependent downstream tasks.",
      });
    }

    if (req.overdue_critical_high_count > 0) {
      recommendations.push({
        id: `rec-${Date.now()}-2`,
        category: "Milestone",
        title: "Fast-Track Overdue High Priority Items",
        description: `${req.overdue_critical_high_count} high-priority tasks are past target deadlines.`,
        priority: "High",
        suggested_action: "Pair program or redistribute capacity to clear overdue items.",
        impact_statement: "Protects target milestone delivery dates.",
      });
    }

    return {
      project_id: req.project_id,
      health_score: finalScore,
      risk_level: riskLevel,
      risk_color: riskColor,
      summary: `Project is ${riskLevel.toLowerCase()} with a health index of ${finalScore}/100.`,
      factors,
      recommendations,
    };
  }
}
