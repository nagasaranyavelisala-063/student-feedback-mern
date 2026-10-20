
import { useEffect, useState } from "react";
import "./Student.css";

const API = "https://student-feedback-mern.onrender.com";

const emptyRating = {
  rating: 0,
  teaching_quality: 0,
  explanation: 0,
  interaction: 0,
};

function Icon({ name, size = 20 }) {
  const paths = {
    home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9"/><path d="M9 20v-7h6v7"/></>,
    star: <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z"/>,
    book: <><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 4.5v17"/><path d="M8 6h8M8 10h7"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    send: <><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/></>,
    logout: <><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7"/></>,
    message: <><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    arrow: <><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

function RatingStars({ value, onChange, label }) {
  return (
    <div className="rating-control">
      <div className="rating-stars" role="group" aria-label={label}>
        {[1, 2, 3, 4, 5].map((number) => (
          <button
            key={number}
            type="button"
            className={number <= value ? "rating-star selected" : "rating-star"}
            aria-label={`${number} out of 5`}
            aria-pressed={number === value}
            onClick={() => onChange(number)}
          >
            <Icon name="star" size={21} />
          </button>
        ))}
      </div>
      <span className="rating-value">
        {value ? `${value}/5` : "Not rated"}
      </span>
    </div>
  );
}

export default function Student() {
  const rollNo =
    sessionStorage.getItem("rollNo") ||
    sessionStorage.getItem("roll_no") ||
    "";

  const [branches, setBranches] = useState([]);
  const [years, setYears] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [rows, setRows] = useState([]);
  const [comment, setComment] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function loadOptions() {
      setLoading(true);
      setError("");

      try {
        const [branchResponse, yearResponse] = await Promise.all([
          fetch(`${API}/api/branches`),
          fetch(`${API}/api/years`),
        ]);

        const branchData = await branchResponse.json();
        const yearData = await yearResponse.json();

        if (!branchResponse.ok || !yearResponse.ok) {
          throw new Error("Unable to load branch and year details.");
        }

        const branchList = Array.isArray(branchData)
          ? branchData
          : branchData.branches || [];

        const yearList = Array.isArray(yearData)
          ? yearData
          : yearData.years || [];

        setBranches(branchList);
        setYears(yearList);
      } catch (err) {
        setError(err.message || "Could not connect to the server.");
      } finally {
        setLoading(false);
      }
    }

    loadOptions();
  }, []);

  useEffect(() => {
    if (!branch) {
      setFaculty([]);
      setRows([]);
      return;
    }

    async function loadFaculty() {
      setLoading(true);
      setError("");
      setFaculty([]);
      setRows([]);

      try {
        const response = await fetch(
          `${API}/api/faculty?branch=${encodeURIComponent(branch)}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load faculty.");
        }

        const list = Array.isArray(data)
          ? data
          : data.faculty || data.teachers || [];

        const names = list.map((item) =>
          typeof item === "string"
            ? item
            : item.teacher || item.name || item.faculty
        ).filter(Boolean);

        setFaculty(names);
        setRows(
          names.map((teacher) => ({
            faculty: teacher,
            ...emptyRating,
          }))
        );
      } catch (err) {
        setError(err.message || "Could not load faculty.");
      } finally {
        setLoading(false);
      }
    }

    loadFaculty();
  }, [branch]);

  function updateRating(index, field, value) {
    setRows((previous) =>
      previous.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row
      )
    );
  }

  function resetRatings() {
    setRows((previous) =>
      previous.map((row) => ({
        ...row,
        ...emptyRating,
      }))
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!branch || !year) {
      setError("Please select your branch and year.");
      return;
    }

    if (!rows.length) {
      setError("No faculty found for the selected branch.");
      return;
    }

    const incomplete = rows.find(
      (row) =>
        !row.rating ||
        !row.teaching_quality ||
        !row.explanation ||
        !row.interaction
    );

    if (incomplete) {
      setError(`Please complete all ratings for ${incomplete.faculty}.`);
      return;
    }

    setSending(true);

    try {
      const response = await fetch(`${API}/api/feedback/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roll_no: rollNo,
          branch,
          year,
          feedbacks: rows.map((row) => ({
            ...row,
            branch,
            year,
            comment,
            anonymous,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Feedback submission failed.");
      }

      setMessage(
        data.message ||
        `Feedback submitted successfully${data.count ? ` for ${data.count} faculty members` : ""}.`
      );

      setComment("");
      setAnonymous(false);
      resetRatings();
    } catch (err) {
      setError(err.message || "Could not submit feedback.");
    } finally {
      setSending(false);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem("role");
    sessionStorage.removeItem("rollNo");
    sessionStorage.removeItem("roll_no");
    window.location.reload();
  }

  const completedRatings = rows.filter(
    (row) =>
      row.rating &&
      row.teaching_quality &&
      row.explanation &&
      row.interaction
  ).length;

  return (
    <main className="student-app">
      <header className="student-header">
        <a className="student-brand" href="#student-home">
          <span className="brand-mark"><Icon name="message" size={23} /></span>
          <span>Campus<span className="brand-accent">Voice</span></span>
        </a>

        <nav className="student-nav" aria-label="Main navigation">
          <a className="nav-active" href="#student-home">
            <Icon name="home" size={17} />
            <span>Feedback</span>
          </a>
          <a href="#faculty-feedback">
            <Icon name="book" size={17} />
            <span>Faculty</span>
          </a>
        </nav>

        <div className="student-account">
          <div className="account-avatar"><Icon name="user" size={19} /></div>
          <div className="account-details">
            <span>Signed in as</span>
            <strong>{rollNo || "Student"}</strong>
          </div>
          <button className="logout-button" onClick={handleLogout} type="button">
            <Icon name="logout" size={17} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <section className="student-hero" id="student-home">
        <div className="hero-copy">
          <span className="hero-label">STUDENT FEEDBACK PORTAL</span>
          <h1>Your voice can make<br />a <span>real difference.</span></h1>
          <p>
            Share honest feedback about your faculty and help create a
            better learning experience for everyone.
          </p>
          <div className="hero-points">
            <span><Icon name="shield" size={17} /> Your feedback matters</span>
            <span><Icon name="check" size={17} /> Simple and secure</span>
          </div>
        </div>

        <div className="hero-art" aria-hidden="true">
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="art-card">
            <div className="art-card-top">
              <span className="art-symbol"><Icon name="star" size={24} /></span>
              <span className="art-status"><span /> YOUR OPINION COUNTS</span>
            </div>
            <div className="art-stars">★★★★★</div>
            <div className="art-lines"><span /><span /><span /></div>
            <div className="art-card-bottom">
              <span>Feedback</span>
              <span className="art-check"><Icon name="check" size={16} /></span>
            </div>
          </div>
          <div className="art-floating art-float-top">5.0</div>
          <div className="art-floating art-float-bottom"><Icon name="check" size={18} /></div>
        </div>
      </section>

      <section className="student-stats" aria-label="Feedback progress">
        <div className="progress-card">
          <div className="progress-icon purple"><Icon name="book" size={22} /></div>
          <div>
            <span>Selected branch</span>
            <strong>{branch || "Not selected"}</strong>
          </div>
        </div>
        <div className="progress-card">
          <div className="progress-icon pink"><Icon name="user" size={22} /></div>
          <div>
            <span>Faculty members</span>
            <strong>{faculty.length}</strong>
          </div>
        </div>
        <div className="progress-card">
          <div className="progress-icon orange"><Icon name="star" size={22} /></div>
          <div>
            <span>Ratings completed</span>
            <strong>{completedRatings} / {rows.length}</strong>
          </div>
        </div>
      </section>

      <section className="feedback-section" id="faculty-feedback">
        <div className="section-heading">
          <div>
            <span className="section-kicker">LET'S GET STARTED</span>
            <h2>Share your feedback</h2>
            <p>Choose your academic details and rate each faculty member.</p>
          </div>
          <div className="step-badge"><span>01</span> Your feedback</div>
        </div>

        {error && (
          <div className="status-message error-message" role="alert">
            {error}
          </div>
        )}

        {message && (
          <div className="status-message success-message" role="status">
            <Icon name="check" size={19} />
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="details-card">
            <div className="card-heading">
              <span className="heading-icon"><Icon name="book" size={20} /></span>
              <div>
                <h3>Academic details</h3>
                <p>Tell us about your class.</p>
              </div>
            </div>

            <div className="details-grid">
              <div className="field-group">
                <label htmlFor="branch">Branch</label>
                <select
                  id="branch"
                  value={branch}
                  onChange={(event) => {
                    setBranch(event.target.value);
                    setMessage("");
                    setError("");
                  }}
                  required
                >
                  <option value="">Select your branch</option>
                  {branches.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label htmlFor="year">Academic year</label>
                <select
                  id="year"
                  value={year}
                  onChange={(event) => setYear(event.target.value)}
                  required
                >
                  <option value="">Select your year</option>
                  {years.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="faculty-heading">
            <div>
              <span className="section-kicker">YOUR EXPERIENCE</span>
              <h3>Faculty ratings</h3>
            </div>
            <span className="faculty-count">{faculty.length} faculty</span>
          </div>

          {loading && (
            <div className="empty-state">Loading your details...</div>
          )}

          {!loading && !branch && (
            <div className="empty-state">
              Select your branch to see the available faculty members.
            </div>
          )}

          {!loading && branch && faculty.length === 0 && !error && (
            <div className="empty-state">
              No faculty members were returned for this branch.
            </div>
          )}

          <div className="faculty-list">
            {rows.map((row, index) => (
              <article className="faculty-card" key={row.faculty}>
                <div className="faculty-card-top">
                  <div className="faculty-avatar">
                    <Icon name="user" size={24} />
                  </div>
                  <div className="faculty-name">
                    <span>FACULTY MEMBER {String(index + 1).padStart(2, "0")}</span>
                    <h4>{row.faculty}</h4>
                    <p>{branch} Department</p>
                  </div>
                  <div className="overall-rating">
                    <span>Overall rating</span>
                    <RatingStars
                      label={`Overall rating for ${row.faculty}`}
                      value={row.rating}
                      onChange={(value) => updateRating(index, "rating", value)}
                    />
                  </div>
                </div>

                <div className="rating-divider" />

                <div className="rating-grid">
                  <div className="rating-item">
                    <label>Teaching quality</label>
                    <RatingStars
                      label={`Teaching quality for ${row.faculty}`}
                      value={row.teaching_quality}
                      onChange={(value) => updateRating(index, "teaching_quality", value)}
                    />
                  </div>

                  <div className="rating-item">
                    <label>Explanation of concepts</label>
                    <RatingStars
                      label={`Explanation of concepts for ${row.faculty}`}
                      value={row.explanation}
                      onChange={(value) => updateRating(index, "explanation", value)}
                    />
                  </div>

                  <div className="rating-item">
                    <label>Interaction with students</label>
                    <RatingStars
                      label={`Interaction for ${row.faculty}`}
                      value={row.interaction}
                      onChange={(value) => updateRating(index, "interaction", value)}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="comments-card">
            <div className="card-heading">
              <span className="heading-icon comment-icon"><Icon name="message" size={20} /></span>
              <div>
                <h3>Additional comments</h3>
                <p>Share suggestions that can improve learning.</p>
              </div>
            </div>

            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Write your thoughts or suggestions here..."
              rows={4}
            />

            <label className="anonymous-option">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(event) => setAnonymous(event.target.checked)}
              />
              <span className="custom-checkbox"><Icon name="check" size={14} /></span>
              <span className="anonymous-text">
                <strong>Submit feedback as anonymous</strong>
                <small>Request that your identity be hidden from faculty.</small>
              </span>
              <Icon name="lock" size={20} />
            </label>
          </div>

          <div className="submit-area">
            <p>Review all ratings before submitting your feedback.</p>
            <button
              className="submit-feedback"
              type="submit"
              disabled={sending || loading || rows.length === 0}
            >
              {sending ? "Submitting..." : "Submit all feedback"}
              <Icon name="send" size={19} />
            </button>
          </div>
        </form>

        <footer className="student-footer">
          <span className="footer-brand">CampusVoice</span>
          <span>Student Feedback System</span>
          <span className="footer-lock"><Icon name="shield" size={15} /> Feedback portal</span>
        </footer>
      </section>
    </main>
  );
}
