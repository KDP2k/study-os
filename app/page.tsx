import Link from "next/link";
import { CourseArtwork } from "@/components/CourseArtwork";
import { Icon } from "@/components/Icons";

export default function LandingPage() {
  return (
    <main className="landing-page season-fall">
      <nav className="landing-nav">
        <div className="brand-mark"><span className="brand-glyph">K//</span><span><strong>STUDY OS</strong><small>SOFTWARE ENGINEERING</small></span></div>
        <Link href="/app" className="button secondary">Open dashboard <Icon name="arrow" size={15}/></Link>
      </nav>
      <section className="landing-hero">
        <div className="landing-copy">
          <span className="eyebrow">LAKEHEAD · 2026—2028</span>
          <h1>Your engineering degree,<br/><em>organized like a system.</em></h1>
          <p>Schedules, lecture notes, cue cards, active recall, assignments, resources, study context and agent-ready exports — in one calm workspace.</p>
          <div className="landing-actions"><Link href="/app" className="button primary large">Enter Study OS <Icon name="arrow"/></Link><a href="#system" className="button secondary large">See the system</a></div>
          <div className="landing-meta"><span><i/> FALL 2026</span><span>3 course workspaces</span><span>Lakehead cobalt + Thunder Bay seasons</span></div>
        </div>
        <div className="landing-art-stack">
          <div className="landing-card card-a"><CourseArtwork art="compiler" compact/><span>ESOF 3251</span><strong>Compiler & Algorithm Design</strong></div>
          <div className="landing-card card-b"><CourseArtwork art="networks" compact/><span>ESOF 4310</span><strong>Advanced Computer Networks</strong></div>
          <div className="landing-float"><span>NEXT</span><strong>Compiler</strong><small>Tuesday · 1:00 PM</small></div>
        </div>
      </section>
      <section id="system" className="landing-system">
        <div className="section-heading"><div><span className="eyebrow">ACADEMIC OPERATING SYSTEM</span><h2>Class → notes → recall → mistakes → exam ready.</h2></div></div>
        <div className="system-flow">{["Class","Notes","Cue cards","Active recall","Mistakes","Practice","Exam ready"].map((item,index)=><div key={item}><span>{String(index+1).padStart(2,"0")}</span><strong>{item}</strong>{index<6&&<Icon name="arrow"/>}</div>)}</div>
      </section>
    </main>
  );
}
