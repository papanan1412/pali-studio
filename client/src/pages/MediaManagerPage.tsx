import { FileText, Link2, Save, Video } from "lucide-react";
import { useMemo, useState } from "react";
import { StudioPageFrame } from "@/components/StudioPageFrame";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function MediaManagerPage() {
  const { user } = useAuth();
  const isTeacher = user?.role === "teacher" || user?.role === "admin";
  const { data } = trpc.courses.lessons.useQuery({}, { retry: false });
  const update = trpc.courses.updateMedia.useMutation({ onSuccess: () => toast.success("บันทึกลิงก์สื่อแล้ว") });
  const fallback = [{ id: 1, title: "พุทฺโธ ธมฺโม สงฺโฆ", videoUrl: "", pdfUrl: "" }, { id: 2, title: "ตสฺมาติห — เพราะฉะนั้นแล", videoUrl: "", pdfUrl: "" }, { id: 3, title: "นามศัพท์และวิภัตติ", videoUrl: "", pdfUrl: "" }];
  const rows = useMemo(() => data?.length ? data : fallback, [data]);
  const [values, setValues] = useState<Record<number, { videoUrl: string; pdfUrl: string }>>({});
  const getValue = (id: number, key: "videoUrl" | "pdfUrl", original?: string | null) => values[id]?.[key] ?? original ?? "";
  return <StudioPageFrame title="คลังสื่อการเรียน" eyebrow="จัดการวิดีโอ เอกสาร และลิงก์บทเรียน">
    {!isTeacher && <div className="auth-banner auth-banner--soft"><Link2 size={20} /><div><strong>หน้าจัดการสำหรับพระอาจารย์</strong><span>เข้าสู่ระบบด้วยบัญชี teacher หรือ admin เพื่อบันทึกสื่อจริง</span></div>{!user && <button onClick={() => { window.location.href = "/login"; }}>เข้าสู่ระบบ</button>}</div>}
    <div className="media-note"><strong>เพิ่มวิดีโอ/PDF จริง</strong><span>วาง URL จาก YouTube, Vimeo, Google Drive หรือ storage ของสำนักเรียนได้ ระบบจะนำไปแสดงในหน้ารายละเอียดบทเรียน</span></div>
    <div className="media-list">{rows.map((lesson: any) => <article className="media-card" key={lesson.id}><div className="media-card-title"><div className="media-number">{String(lesson.id).padStart(2, "0")}</div><div><h2>{lesson.title}</h2><span>บทเรียนบาลี</span></div></div><label><span><Video size={14} /> Video URL</span><input type="url" value={getValue(lesson.id, "videoUrl", lesson.videoUrl)} onChange={e => setValues(prev => ({ ...prev, [lesson.id]: { videoUrl: e.target.value, pdfUrl: getValue(lesson.id, "pdfUrl", lesson.pdfUrl) } }))} placeholder="https://www.youtube.com/watch?v=..." /></label><label><span><FileText size={14} /> PDF URL</span><input type="url" value={getValue(lesson.id, "pdfUrl", lesson.pdfUrl)} onChange={e => setValues(prev => ({ ...prev, [lesson.id]: { videoUrl: getValue(lesson.id, "videoUrl", lesson.videoUrl), pdfUrl: e.target.value } }))} placeholder="https://drive.google.com/... หรือ /manus-storage/..." /></label><button className="primary-button" disabled={!isTeacher || update.isPending} onClick={() => update.mutate({ id: lesson.id, videoUrl: getValue(lesson.id, "videoUrl", lesson.videoUrl), pdfUrl: getValue(lesson.id, "pdfUrl", lesson.pdfUrl) })}><Save size={15} /> บันทึกสื่อ</button></article>)}</div>
  </StudioPageFrame>;
}
