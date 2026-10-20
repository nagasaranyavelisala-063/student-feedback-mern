const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb://127.0.0.1:27017/student_feedback";

const BRANCHES = [
  "CSE", "ECE", "EEE", "ME", "CIVIL", "IT",
  "AIML", "AIDS", "DS", "CSM", "CSD", "CS",
  "AG", "BT"
];

const YEARS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year"
];

const BRANCH_FACULTY = {
  CSE: ["Dr. Ramesh", "Mrs. Priya", "Mr. Kumar"],
  ECE: ["Dr. Sharma", "Mrs. Rao", "Mr. Kiran"],
  EEE: ["Dr. Suresh", "Mrs. Lakshmi", "Mr. Ajay"],
  ME: ["Dr. Prasad", "Mr. Ravi", "Mrs. Anitha"],
  CIVIL: ["Dr. Naresh", "Mrs. Swathi", "Mr. Vinod"],
  IT: ["Dr. Arjun", "Mrs. Kavya", "Mr. Rahul"],
  AIML: ["Dr. Arjun", "Mrs. Kavya", "Mr. Rahul"],
  AIDS: ["Dr. Arjun", "Mrs. Kavya", "Mr. Rahul"],
  DS: ["Dr. Arjun", "Mrs. Kavya", "Mr. Rahul"],
  CSM: ["Dr. Arjun", "Mrs. Kavya", "Mr. Rahul"],
  CSD: ["Dr. Arjun", "Mrs. Kavya", "Mr. Rahul"],
  CS: ["Dr. Arjun", "Mrs. Kavya", "Mr. Rahul"],
  AG: ["Dr. Suresh", "Mrs. Lakshmi", "Mr. Ajay"],
  BT: ["Dr. Prasad", "Mr. Ravi", "Mrs. Anitha"]
};

const studentSchema = new mongoose.Schema({
  roll_no: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

const feedbackSchema = new mongoose.Schema({
  roll_no: {
    type: String,
    default: ""
  },
  branch: {
    type: String,
    required: true
  },
  year: {
    type: String,
    required: true
  },
  teacher: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  teaching_quality: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  explanation: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  interaction: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    default: ""
  },
  anonymous: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

const Student = mongoose.model("Student", studentSchema);
const Feedback = mongoose.model("Feedback", feedbackSchema);

function requireAdmin(req, res, next) {
  if (req.headers["x-user-role"] !== "admin") {
    return res.status(401).json({
      success: false,
      message: "Admin login required."
    });
  }

  next();
}

function validateFeedback(item) {
  const branch = String(item.branch || "").trim();
  const year = String(item.year || "").trim();
  const teacher = String(
    item.teacher || item.faculty || ""
  ).trim();

  const ratingFields = [
    item.rating,
    item.teaching_quality,
    item.explanation,
    item.interaction
  ];

  if (!BRANCHES.includes(branch)) {
    return "Please select a valid branch.";
  }

  if (!YEARS.includes(year)) {
    return "Please select a valid year.";
  }

  if (
    !BRANCH_FACULTY[branch] ||
    !BRANCH_FACULTY[branch].includes(teacher)
  ) {
    return "Please select a valid faculty for the branch.";
  }

  for (const value of ratingFields) {
    const number = Number(value);

    if (
      value === undefined ||
      value === null ||
      value === "" ||
      !Number.isInteger(number) ||
      number < 1 ||
      number > 5
    ) {
      return "All ratings must be between 1 and 5.";
    }
  }

  return null;
}

function normalizeFeedback(item, rollNo) {
  return {
    roll_no: item.anonymous ? "" : rollNo,
    branch: String(item.branch).trim(),
    year: String(item.year).trim(),
    teacher: String(item.teacher || item.faculty).trim(),
    rating: Number(item.rating),
    teaching_quality: Number(item.teaching_quality),
    explanation: Number(item.explanation),
    interaction: Number(item.interaction),
    comment: String(item.comment || "").trim(),
    anonymous: Boolean(item.anonymous)
  };
}

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Student Feedback System API is running."
  });
});

app.get("/api/test-db", (req, res) => {
  res.json({
    success: mongoose.connection.readyState === 1,
    database: mongoose.connection.name,
    message:
      mongoose.connection.readyState === 1
        ? "MongoDB connected successfully."
        : "MongoDB is not connected."
  });
});

app.get("/api/branches", (req, res) => {
  res.json({
    success: true,
    branches: BRANCHES
  });
});

app.get("/api/years", (req, res) => {
  res.json({
    success: true,
    years: YEARS
  });
});

app.get("/api/faculty", (req, res) => {
  const branch = String(req.query.branch || "").trim();

  if (branch) {
    return res.json({
      success: true,
      branch,
      faculty: BRANCH_FACULTY[branch] || []
    });
  }

  const faculty = Object.entries(BRANCH_FACULTY).map(
    ([branchName, teachers]) => ({
      branch: branchName,
      teachers
    })
  );

  res.json({
    success: true,
    faculty
  });
});

app.get("/api/faculty/:branch", (req, res) => {
  const branch = String(req.params.branch).trim();

  res.json({
    success: true,
    branch,
    faculty: BRANCH_FACULTY[branch] || []
  });
});

/* STUDENT LOGIN */

app.post("/api/student/login", async (req, res) => {
  try {
    const roll_no = String(
      req.body?.roll_no || ""
    ).trim();

    if (!roll_no) {
      return res.status(400).json({
        success: false,
        message: "Please enter your roll number."
      });
    }

    await Student.updateOne(
      { roll_no },
      { $setOnInsert: { roll_no } },
      { upsert: true }
    );

    return res.json({
      success: true,
      role: "student",
      roll_no,
      message: "Student login successful."
    });
  } catch (error) {
    console.error("Student login error:", error);

    res.status(500).json({
      success: false,
      message: "Student login failed."
    });
  }
});

/* ADMIN LOGIN */

app.post("/api/admin/login", (req, res) => {
  const username = String(
    req.body?.username || ""
  ).trim();

  const password = String(
    req.body?.password || ""
  );

  const adminUsername =
    process.env.ADMIN_USERNAME || "admin";

  const adminPassword =
    process.env.ADMIN_PASSWORD || "admin123";

  if (
    username !== adminUsername ||
    password !== adminPassword
  ) {
    return res.status(401).json({
      success: false,
      message: "Invalid admin username or password."
    });
  }

  res.json({
    success: true,
    role: "admin",
    message: "Admin login successful."
  });
});

/* SUBMIT ONE FEEDBACK */

app.post("/api/feedback", async (req, res) => {
  try {
    const roll_no = String(
      req.body?.roll_no || ""
    ).trim();

    if (!roll_no) {
      return res.status(400).json({
        success: false,
        message: "Please log in as a student."
      });
    }

    const validationError = validateFeedback(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    await Student.updateOne(
      { roll_no },
      { $setOnInsert: { roll_no } },
      { upsert: true }
    );

    const feedbackData = normalizeFeedback(
      req.body,
      roll_no
    );

    const feedback = await Feedback.create(feedbackData);

    res.status(201).json({
      success: true,
      message: "Feedback submitted successfully.",
      feedback
    });
  } catch (error) {
    console.error("Feedback submit error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to submit feedback."
    });
  }
});

/* SUBMIT FEEDBACK FOR MULTIPLE FACULTY */

app.post("/api/feedback/bulk", async (req, res) => {
  try {
    const roll_no = String(
      req.body?.roll_no || ""
    ).trim();

    const feedbackList = req.body?.feedbacks;

    if (!roll_no) {
      return res.status(400).json({
        success: false,
        message: "Please log in as a student."
      });
    }

    if (
      !Array.isArray(feedbackList) ||
      feedbackList.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide feedback for faculty."
      });
    }

    for (let i = 0; i < feedbackList.length; i++) {
      const error = validateFeedback(feedbackList[i]);

      if (error) {
        return res.status(400).json({
          success: false,
          message: `Feedback ${i + 1}: ${error}`
        });
      }
    }

    await Student.updateOne(
      { roll_no },
      { $setOnInsert: { roll_no } },
      { upsert: true }
    );

    const documents = feedbackList.map((item) =>
      normalizeFeedback(item, roll_no)
    );

    const feedbacks = await Feedback.insertMany(documents);

    res.status(201).json({
      success: true,
      message: "All feedback submitted successfully.",
      count: feedbacks.length
    });
  } catch (error) {
    console.error("Bulk feedback error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to submit feedback."
    });
  }
});

/* STUDENT FEEDBACK HISTORY */

app.get("/api/feedback/student/:rollNo", async (req, res) => {
  try {
    const rollNo = String(req.params.rollNo).trim();

    const feedbacks = await Feedback.find({
      roll_no: rollNo
    }).sort({ created_at: -1 });

    res.json({
      success: true,
      feedbacks
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch student feedback."
    });
  }
});

/* ADMIN DASHBOARD */

app.get(
  "/api/admin/dashboard",
  requireAdmin,
  async (req, res) => {
    try {
      const total_feedback = await Feedback.countDocuments();

      const total_students = await Student.countDocuments();

      const total_faculty = new Set(
        Object.values(BRANCH_FACULTY).flat()
      ).size;

      const averageResult = await Feedback.aggregate([
        {
          $group: {
            _id: null,
            average: { $avg: "$rating" }
          }
        }
      ]);

      const avg_rating = averageResult.length
        ? Number(averageResult[0].average.toFixed(2))
        : 0;

      const faculty_ratings = await Feedback.aggregate([
        {
          $group: {
            _id: {
              branch: "$branch",
              teacher: "$teacher"
            },
            feedback_count: { $sum: 1 },
            average_rating: { $avg: "$rating" },
            teaching_average: { $avg: "$teaching_quality" },
            explanation_average: { $avg: "$explanation" },
            interaction_average: { $avg: "$interaction" }
          }
        },
        {
          $project: {
            _id: 0,
            branch: "$_id.branch",
            teacher: "$_id.teacher",
            feedback_count: 1,
            average_rating: {
              $round: ["$average_rating", 2]
            },
            teaching_average: {
              $round: ["$teaching_average", 2]
            },
            explanation_average: {
              $round: ["$explanation_average", 2]
            },
            interaction_average: {
              $round: ["$interaction_average", 2]
            }
          }
        },
        {
          $sort: {
            average_rating: -1
          }
        }
      ]);

      const recent_feedback = await Feedback.find()
        .sort({ created_at: -1 })
        .limit(10)
        .select(
          "branch year teacher rating comment anonymous created_at"
        )
        .lean();

      res.json({
        success: true,
        total_feedback,
        total_students,
        total_faculty,
        avg_rating,
        faculty_ratings,
        recent_feedback
      });
    } catch (error) {
      console.error("Dashboard error:", error);

      res.status(500).json({
        success: false,
        message: "Unable to load admin dashboard."
      });
    }
  }
);

/* BRANCH-WISE BEST FACULTY */

app.get(
  "/api/admin/branch-best-faculty",
  requireAdmin,
  async (req, res) => {
    try {
      const results = await Feedback.aggregate([
        {
          $group: {
            _id: {
              branch: "$branch",
              teacher: "$teacher"
            },
            average_rating: { $avg: "$rating" },
            feedback_count: { $sum: 1 }
          }
        },
        {
          $sort: {
            "_id.branch": 1,
            average_rating: -1,
            feedback_count: -1
          }
        },
        {
          $group: {
            _id: "$_id.branch",
            teacher: { $first: "$_id.teacher" },
            average_rating: { $first: "$average_rating" },
            feedback_count: { $first: "$feedback_count" }
          }
        },
        {
          $project: {
            _id: 0,
            branch: "$_id",
            teacher: 1,
            average_rating: {
              $round: ["$average_rating", 2]
            },
            feedback_count: 1
          }
        },
        {
          $sort: {
            branch: 1
          }
        }
      ]);

      res.json({
        success: true,
        branch_best_faculty: results
      });
    } catch (error) {
      console.error("Best faculty error:", error);

      res.status(500).json({
        success: false,
        message: "Unable to calculate best faculty."
      });
    }
  }
);

/* ADMIN: VIEW ALL FEEDBACK */

app.get(
  "/api/admin/feedback",
  requireAdmin,
  async (req, res) => {
    try {
      const feedbacks = await Feedback.find()
        .sort({ created_at: -1 })
        .lean();

      res.json({
        success: true,
        feedbacks
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message: "Unable to fetch feedback."
      });
    }
  }
);

/* START SERVER AFTER DATABASE CONNECTION */

async function startServer() {
  try {
    await mongoose.connect(MONGO_URI);

    console.log(
      `MongoDB connected: ${mongoose.connection.name}`
    );

    app.listen(PORT, () => {
      console.log(
        `Backend running at http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error(
      "MongoDB connection failed:",
      error.message
    );

    process.exit(1);
  }
}

startServer();