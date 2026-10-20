import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./AdminDashboard.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const empty = { total_feedback: 0, total_students: 0, total_faculty: 0, avg_rating: 0, faculty_ratings: [], recent_feedback: [], branches: [], years: [] };

export default function AdminDashboard({ onLogout }) {
  const [data, setData] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dark, setDark] = useState(() => localStorage.getItem("feedback-theme") === "dark");
  const [filters, setFilters] = useState({ branch: "", year: "", faculty: "", from: "", to: "", search: "" });

  async function loadDashboard(nextFilters = filters) {
    setLoading(true); setError("");
    try {
      const params = {};
      ["branch", "year", "faculty", "from", "to"].forEach(k => { if (nextFilters[k]) params[k] = nextFilters[k]; });
      const response = await axios.get(`${API}/api/admin/dashboard`, { params });
      setData(response.data);
    } catch (e) {
      setError(e.response?.data?.message || "Backend connect avvaledu. Node server run avutundo check cheyyandi.");
    } finally { setLoading(false); }
  }

  useEffect(() => { loadDashboard(); }, []);
  useEffect(() => { document.documentElement.dataset.theme = dark ? "dark" : "light"; localStorage.setItem("feedback-theme", dark ? "dark" : "light"); }, [dark]);

  const facultyOptions = useMemo(() => [...new Set(data.faculty_ratings.map(x => x.teacher).filter(Boolean))].sort(), [data.faculty_ratings]);
  const visibleFeedback = useMemo(() => data.recent_feedback.filter(f => {
    const q = filters.search.toLowerCase();
    return !q || [f.teacher, f.branch, f.year, f.comment, f.rating].some(v => String(v ?? "").toLowerCase().includes(q));
  }), [data.recent_feedback, filters.search]);

  function update(k, v) { setFilters(old => ({ ...old, [k]: v })); }
  function resetFilters() { const clean = { branch: "", year: "", faculty: "", from: "", to: "", search: "" }; setFilters(clean); loadDashboard(clean); }
  function exportExcel() {
    const safeRows = visibleFeedback.map(f => ({
      Branch: f.branch, Year: f.year, Faculty: f.teacher, Rating: f.rating,
      Teaching: f.teaching_quality, Explanation: f.explanation, Interaction: f.interaction,
      Anonymous: f.is_anonymous ? "Yes" : "No", Student: f.is_anonymous ? "Hidden" : (f.roll_no || ""),
      Comment: f.comment, Date: f.created_at ? new Date(f.created_at).toLocaleString() : ""
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(safeRows), "Feedback");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.faculty_ratings.map(f => ({
      Branch: f.branch, Faculty: f.teacher, Feedbacks: f.feedback_count, Average: f.average_rating,
      Teaching: f.teaching_average, Explanation: f.explanation_average, Interaction: f.interaction_average
    }))), "Faculty Analytics");
    XLSX.writeFile(wb, "student-feedback-report.xlsx");
  }
  function exportPDF() {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(16); doc.text("Student Feedback Report", 14, 15);
    doc.setFontSize(10); doc.text(`Feedback: ${data.total_feedback}   Students: ${data.total_students}   Faculty: ${data.total_faculty}   Average: ${data.avg_rating}/5`, 14, 23);
    autoTable(doc, { startY: 29, head: [["Branch", "Year", "Faculty", "Rating", "Anonymous", "Student", "Comment"]], body: visibleFeedback.map(f => [f.branch, f.year, f.teacher, f.rating, f.is_anonymous ? "Yes" : "No", f.is_anonymous ? "Hidden" : (f.roll_no || ""), f.comment || ""]), styles: { fontSize: 8 } });
    doc.save("student-feedback-report.pdf");
  }

  return <div className={`admin-shell ${dark ? "dark" : ""}`}>
    <header className="dash-topbar">
      <div><div className="eyebrow">STUDENT FEEDBACK SYSTEM</div><h1>Admin Dashboard</h1><p>Feedback overview and faculty performance</p></div>
      <div className="top-actions">
        <button className="btn secondary" onClick={() => setDark(v => !v)}>{dark ? "☀ Light mode" : "☾ Dark mode"}</button>
        <button className="btn secondary" onClick={() => loadDashboard()}>↻ Refresh</button>
        <button className="btn primary" onClick={onLogout || (() => { localStorage.removeItem("feedbackRole"); localStorage.removeItem("feedbackToken"); window.location.href = "/"; })}>Logout</button>
      </div>
    </header>

    {error && <div className="error-banner">{error}</div>}
    <section className="stats-grid">
      <Stat title="Total Feedback" value={data.total_feedback} icon="✉" />
      <Stat title="Identified Students" value={data.total_students} icon="♙" />
      <Stat title="Faculty Members" value={data.total_faculty} icon="♧" />
      <Stat title="Average Rating" value={`${Number(data.avg_rating || 0).toFixed(2)} / 5`} icon="★" />
    </section>

    <section className="panel filters-panel">
      <div className="panel-heading"><div><h2>Search & Filters</h2><p>Choose a branch, year or date range and apply.</p></div><button className="btn secondary" onClick={resetFilters}>Clear filters</button></div>
      <div className="filters-grid">
        <label>Branch<select value={filters.branch} onChange={e => update("branch", e.target.value)}><option value="">All branches</option>{(data.branches.length ? data.branches : ["CSE","ECE","EEE","ME","CIVIL","IT","AIML","AIDS","DS","CSM","CSD","CS","AG","BT"]).map(x => <option key={x}>{x}</option>)}</select></label>
        <label>Year<select value={filters.year} onChange={e => update("year", e.target.value)}><option value="">All years</option>{(data.years.length ? data.years : ["1st Year","2nd Year","3rd Year","4th Year"]).map(x => <option key={x}>{x}</option>)}</select></label>
        <label>Faculty<select value={filters.faculty} onChange={e => update("faculty", e.target.value)}><option value="">All faculty</option>{facultyOptions.map(x => <option key={x}>{x}</option>)}</select></label>
        <label>From date<input type="date" value={filters.from} onChange={e => update("from", e.target.value)} /></label>
        <label>To date<input type="date" value={filters.to} onChange={e => update("to", e.target.value)} /></label>
        <button className="btn primary apply-btn" onClick={() => loadDashboard()}>Apply filters</button>
      </div>
      <label className="search-label">Search visible feedback<input value={filters.search} onChange={e => update("search", e.target.value)} placeholder="Search faculty, branch, comment or rating..." /></label>
    </section>

    <section className="content-grid">
      <div className="panel chart-panel"><div className="panel-heading"><div><h2>Faculty Analytics</h2><p>Average overall rating out of 5</p></div></div>
        {data.faculty_ratings.length ? <div className="chart-wrap"><ResponsiveContainer width="100%" height={300}><BarChart data={data.faculty_ratings.slice(0, 12)} margin={{ top: 8, right: 12, left: -18, bottom: 55 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="teacher" angle={-30} textAnchor="end" interval={0} tick={{ fontSize: 11 }} /><YAxis domain={[0,5]} /><Tooltip /><Bar dataKey="average_rating" name="Average rating" fill="#6258e8" radius={[6,6,0,0]} /></BarChart></ResponsiveContainer></div> : <div className="empty-state">Feedback submit ayyaka analytics ikkada kanipistayi.</div>}
      </div>
      <div className="panel ranking-panel"><div className="panel-heading"><div><h2>Faculty Summary</h2><p>Sorted by highest rating</p></div></div>
        <div className="ranking-list">{data.faculty_ratings.slice(0, 8).map((f, i) => <div className="rank-row" key={`${f.branch}-${f.teacher}`}><span className="rank-number">{i + 1}</span><div className="rank-main"><strong>{f.teacher || "Faculty"}</strong><small>{f.branch} · {f.feedback_count} feedbacks</small></div><strong className="rank-score">★ {Number(f.average_rating || 0).toFixed(2)}</strong></div>)}
        {!data.faculty_ratings.length && <div className="empty-state">No faculty ratings yet.</div>}</div>
      </div>
    </section>

    <section className="panel table-panel"><div className="panel-heading"><div><h2>Recent Feedback</h2><p>Anonymous student identifiers are hidden.</p></div><div className="export-actions"><button className="btn secondary" onClick={exportExcel}>⇩ Excel</button><button className="btn primary" onClick={exportPDF}>⇩ PDF</button></div></div>
      {loading ? <div className="empty-state">Loading dashboard...</div> : <div className="table-scroll"><table><thead><tr><th>Branch</th><th>Year</th><th>Faculty</th><th>Rating</th><th>Student</th><th>Comment</th><th>Date</th></tr></thead><tbody>{visibleFeedback.map(f => <tr key={f._id}><td><span className="branch-pill">{f.branch}</span></td><td>{f.year}</td><td>{f.teacher}</td><td><span className="rating-pill">★ {f.rating}</span></td><td>{f.is_anonymous ? <span className="anonymous-pill">Anonymous</span> : (f.roll_no || "—")}</td><td className="comment-cell">{f.comment || "—"}</td><td>{f.created_at ? new Date(f.created_at).toLocaleDateString() : "—"}</td></tr>)}</tbody></table>{!visibleFeedback.length && <div className="empty-state">No feedback matches your search.</div>}</div>}
    </section>
    <footer className="dash-footer">Student Feedback System · Admin analytics</footer>
  </div>;
}

function Stat({ title, value, icon }) {
  return <article className="stat-card"><div className="stat-icon">{icon}</div><div><p>{title}</p><strong>{value}</strong></div></article>;
}
