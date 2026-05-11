require("dotenv").config();
const mysql = require("mysql2/promise");

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  console.log("Connected to MySQL. Seeding notifications...\n");

  // Create table if not exists
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS notifications (
      id VARCHAR(100) PRIMARY KEY,
      type VARCHAR(50) NOT NULL,
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const notifications = [
    // ── Events ──
    {
      id: "EVT-2026-001",
      type: "Event",
      message: "🎯 Annual Hackathon 2026 — 48-hour coding marathon starts May 17. Register your team of 4 on the portal before May 15. Prizes worth ₹2,00,000!",
      is_read: false,
      created_at: "2026-05-11 09:00:00",
    },
    {
      id: "EVT-2026-002",
      type: "Event",
      message: "🎤 Guest Lecture: 'The Future of Generative AI' by Dr. Rajeev Kumar (IIT Delhi) on May 14, 3:00 PM at Auditorium B. All CSE students must attend.",
      is_read: false,
      created_at: "2026-05-10 14:30:00",
    },
    {
      id: "EVT-2026-003",
      type: "Event",
      message: "🏆 Inter-Department Sports Fest 'Blitz 2026' registrations open. Cricket, Basketball, and Badminton events from May 20-22. Register at Sports Complex.",
      is_read: true,
      created_at: "2026-05-09 11:00:00",
    },
    {
      id: "EVT-2026-004",
      type: "Event",
      message: "💻 Workshop: Full-Stack Development with MERN — A 3-day intensive workshop by Microsoft Student Chapter. May 12-14, Lab 4. Limited to 60 seats.",
      is_read: false,
      created_at: "2026-05-08 16:45:00",
    },
    {
      id: "EVT-2026-005",
      type: "Event",
      message: "🎶 Cultural Night 'Euphoria 2026' auditions scheduled for May 16. Singing, Dancing, and Stand-up Comedy categories. Venue: Open Air Theatre.",
      is_read: true,
      created_at: "2026-05-07 10:15:00",
    },

    // ── Results ──
    {
      id: "RES-2026-001",
      type: "Result",
      message: "📊 Mid-Semester Examination Results for CSE Semester 4 have been published. Check your grades on the student portal. Contact exam cell for discrepancies.",
      is_read: false,
      created_at: "2026-05-11 08:00:00",
    },
    {
      id: "RES-2026-002",
      type: "Result",
      message: "📝 Internal Assessment Marks (IA-2) for Data Structures & Algorithms uploaded. Maximum: 30, Average: 22.5. View detailed breakdown on portal.",
      is_read: false,
      created_at: "2026-05-10 09:30:00",
    },
    {
      id: "RES-2026-003",
      type: "Result",
      message: "🏅 Code Sprint 2026 Leaderboard finalized — Top 3: Arjun Mehta (1st), Sneha Gupta (2nd), Rahul Verma (3rd). Certificates will be emailed within 48 hours.",
      is_read: true,
      created_at: "2026-05-09 17:00:00",
    },
    {
      id: "RES-2026-004",
      type: "Result",
      message: "📋 Lab Practical Examination (DBMS) results declared. Viva rescheduled for students with KT — check updated schedule on notice board.",
      is_read: true,
      created_at: "2026-05-06 12:00:00",
    },

    // ── Placements ──
    {
      id: "PLC-2026-001",
      type: "Placement",
      message: "🚀 Google — SDE Intern (Summer 2026) applications open! Eligibility: CGPA ≥ 8.0, CSE/IT. CTC: ₹1,50,000/month. Apply on placement portal by May 13.",
      is_read: false,
      created_at: "2026-05-11 07:00:00",
    },
    {
      id: "PLC-2026-002",
      type: "Placement",
      message: "🏢 Microsoft — Pre-Placement Talk scheduled for May 15, 2:00 PM at Seminar Hall. All eligible students must attend. Dress code: Business Casuals.",
      is_read: false,
      created_at: "2026-05-10 10:00:00",
    },
    {
      id: "PLC-2026-003",
      type: "Placement",
      message: "💼 Amazon — 12 students selected for SDE-1 role! Package: ₹38 LPA. Selected students: check your email for offer letter and joining details.",
      is_read: true,
      created_at: "2026-05-09 15:00:00",
    },
    {
      id: "PLC-2026-004",
      type: "Placement",
      message: "📢 Infosys — InfyTQ certification results out. 45 students qualified for Power Programmer role (₹9.5 LPA). Interview schedule will be shared by May 14.",
      is_read: false,
      created_at: "2026-05-08 13:30:00",
    },
    {
      id: "PLC-2026-005",
      type: "Placement",
      message: "🎯 Flipkart — Campus hiring drive on May 19. Online coding round followed by 2 technical + 1 HR interview. Eligible branches: CSE, IT, ECE. Register now!",
      is_read: true,
      created_at: "2026-05-05 09:00:00",
    },
    {
      id: "PLC-2026-006",
      type: "Placement",
      message: "📈 Placement Report: 85% placement rate achieved for Batch 2026. Highest package: ₹52 LPA (Google). Average package: ₹12.4 LPA. Congratulations!",
      is_read: true,
      created_at: "2026-05-04 11:00:00",
    },
  ];

  let inserted = 0;
  for (const n of notifications) {
    try {
      const [result] = await connection.execute(
        `INSERT INTO notifications (id, type, message, is_read, created_at) VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE message = VALUES(message), type = VALUES(type), is_read = VALUES(is_read), created_at = VALUES(created_at)`,
        [n.id, n.type, n.message, n.is_read, n.created_at]
      );
      inserted++;
      console.log(`  ✅ ${n.id} — ${n.type}`);
    } catch (err) {
      console.error(`  ❌ ${n.id} — ${err.message}`);
    }
  }

  console.log(`\n🎉 Done! ${inserted} notifications seeded.`);
  await connection.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
