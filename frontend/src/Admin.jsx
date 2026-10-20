
import React, { useEffect, useMemo, useState } from "react";
import "./Admin.css";

const API = "https://student-feedback-mern.onrender.com";

const Icon = ({ name, size = 22 }) => {
  const paths = {
    dashboard: <><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="5" rx="2"/><rect x="13" y="10" width="8" height="11" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/></>,
    feedback: <><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    faculty: <><path d="m22 10-10-5L2 10l10 5 10-5Z"/><path d="M6 12v5c3 3 9 3 12 0v-5M22 10v6"/></>,
    star: <><polygon points="12 2 15 9 22 9.5 16.5 14.5 18 22 12 18 6 22 7.5 14.5 2 9.5 9 9 12 2"/></>,
    chart: <><path d="M3 3v18h18"/><path d="m7 14 4-4 4 3 6-7"/></>,
    search: <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/></>,
    refresh: <><path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M5.6 9a7 7 0 0 1 11.6-2L20 12M4 12l2.8 5a7 7 0 0 0 11.6-2"/></>,
    filter: <><path d="M4 7h16M7 12h10m-7 5h4"/></>,
    trophy: <><path d="M8 21h8m-4-4v4M7 4h10v7a5 5 0 0 1-10 0V4Z"/><path d="M7 7H4v2a4 4 0 0 0 4 4m9-6h3v2a4 4 0 0 1-4 4"/></>
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      {paths[name] || paths.dashboard}
    </svg>
  );
};

const number = value => Number(value || 0);

const rating = value => number(value).toFixed(1);

export default function Admin({ onLogout }) {
  const [data, setData] = useState(null);
  const [allFeedback, setAllFeedback] = useState([]);
  const [bestFaculty, setBestFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("All");
  const [year, setYear] = useState("All");
  const [minimumRating, setMinimumRating] = useState("All");
  const [activeTab, setActiveTab] = useState("overview");

  const headers = useMemo(() => ({
    "Content-Type": "application/json",
    "x-user-role": "admin"
  }), []);

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const results = await Promise.all([
        fetch(`${API}/api/admin/dashboard`, { headers }),
        fetch(`${API}/api/admin/feedback`, { headers }),
        fetch(`${API}/api/admin/branch-best-faculty`, { headers })
      ]);

      const [dashboardResponse, feedbackResponse, bestResponse] = results;

      const dashboard = await dashboardResponse.json();
      const feedback = await feedbackResponse.json();
      const best = await bestResponse.json();

      if (!dashboardResponse.ok || !dashboard.success) {
        throw new Error(dashboard.message || "Dashboard load failed.");
      }

      if (!feedbackResponse.ok || !feedback.success) {
        throw new Error(feedback.message || "Feedback load failed.");
      }

      if (!bestResponse.ok || !best.success) {
        throw new Error(best.message || "Faculty ranking load failed.");
      }

      setData(dashboard);
      setAllFeedback(feedback.feedbacks || []);
      setBestFaculty(best.branch_best_faculty || []);
    } catch (err) {
      setError(err.message || "Unable to connect to the backend.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const branches = useMemo(
    () => [...new Set(allFeedback.map(item => item.branch).filter(Boolean))].sort(),
    [allFeedback]
  );

  const years = useMemo(
    () => [...new Set(allFeedback.map(item => item.year).filter(Boolean))].sort(),
    [allFeedback]
  );

  const filteredFeedback = useMemo(() => {
    const term = search.trim().toLowerCase();

    return allFeedback.filter(item => {
      const faculty = item.teacher || item.faculty || "";
      const matchesSearch = !term || [
        faculty,
        item.branch,
        item.year,
        item.comment,
        item.roll_no
      ].some(value => String(value || "").toLowerCase().includes(term));

      const matchesBranch = branch === "All" || item.branch === branch;
      const matchesYear = year === "All" || item.year === year;
      const matchesRating =
        minimumRating === "All" ||
        number(item.rating) >= Number(minimumRating);

      return matchesSearch && matchesBranch && matchesYear && matchesRating;
    });
  }, [allFeedback, search, branch, year, minimumRating]);

  const facultyRatings = useMemo(() => {
    const map = new Map();

    filteredFeedback.forEach(item => {
      const teacher = item.teacher || item.faculty || "Unknown";
      const key = `${item.branch}-${teacher}`;

      if (!map.has(key)) {
        map.set(key, {
          teacher,
          branch: item.branch,
          count: 0,
          rating: 0,
          teaching: 0,
          explanation: 0,
          interaction: 0
        });
      }

      const row = map.get(key);
      row.count += 1;
      row.rating += number(item.rating);
      row.teaching += number(item.teaching_quality);
      row.explanation += number(item.explanation);
      row.interaction += number(item.interaction);
    });

    return [...map.values()]
      .map(row => ({
        ...row,
        rating: row.rating / row.count,
        teaching: row.teaching / row.count,
        explanation: row.explanation / row.count,
        interaction: row.interaction / row.count
      }))
      .sort((a, b) => b.rating - a.rating);
  }, [filteredFeedback]);

  function exportCSV() {
    const rows = filteredFeedback.map(item => ({
      Branch: item.branch,
      Year: item.year,
      Faculty: item.teacher || item.faculty || "",
      Rating: item.rating,
      Teaching: item.teaching_quality,
      Explanation: item.explanation,
      Interaction: item.interaction,
      Student: item.anonymous ? "Anonymous" : (item.roll_no || "Not provided"),
      Comment: item.comment || "",
      Date: item.created_at ? new Date(item.created_at).toLocaleString() : ""
    }));

    const escapeCSV = value =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [
      Object.keys(rows[0] || {
        Branch: "", Year: "", Faculty: "", Rating: "",
        Teaching: "", Explanation: "", Interaction: "",
        Student: "", Comment: "", Date: ""
      }).join(","),
      ...rows.map(row => Object.values(row).map(escapeCSV).join(","))
    ].join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "student-feedback-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function signOut() {
    if (onLogout) {
      onLogout();
    } else {
      sessionStorage.removeItem("role");
      sessionStorage.removeItem("userRole");
      sessionStorage.removeItem("admin");
      window.location.reload();
    }
  }

  const stats = data ? [
    {
      label: "Total Feedback",
      value: data.total_feedback ?? 0,
      icon: "feedback",
      color: "purple",
      note: "All submissions"
    },
    {
      label: "Total Students",
      value: data.total_students ?? 0,
      icon: "users",
      color: "blue",
      note: "Registered students"
    },
    {
      label: "Total Faculty",
      value: data.total_faculty ?? 0,
      icon: "faculty",
      color: "pink",
      note: "Across all branches"
    },
    {
      label: "Average Rating",
      value: `${rating(data.avg_rating)} / 5`,
      icon: "star",
      color: "orange",
      note: "Overall satisfaction"
    }
  ] : [];

  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-icon">
            <Icon name="feedback" size={25} />
          </div>
          <div>
            <h2>CampusVoice</h2>
            <span>ADMIN PANEL</span>
          </div>
        </div>

        <div className="admin-side-label">WORKSPACE</div>

        <button
          className={`admin-nav ${activeTab === "overview" ? "selected" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <Icon name="dashboard" /> Overview
        </button>

        <button
          className={`admin-nav ${activeTab === "feedback" ? "selected" : ""}`}
          onClick={() => setActiveTab("feedback")}
        >
          <Icon name="feedback" /> All Feedback
          <span className="nav-count">{allFeedback.length}</span>
        </button>

        <button
          className={`admin-nav ${activeTab === "faculty" ? "selected" : ""}`}
          onClick={() => setActiveTab("faculty")}
        >
          <Icon name="faculty" /> Faculty Performance
        </button>

        <button
          className={`admin-nav ${activeTab === "ranking" ? "selected" : ""}`}
          onClick={() => setActiveTab("ranking")}
        >
          <Icon name="trophy" /> Branch Rankings
        </button>

        <div className="admin-side-bottom">
          <div className="admin-help-card">
            <div className="admin-help-icon"><Icon name="chart" /></div>
            <strong>Feedback Insights</strong>
            <p>Review student opinions and monitor faculty performance.</p>
          </div>

          <button className="admin-logout" onClick={signOut}>
            <Icon name="logout" /> Logout
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="admin-eyebrow">STUDENT FEEDBACK SYSTEM</span>
            <h1>
              {activeTab === "overview" && "Dashboard Overview"}
              {activeTab === "feedback" && "Student Feedback"}
              {activeTab === "faculty" && "Faculty Performance"}
              {activeTab === "ranking" && "Branch Rankings"}
            </h1>
          </div>

          <div className="admin-top-actions">
            <div className="admin-status">
              <span /> Admin Workspace
            </div>
            <button
              className="admin-refresh"
              onClick={loadDashboard}
              title="Refresh dashboard"
              aria-label="Refresh dashboard"
            >
              <Icon name="refresh" />
            </button>
            <div className="admin-avatar">A</div>
          </div>
        </header>

        {error && (
          <div className="admin-error">
            <strong>Unable to load dashboard.</strong>
            <span>{error}</span>
            <button onClick={loadDashboard}>Try again</button>
          </div>
        )}

        {loading && (
          <div className="admin-loading">
            <div className="admin-spinner" />
            <p>Loading dashboard data...</p>
          </div>
        )}

        {!loading && data && (
          <>
            {activeTab === "overview" && (
              <>
                <section className="admin-welcome">
                  <div>
                    <span className="welcome-pill">YOUR ANALYTICS SPACE</span>
                    <h2>Welcome back, Admin!</h2>
                    <p>Here is an overview of your student feedback activity.</p>
                  </div>
                  <div className="welcome-art">
                    <div className="welcome-circle circle-one" />
                    <div className="welcome-circle circle-two" />
                    <Icon name="chart" size={66} />
                  </div>
                </section>

                <section className="admin-stats">
                  {stats.map(item => (
                    <article className={`admin-stat stat-${item.color}`} key={item.label}>
                      <div className="stat-top">
                        <div className="stat-icon"><Icon name={item.icon} size={24} /></div>
                        <span className="stat-dot" />
                      </div>
                      <p>{item.label}</p>
                      <h2>{item.value}</h2>
                      <span className="stat-note">{item.note}</span>
                    </article>
                  ))}
                </section>

                <section className="admin-content-grid">
                  <article className="admin-panel performance-panel">
                    <div className="panel-heading">
                      <div>
                        <span className="panel-kicker">ANALYTICS</span>
                        <h3>Faculty Performance</h3>
                      </div>
                      <button className="text-action" onClick={() => setActiveTab("faculty")}>
                        View all
                      </button>
                    </div>

                    {facultyRatings.length === 0 ? (
                      <p className="admin-empty">No feedback available yet.</p>
                    ) : (
                      <div className="performance-list">
                        {facultyRatings.slice(0, 5).map((item, index) => (
                          <div className="performance-item" key={`${item.branch}-${item.teacher}`}>
                            <div className={`performance-rank rank-${index + 1}`}>
                              {index + 1}
                            </div>
                            <div className="performance-info">
                              <strong>{item.teacher}</strong>
                              <span>{item.branch} · {item.count} feedback</span>
                              <div className="performance-track">
                                <div style={{ width: `${Math.min(100, item.rating / 5 * 100)}%` }} />
                              </div>
                            </div>
                            <div className="performance-score">
                              <Icon name="star" size={15} />
                              {rating(item.rating)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>

                  <article className="admin-panel distribution-panel">
                    <div className="panel-heading">
                      <div>
                        <span className="panel-kicker">RATING SUMMARY</span>
                        <h3>Overall Rating</h3>
                      </div>
                      <div className="mini-icon"><Icon name="star" /></div>
                    </div>

                    <div className="rating-big">
                      <strong>{rating(data.avg_rating)}</strong>
                      <span>/ 5</span>
                    </div>
                    <div className="rating-stars" aria-label={`Average rating ${rating(data.avg_rating)} out of 5`}>
                      {"★★★★★".split("").map((star, index) => (
                        <span key={index} className={index < Math.round(number(data.avg_rating)) ? "filled" : ""}>{star}</span>
                      ))}
                    </div>
                    <p className="rating-caption">Average rating from all submitted feedback.</p>

                    <div className="rating-scale">
                      {[5, 4, 3, 2, 1].map(value => {
                        const count = allFeedback.filter(item => Math.round(number(item.rating)) === value).length;
                        const percent = allFeedback.length ? count / allFeedback.length * 100 : 0;

                        return (
                          <div className="scale-row" key={value}>
                            <span>{value} star</span>
                            <div className="scale-track">
                              <div style={{ width: `${percent}%` }} />
                            </div>
                            <b>{count}</b>
                          </div>
                        );
                      })}
                    </div>
                  </article>
                </section>

                <section className="admin-panel table-panel">
                  <div className="panel-heading table-heading">
                    <div>
                      <span className="panel-kicker">LATEST SUBMISSIONS</span>
                      <h3>Recent Feedback</h3>
                    </div>
                    <button className="text-action" onClick={() => setActiveTab("feedback")}>
                      View all feedback
                    </button>
                  </div>
                  <FeedbackTable items={allFeedback.slice(0, 5)} />
                </section>
              </>
            )}

            {activeTab === "feedback" && (
              <section className="admin-panel table-panel">
                <div className="panel-heading">
                  <div>
                    <span className="panel-kicker">STUDENT RESPONSES</span>
                    <h3>All Feedback Submissions</h3>
                    <p className="panel-description">{filteredFeedback.length} records match your filters.</p>
                  </div>
                  <button className="export-button" onClick={exportCSV}>
                    <Icon name="download" size={18} /> Export CSV
                  </button>
                </div>

                <Filters
                  search={search}
                  setSearch={setSearch}
                  branch={branch}
                  setBranch={setBranch}
                  year={year}
                  setYear={setYear}
                  minimumRating={minimumRating}
                  setMinimumRating={setMinimumRating}
                  branches={branches}
                  years={years}
                />

                <FeedbackTable items={filteredFeedback} />
              </section>
            )}

            {activeTab === "faculty" && (
              <section className="admin-panel table-panel">
                <div className="panel-heading">
                  <div>
                    <span className="panel-kicker">PERFORMANCE REPORT</span>
                    <h3>Faculty-wise Ratings</h3>
                    <p className="panel-description">Average scores are calculated from the feedback currently selected.</p>
                  </div>
                  <button className="export-button" onClick={exportCSV}>
                    <Icon name="download" size={18} /> Export CSV
                  </button>
                </div>

                <Filters
                  search={search}
                  setSearch={setSearch}
                  branch={branch}
                  setBranch={setBranch}
                  year={year}
                  setYear={setYear}
                  minimumRating={minimumRating}
                  setMinimumRating={setMinimumRating}
                  branches={branches}
                  years={years}
                />

                <div className="faculty-card-grid">
                  {facultyRatings.map((item, index) => (
                    <article className={`faculty-performance-card faculty-card-${index % 4}`} key={`${item.branch}-${item.teacher}`}>
                      <div className="faculty-card-top">
                        <div className="faculty-initial">{item.teacher.charAt(0)}</div>
                        <span className="faculty-branch">{item.branch}</span>
                      </div>
                      <h3>{item.teacher}</h3>
                      <div className="faculty-main-score">
                        <Icon name="star" size={19} />
                        <strong>{rating(item.rating)}</strong>
                        <span>/ 5</span>
                      </div>
                      <p className="faculty-count">{item.count} feedback submissions</p>
                      <MetricBar label="Teaching Quality" value={item.teaching} />
                      <MetricBar label="Explanation" value={item.explanation} />
                      <MetricBar label="Interaction" value={item.interaction} />
                    </article>
                  ))}
                </div>

                {facultyRatings.length === 0 && <p className="admin-empty">No faculty ratings found for these filters.</p>}
              </section>
            )}

            {activeTab === "ranking" && (
              <section className="admin-panel table-panel">
                <div className="panel-heading">
                  <div>
                    <span className="panel-kicker">BRANCH-WISE ANALYSIS</span>
                    <h3>Top Rated Faculty by Branch</h3>
                  </div>
                </div>

                <div className="ranking-grid">
                  {bestFaculty.map((item, index) => (
                    <article className={`ranking-card ranking-${index % 4}`} key={item.branch}>
                      <div className="ranking-icon"><Icon name="trophy" size={24} /></div>
                      <span className="ranking-branch">{item.branch}</span>
                      <h3>{item.teacher}</h3>
                      <p>Highest-rated faculty</p>
                      <div className="ranking-score">
                        <Icon name="star" size={18} />
                        {rating(item.average_rating)} <span>/ 5</span>
                      </div>
                      <div className="ranking-footer">
                        {item.feedback_count} feedback submissions
                      </div>
                    </article>
                  ))}
                </div>

                {bestFaculty.length === 0 && (
                  <p className="admin-empty">Branch rankings will appear after feedback is submitted.</p>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function Filters({
  search, setSearch, branch, setBranch, year, setYear,
  minimumRating, setMinimumRating, branches, years
}) {
  return (
    <div className="admin-filters">
      <div className="admin-search">
        <Icon name="search" size={19} />
        <input
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder="Search faculty, branch or comment..."
        />
      </div>

      <div className="filter-select">
        <Icon name="filter" size={17} />
        <select value={branch} onChange={event => setBranch(event.target.value)}>
          <option value="All">All Branches</option>
          {branches.map(item => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>

      <select className="plain-filter" value={year} onChange={event => setYear(event.target.value)}>
        <option value="All">All Years</option>
        {years.map(item => <option key={item} value={item}>{item}</option>)}
      </select>

      <select className="plain-filter" value={minimumRating} onChange={event => setMinimumRating(event.target.value)}>
        <option value="All">All Ratings</option>
        <option value="4">4+ Stars</option>
        <option value="3">3+ Stars</option>
        <option value="2">2+ Stars</option>
        <option value="1">1+ Stars</option>
      </select>
    </div>
  );
}

function FeedbackTable({ items }) {
  if (!items.length) {
    return <div className="admin-empty">No feedback records found.</div>;
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Faculty</th>
            <th>Branch / Year</th>
            <th>Rating</th>
            <th>Student Comment</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item._id || `${item.teacher}-${item.created_at}-${index}`}>
              <td>
                <div className="table-faculty">
                  <div className={`table-avatar avatar-${index % 4}`}>
                    {(item.teacher || item.faculty || "?").charAt(0)}
                  </div>
                  <div>
                    <strong>{item.teacher || item.faculty || "Unknown"}</strong>
                    <span>{item.anonymous ? "Anonymous submission" : (item.roll_no || "Student")}</span>
                  </div>
                </div>
              </td>
              <td>
                <strong>{item.branch}</strong>
                <span className="table-subtext">{item.year}</span>
              </td>
              <td>
                <span className="table-rating">
                  <Icon name="star" size={15} /> {rating(item.rating)}
                </span>
              </td>
              <td className="table-comment">{item.comment || "No comment provided"}</td>
              <td className="table-date">
                {item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MetricBar({ label, value }) {
  const percentage = Math.min(100, Math.max(0, number(value) * 20));

  return (
    <div className="metric-row">
      <div className="metric-label">
        <span>{label}</span>
        <strong>{rating(value)}/5</strong>
      </div>
      <div className="metric-track">
        <div style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
