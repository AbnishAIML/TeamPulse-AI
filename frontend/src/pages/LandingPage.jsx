import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Zap,
  ArrowRight,
  GitBranch,
  ShieldCheck,
  Users,
  Activity,
  Layers,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Sparkles,
  FileSpreadsheet,
  Lock,
  ListTodo,
  Gauge,
} from "lucide-react";

export default function LandingPage() {
  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "How does the Critical Path Method (CPM) algorithm work?",
      a: "TeamPulse models all task dependencies as a Directed Acyclic Graph (DAG). It validates finish-to-start constraints, detects and rejects cycles, and performs topological sorting. CPM calculates early/late start and finish times to highlight the zero-slack path that directly drives the project completion date.",
    },
    {
      q: "Does TeamPulse automatically reassign tasks between members?",
      a: "Never. TeamPulse AI strictly enforces advisory balancing. The redistribution engine scores movable tasks based on capacity gain, skills overlap, and urgency, generating recommendations that require explicit Project Owner or Manager approval.",
    },
    {
      q: "How are team contribution indicators calculated without bias?",
      a: "We do not produce a single subjective 'score' or ranking. Instead, TeamPulse provides separate, transparent signals: effort-weighted completion, code reviews conducted, blockers resolved, rework rates, and deadline timeliness with explicit numerator, denominator, and sample sizes.",
    },
    {
      q: "What roles are supported in project workspaces?",
      a: "Workspaces enforce a 4-tier Role-Based Access Control (RBAC) matrix: Project Owner (full administration), Project Manager (task & milestone management), Team Member (deliverables and assigned updates), and Reviewer (review requests and verification).",
    },
    {
      q: "Can the platform operate if the Python analytics engine is offline?",
      a: "Yes. TeamPulse includes a dual-engine architecture. When the FastAPI Python microservice is active, it runs native graph optimizations. If it becomes unreachable or times out, the backend seamlessly falls back to a high-fidelity TypeScript implementation.",
    },
    {
      q: "How does TeamPulse prevent project cross-tenant data leaks?",
      a: "All project queries enforce strict membership verification middleware in the API layer. Non-members receive a 403 Forbidden status, unknown identifiers return 404, and Socket.IO rooms authenticate JWTs and re-verify project membership on each join.",
    },
  ];

  return (
    <div style={{ background: "#080c18", color: "#e8ebf5", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Sticky Navbar */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "#080c18e6",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #1e263d",
          padding: "0 24px",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", color: "inherit" }}>
          <div className="brand-mark" style={{ width: "34px", height: "34px" }}>
            <Zap size={18} fill="currentColor" />
          </div>
          <strong style={{ fontSize: "17px", letterSpacing: "-0.5px" }}>
            TeamPulse<span style={{ color: "#9b8cff" }}>AI</span>
          </strong>
        </Link>

        <nav style={{ display: "flex", gap: "24px", alignItems: "center" }} className="landing-nav-links">
          <a href="#features" style={{ color: "#9aa4bc", textDecoration: "none", fontSize: "12px", fontWeight: 500 }}>Features</a>
          <a href="#how-it-works" style={{ color: "#9aa4bc", textDecoration: "none", fontSize: "12px", fontWeight: 500 }}>How It Works</a>
          <a href="#intelligence" style={{ color: "#9aa4bc", textDecoration: "none", fontSize: "12px", fontWeight: 500 }}>Intelligence</a>
          <a href="#roles" style={{ color: "#9aa4bc", textDecoration: "none", fontSize: "12px", fontWeight: 500 }}>Roles</a>
          <a href="#faq" style={{ color: "#9aa4bc", textDecoration: "none", fontSize: "12px", fontWeight: 500 }}>FAQ</a>
        </nav>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <Link
            to="/login"
            className="button-secondary"
            style={{ textDecoration: "none", height: "34px", padding: "0 14px", fontSize: "11px" }}
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="button-primary"
            style={{ textDecoration: "none", height: "34px", padding: "0 16px", fontSize: "11px" }}
          >
            Get Started <ArrowRight size={13} />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "80px 24px 60px", textAlign: "center" }}>
        <div className="eyebrow" style={{ justifyContent: "center", marginBottom: "16px" }}>
          <span className="live-dot" /> NEXT-GEN PROJECT INTELLIGENCE
        </div>
        <h1 style={{ fontSize: "clamp(32px, 5vw, 54px)", fontWeight: 800, letterSpacing: "-1.5px", lineHeight: "1.15", margin: "0 auto 20px", maxWidth: "880px" }}>
          Intelligent Project Management & Team Contribution Analytics
        </h1>
        <p style={{ fontSize: "15px", color: "#9ba5be", maxWidth: "660px", margin: "0 auto 32px", lineHeight: "1.6" }}>
          Eliminate invisible blockers, balance student and software engineering workloads fairly, and evaluate individual contributions using transparent, deterministic multi-signal indicators.
        </p>

        <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap", marginBottom: "50px" }}>
          <Link
            to="/register"
            className="button-primary"
            style={{ textDecoration: "none", height: "44px", padding: "0 24px", fontSize: "13px" }}
          >
            Start Workspace Free <ArrowRight size={15} />
          </Link>
          <a
            href="#intelligence"
            className="button-secondary"
            style={{ textDecoration: "none", height: "44px", padding: "0 22px", fontSize: "13px" }}
          >
            Explore AI Algorithms
          </a>
        </div>

        {/* Interactive Product Preview */}
        <div
          style={{
            background: "linear-gradient(180deg, #12182b, #0c1020)",
            border: "1px solid #232d47",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 30px 100px #0009",
            textAlign: "left",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1e263d", paddingBottom: "14px", marginBottom: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ff6058" }} />
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ffbd2e" }} />
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#28ca42" }} />
              <span style={{ fontSize: "11px", color: "#818ba5", marginLeft: "8px", fontWeight: 600 }}>
                TEAMPULSE WORKSPACE PREVIEW — ARCHITECTURE DELIVERY
              </span>
            </div>
            <span style={{ fontSize: "10px", padding: "3px 8px", background: "#1c2b30", color: "#72dcb5", borderRadius: "4px", fontWeight: 700 }}>
              DAG VALID · CPM ACTIVE
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
            <div style={{ background: "#151c30", border: "1px solid #2b354f", borderRadius: "10px", padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "10px", color: "#ff8c9c", fontWeight: 700 }}>CRITICAL PATH (0 SLACK)</span>
                <span style={{ fontSize: "10px", color: "#818ba5" }}>16h remaining</span>
              </div>
              <strong style={{ fontSize: "13px", display: "block", color: "#e8ebf5", marginBottom: "6px" }}>
                FastAPI Analytics Engine & CPM Pipeline
              </strong>
              <p style={{ fontSize: "10px", color: "#9ca5bd", margin: "0 0 10px" }}>
                Delay on this task pushes final delivery date back 1-for-1.
              </p>
              <div style={{ display: "flex", gap: "6px" }}>
                <span style={{ fontSize: "9px", background: "#30263f", color: "#c7beff", padding: "2px 6px", borderRadius: "4px" }}>Python</span>
                <span style={{ fontSize: "9px", background: "#1a2a38", color: "#9fc5ff", padding: "2px 6px", borderRadius: "4px" }}>Critical</span>
              </div>
            </div>

            <div style={{ background: "#151c30", border: "1px solid #2b354f", borderRadius: "10px", padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "10px", color: "#ffbd7c", fontWeight: 700 }}>BLOCKED DEPENDENCY</span>
                <span style={{ fontSize: "10px", color: "#818ba5" }}>Predecessor Incomplete</span>
              </div>
              <strong style={{ fontSize: "13px", display: "block", color: "#e8ebf5", marginBottom: "6px" }}>
                Interactive DAG Visualization Canvas
              </strong>
              <p style={{ fontSize: "10px", color: "#9ca5bd", margin: "0 0 10px" }}>
                Blocked by predecessor: FastAPI Analytics Engine.
              </p>
              <div style={{ display: "flex", gap: "6px" }}>
                <span style={{ fontSize: "9px", background: "#3a2830", color: "#ff9ca9", padding: "2px 6px", borderRadius: "4px" }}>Blocked</span>
                <span style={{ fontSize: "9px", background: "#20283b", color: "#818ba5", padding: "2px 6px", borderRadius: "4px" }}>React</span>
              </div>
            </div>

            <div style={{ background: "#151c30", border: "1px solid #2b354f", borderRadius: "10px", padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "10px", color: "#72dcb5", fontWeight: 700 }}>ADVISORY BALANCING</span>
                <span style={{ fontSize: "10px", color: "#818ba5" }}>Confidence: 92%</span>
              </div>
              <strong style={{ fontSize: "13px", display: "block", color: "#e8ebf5", marginBottom: "6px" }}>
                Rebalance 6h to Frontend Specialist
              </strong>
              <p style={{ fontSize: "10px", color: "#9ca5bd", margin: "0 0 10px" }}>
                Reduces lead overload from 125% to healthy 90% without breaking critical path.
              </p>
              <span style={{ fontSize: "9px", background: "#1e332c", color: "#72dcb5", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>
                Owner Approval Required
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Problem / Solution Strip */}
      <section style={{ borderTop: "1px solid #1a2236", borderBottom: "1px solid #1a2236", background: "#0b1020", padding: "48px 24px" }}>
        <div style={{ maxWidth: "1140px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "32px" }}>
          <div>
            <span style={{ color: "#ff8c9c", fontSize: "11px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>THE PROBLEM</span>
            <h2 style={{ fontSize: "18px", margin: "8px 0 10px", color: "#fff" }}>Opaque Cascades & Unbalanced Student Teams</h2>
            <p style={{ fontSize: "12px", color: "#8a96b0", lineHeight: "1.6" }}>
              One late dependency secretly halts three team members. Uneven work distribution causes burnout for high performers and disengagement for others.
            </p>
          </div>
          <div>
            <span style={{ color: "#9b8cff", fontSize: "11px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>THE TEAMPULSE SOLUTION</span>
            <h2 style={{ fontSize: "18px", margin: "8px 0 10px", color: "#fff" }}>Deterministic Intelligence & Transparent Attribution</h2>
            <p style={{ fontSize: "12px", color: "#8a96b0", lineHeight: "1.6" }}>
              Mathematical DAG schedule float calculation, advisory workload recommendations with human sign-off, and multi-signal contribution indicators.
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" style={{ maxWidth: "1200px", margin: "0 auto", padding: "80px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div className="eyebrow" style={{ justifyContent: "center" }}>CORE CAPABILITIES</div>
          <h2 style={{ fontSize: "28px", fontWeight: 800, margin: "10px 0" }}>Engineered for Software Excellence</h2>
          <p style={{ fontSize: "13px", color: "#818ba5" }}>Robust tools for project leads, academic instructors, and student software teams.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
          <div className="panel" style={{ padding: "24px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#392f5d", color: "#b9afff", display: "grid", placeItems: "center", marginBottom: "14px" }}>
              <GitBranch size={18} />
            </div>
            <strong style={{ fontSize: "15px", display: "block", marginBottom: "8px" }}>DAG & Critical Path Method</strong>
            <p style={{ fontSize: "11px", color: "#929db6", lineHeight: "1.6", margin: 0 }}>
              Algorithmic directed graph cycle detection rejects illegal loops and highlights zero-slack critical paths to guarantee target delivery dates.
            </p>
          </div>

          <div className="panel" style={{ padding: "24px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#1c3830", color: "#72dcb5", display: "grid", placeItems: "center", marginBottom: "14px" }}>
              <Users size={18} />
            </div>
            <strong style={{ fontSize: "15px", display: "block", marginBottom: "8px" }}>Advisory Workload Balancing</strong>
            <p style={{ fontSize: "11px", color: "#929db6", lineHeight: "1.6", margin: 0 }}>
              Detects members operating over weekly capacity and formulates redistribution suggestions considering skills, urgency, and dependency risk.
            </p>
          </div>

          <div className="panel" style={{ padding: "24px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#3b2f24", color: "#ffbd7c", display: "grid", placeItems: "center", marginBottom: "14px" }}>
              <Activity size={18} />
            </div>
            <strong style={{ fontSize: "15px", display: "block", marginBottom: "8px" }}>Multi-Signal Contribution Indicators</strong>
            <p style={{ fontSize: "11px", color: "#929db6", lineHeight: "1.6", margin: 0 }}>
              Transparent breakdown of completed effort, code review participation, blocker resolution, and rework rates without opaque scoring.
            </p>
          </div>

          <div className="panel" style={{ padding: "24px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#202c46", color: "#62aaff", display: "grid", placeItems: "center", marginBottom: "14px" }}>
              <Zap size={18} />
            </div>
            <strong style={{ fontSize: "15px", display: "block", marginBottom: "8px" }}>Real-Time Socket.IO Synchronization</strong>
            <p style={{ fontSize: "11px", color: "#929db6", lineHeight: "1.6", margin: 0 }}>
              Live task status transitions, immediate notification dispatch, and collaborative kanban synchronization across team member browsers.
            </p>
          </div>

          <div className="panel" style={{ padding: "24px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#4a2432", color: "#ff8c9c", display: "grid", placeItems: "center", marginBottom: "14px" }}>
              <Lock size={18} />
            </div>
            <strong style={{ fontSize: "15px", display: "block", marginBottom: "8px" }}>Append-Only Activity Audit Log</strong>
            <p style={{ fontSize: "11px", color: "#929db6", lineHeight: "1.6", margin: 0 }}>
              Immutable event history records every status modification, blocker report, review decision, and assignment change for verification.
            </p>
          </div>

          <div className="panel" style={{ padding: "24px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#332247", color: "#d2b4ff", display: "grid", placeItems: "center", marginBottom: "14px" }}>
              <FileSpreadsheet size={18} />
            </div>
            <strong style={{ fontSize: "15px", display: "block", marginBottom: "8px" }}>7 Standardized Reports & CSV Export</strong>
            <p style={{ fontSize: "11px", color: "#929db6", lineHeight: "1.6", margin: 0 }}>
              Progress, milestone delivery, workload, blockers, and risk reports with multi-criteria filtering and RFC-compliant CSV downloads.
            </p>
          </div>
        </div>
      </section>

      {/* How it works in 4 steps */}
      <section id="how-it-works" style={{ background: "#0c1122", borderTop: "1px solid #1a2236", borderBottom: "1px solid #1a2236", padding: "80px 24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <div className="eyebrow" style={{ justifyContent: "center" }}>WORKFLOW</div>
            <h2 style={{ fontSize: "28px", fontWeight: 800, margin: "10px 0" }}>How TeamPulse AI Operates</h2>
            <p style={{ fontSize: "13px", color: "#818ba5" }}>From project initialization to delivery verification in 4 clear steps.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px" }}>
            <div style={{ background: "#111729", border: "1px solid #20283b", borderRadius: "12px", padding: "20px" }}>
              <span style={{ fontSize: "24px", fontWeight: 800, color: "#9b8cff", display: "block", marginBottom: "8px" }}>01</span>
              <strong style={{ fontSize: "14px", display: "block", color: "#fff", marginBottom: "6px" }}>Initialize & Assign Roles</strong>
              <p style={{ fontSize: "11px", color: "#818ba5", lineHeight: "1.5", margin: 0 }}>
                Create project workspace, configure target deadline, invite members with roles (Owner, Manager, Member, Reviewer) and weekly capacity hours.
              </p>
            </div>

            <div style={{ background: "#111729", border: "1px solid #20283b", borderRadius: "12px", padding: "20px" }}>
              <span style={{ fontSize: "24px", fontWeight: 800, color: "#9b8cff", display: "block", marginBottom: "8px" }}>02</span>
              <strong style={{ fontSize: "14px", display: "block", color: "#fff", marginBottom: "6px" }}>Map Tasks & Dependencies</strong>
              <p style={{ fontSize: "11px", color: "#818ba5", lineHeight: "1.5", margin: 0 }}>
                Define deliverables, estimate hours, and link finish-to-start dependencies. Cycle detection immediately prevents deadlocks.
              </p>
            </div>

            <div style={{ background: "#111729", border: "1px solid #20283b", borderRadius: "12px", padding: "20px" }}>
              <span style={{ fontSize: "24px", fontWeight: 800, color: "#9b8cff", display: "block", marginBottom: "8px" }}>03</span>
              <strong style={{ fontSize: "14px", display: "block", color: "#fff", marginBottom: "6px" }}>Execute & Balance Workload</strong>
              <p style={{ fontSize: "11px", color: "#818ba5", lineHeight: "1.5", margin: 0 }}>
                Track progress on the Kanban board. When member utilization exceeds healthy limits, review advisory reallocations with full before/after transparency.
              </p>
            </div>

            <div style={{ background: "#111729", border: "1px solid #20283b", borderRadius: "12px", padding: "20px" }}>
              <span style={{ fontSize: "24px", fontWeight: 800, color: "#9b8cff", display: "block", marginBottom: "8px" }}>04</span>
              <strong style={{ fontSize: "14px", display: "block", color: "#fff", marginBottom: "6px" }}>Audit Contributions</strong>
              <p style={{ fontSize: "11px", color: "#818ba5", lineHeight: "1.5", margin: 0 }}>
                Generate objective contribution indicators, verify milestone completion criteria, and export verifiable audit reports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Intelligence Section: Transparent Formulas */}
      <section id="intelligence" style={{ maxWidth: "1200px", margin: "0 auto", padding: "80px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div className="eyebrow" style={{ justifyContent: "center" }}>
            <Sparkles size={14} /> TRANSPARENT COMPUTATION
          </div>
          <h2 style={{ fontSize: "28px", fontWeight: 800, margin: "10px 0" }}>Zero Black-Box Scoring</h2>
          <p style={{ fontSize: "13px", color: "#818ba5", maxWidth: "600px", margin: "0 auto" }}>
            Every health score, workload percentage, and contribution signal is mathematically documented and auditable.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
          <div className="panel" style={{ padding: "24px", border: "1px solid #3c2f5d" }}>
            <strong style={{ fontSize: "15px", color: "#c7beff", display: "block", marginBottom: "10px" }}>
              Composite Project Health Risk (0–100)
            </strong>
            <p style={{ fontSize: "11px", color: "#9ca5bd", lineHeight: "1.5", marginBottom: "14px" }}>
              Calculated using weighted normalized risk dimensions:
            </p>
            <ul style={{ paddingLeft: "18px", fontSize: "11px", color: "#8993ad", lineHeight: "1.8", margin: 0 }}>
              <li><strong>25%</strong> Milestone Schedule Variance (days late vs plan)</li>
              <li><strong>20%</strong> Overdue High/Critical Priority Tasks</li>
              <li><strong>20%</strong> Capacity Shortfall vs Project Deadline</li>
              <li><strong>15%</strong> Average Blocker Duration</li>
              <li><strong>15%</strong> Critical Path Projected Delay</li>
              <li><strong>5%</strong> Pending Reviews Older than 2 Days</li>
            </ul>
          </div>

          <div className="panel" style={{ padding: "24px", border: "1px solid #263c35" }}>
            <strong style={{ fontSize: "15px", color: "#72dcb5", display: "block", marginBottom: "10px" }}>
              Workload Utilization %
            </strong>
            <p style={{ fontSize: "11px", color: "#9ca5bd", lineHeight: "1.5", marginBottom: "14px" }}>
              Calculated from active assigned effort against weekly capacity:
            </p>
            <div style={{ background: "#09121a", padding: "10px", borderRadius: "8px", fontFamily: "monospace", fontSize: "11px", color: "#72dcb5", marginBottom: "12px" }}>
              utilization% = (remainingEffortHours / availableCapacityHours) × 100
            </div>
            <p style={{ fontSize: "11px", color: "#8993ad", lineHeight: "1.5", margin: 0 }}>
              Where zero or missing capacity cleanly renders <em>capacity not set</em> without dividing by zero. Default thresholds: Underutilized &lt;40%, Healthy 40–85%, High 85–100%, Overloaded &gt;100%.
            </p>
          </div>

          <div className="panel" style={{ padding: "24px", border: "1px solid #3d3527" }}>
            <strong style={{ fontSize: "15px", color: "#ffbd7c", display: "block", marginBottom: "10px" }}>
              Multi-Signal Contribution Indicators
            </strong>
            <p style={{ fontSize: "11px", color: "#9ca5bd", lineHeight: "1.5", marginBottom: "14px" }}>
              Separately reported signals without forced competitive rankings:
            </p>
            <ul style={{ paddingLeft: "18px", fontSize: "11px", color: "#8993ad", lineHeight: "1.8", margin: 0 }}>
              <li><strong>Completed Work:</strong> Effort-weighted done tasks vs assigned</li>
              <li><strong>Review Participation:</strong> Reviews completed & approvals given</li>
              <li><strong>Blocker Resolution:</strong> Impediments reported & unblocked</li>
              <li><strong>Rework Rate:</strong> Reopened tasks / completed tasks</li>
              <li><strong>Timeliness:</strong> On-time delivery ratio with sample size</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Role Cards Section (Section 2.1 RBAC Matrix) */}
      <section id="roles" style={{ background: "#0c1122", borderTop: "1px solid #1a2236", borderBottom: "1px solid #1a2236", padding: "80px 24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <div className="eyebrow" style={{ justifyContent: "center" }}>PERMISSIONS</div>
            <h2 style={{ fontSize: "28px", fontWeight: 800, margin: "10px 0" }}>Role-Based Access Control</h2>
            <p style={{ fontSize: "13px", color: "#818ba5" }}>Enforced server-side per project membership.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
            <div className="panel" style={{ padding: "24px", background: "#111729" }}>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "#9b8cff", letterSpacing: "1px", textTransform: "uppercase" }}>TIER 1</span>
              <h3 style={{ fontSize: "18px", margin: "6px 0 12px", color: "#fff" }}>Project Owner</h3>
              <p style={{ fontSize: "11px", color: "#818ba5", lineHeight: "1.5", marginBottom: "16px" }}>
                Full administrative authority over project lifecycle and memberships.
              </p>
              <ul style={{ paddingLeft: "16px", fontSize: "11px", color: "#c7beff", lineHeight: "1.8", margin: 0 }}>
                <li>Edit / archive / delete project</li>
                <li>Manage team members & roles</li>
                <li>Create & edit milestones</li>
                <li>Assign & reassign tasks</li>
                <li>Approve / reject redistribution</li>
              </ul>
            </div>

            <div className="panel" style={{ padding: "24px", background: "#111729" }}>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "#62aaff", letterSpacing: "1px", textTransform: "uppercase" }}>TIER 2</span>
              <h3 style={{ fontSize: "18px", margin: "6px 0 12px", color: "#fff" }}>Project Manager</h3>
              <p style={{ fontSize: "11px", color: "#818ba5", lineHeight: "1.5", marginBottom: "16px" }}>
                Operational oversight, scheduling, and task management.
              </p>
              <ul style={{ paddingLeft: "16px", fontSize: "11px", color: "#a9d0ff", lineHeight: "1.8", margin: 0 }}>
                <li>Create & edit milestones</li>
                <li>Create, edit & assign tasks</li>
                <li>Approve / reject redistribution</li>
                <li>Update any task status</li>
                <li>View complete project analytics</li>
              </ul>
            </div>

            <div className="panel" style={{ padding: "24px", background: "#111729" }}>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "#72dcb5", letterSpacing: "1px", textTransform: "uppercase" }}>TIER 3</span>
              <h3 style={{ fontSize: "18px", margin: "6px 0 12px", color: "#fff" }}>Team Member</h3>
              <p style={{ fontSize: "11px", color: "#818ba5", lineHeight: "1.5", marginBottom: "16px" }}>
                Engineering deliverables, assigned tasks, and impediment reporting.
              </p>
              <ul style={{ paddingLeft: "16px", fontSize: "11px", color: "#a7f0d7", lineHeight: "1.8", margin: 0 }}>
                <li>Create tasks within own project</li>
                <li>Update assigned task effort & status</li>
                <li>Report blockers & post comments</li>
                <li>Upload task attachments</li>
                <li>Request peer code review</li>
              </ul>
            </div>

            <div className="panel" style={{ padding: "24px", background: "#111729" }}>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "#ffbd7c", letterSpacing: "1px", textTransform: "uppercase" }}>TIER 4</span>
              <h3 style={{ fontSize: "18px", margin: "6px 0 12px", color: "#fff" }}>Reviewer</h3>
              <p style={{ fontSize: "11px", color: "#818ba5", lineHeight: "1.5", marginBottom: "16px" }}>
                Quality assurance, peer evaluation, and review verification.
              </p>
              <ul style={{ paddingLeft: "16px", fontSize: "11px", color: "#ffd5a6", lineHeight: "1.8", margin: 0 }}>
                <li>Inspect code review requests</li>
                <li>Approve / reject reviews with feedback</li>
                <li>Comment & report blockers</li>
                <li>View deliverables & dependencies</li>
                <li>Audit project reports</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section id="faq" style={{ maxWidth: "860px", margin: "0 auto", padding: "80px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div className="eyebrow" style={{ justifyContent: "center" }}>FAQ</div>
          <h2 style={{ fontSize: "28px", fontWeight: 800, margin: "10px 0" }}>Frequently Asked Questions</h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="panel"
              style={{ padding: "16px 20px", cursor: "pointer", background: "#111729" }}
              onClick={() => toggleFaq(idx)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                <strong style={{ fontSize: "13px", color: "#e8ebf5" }}>{faq.q}</strong>
                <ChevronDown
                  size={16}
                  style={{
                    color: "#818ba5",
                    transform: activeFaq === idx ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                  }}
                />
              </div>
              {activeFaq === idx && (
                <p style={{ fontSize: "11px", color: "#9ca5bd", lineHeight: "1.6", marginTop: "12px", marginBottom: 0 }}>
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ borderTop: "1px solid #1a2236", background: "linear-gradient(180deg, #0e1426, #080c18)", padding: "70px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "30px", fontWeight: 800, margin: "0 0 14px", letterSpacing: "-0.8px" }}>
            Ready to Bring True Intelligence to Your Team?
          </h2>
          <p style={{ fontSize: "13px", color: "#8a96b0", lineHeight: "1.6", marginBottom: "28px" }}>
            Join thousands of engineering students and project managers coordinating deliverables with DAG CPM scheduling and transparent workload balancing.
          </p>
          <Link
            to="/register"
            className="button-primary"
            style={{ textDecoration: "none", height: "44px", padding: "0 24px", fontSize: "13px", display: "inline-flex" }}
          >
            Create Your Free Account <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #151c30", padding: "32px 24px", background: "#060914" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="brand-mark" style={{ width: "26px", height: "26px" }}>
              <Zap size={14} fill="currentColor" />
            </div>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#dce1f0" }}>TeamPulse AI</span>
            <span style={{ fontSize: "11px", color: "#68738e" }}>· Intelligent Project Management</span>
          </div>

          <div style={{ display: "flex", gap: "20px", fontSize: "11px", color: "#818ba5" }}>
            <a href="#features" style={{ color: "inherit", textDecoration: "none" }}>Features</a>
            <a href="#how-it-works" style={{ color: "inherit", textDecoration: "none" }}>How It Works</a>
            <a href="#intelligence" style={{ color: "inherit", textDecoration: "none" }}>Intelligence</a>
            <a href="#roles" style={{ color: "inherit", textDecoration: "none" }}>Permissions</a>
            <Link to="/login" style={{ color: "inherit", textDecoration: "none" }}>Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
