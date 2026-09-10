import Link from "next/link";
import { Icon } from "@/components/Icons";

const bootLines = [
  ["OK", "schedule.mount", "Fall 2026 timetable loaded"],
  ["OK", "notes.sync", "Supabase persistence online"],
  ["OK", "recall.engine", "Active recall queue ready"],
  ["OK", "cards.fsrs", "Spaced repetition state ready"],
  ["OK", "agent.export", "Course context export armed"],
  ["OK", "workspace.pen", "Vector engineering workspace mounted"],
  ["OK", "general.calendar", "Personal runtime timeline online"],
] as const;

const pipeline = ["CLASS", "NOTES", "RECALL", "CARDS", "MISTAKES", "PRACTICE", "EXAM_READY"];

export default function LandingPage() {
  return (
    <main className="terminal-landing">
      <div className="terminal-grid" aria-hidden="true" />
      <nav className="terminal-nav">
        <div className="terminal-wordmark">
          <strong>STUDY_OS</strong>
          <span>// SOFTWARE_ENGINEERING</span>
        </div>
        <div className="terminal-nav-meta">
          <span>BUILD 26.09</span>
          <span className="online-dot">ONLINE</span>
          <Link href="/app" className="terminal-nav-link">OPEN_DASHBOARD <Icon name="arrow" size={14}/></Link>
        </div>
      </nav>

      <section className="terminal-hero">
        <div className="terminal-window terminal-main-window">
          <div className="terminal-window-bar">
            <span className="terminal-dots" aria-hidden="true"><i/><i/><i/></span>
            <span>kdp@study-os:~/engineering</span>
            <span>UTF-8</span>
          </div>
          <div className="terminal-screen">
            <p className="terminal-command"><span>$</span> ./study-os --semester fall-2026 --mode focus</p>
            <pre className="ascii-title" aria-label="Study OS">{String.raw`
 ███████╗████████╗██╗   ██╗██████╗ ██╗   ██╗     ██████╗ ███████╗
 ██╔════╝╚══██╔══╝██║   ██║██╔══██╗╚██╗ ██╔╝    ██╔═══██╗██╔════╝
 ███████╗   ██║   ██║   ██║██║  ██║ ╚████╔╝     ██║   ██║███████╗
 ╚════██║   ██║   ██║   ██║██║  ██║  ╚██╔╝      ██║   ██║╚════██║
 ███████║   ██║   ╚██████╔╝██████╔╝   ██║       ╚██████╔╝███████║
 ╚══════╝   ╚═╝    ╚═════╝ ╚═════╝    ╚═╝        ╚═════╝ ╚══════╝`}</pre>
            <div className="terminal-subhead">
              <span>PERSONAL ACADEMIC OPERATING SYSTEM</span>
              <span>LAKEHEAD // 2026—2028</span>
            </div>
            <p className="terminal-intro">One place for schedules, lecture notes, cue cards, active recall, assignments, study context and agent-ready exports.</p>

            <div className="boot-sequence">
              {bootLines.map(([status, process, detail]) => (
                <div key={process} className="boot-line">
                  <span className="boot-status">[{status}]</span>
                  <code>{process}</code>
                  <span className="boot-dots"/>
                  <small>{detail}</small>
                </div>
              ))}
            </div>

            <div className="terminal-actions">
              <Link href="/app" className="terminal-button primary">[ ENTER_STUDY_OS ] <Icon name="arrow" size={15}/></Link>
              <a href="#architecture" className="terminal-button">[ VIEW_PIPELINE ]</a>
            </div>
            <p className="terminal-cursor-line"><span>$</span> ready<span className="terminal-cursor">_</span></p>
          </div>
        </div>

        <aside className="terminal-side-stack">
          <div className="terminal-window terminal-diagnostic">
            <div className="terminal-window-bar"><span>semester.cfg</span><span>01</span></div>
            <div className="diagnostic-body">
              <span className="diag-label">ACTIVE_TERM</span>
              <strong>FALL_2026</strong>
              <div className="diag-rule"/>
              <div className="diag-row"><span>COURSES</span><b>03</b></div>
              <div className="diag-row"><span>LABS</span><b>02</b></div>
              <div className="diag-row"><span>CLOUD_SYNC</span><b className="signal-text">READY</b></div>
              <div className="diag-row"><span>LOCATION</span><b>THUNDER_BAY</b></div>
            </div>
          </div>

          <div className="terminal-window terminal-tree-window">
            <div className="terminal-window-bar"><span>course_tree.txt</span><span>RO</span></div>
            <pre className="course-tree">{String.raw`fall_2026/
├── ESOF_3251/
│   ├── notes/
│   ├── cards/
│   └── lab/
├── ESOF_4310/
│   ├── notes/
│   ├── cards/
│   └── lab/
└── SOCI_2755/
    ├── notes/
    └── resources/`}</pre>
          </div>

          <div className="terminal-window terminal-memory-window">
            <div className="terminal-window-bar"><span>memory_curve.log</span><span>LIVE</span></div>
            <div className="memory-bars" aria-hidden="true">
              {[78,42,86,58,92,65,84,70,96,76,89,82].map((height,index)=><i key={index} style={{height:`${height}%`}}/>) }
            </div>
            <div className="memory-labels"><span>RECALL_SIGNAL</span><span>ADAPTIVE_REVIEW</span></div>
          </div>
        </aside>
      </section>

      <section id="architecture" className="terminal-architecture">
        <div className="architecture-head">
          <span>// SYSTEM_PIPELINE</span>
          <p>Class material enters once. Every study tool reads from the same course data.</p>
        </div>
        <div className="terminal-pipeline">
          {pipeline.map((item,index)=><div key={item} className="pipeline-node"><span>{String(index+1).padStart(2,"0")}</span><strong>{item}</strong>{index < pipeline.length-1 && <b>→</b>}</div>)}
        </div>
        <div className="terminal-footer-line"><span>STUDY_OS // ENGINEERING_CONSOLE</span><span>NOTES_STAY_PORTABLE // DATA_STAYS_YOURS</span></div>
      </section>
    </main>
  );
}
