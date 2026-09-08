import { CourseArt } from "@/lib/types";

export function CourseArtwork({ art, compact = false }: { art: CourseArt; compact?: boolean }) {
  const id = `art-${art}`;
  return (
    <div className={`course-art course-art-${art} ${compact ? "course-art-compact" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 600 360" role="presentation">
        <defs>
          <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--art-bg-1)" />
            <stop offset="1" stopColor="var(--art-bg-2)" />
          </linearGradient>
          <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="var(--accent)" stopOpacity=".5" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
          </radialGradient>
          <filter id={`${id}-blur`}>
            <feGaussianBlur stdDeviation="18" />
          </filter>
        </defs>
        <rect width="600" height="360" fill={`url(#${id}-bg)`} />
        <circle cx="480" cy="70" r="120" fill={`url(#${id}-glow)`} filter={`url(#${id}-blur)`} opacity=".6" />

        {art === "compiler" && (
          <g fill="none" stroke="currentColor" strokeWidth="2.2" opacity=".82">
            <path d="M90 310C155 255 170 190 236 150C290 118 316 84 340 36" />
            <path d="M175 235c-34-42-60-64-95-71M207 183c-7-48-28-83-55-114M234 152c37-24 73-40 116-42M270 120c20 21 48 38 89 47M301 83c-5-18-4-36 6-59" />
            {[ [80,164],[152,69],[350,110],[359,167],[307,24],[236,150],[175,235],[90,310] ].map(([x,y], i) => <circle key={i} cx={x} cy={y} r="7" fill={i % 2 ? "var(--accent)" : "var(--art-node)"} stroke="none" />)}
            <path d="M390 246h136M390 275h98M390 304h118" opacity=".45" />
          </g>
        )}

        {art === "networks" && (
          <g stroke="currentColor" strokeWidth="1.5" opacity=".78">
            {[[90,110],[180,72],[268,130],[358,76],[470,126],[135,245],[260,250],[385,228],[510,268]].map(([x,y],i) => (
              <circle key={i} cx={x} cy={y} r={i===6?14:8} fill={i===6?"var(--accent)":"var(--art-node)"} stroke="none" />
            ))}
            <path d="M90 110 180 72 268 130 358 76 470 126M90 110l45 135 125 5 125-22 125 40M268 130l-8 120M358 76l27 152M470 126l40 142M180 72l80 178" fill="none" />
            <path d="M0 310c90-30 160-18 230-6s150 22 370-10" fill="none" opacity=".25" />
          </g>
        )}

        {art === "society" && (
          <g fill="none" stroke="currentColor" opacity=".5">
            {[0,1,2,3,4,5].map((n) => <path key={n} d={`M${-40+n*10} ${300-n*24}C100 ${220-n*11} 180 ${340-n*15} 315 ${235-n*16}S500 ${150+n*10} 650 ${220-n*9}`} strokeWidth={1.4+n*.15} />)}
            <path d="M100 95h400M130 70h340M165 45h270" opacity=".22" />
            <circle cx="380" cy="140" r="9" fill="var(--accent)" stroke="none" />
            <path d="M380 140 470 95M380 140l-92 74M380 140 215 110" strokeWidth="2" />
          </g>
        )}

        {art === "economics" && (
          <g fill="none" stroke="currentColor">
            <path d="M70 285h470M95 310V55" opacity=".45" />
            <path d="M105 268 180 220 255 235 330 150 410 170 515 75" strokeWidth="3" />
            {[ [105,268],[180,220],[255,235],[330,150],[410,170],[515,75] ].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="7" fill={i===5?"var(--accent)":"var(--art-node)"} stroke="none"/>)}
            <g opacity=".3" strokeWidth="8"><path d="M130 90h130M130 120h210M130 150h80"/></g>
          </g>
        )}

        {art === "testing" && (
          <g fill="none" stroke="currentColor" strokeWidth="2.4" opacity=".82">
            <circle cx="300" cy="180" r="12" fill="var(--accent)" stroke="none" />
            {[0,60,120,180,240,300].map((rotation) => (
              <g key={rotation} transform={`rotate(${rotation} 300 180)`}>
                <path d="M300 180v-110M300 105l-26-26M300 105l26-26M300 135l-17-17M300 135l17-17" />
              </g>
            ))}
            <path d="M300 180v-110" stroke="var(--danger)" strokeDasharray="10 9" transform="rotate(60 300 180)" />
            <circle cx="393" cy="126" r="8" fill="var(--danger)" stroke="none" />
          </g>
        )}

        {art === "performance" && (
          <g fill="none" stroke="currentColor">
            {[0,1,2,3,4].map((n)=><path key={n} d={`M40 ${270-n*34}C130 ${220-n*17} 170 ${300-n*21} 260 ${235-n*24}S430 ${175-n*11} 570 ${210-n*18}`} opacity={.2+n*.13} strokeWidth={1.5+n*.5}/>) }
            <path d="M55 280c70-80 125 15 190-60s110-10 160-80 92-55 140-95" strokeWidth="3.4" />
            <circle cx="405" cy="140" r="9" fill="var(--accent)" stroke="none" />
          </g>
        )}

        {art === "numerical" && (
          <g fill="none" stroke="currentColor" opacity=".62">
            {[35,58,82,108,136].map((r,i)=><ellipse key={r} cx="300" cy="184" rx={r*1.65} ry={r} transform={`rotate(${-12+i*3} 300 184)`} strokeWidth={1.2+i*.35}/>) }
            <path d="M80 285C150 200 190 260 260 155s150-110 260-45" stroke="var(--accent)" strokeWidth="3" opacity=".9" />
            <path d="M80 305h440M100 320V55" opacity=".22" />
          </g>
        )}

        {art === "datamining" && (
          <g>
            {Array.from({length: 48}).map((_,i)=>{
              const cluster = i%3;
              const baseX = [155,310,455][cluster];
              const baseY = [190,115,230][cluster];
              const x = baseX + Math.sin(i*2.31)*55 + Math.cos(i*.71)*18;
              const y = baseY + Math.cos(i*1.77)*45 + Math.sin(i*.43)*15;
              return <circle key={i} cx={x} cy={y} r={i%7===0?6:3.5} fill={cluster===1?"var(--accent)":"currentColor"} opacity={cluster===1?.82:.47}/>;
            })}
            <path d="M70 305h470" stroke="currentColor" opacity=".2" />
          </g>
        )}
      </svg>
    </div>
  );
}
