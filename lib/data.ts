import { Semester } from "./types";

const registrationUrl = "https://erpss.lakeheadu.ca/Student/Planning/DegreePlans#";

export const semesters: Semester[] = [
  {
    id: "fall-2026",
    title: "Fall 2026",
    label: "FALL / 2026",
    season: "fall",
    startsOn: "2026-09-08",
    courses: [
      {
        id: "esof-3251",
        code: "ESOF 3251",
        title: "Compiler & Algorithm Design",
        semesterId: "fall-2026",
        section: "ESOF-3251-FA",
        labSection: "ESOF-3251L-F1",
        instructor: "Dr. Y. Deng",
        art: "compiler",
        shortName: "Compiler",
        registrationUrl,
        roadmap: ["Algorithm analysis", "Lexical analysis", "Finite automata", "Parsing", "Semantic analysis", "Optimization"],
        advancedTopics: ["LLVM", "JIT compilation", "Rust compiler internals", "Tree-sitter", "WebAssembly", "GPU compilers"]
      },
      {
        id: "esof-4310",
        code: "ESOF 4310",
        title: "Advanced Computer Networks",
        semesterId: "fall-2026",
        section: "ESOF-4310-FA",
        labSection: "ESOF-4310L-F1",
        instructor: "M. AbuFoul",
        art: "networks",
        shortName: "Networks",
        registrationUrl,
        roadmap: ["Network architecture", "Routing", "Transport", "Congestion", "Security", "Distributed systems"],
        advancedTopics: ["QUIC", "eBPF networking", "Software-defined networking", "BGP security", "Edge networking", "Zero-trust architecture"]
      },
      {
        id: "soci-2755",
        code: "SOCI 2755",
        title: "Technology, Society & Indigenous Peoples in Canada",
        semesterId: "fall-2026",
        section: "SOCI-2755-FDF",
        art: "society",
        shortName: "Tech & Society",
        registrationUrl,
        roadmap: ["Technology & society", "Infrastructure", "Data governance", "Community impacts", "Policy", "Ethics"],
        advancedTopics: ["Indigenous data sovereignty", "OCAP principles", "Community-led technology", "Digital infrastructure policy", "Algorithmic governance"]
      }
    ],
    schedule: [
      { id: "f-tue-3251", courseId: "esof-3251", section: "ESOF-3251-FA", title: "Compiler & Algorithm Design", type: "lecture", day: "Tuesday", start: "13:00", end: "14:30", room: "AT-2004", instructor: "Dr. Y. Deng" },
      { id: "f-thu-3251", courseId: "esof-3251", section: "ESOF-3251-FA", title: "Compiler & Algorithm Design", type: "lecture", day: "Thursday", start: "13:00", end: "14:30", room: "AT-2004", instructor: "Dr. Y. Deng" },
      { id: "f-fri-3251l", courseId: "esof-3251", section: "ESOF-3251L-F1", title: "Compiler Lab", type: "lab", day: "Friday", start: "11:30", end: "13:00", room: "AT-4020", instructor: "Dr. Y. Deng" },
      { id: "f-wed-4310l", courseId: "esof-4310", section: "ESOF-4310L-F1", title: "Advanced Networks Lab", type: "lab", day: "Wednesday", start: "10:00", end: "11:30", room: "BB-1021", instructor: "M. AbuFoul" },
      { id: "f-thu-4310", courseId: "esof-4310", section: "ESOF-4310-FA", title: "Advanced Computer Networks", type: "lecture", day: "Thursday", start: "17:30", end: "20:00", room: "AT-1001", instructor: "M. AbuFoul" }
    ]
  },
  {
    id: "winter-2027",
    title: "Winter 2027",
    label: "WINTER / 2027",
    season: "winter",
    startsOn: "2027-01-11",
    courses: [
      {
        id: "engi-3336",
        code: "ENGI 3336",
        title: "Engineering Economics & Project Management",
        semesterId: "winter-2027",
        section: "ENGI-3336-WB",
        art: "economics",
        shortName: "Eng. Economics",
        registrationUrl,
        roadmap: ["Time value of money", "Cost estimation", "Decision analysis", "Risk", "Scheduling", "Project control"],
        advancedTopics: ["Monte Carlo project risk", "Real options", "Earned value analytics", "Portfolio optimization", "Technology economics"]
      },
      {
        id: "esof-3255",
        code: "ESOF 3255",
        title: "Software Test & Quality Assurance",
        semesterId: "winter-2027",
        section: "ESOF-3255-WA",
        labSection: "ESOF-3255L-W1",
        art: "testing",
        shortName: "Testing",
        registrationUrl,
        roadmap: ["Testing foundations", "Test design", "Automation", "Coverage", "Quality models", "Reliability"],
        advancedTopics: ["Property-based testing", "Mutation testing", "Fuzzing", "Formal verification", "Chaos engineering", "AI-assisted testing"]
      },
      {
        id: "esof-3350",
        code: "ESOF 3350",
        title: "Performance Analysis of Software",
        semesterId: "winter-2027",
        section: "ESOF-3350-WA",
        labSection: "ESOF-3350L-W1",
        art: "performance",
        shortName: "Performance",
        registrationUrl,
        roadmap: ["Measurement", "Profiling", "Benchmarking", "Complexity", "Bottlenecks", "Optimization"],
        advancedTopics: ["Flame graphs", "Hardware performance counters", "Perf/eBPF", "Distributed tracing", "Cache-aware algorithms", "GPU profiling"]
      },
      {
        id: "esof-3558",
        code: "ESOF 3558",
        title: "Numerical Methods & Modeling",
        semesterId: "winter-2027",
        section: "ESOF-3558-WA",
        labSection: "ESOF-3558L-W1",
        art: "numerical",
        shortName: "Numerical Methods",
        registrationUrl,
        roadmap: ["Error analysis", "Root finding", "Linear systems", "Interpolation", "Integration", "Differential equations"],
        advancedTopics: ["Automatic differentiation", "Scientific machine learning", "Finite element methods", "GPU numerical computing", "Differentiable simulation"]
      },
      {
        id: "esof-3675",
        code: "ESOF 3675",
        title: "Data Mining",
        semesterId: "winter-2027",
        section: "ESOF-3675-WA",
        labSection: "ESOF-3675L-W1",
        art: "datamining",
        shortName: "Data Mining",
        registrationUrl,
        roadmap: ["Data preparation", "Similarity", "Classification", "Clustering", "Association rules", "Evaluation"],
        advancedTopics: ["Representation learning", "Vector databases", "Graph mining", "Streaming analytics", "Anomaly detection", "Retrieval systems"]
      }
    ],
    schedule: [
      { id: "w-mon-3255", courseId: "esof-3255", section: "ESOF-3255-WA", title: "Software Test & Quality Assurance", type: "lecture", day: "Monday", start: "08:30", end: "10:00" },
      { id: "w-wed-3255", courseId: "esof-3255", section: "ESOF-3255-WA", title: "Software Test & Quality Assurance", type: "lecture", day: "Wednesday", start: "08:30", end: "10:00" },
      { id: "w-wed-3255l", courseId: "esof-3255", section: "ESOF-3255L-W1", title: "Software Testing Lab", type: "lab", day: "Wednesday", start: "14:30", end: "16:00" },

      { id: "w-tue-3336", courseId: "engi-3336", section: "ENGI-3336-WB", title: "Engineering Economics & Project Management", type: "lecture", day: "Tuesday", start: "12:30", end: "14:30" },
      { id: "w-thu-3336", courseId: "engi-3336", section: "ENGI-3336-WB", title: "Engineering Economics & Project Management", type: "lecture", day: "Thursday", start: "12:30", end: "14:30" },

      { id: "w-tue-3350l", courseId: "esof-3350", section: "ESOF-3350L-W1", title: "Performance Analysis Lab", type: "lab", day: "Tuesday", start: "14:30", end: "16:00" },
      { id: "w-tue-3350", courseId: "esof-3350", section: "ESOF-3350-WA", title: "Performance Analysis of Software", type: "lecture", day: "Tuesday", start: "17:30", end: "19:00" },
      { id: "w-thu-3350", courseId: "esof-3350", section: "ESOF-3350-WA", title: "Performance Analysis of Software", type: "lecture", day: "Thursday", start: "17:30", end: "19:00" },

      { id: "w-mon-3558", courseId: "esof-3558", section: "ESOF-3558-WA", title: "Numerical Methods & Modeling", type: "lecture", day: "Monday", start: "13:00", end: "14:30" },
      { id: "w-wed-3558", courseId: "esof-3558", section: "ESOF-3558-WA", title: "Numerical Methods & Modeling", type: "lecture", day: "Wednesday", start: "13:00", end: "14:30" },
      { id: "w-thu-3558l", courseId: "esof-3558", section: "ESOF-3558L-W1", title: "Numerical Methods Lab", type: "lab", day: "Thursday", start: "14:30", end: "16:00" },

      { id: "w-tue-3675", courseId: "esof-3675", section: "ESOF-3675-WA", title: "Data Mining", type: "lecture", day: "Tuesday", start: "19:00", end: "20:30" },
      { id: "w-thu-3675", courseId: "esof-3675", section: "ESOF-3675-WA", title: "Data Mining", type: "lecture", day: "Thursday", start: "19:00", end: "20:30" },
      { id: "w-fri-3675l", courseId: "esof-3675", section: "ESOF-3675L-W1", title: "Data Mining Lab", type: "lab", day: "Friday", start: "08:30", end: "10:00" }
    ]
  }
];

export const semesterById = Object.fromEntries(semesters.map((semester) => [semester.id, semester]));
export const allCourses = semesters.flatMap((semester) => semester.courses);
export const courseById = Object.fromEntries(allCourses.map((course) => [course.id, course]));
