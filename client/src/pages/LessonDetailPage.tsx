import { ArrowLeft, CheckCircle2, Download, FileText, Headphones, Play, Save, Volume2 } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "wouter";
import { StudioPageFrame } from "@/components/StudioPageFrame";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

const fallback: Record<number, any> = { 1: { id: 1, title: "พุทฺโธ ธมฺโม สงฺโฆ", subtitle: "ไตรสรณคมน์ • บทที่ ๐๔", durationMinutes: 18, paliRawText: "พุทฺธํ สรณํ คจฺฉามิ\nธมฺมํ สรณํ คจฺฉามิ\nสงฺฆํ สรณํ คจฺฉามิ", course: { title: "ประโยค ๑–๒" } }, 2: { id: 2, title: "ตสฺมาติห — เพราะฉะนั้นแล", subtitle: "สังสนธิพื้นฐาน • บทที่ ๐๕", durationMinutes: 24, paliRawText: "ตสฺมา อิติ ห ตสฺมาติห", course: { title: "ประโยค ๑–๒" } } };

export default function LessonDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { user } = useAuth();
  const { data } = trpc.courses.lesson.useQuery({ id }, { retry: false });
  const quiz = trpc.quiz.forLesson.useQuery({ lessonId: id }, { enabled: Boolean(user), retry: false });
  const save = trpc.progress.save.useMutation({ onSuccess: () => toast.success("บันทึกความก้าวหน้าแล้ว") });
  const submitQuiz = trpc.quiz.submit.useMutation({ onSuccess: result => toast.success(`ได้ ${result.score}/${result.total} คะแนน${result.passed ? " · ผ่านบทเรียนแล้ว" : " · ลองทบทวนอีกครั้ง"}`), onError: e => toast.error(e.message) });
  const lesson = data || fallback[id] || fallback[1];
  const [playing, setPlaying] = useState(false);
  const [done, setDone] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const complete = () => { setDone(true); if (user) save.mutate({ lessonId: lesson.id, progressPercent: 100, minutesWatched: lesson.durationMinutes }); else toast.info("เข้าสู่ระบบเพื่อบันทึกความก้าวหน้า"); };
  return <StudioPageFrame title={lesson.title} eyebrow={lesson.course?.title || "รายละเอียดบทเรียน"}>
    <Link href="/courses" className="inline-back"><ArrowLeft size={15} /> กลับรายการบทเรียน</Link>
    <div className="lesson-detail-grid"><section><div className="video-stage">{lesson.videoUrl ? <video controls src={lesson.videoUrl} /> : <><div className="video-glow" /><div className="video-glyph">พุทฺ<br /><span>โธ</span></div><button className="video-play" onClick={() => { setPlaying(!playing); toast.success(playing ? "หยุดบทเรียนแล้ว" : "เริ่มจำลองการเล่นบทเรียน"); }}><Play size={19} fill="currentColor" /> {playing ? "กำลังเรียนอยู่" : "เริ่มบทเรียน"}</button><span className="video-label">PALI STUDIO · LESSON {String(lesson.id).padStart(2, "0")}</span></>}</div><div className="lesson-heading-row"><div><p className="eyebrow">{lesson.subtitle}</p><h2>เรียนบทนี้ให้เข้าใจ ไม่ต้องรีบ</h2></div><span className="duration-badge"><Headphones size={14} /> {lesson.durationMinutes} นาที</span></div><div className="lesson-actions"><button className="primary-button" onClick={complete}>{done ? <CheckCircle2 size={16} /> : <Save size={16} />} {done ? "เรียนจบแล้ว" : "บันทึกว่าเรียนจบ"}</button>{lesson.pdfUrl ? <a className="secondary-button compact" href={lesson.pdfUrl} target="_blank" rel="noreferrer"><Download size={15} /> ดาวน์โหลด PDF</a> : <button className="secondary-button compact" onClick={() => toast.info("บทนี้ยังไม่มี PDF แนบ")}><Download size={15} /> ดาวน์โหลดเอกสาร</button>}</div></section><aside className="lesson-side-card"><div className="side-card-heading"><FileText size={17} /><span>บาลีประจำบท</span></div><pre>{lesson.paliRawText || "ยังไม่มีข้อความบาลีประจำบท"}</pre><div className="pali-tip"><Volume2 size={15} /><span>แตะคำที่ไฮไลต์เพื่อฟังเสียงอ่าน</span></div><div className="highlight-word"><strong>ตสฺมาติห</strong><span>เพราะฉะนั้นแล</span></div></aside></div>
    <section className="quiz-panel"><div className="panel-heading"><div><p className="eyebrow">ตรวจความเข้าใจ</p><h2>แบบทดสอบท้ายบท</h2></div><span>{quiz.data?.length || 0} ข้อ</span></div>{quiz.data?.length ? <>{quiz.data.map((question, index) => <div className="quiz-question" key={question.id}><strong>{index + 1}. {question.question}</strong><div className="quiz-options">{question.choices.map((choice, choiceIndex) => <button className={answers[index] === choiceIndex ? "selected" : ""} key={choice} onClick={() => setAnswers(current => { const next = [...current]; next[index] = choiceIndex; return next; })}>{choice}</button>)}</div></div>)}<button className="primary-button" onClick={() => submitQuiz.mutate({ lessonId: id, answers })} disabled={answers.length !== quiz.data.length}>ส่งคำตอบ</button></> : <div className="empty-state"><FileText size={22} /><strong>บทนี้ยังไม่มีแบบทดสอบ</strong><span>เมื่อพระอาจารย์เพิ่มข้อสอบ จะแสดงที่ส่วนนี้</span></div>}</section>
  </StudioPageFrame>;
}
