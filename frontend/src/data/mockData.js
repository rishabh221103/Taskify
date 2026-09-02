export const MEMBERS = [
  { id: "m1", name: "Rishabh Pathak", initials: "RP", color: "#3B82F6", phone: "+91 98765 43210", location: "Ghaziabad, UP", joined: "Jan 10, 2023", bio: "Full-stack developer with 4 years of experience building scalable web apps.", role: "Developer", department: "Developer", status: "Active", email: "rishabh.pathak@gmail.com", password: "rishabh123", access: "Admin", skills: ["React", "Node.js", "TypeScript"], avatar: "https://images.unsplash.com/photo-1624561172888-ac93c696e10c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mzh8fGF2YXRhcnxlbnwwfHwwfHx8MA%3D%3D" },
  { id: "m2", name: "Simran Sharma", initials: "SS", color: "#8B5CF6", phone: "+91 91234 56789", location: "Delhi, IN", joined: "Mar 5, 2023", bio: "UI/UX designer passionate about clean, accessible interfaces and user-centred design.", role: "Designer", department: "Designer", status: "Active", email: "simran.sharma@gmail.com", password: "simran123", access: "Member", skills: ["UI/UX", "Figma", "Illustration"], avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8YXZhdGFyfGVufDB8fDB8fHww" },
  { id: "m3", name: "Rohit Sharma", initials: "RS", color: "#EC4899", phone: "+91 99887 76655", location: "Bangalore, KA", joined: "Jun 15, 2023", bio: "Backend engineer specialising in Python, REST APIs, and cloud infrastructure on AWS.", role: "Developer", department: "Developer", status: "Away", email: "rohit.sharma@gmail.com", password: "rohit123", access: "Member", skills: ["Python", "Django", "AWS"], avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzZ8fGF2YXRhcnxlbnwwfHwwfHx8MA%3D%3D" },
  { id: "m4", name: "Pinky Patel", initials: "PP", color: "#10B981", phone: "+91 88776 54321", location: "Ahmedabad, GJ", joined: "Aug 1, 2023", bio: "Content strategist and SEO specialist with a strong focus on growth marketing and analytics.", role: "Marketer", department: "Marketer", status: "Active", email: "pinky.patel@gmail.com", password: "pinky123", access: "Member", skills: ["Content", "SEO", "Copywriting"], avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80" },
  { id: "m5", name: "Ram", initials: "RP", color: "#F59E0B", phone: "+91 77665 44332", location: "Pune, MH", joined: "Oct 20, 2023", bio: "Product designer focused on prototyping, wireframing, and building scalable design systems.", role: "Designer", department: "Designer", status: "Active", email: "ram.pal@gmail.com", password: "rampal123", access: "Member", skills: ["Figma", "Prototyping", "Wireframing"], avatar: "https://images.unsplash.com/photo-1724435811349-32d27f4d5806?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NjN8fGF2YXRhcnxlbnwwfHwwfHx8MA%3D%3D" },
  { id: "m6", name: "Sonia Kaur", initials: "SK ", color: "#EF4444", phone: "+91 66554 33221", location: "Chandigarh, PB", joined: "Dec 3, 2023", bio: "Digital marketing specialist with expertise in SEO, analytics, and paid advertising campaigns.", role: "Marketer", department: "Marketer", status: "Away", email: "sonia.kaur@gmail.com", password: "sonia123", access: "Member", skills: ["SEO", "Analytics", "Ads"], avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80" },
  { id: "m7", name: "Deepanshu Sharma", initials: "DS", color: "#06B6D4", phone: "+91 7845878745", location: "Goa, IN", joined: "Aug 3, 2024", bio: "Digital marketing specialist with expertise in SEO, analytics, and paid advertising campaigns.", role: "Marketer", department: "Marketer", status: "Active", email: "deepu.sharma@gmail.com", password: "deepu123", access: "Member", skills: ["Marketing", "Analytics", "Ads"], avatar: "https://plus.unsplash.com/premium_photo-1689562473471-6e736b8afe15?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OTN8fGF2YXRhcnxlbnwwfHwwfHx8MA%3D%3D" },
  { id: "m8", name: "Rohan Singh", initials: "RS", color: "#F97316", phone: "+91 8597487548", location: "Punjab, IN", joined: "Sep 11, 2024", bio: "Digital marketing specialist with expertise in SEO, analytics, and paid advertising campaigns.", role: "Digital Marketing", department: "Digital Marketing", status: "Active", email: "rohan.singh@gmail.com", password: "rohan123", access: "Member", skills: ["Marketing", "Analytics", "SEO"], avatar: "https://plus.unsplash.com/premium_photo-1669879825881-6d4e4bde67d5?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Njl8fGF2YXRhcnxlbnwwfHwwfHx8MA%3D%3D" },

];

export const MEMBER_FILTERS = ["All Members", "Developer", "Designer", "Marketer", "Digital Marketing"];

export const COLUMNS = ["To do", "In progress", "Review", "Done"];

export const PRIORITY_COLOR = { High: "var(--priority-high-text)", Medium: "var(--status-onhold-text)", Low: "var(--priority-low-text)" };

export const INITIAL_TASKS = [
  // Website Design (p1) tasks matching screenshot
  { id: "t9", title: "Design system tokens v2", column: "Done", priority: "Low", assignees: ["m1"], due: "Aug 9", sub: [6, 6], projectId: "p1", section: "Database" },
  { id: "t101", title: "Design", column: "To do", priority: "High", assignees: ["m1"], due: "Sep 1", sub: [0, 0], projectId: "p1", section: "Frontend", thumbnail: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=400&auto=format&fit=crop&q=60" },
  // { id: "t102", title: "Smithmatic Store - Brainstorming", column: "To do", priority: "Medium", assignees: ["m2"], due: "Sep 15", sub: [0, 0], projectId: "p1", section: "SmithMatic.Shop", thumbnail: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&auto=format&fit=crop&q=60" },
  { id: "t103", title: "QC and Migration", column: "In progress", priority: "Medium", assignees: ["m1"], due: "Aug 10", sub: [0, 0], projectId: "p1", section: "Rissah", thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&auto=format&fit=crop&q=60" },
  // { id: "t104", title: "Replace the site with the theme with the attached zip theme", column: "To do", priority: "Medium", assignees: ["m1"], due: "May 28", sub: [0, 0], projectId: "p1", section: "Rissah" },
  // { id: "t105", title: "New Batch 8", column: "To do", priority: "High", assignees: ["m1"], due: "Aug 10", sub: [0, 0], projectId: "p1", section: "DOL" },
  // { id: "t106", title: "Correct the list style formatting on HTML pages", column: "To do", priority: "High", assignees: ["m1"], due: "Jul 31", sub: [0, 0], projectId: "p1", section: "DOL" },
  // { id: "t107", title: "Her Minds Matter Campaign: July - September #HerMindMatters", column: "In progress", priority: "Medium", assignees: ["m2"], due: "Jul 31", sub: [0, 0], projectId: "p1", section: "IAMH DUDA" },

  // Other projects' tasks
  { id: "t4", title: "API rate-limit middleware", column: "In progress", priority: "High", assignees: ["m2"], due: "Aug 14", sub: [3, 6], projectId: "p2" },
  // { id: "t5", title: "Team workload dashboard", column: "In progress", priority: "Medium", assignees: ["m1"], due: "Aug 16", sub: [4, 8], projectId: "p2" },
  { id: "t6", title: "Accessibility pass on forms", column: "Review", priority: "Medium", assignees: ["m3"], due: "Aug 13", sub: [5, 5], projectId: "p3" },
  { id: "t7", title: "Sprint 14 retro notes", column: "Review", priority: "Low", assignees: ["m4"], due: "Aug 13", sub: [2, 2], projectId: "p3" },
  { id: "t8", title: "Migrate auth to OAuth2", column: "Done", priority: "High", assignees: ["m2"], due: "Aug 10", sub: [7, 7], projectId: "p2" },
  { id: "t10", title: "Payment Gateway", column: "To do", priority: "High", assignees: ["m5"], due: "Aug 26", sub: [4, 6], projectId: "p4" },
  // { id: "t11", title: "Fix invoice PDF export bug", column: "In progress", priority: "High", assignees: ["m6"], due: "Aug 26", sub: [4, 6], projectId: "p4" },
  { id: "t12", title: "Landing page", column: "Review", priority: "High", assignees: ["m7"], due: "Aug 28", sub: [6, 6], projectId: "p5" },
  { id: "t13", title: "Dashboard", column: "To do", priority: "Medium", assignees: ["m8"], due: "Aug 29", sub: [2, 6], projectId: "p6" },
];

export const WEEKLY = [
  { day: "Mon", created: 8, completed: 5 },
  { day: "Tue", created: 6, completed: 7 },
  { day: "Wed", created: 9, completed: 6 },
  { day: "Thu", created: 7, completed: 8 },
  { day: "Fri", created: 10, completed: 9 },
  { day: "Sat", created: 3, completed: 4 },
  { day: "Sun", created: 2, completed: 3 },
];

export const WORKLOAD = MEMBERS.map((m) => ({
  name: m.name.split(" ")[0],
  tasks: INITIAL_TASKS.filter((t) => (t.assignees || []).includes(m.id)).length,
  color: m.color,
}));

export const EVENTS = {
  13: ["Design review · 11:00", "Ship accessibility fixes"],
  14: ["API rate-limit due"],
  16: ["Sprint planning · 10:00"],
  20: ["Release notes due"],
  24: ["Team retro · 3:00"],
  26: ["payment Gateway : 2:00"],
  "Sep 2": ["Authentication : 3:00"]
};

export const INITIAL_CHAT = [
  { id: 1, sender: "m3", text: "Pushed the accessibility fixes for the intake form — ready for a look.", time: "9:12 AM" },
  { id: 2, sender: "m1", text: "On it. Also nudged the OAuth2 migration into Done, nice work team.", time: "9:15 AM" },
  { id: 3, sender: "m2", text: "Rate-limit middleware is in review, should land before standup.", time: "9:21 AM" },
];

export const REPLIES = [
  "Got it, taking a look now.",
  "Sounds good — I'll update the board.",
  "Nice, that unblocks me too.",
  "Can we sync on this after standup?",
];

export const memberById = (id) => MEMBERS.find((m) => m.id === id);

export const PROJECTS = [
  { id: "p1", name: "Website Design", description: "Redesign the company main website pages and blog layout.", status: "In Progress", percent: 65, due: "Jun 15", startDate: "2026-03-01", endDate: "2027-01-01", manager: "m1", priority: "High", category: "Design", members: ["m1", "m2", "m3"], sections: ["Frontend", "Database", "Backend"] },
  { id: "p2", name: "Mobile App", description: "Develop the native Android and iOS mobile application.", status: "In Progress", percent: 42, due: "Jul 10", startDate: "2026-04-10", endDate: "2027-07-10", manager: "m2", priority: "High", category: "Development", members: ["m2", "m4", "m5"] },
  { id: "p3", name: "Marketing Campaign", description: "Plan and execute marketing outreach for product release.", status: "Completed", percent: 100, due: "May 30", startDate: "2026-02-15", endDate: "2027-05-30", manager: "m4", priority: "Medium", category: "Marketing", members: ["m4", "m6"] },
  { id: "p4", name: "Product Launch", description: "Coordinate operations and release of design system v2.", status: "Upcoming", percent: 25, due: "Aug 5", startDate: "2026-07-01", endDate: "2027-01-05", manager: "m5", priority: "Medium", category: "Operations", members: ["m1", "m5"] },
  { id: "p5", name: "Cafe Website", description: "Develop cafe website and deploy.", status: "Upcoming", percent: 25, due: "Aug 1", startDate: "2026-07-01", endDate: "2027-01-05", manager: "m7", priority: "High", category: "Design", members: ["m7", "m1", "m5"] },
  { id: "p6", name: "Resturant Staff Dashboard", description: "Implement Dashboard for resturant staff.", status: "In Progress", percent: 37, due: "Aug 5", startDate: "2026-07-01", endDate: "2027-01-05", manager: "m5", priority: "Medium", category: "Operations", members: ["m1", "m5", "m6"] },
];

export const MILESTONES = [
  { id: "mi1", label: "Planning", date: "Apr 10", done: true },
  { id: "mi2", label: "Design", date: "Apr 25", done: true },
  { id: "mi3", label: "Development", date: "May 15", done: true },
  { id: "mi4", label: "Testing", date: "May 30", done: false },
  { id: "mi5", label: "Deployment", date: "Jun 10", done: false },
  { id: "mi6", label: "Issues identifying", date: "Jun 15", done: false },
];

export const GOALS = [
  { id: "g1", title: "Increase Revenue by 20%", tag: "Financial", team: "Finance Team", due: "Dec 31, 2025", status: "On Track", percent: 65 },
  { id: "g2", title: "Reduce Customer Churn by 5%", tag: "Customer", team: "Customer Success", due: "Oct 1, 2025", status: "At Risk", percent: 35 },
  { id: "g3", title: "Implement New CRM System", tag: "Operations", team: "IT Department", due: "Jun 30, 2025", status: "Completed", percent: 90 },
];

export const ATTENDANCE_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export const ATTENDANCE = {
  m1: ["Present", "Present", "Present", "Present", "Present"],
  m2: ["Present", "Present", "Late", "Present", "Present"],
  m3: ["Present", "Absent", "Present", "Present", "Present"],
  m4: ["Present", "Present", "Present", "Late", "Present"],
  m5: ["Present", "Present", "Present", "Present", "Absent"],
  m6: ["Absent", "Present", "Present", "Present", "Present"],
};

export const ATTENDANCE_STATUS_COLOR = {
  Present: "var(--priority-low-text)",
  Late: "var(--status-onhold-text)",
  Absent: "var(--priority-high-text)",
};

export const REPORTS = [
  { id: "r1", title: "Task Completion Report", description: "Breakdown of completed vs. open tasks across the sprint.", period: "This week" },
  { id: "r2", title: "Team Performance Report", description: "Productivity, quality score, and KPI trends for the squad.", period: "This month" },
  { id: "r3", title: "Attendance Report", description: "Daily attendance and punctuality across all members.", period: "This week" },
  { id: "r4", title: "Workload Distribution Report", description: "Active tasks per member, sorted by load.", period: "Live" },
];

export const PERFORMANCE_METRICS = [
  { key: "productivity", label: "Team Productivity", value: "87%", delta: "+12% from last month", icon: "TrendingUp", tint: "var(--accent-blue-light)" },
  { key: "completed", label: "Tasks Completed", value: "24", delta: "+8 from last month", icon: "CheckCircle2", tint: "var(--priority-low-text)" },
  { key: "quality", label: "Quality Score", value: "92%", delta: "+3% from last month", icon: "Activity", tint: "#C9A6FF" },
  { key: "satisfaction", label: "Team Satisfaction", value: "4.2/5", delta: "+0.3 from last month", icon: "Users", tint: "var(--status-onhold-text)" },
];

export const KPI_SCORECARD = [
  { label: "Productivity Index", value: "87%", target: "Target: 85%", delta: "+5.2", positive: true, tint: "var(--accent-blue-light)" },
  { label: "Quality Score", value: "92%", target: "Target: 90%", delta: "+2.8", positive: true, tint: "var(--priority-low-text)" },
  { label: "Task Completion Rate", value: "78%", target: "Target: 80%", delta: "-1.5", positive: false, tint: "#FF9AC1" },
  { label: "Team Satisfaction", value: "4.2/5", target: "Target: 4.5/5", delta: "+0.3", positive: true, tint: "var(--status-onhold-text)" },
];

export const NOTIFICATIONS = [
  { id: 1, text: "Diego commented on \"API rate-limit middleware\"", time: "5m ago" },
  { id: 2, text: "Aiko marked \"Accessibility pass on forms\" ready for review", time: "1h ago" },
  { id: 3, text: "Sprint 14 planning starts tomorrow at 10:00", time: "3h ago" },
];