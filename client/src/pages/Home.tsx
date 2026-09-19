import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Bell,
  BookOpen,
  BookOpenCheck,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Flame,
  Headphones,
  Home as HomeIcon,
  LayoutGrid,
  Menu,
  Play,
  Search,
  Sparkles,
  Target,
  Trophy,
  Upload,
  Volume2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type SectionKey = "overview" | "courses" | "homework" | "progress";

type Lesson = {
  id: number;
  title: string;
  subtitle: string;
  level: string;
  duration: string;
  progress: number;
  accent: string;
  icon: LucideIcon;
};

const lessons: Lesson[] = [
  {
    id: 1,
    title: "พุทฺโธ ธมฺโม สงฺโฆ",
    subtitle: "ไตรสรณคมน์ • บทที่ 04",
    level: "ประโยค ๑–๒",
    duration: "18 นาที",
    progress: 68,
    accent: "saffron",
    icon: BookOpenCheck,
  },
  {
    id: 2,
    title: "ตสฺมาติห — เพราะฉะนั้นแล",
    subtitle: "สังสนธิพื้นฐาน • บทที่ 05",
    level: "ประโยค ๑–๒",
    duration: "24 นาที",
    progress: 32,
    accent: "coral",
    icon: Sparkles,
  },
  {
    id: 3,
    title: "นามศัพท์และวิภัตติ",
    subtitle: "ไวยากรณ์บาลี • บทที่ 02",
    level: "บาลีไวยากรณ์",
    duration: "31 นาที",
    progress: 12,
    accent: "teal",
    icon: Target,
  },
];

const navItems: { key: SectionKey; label: string; icon: LucideIcon }[] = [
  { key: "overview", label: "ภาพรวม", icon: HomeIcon },
  { key: "courses", label: "คอร์สเรียน", icon: LayoutGrid },
  { key: "homework", label: "การบ้าน", icon: BookOpenCheck },
  { key: "progress", label: "สถิติการเรียน", icon: Trophy },
];

function PaliMark({ small = false }: { small?: boolean }) {
  return (
    <div className={`brand-mark ${small ? "brand-mark--small" : ""}`} aria-hidden="true">
      <span>อ</span>
      <span>า</span>
      <span>ฬ</span>
    </div>
  );
}

function SectionTitle({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: string }) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
      </div>
      {action && (
        <button className="text-button" onClick={() => toast.info("กำลังเตรียมหน้าเนื้อหาทั้งหมดให้คุณ") }>
          {action} <ArrowRight size={15} />
        </button>
      )}
    </div>
  );
}

function Home() {
  const [activeSection, setActiveSection] = useState<SectionKey>("overview");
  const [search, setSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [paliWord, setPaliWord] = useState("พุทฺโธ");
  const [, setLocation] = useLocation();

  const filteredLessons = useMemo(() => {
    const normalize = (value: string) => value.replace(/[ฺํ]/g, "").toLowerCase();
    const query = normalize(search);
    if (!query) return lessons;
    return lessons.filter((lesson) => normalize(`${lesson.title} ${lesson.subtitle} ${lesson.level}`).includes(query));
  }, [search]);

  const handleNav = (key: SectionKey) => {
    setActiveSection(key);
    setMobileMenuOpen(false);
    const routes: Partial<Record<SectionKey, string>> = { courses: "/courses", homework: "/homework", progress: "/school" };
    if (routes[key]) setLocation(routes[key]!);
  };

  const handlePlay = () => {
    setPlaying((value) => !value);
    toast.success(playing ? "หยุดบทเรียนชั่วคราวแล้ว" : "เริ่มบทเรียนต่อจากเดิมแล้ว");
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenuOpen ? "sidebar--open" : ""}`}>
        <div className="sidebar-topline">
          <div className="brand-lockup">
            <PaliMark />
            <div>
              <div className="brand-name">บาลีสตูดิโอ</div>
              <div className="brand-subtitle">LEARN WITH CLARITY</div>
            </div>
          </div>
          <button className="icon-button sidebar-close" onClick={() => setMobileMenuOpen(false)} aria-label="ปิดเมนู">
            <X size={18} />
          </button>
        </div>

        <div className="student-card">
          <div className="avatar avatar--large">ดน</div>
          <div className="student-copy">
            <strong>พระมหาดนัย</strong>
            <span>วัดบวรนิเวศวิหาร</span>
          </div>
          <span className="online-dot" aria-label="ออนไลน์" />
        </div>

        <nav className="side-nav" aria-label="เมนูหลัก">
          <p className="nav-label">เมนูหลัก</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.key} className={`nav-item ${activeSection === item.key ? "nav-item--active" : ""}`} onClick={() => handleNav(item.key)}>
                <Icon size={18} strokeWidth={activeSection === item.key ? 2.4 : 1.9} />
                <span>{item.label}</span>
                {item.key === "homework" && <span className="nav-badge">2</span>}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-spacer" />
        <div className="sidebar-tip">
          <div className="tip-icon"><CircleHelp size={17} /></div>
          <div>
            <strong>เรียนให้สบายใจ</strong>
            <p>กดค้างที่คำบาลีเพื่อดูคำแปลได้ทุกบท</p>
          </div>
        </div>
        <button className="help-link" onClick={() => toast.info("ทีมงานจะติดต่อกลับโดยเร็วที่สุด")}>ศูนย์ช่วยเหลือ <ChevronRight size={15} /></button>
      </aside>

      {mobileMenuOpen && <button className="sidebar-backdrop" onClick={() => setMobileMenuOpen(false)} aria-label="ปิดเมนู" />}

      <div className="page-wrap">
        <header className="topbar">
          <button className="icon-button mobile-menu-button" onClick={() => setMobileMenuOpen(true)} aria-label="เปิดเมนู">
            <Menu size={21} />
          </button>
          <div className="mobile-brand"><PaliMark small /><span>บาลีสตูดิโอ</span></div>
          <div className="search-field">
            <Search size={18} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาบทเรียน หรือคำบาลี..." aria-label="ค้นหาบทเรียน" />
            {search && <button className="search-clear" onClick={() => setSearch("")} aria-label="ล้างคำค้น"><X size={15} /></button>}
            <kbd>⌘ K</kbd>
          </div>
          <div className="top-actions">
            <button className="icon-button notification-button" onClick={() => toast.info("ยังไม่มีการแจ้งเตือนใหม่")} aria-label="การแจ้งเตือน">
              <Bell size={19} />
              <span />
            </button>
            <div className="top-divider" />
            <button className="profile-button" onClick={() => toast.info("โปรไฟล์ของพระมหาดนัย")}>
              <div className="avatar">ดน</div>
              <div className="profile-name"><strong>พระมหาดนัย</strong><span>ผู้เรียน</span></div>
              <ChevronRight size={16} />
            </button>
          </div>
        </header>

        <main className="main-content">
          <div className="welcome-row">
            <div>
              <p className="eyebrow eyebrow--warm">วันพฤหัสบดีที่ ๑๙ กันยายน ๒๕๖๙</p>
              <h1>สวัสดีครับ <em>พระมหาดนัย</em></h1>
              <p className="welcome-note">วันนี้มาเรียนต่ออีกนิด ให้ความรู้ค่อย ๆ งอกงามเหมือนต้นโพธิ์</p>
            </div>
            <div className="streak-chip"><Flame size={16} fill="currentColor" /><span><strong>๗ วัน</strong> เรียนต่อเนื่อง</span></div>
          </div>

          <section className="hero-card" aria-label="เรียนต่อจากเดิม">
            <div className="hero-copy">
              <div className="hero-kicker"><span className="live-dot" /> กำลังเรียนอยู่</div>
              <h2>คำที่ทำให้เห็น<br /><span>ความหมาย</span> ชัดขึ้น</h2>
              <p>บทที่ ๐๔ · ไตรสรณคมน์</p>
              <div className="hero-progress"><div className="progress-track"><div style={{ width: "68%" }} /></div><span>68%</span></div>
              <button className="primary-button" onClick={handlePlay}><span className="button-icon">{playing ? <span className="pause-bars"><i /><i /></span> : <Play size={16} fill="currentColor" />}</span>{playing ? "กำลังเรียนอยู่" : "เรียนต่อจากเดิม"}<ArrowRight size={16} /></button>
            </div>
            <div className="hero-art" aria-hidden="true">
              <div className="art-orbit art-orbit--one" />
              <div className="art-orbit art-orbit--two" />
              <div className="art-sun" />
              <div className="art-glyph">พุทฺ<br /><span>โธ</span></div>
              <div className="art-caption">BALI · 04</div>
            </div>
          </section>

          <section className="stats-grid" aria-label="สรุปการเรียน">
            <div className="stat-card stat-card--plain"><div className="stat-icon stat-icon--saffron"><Clock3 size={18} /></div><div><span>เวลาเรียนสัปดาห์นี้</span><strong>๒ ชม. ๔๐ นาที</strong></div><span className="stat-trend">+๒๐%</span></div>
            <div className="stat-card stat-card--plain"><div className="stat-icon stat-icon--teal"><BookOpen size={18} /></div><div><span>บทเรียนที่จบแล้ว</span><strong>๑๒ <small>/ ๓๖ บท</small></strong></div><span className="stat-trend stat-trend--muted">๑ คอร์ส</span></div>
            <div className="stat-card stat-card--plain"><div className="stat-icon stat-icon--coral"><Target size={18} /></div><div><span>เป้าหมายเดือนนี้</span><strong>๖๘<small>% สำเร็จ</small></strong></div><span className="mini-ring"><span>68</span></span></div>
          </section>

          <div className="content-grid">
            <section className="course-section">
              <SectionTitle eyebrow="เลือกเรียนต่อ" title="คอร์สของคุณ" action="ดูทั้งหมด" />
              <div className="course-list">
                {filteredLessons.length > 0 ? filteredLessons.map((lesson, index) => {
                  const Icon = lesson.icon;
                  return (
                    <article className="course-card" key={lesson.id} style={{ "--delay": `${index * 60}ms` } as CSSProperties}>
                      <div className={`course-visual course-visual--${lesson.accent}`}>
                        <span className="course-number">0{lesson.id}</span>
                        <Icon size={24} strokeWidth={1.5} />
                        <span className="course-level">{lesson.level}</span>
                      </div>
                      <div className="course-info">
                        <div className="course-meta"><span>{lesson.subtitle}</span><span><Clock3 size={13} /> {lesson.duration}</span></div>
                        <h3>{lesson.title}</h3>
                        <div className="course-footer"><div className="tiny-progress"><div style={{ width: `${lesson.progress}%` }} /></div><span>{lesson.progress}%</span><button className="round-arrow" onClick={() => toast.success(`เปิดบทเรียน “${lesson.title}” แล้ว`)} aria-label={`เปิด ${lesson.title}`}><ArrowRight size={16} /></button></div>
                      </div>
                    </article>
                  );
                }) : <div className="empty-state"><Search size={22} /><strong>ยังไม่พบคำที่ค้นหา</strong><span>ลองค้นหา “พุทโธ” หรือ “ไวยากรณ์”</span></div>}
              </div>
            </section>

            <aside className="right-column">
              <section className="word-card">
                <div className="word-card-top"><div><p className="eyebrow">บาลีวันนี้</p><h2>แตะเพื่อฟังเสียง</h2></div><button className="sound-button" onClick={() => toast.success(`กำลังอ่านออกเสียง “${paliWord}”`)} aria-label="ฟังเสียงคำบาลี"><Volume2 size={19} /></button></div>
                <button className="word-display" onClick={() => setPaliWord(paliWord === "พุทฺโธ" ? "ธมฺโม" : "พุทฺโธ")}><span>{paliWord}</span><small>{paliWord === "พุทฺโธ" ? "ผู้รู้ ผู้ตื่น ผู้เบิกบาน" : "ธรรมะ คำสอนของพระพุทธเจ้า"}</small></button>
                <div className="word-divider" /><div className="word-note"><Sparkles size={15} /><span>กดที่คำบาลีเพื่อสลับคำศัพท์</span></div>
              </section>

              <section className="homework-card">
                <div className="homework-heading"><div><p className="eyebrow">วงจรการบ้าน</p><h2>ส่งงานให้ครูตรวจ</h2></div><span className="pending-count">๒ งาน</span></div>
                <p>ถ่ายรูปคำแปลจากสมุดของคุณ แล้วรับคำแนะนำจากพระอาจารย์กลับไปใน LINE</p>
                <div className="homework-item"><div className="homework-status homework-status--pending"><Upload size={16} /></div><div><strong>แบบฝึกหัดบทที่ ๐๓</strong><span>รอตรวจ · ส่งเมื่อวานนี้</span></div><ChevronRight size={16} /></div>
                <button className="secondary-button" onClick={() => toast.success("เปิดพื้นที่อัปโหลดการบ้านแล้ว")}><Upload size={16} /> อัปโหลดการบ้าน</button>
              </section>
            </aside>
          </div>

          <section className="weekly-card">
            <div className="weekly-main"><div className="weekly-icon"><Trophy size={21} /></div><div><p className="eyebrow">ภารกิจประจำสัปดาห์</p><h2>เรียนให้ครบ ๓ บทก่อนวันพระ</h2><p>อีกเพียง ๑ บท คุณจะรักษาจังหวะการเรียนได้ต่อเนื่อง</p></div></div>
            <div className="weekly-meter"><div className="meter-label"><span>ความคืบหน้า</span><strong>๒ / ๓ บท</strong></div><div className="meter-track"><div style={{ width: "66%" }} /></div></div>
            <button className="icon-button weekly-arrow" onClick={() => toast.info("เปิดรายละเอียดภารกิจประจำสัปดาห์")} aria-label="ดูรายละเอียดภารกิจ"><ArrowRight size={18} /></button>
          </section>
        </main>

        <nav className="mobile-nav" aria-label="เมนูด้านล่าง">
          {navItems.map((item) => { const Icon = item.icon; return <button key={item.key} className={activeSection === item.key ? "active" : ""} onClick={() => handleNav(item.key)}><Icon size={19} /><span>{item.label}</span></button>; })}
        </nav>
      </div>
    </div>
  );
}

export default Home;
