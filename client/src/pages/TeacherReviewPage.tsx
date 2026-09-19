import { Check, ClipboardCheck, Eye, Loader2, RotateCcw, ShieldCheck, UserCog, UserPlus } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { StudioPageFrame } from "@/components/StudioPageFrame";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function TeacherReviewPage() {
  const { user } = useAuth();
  const isTeacher = user?.role === "teacher" || user?.role === "admin" || user?.role === "owner";
  const isAdmin = user?.role === "admin" || user?.role === "owner";
  const isOwner = user?.role === "owner";
  const submissions = trpc.homework.forTeacher.useQuery(undefined, { enabled: isTeacher, retry: false });
  const accounts = trpc.admin.users.useQuery(undefined, { enabled: isAdmin, retry: false });
  const grade = trpc.homework.grade.useMutation({ onSuccess: () => { toast.success("บันทึกผลตรวจแล้ว"); submissions.refetch(); } });
  const setRole = trpc.admin.setRole.useMutation({ onSuccess: () => { toast.success("อัปเดตบทบาทบัญชีแล้ว"); accounts.refetch(); } });
  const createTeacher = trpc.admin.createTeacher.useMutation({ onSuccess: () => { toast.success("สร้างบัญชีพระอาจารย์แล้ว"); accounts.refetch(); setTeacherName(""); setTeacherEmail(""); setTeacherPassword(""); }, onError: error => toast.error(error.message) });
  const [feedback, setFeedback] = useState<Record<number, string>>({});
  const [score, setScore] = useState<Record<number, string>>({});
  const [teacherName, setTeacherName] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherPassword, setTeacherPassword] = useState("");
  const demo = [{ id: "demo", lesson: { title: "แบบฝึกหัดบทที่ ๐๓" }, student: { name: "พระมหาดนัย", monasteryName: "วัดบวรนิเวศวิหาร" }, submission: { status: "pending", note: "ขอคำแนะนำเรื่องการแปลประโยคที่ ๒" } }];
  const rows: any[] = submissions.data?.length ? submissions.data : demo;
  const saveGrade = (id: number | string, status: "graded" | "revision") => { if (typeof id !== "number") return toast.info("ตัวอย่างนี้จะบันทึกได้เมื่อมีผู้เรียนส่งงานจริง"); grade.mutate({ id, status, score: score[id] ? Number(score[id]) : undefined, feedback: feedback[id] }); };
  return <StudioPageFrame title="ห้องตรวจการบ้าน" eyebrow="พระอาจารย์และผู้ดูแลสำนักเรียน">
    {!user && <div className="auth-banner"><ShieldCheck size={20} /><div><strong>หน้านี้สำหรับพระอาจารย์</strong><span>เข้าสู่ระบบเพื่อดูงานจริงและส่งคำแนะนำกลับให้ผู้เรียน</span></div><button onClick={() => { window.location.href = "/login"; }}>เข้าสู่ระบบ</button></div>}
    {user && !isTeacher && <div className="auth-banner auth-banner--soft"><ShieldCheck size={20} /><div><strong>บัญชีนี้ยังไม่มีสิทธิ์พระอาจารย์</strong><span>ให้ผู้ดูแลระบบเปลี่ยน role เป็น teacher ก่อนจึงจะตรวจงานได้</span></div><Link href="/school">ดูแดชบอร์ดสำนักเรียน</Link></div>}
    <div className="review-list">{rows.map((row: any) => <article className="review-card" key={row.submission?.id || row.id}><div className="review-header"><div className="submission-icon"><ClipboardCheck size={17} /></div><div><h2>{row.lesson?.title}</h2><p>{row.student?.name || "ผู้เรียน"} · {row.student?.monasteryName || "ยังไม่ระบุสำนักเรียน"}</p></div><span className="status-pill pending">{row.submission?.status === "graded" ? "ตรวจแล้ว" : "รอตรวจ"}</span></div>{row.submission?.submissionImageUrl ? <a className="submission-preview" href={row.submission.submissionImageUrl} target="_blank" rel="noreferrer"><img src={row.submission.submissionImageUrl} alt="รูปการบ้านที่ส่ง" /><span><Eye size={15} /> เปิดรูปเต็ม</span></a> : <div className="submission-placeholder">ยังไม่มีรูปแนบในข้อมูลตัวอย่าง</div>}<p className="student-note">{row.submission?.note || "ผู้เรียนไม่ได้แนบโน้ตเพิ่มเติม"}</p><div className="review-fields"><label>คะแนน (เต็ม ๑๐)<input value={score[row.submission?.id] || ""} onChange={e => setScore(prev => ({ ...prev, [row.submission.id]: e.target.value }))} inputMode="numeric" placeholder="เช่น 8" /></label><label>คำแนะนำถึงผู้เรียน<textarea value={feedback[row.submission?.id] || ""} onChange={e => setFeedback(prev => ({ ...prev, [row.submission.id]: e.target.value }))} placeholder="เขียนข้อสังเกต หรือกำลังใจสั้น ๆ..." /></label></div><div className="review-actions"><button className="secondary-button" disabled={grade.isPending} onClick={() => saveGrade(row.submission?.id || row.id, "revision")}><RotateCcw size={15} /> ขอให้แก้ไข</button><button className="primary-button" disabled={grade.isPending} onClick={() => saveGrade(row.submission?.id || row.id, "graded")}>{grade.isPending ? <Loader2 size={15} className="spin" /> : <Check size={15} />} บันทึกผลตรวจ</button></div></article>)}</div>
    {isAdmin && <section className="account-admin"><div className="panel-heading"><div><h2>จัดการบัญชีพระอาจารย์</h2><p>ผู้ดูแลหลักเท่านั้นที่สร้างบัญชีครูได้</p></div><UserCog size={20} /></div>{isOwner && <form className="account-create" onSubmit={event => { event.preventDefault(); createTeacher.mutate({ name: teacherName, email: teacherEmail, password: teacherPassword }); }}><div className="account-create-title"><UserPlus size={16} /><strong>สร้างบัญชีให้ครูท่านอื่น</strong></div><input value={teacherName} onChange={event => setTeacherName(event.target.value)} placeholder="ชื่อครู" required /><input type="email" value={teacherEmail} onChange={event => setTeacherEmail(event.target.value)} placeholder="อีเมลครู" required /><input type="password" value={teacherPassword} onChange={event => setTeacherPassword(event.target.value)} placeholder="รหัสผ่านอย่างน้อย 8 ตัว" minLength={8} required /><button className="primary-button" disabled={createTeacher.isPending}>สร้างบัญชีครู</button></form>}{accounts.data?.length ? accounts.data.map(account => <div className="account-row" key={account.id}><div><strong>{account.name || "ยังไม่ระบุชื่อ"}</strong><span>{account.email || account.monasteryName || "ไม่มีข้อมูลเพิ่มเติม"}</span></div><select value={account.role} disabled={!isOwner && account.role === "owner"} onChange={e => setRole.mutate({ userId: account.id, role: e.target.value as "user" | "teacher" | "admin" | "owner" })}><option value="user">ผู้เรียน</option><option value="teacher">พระอาจารย์</option><option value="admin">ผู้ดูแล</option><option value="owner">ผู้ดูแลหลัก</option></select></div>) : <p className="muted-copy">ยังไม่มีผู้ใช้ในฐานข้อมูล ระบบจะแสดงบัญชีหลังจากมีการเข้าสู่ระบบครั้งแรก</p>}</section>}
  </StudioPageFrame>;
}
