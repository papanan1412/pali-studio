import { BookOpen, Clock3, Search, Sparkles, ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { StudioPageFrame } from "@/components/StudioPageFrame";
import { trpc } from "@/lib/trpc";

const fallback = [
  { id: 1, title: "พุทฺโธ ธมฺโม สงฺโฆ", subtitle: "ไตรสรณคมน์ • บทที่ ๐๔", paliLevel: "ประโยค ๑–๒", durationMinutes: 18, coverTone: "saffron", progress: 68 },
  { id: 2, title: "ตสฺมาติห — เพราะฉะนั้นแล", subtitle: "สังสนธิพื้นฐาน • บทที่ ๐๕", paliLevel: "ประโยค ๑–๒", durationMinutes: 24, coverTone: "coral", progress: 32 },
  { id: 3, title: "นามศัพท์และวิภัตติ", subtitle: "ไวยากรณ์บาลี • บทที่ ๐๒", paliLevel: "บาลีไวยากรณ์", durationMinutes: 31, coverTone: "teal", progress: 12 },
  { id: 4, title: "มโนปุพฺพงฺคมา ธมฺมา", subtitle: "ธรรมบท • คาถาที่ ๑", paliLevel: "ธรรมบท", durationMinutes: 27, coverTone: "coral", progress: 0 },
];

export default function CoursesPage() {
  const [query, setQuery] = useState("");
  const { data, isLoading } = trpc.courses.list.useQuery({ search: query || undefined });
  const rows = useMemo(() => {
    if (data?.length) return data.flatMap(course => course.lessons.map(lesson => ({ ...lesson, paliLevel: course.paliLevel, coverTone: course.coverTone, progress: 0 })));
    const normalized = query.replace(/[ฺํ]/g, "").toLowerCase();
    return fallback.filter(item => !normalized || `${item.title} ${item.subtitle} ${item.paliLevel}`.replace(/[ฺํ]/g, "").toLowerCase().includes(normalized));
  }, [data, query]);
  return <StudioPageFrame title="ห้องเรียนบาลี" eyebrow="เรียนตามจังหวะของคุณ">
    <div className="feature-toolbar"><div className="feature-search"><Search size={17} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="ค้นหาบทเรียน หรือพิมพ์ พุทโธ ก็ได้" /></div><span className="result-count">{isLoading ? "กำลังโหลด..." : `${rows.length} บทเรียน`}</span></div>
    <div className="course-grid feature-course-grid">{rows.map((lesson, index) => <article className="feature-course-card" key={lesson.id}>
      <div className={`feature-course-art ${lesson.coverTone || "saffron"}`}><span>0{index + 1}</span><BookOpen size={30} strokeWidth={1.4} /><small>{lesson.paliLevel}</small></div>
      <div className="feature-course-body"><div className="lesson-kicker"><span>{lesson.subtitle}</span><span><Clock3 size={12} /> {lesson.durationMinutes} นาที</span></div><h2>{lesson.title}</h2><p>อ่านคำบาลี ฟังคำอธิบาย และบันทึกความก้าวหน้าของคุณในทุกบทเรียน</p><div className="lesson-progress"><div><span style={{ width: `${lesson.progress || 0}%` }} /></div><small>{lesson.progress || 0}%</small><Link href={`/lessons/${lesson.id}`} className="circle-link" aria-label={`เปิดบทเรียน ${lesson.title}`}><ArrowRight size={16} /></Link></div></div>
    </article>)}</div>
    <div className="feature-callout"><Sparkles size={18} /><div><strong>ค้นหาคำบาลีได้ทั้งสองแบบ</strong><span>ระบบตัดพินทุและนิคหิตเพื่อให้ “พุทฺโธ” กับ “พุทโธ” เจอผลลัพธ์เดียวกัน</span></div></div>
  </StudioPageFrame>;
}
