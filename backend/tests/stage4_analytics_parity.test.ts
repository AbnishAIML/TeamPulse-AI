import assert from "assert";
import { AnalyticsBridge } from "../src/services/analyticsBridge.js";

async function runStage4ParityTests() {
  console.log("=== RUNNING STAGE 4 DUAL-ENGINE ANALYTICS & PARITY TESTS ===");

  const sampleTasks = [
    {
      id: "T1",
      title: "Architecture & DB Design",
      status: "Done",
      priority: "High",
      estimated_hours: 10,
      remaining_hours: 0,
      actual_hours: 10,
      dependencies: [],
      assignee_id: "user_1",
      assignee_name: "Alice",
    },
    {
      id: "T2",
      title: "API Backend Implementation",
      status: "In Progress",
      priority: "Critical",
      estimated_hours: 20,
      remaining_hours: 15,
      actual_hours: 5,
      dependencies: ["T1"],
      assignee_id: "user_1",
      assignee_name: "Alice",
    },
    {
      id: "T3",
      title: "UI Design & Pages",
      status: "In Progress",
      priority: "Medium",
      estimated_hours: 15,
      remaining_hours: 10,
      actual_hours: 5,
      dependencies: ["T1"],
      assignee_id: "user_2",
      assignee_name: "Bob",
    },
    {
      id: "T4",
      title: "End-to-End Integration",
      status: "To Do",
      priority: "High",
      estimated_hours: 12,
      remaining_hours: 12,
      actual_hours: 0,
      dependencies: ["T2", "T3"],
      assignee_id: "user_2",
      assignee_name: "Bob",
    },
  ];

  // 1. CPM Analysis Test
  console.log("Testing CPM DAG Dependency Analysis (Native TS Fallback)...");
  const cpmRes = await AnalyticsBridge.analyzeDependencies("proj_test", sampleTasks);
  assert.strictEqual(cpmRes.has_cycle, false, "Must not detect cycles in valid DAG");
  assert.strictEqual(cpmRes.cycle_nodes.length, 0);
  assert.ok(cpmRes.critical_path.length > 0, "Must identify critical path");
  assert.ok(cpmRes.project_duration_hours >= 27, "Project duration must sum critical path durations");
  assert.ok(cpmRes.cpm_metrics["T2"], "CPM metrics must include T2");
  assert.ok(cpmRes.cpm_metrics["T4"], "CPM metrics must include T4");
  console.log(`✔ CPM Analysis verified: duration=${cpmRes.project_duration_hours}h, critical_path=${cpmRes.critical_path.join(" ➔ ")}`);

  // 2. Cycle Detection
  console.log("Testing Cycle Detection...");
  const cycleTasks = [
    { id: "A", title: "A", status: "To Do", priority: "Low", estimated_hours: 5, remaining_hours: 5, actual_hours: 0, dependencies: ["C"] },
    { id: "B", title: "B", status: "To Do", priority: "Low", estimated_hours: 5, remaining_hours: 5, actual_hours: 0, dependencies: ["A"] },
    { id: "C", title: "C", status: "To Do", priority: "Low", estimated_hours: 5, remaining_hours: 5, actual_hours: 0, dependencies: ["B"] },
  ];
  const cycleRes = await AnalyticsBridge.analyzeDependencies("proj_cycle", cycleTasks);
  assert.strictEqual(cycleRes.has_cycle, true, "Must flag cycle as true");
  assert.ok(cycleRes.cycle_nodes.length >= 3, "Must list nodes in cycle");
  console.log("✔ Cycle detection verified (correctly rejected cyclic DAG)");

  // 3. Delay Propagation Simulation
  console.log("Testing Delay Propagation Simulation...");
  const delayHours = 8;
  const delayRes = await AnalyticsBridge.simulateDelayPropagation("proj_test", sampleTasks, "T2", delayHours);
  assert.strictEqual(delayRes.delayed_task_id, "T2");
  assert.strictEqual(delayRes.delay_hours, delayHours);
  assert.ok(delayRes.schedule_slippage_hours > 0, "Delay on critical task T2 must cause slippage");
  assert.strictEqual(delayRes.new_duration_hours, delayRes.original_duration_hours + delayHours);
  const affectedTaskIds = delayRes.affected_tasks.map((a: any) => a.task_id);
  assert.ok(affectedTaskIds.includes("T2"), "Delayed task must be in affected list");
  assert.ok(affectedTaskIds.includes("T4"), "Downstream successor T4 must be shifted");
  console.log(`✔ Delay propagation verified: slippage=${delayRes.schedule_slippage_hours}h, affected_tasks=${affectedTaskIds.join(", ")}`);

  // 4. Workload Capacity & Greedy Redistribution
  console.log("Testing Workload Balancing & Advisory Redistribution...");
  const sampleMembers = [
    {
      user_id: "user_1",
      name: "Alice",
      weekly_capacity_hours: 15, // Alice has 15h capacity, but assigned 15h open tasks (100% util)
      skills: ["Backend", "Architecture"],
      project_role: "Team Member",
    },
    {
      user_id: "user_2",
      name: "Bob",
      weekly_capacity_hours: 40, // Bob has 40h capacity, assigned 22h (55% util)
      skills: ["Frontend", "Integration"],
      project_role: "Team Member",
    },
  ];

  const workloadRes = await AnalyticsBridge.analyzeWorkload("proj_test", sampleMembers, sampleTasks, 90, 50);
  assert.ok(workloadRes.members_metrics.length === 2, "Must return metrics for both members");
  assert.ok(workloadRes.team_total_capacity_hours === 55, "Total capacity must be 55h");
  console.log(`✔ Workload analysis verified: team_utilization=${workloadRes.team_average_utilization_pct}%`);

  // 5. Member Contribution Scoring
  console.log("Testing Multi-factor Contribution Scoring...");
  const activityData = [
    {
      user_id: "user_1",
      name: "Alice",
      tasks_completed: 4,
      total_hours_logged: 32,
      on_time_delivery_rate: 95,
      reviews_conducted: 3,
      blockers_resolved: 2,
    },
    {
      user_id: "user_2",
      name: "Bob",
      tasks_completed: 3,
      total_hours_logged: 24,
      on_time_delivery_rate: 85,
      reviews_conducted: 1,
      blockers_resolved: 1,
    },
  ];

  const contributionRes = await AnalyticsBridge.analyzeContributions("proj_test", activityData, 10);
  assert.ok(contributionRes.team_indicators.length === 2, "Must return scores for each active member");
  assert.ok(contributionRes.team_indicators[0].composite_contribution_index > 0, "Composite score must be > 0");
  assert.ok(contributionRes.team_indicators[0].composite_contribution_index <= 100, "Composite score must be <= 100");
  console.log(`✔ Contribution scoring verified: Alice=${contributionRes.team_indicators[0].composite_contribution_index}, Bob=${contributionRes.team_indicators[1].composite_contribution_index}`);

  // 6. Project Health Index
  console.log("Testing Project Health Index Evaluation...");
  const healthReq = {
    project_id: "proj_test",
    completion_rate_pct: 60,
    schedule_slippage_days: 0,
    overdue_task_count: 0,
    blocked_tasks_count: 0,
    average_utilization_pct: 75,
    days_until_deadline: 12,
  };
  const healthRes = await AnalyticsBridge.evaluateProjectHealth(healthReq);
  assert.ok(healthRes.health_score >= 0 && healthRes.health_score <= 100, "Health score must be between 0 and 100");
  assert.ok(["Healthy", "At Risk", "Critical", "Low", "Medium", "High"].includes(healthRes.risk_level), "Risk level must be valid enum");
  assert.ok(healthRes.factors.length > 0, "Must return transparent breakdown factors");
  console.log(`✔ Project health evaluated: score=${healthRes.health_score}/100, risk=${healthRes.risk_level}`);

  console.log("=== ALL STAGE 4 ANALYTICS ENGINE TESTS PASSED SUCCESSFULLY! ===");
}

runStage4ParityTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Stage 4 test failure:", err);
    process.exit(1);
  });
