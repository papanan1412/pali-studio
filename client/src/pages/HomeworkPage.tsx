import { CheckCircle2, ClipboardCheck, FileText, ImagePlus, Loader2, MessageCircle, Send, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { StudioPageFrame } from "@/components/StudioPageFrame";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

const lessonOptions = [{ id: 1, title: "พุทฺโธ ธมฺโม สงฺโฆ" }, { id: 2, title: "ตสฺมาติห — เพราะฉะนั้นแล" }, { id: 3, title: "นามศัพท์และวิภัตติ" }];

export default function HomeworkPage() {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [lessonId, setLessonId] = useState(1);
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const homework = trpc.homework.mine.useQuery(undefined, { enabled: Boolean(user), retry: false });
  const submit = trpc.homework.submit.useMutation({ onSuccess: () => { toast.success("ส่งการบ้านให้พระอาจารย์แล้ว"); setFile(null); setPreview(""); setNote(""); homework.refetch(); }, onError: error => toast.error(error.message) });
  const chooseFile = (picked: File | undefined) => {
    if (!picked) return;
    if (!picked.type.startsWith("image/") && picked.type !== "application/pdf") return toast.error("กรุณาเลือกไฟล์รูปภาพหรือ PDF");
    if (picked.size > 5_000_000) return toast.error("ไฟล์ต้องไม่เกิน 5 MB");
    setFile(picked);
    setPreview(picked.type.startsWith("image/") ? URL.createObjectURL(picked) : "pdf");
  };
  const send = () => {
    if (!user) { window.location.href = "/login"; return; }
    if (!file) return toast.error("กรุณาเลือกไฟล์การบ้านก่อน");
    const reader = new FileReader();
    reader.onload = () => submit.mutate({ lessonId, fileName: file.name, contentType: file.type, dataUrl: String(reader.result), note });
    reader.readAsDataURL(file);
  };
  const rows = homework.data || [];
  return <StudioPageFrame title="วงจรการบ้าน" eyebrow="ส่งงาน รับคำแนะนำ เติบโตไปด้วยกัน">
    <div className="homework-layout"><section className="upload-panel"><div className="panel-heading"><div><h2>ส่งการบ้านให้พระอาจารย์</h2><p>ถ่ายรูปหน้าสมุดหรือแนบ PDF ให้เห็นชัด</p></div><div className="upload-badge"><ClipboardCheck size={17} /> ตรวจภายใน ๑–๒ วัน</div></div><label className="select-label">เลือกบทเรียน<select value={lessonId} onChange={e => setLessonId(Number(e.target.value))}>{lessonOptions.map(option => <option key={option.id} value={option.id}>{option.title}</option>)}</select></label><button className={`dropzone ${preview ? "has-preview" : ""}`} onClick={() => inputRef.current?.click()}>{preview === "pdf" ? <><FileText size={27} /><strong>{file?.name}</strong><span>PDF พร้อมส่ง</span></> : preview ? <img src={preview} alt="ตัวอย่างรูปการบ้าน" /> : <><ImagePlus size={27} /><strong>แตะเพื่อเลือกรูปหรือ PDF</strong><span>JPG, PNG, PDF ขนาดไม่เกิน 5 MB</span></>}<input ref={inputRef} type="file" accept="image/*,application/pdf" hidden onChange={e => chooseFile(e.target.files?.[0])} /></button>{file && <div className="file-row"><span>{file.type === "application/pdf" ? <FileText size={15} /> : <ImagePlus size={15} />} {file.name}</span><button onClick={() => { setFile(null); setPreview(""); }} aria-label="ลบไฟล์"><X size={15} /></button></div>}<label className="select-label">โน้ตถึงพระอาจารย์<textarea value={note} onChange={e => setNote(e.target.value)} placeholder="เช่น ตรงไหนที่ยังไม่แน่ใจ อยากขอคำแนะนำเป็นพิเศษ..." /></label><button className="primary-button full-button" onClick={send} disabled={submit.isPending}>{submit.isPending ? <Loader2 size={16} className="spin" /> : <Send size={16} />} {submit.isPending ? "กำลังส่ง..." : "ส่งการบ้าน"}</button></section><section className="status-panel"><div className="panel-heading"><div><h2>งานของฉัน</h2><p>ติดตามสถานะและคำแนะนำจากพระอาจารย์</p></div><span className="pending-count">{rows.filter(row => row.submission?.status === "pending").length} งานรอตรวจ</span></div>{rows.length ? rows.map(row => <div className="submission-row" key={row.submission.id}><div className="submission-icon">{row.submission.status === "graded" ? <CheckCircle2 size={16} /> : <Upload size={16} />}</div><div><strong>{row.lesson.title}</strong><span>{row.submission.status === "graded" ? row.submission.feedback || "ตรวจแล้ว" : row.submission.status === "revision" ? "รอส่งแก้ไข" : "รอตรวจ"}</span></div><span className={`status-pill ${row.submission.status}`}>{row.submission.score != null ? `${row.submission.score} / 10` : row.submission.status === "revision" ? "แก้ไข" : "รอตรวจ"}</span></div>) : <div className="empty-state"><Upload size={22} /><strong>ยังไม่มีการส่งการบ้าน</strong><span>เลือกบทเรียน แนบไฟล์ แล้วส่งให้พระอาจารย์ได้เลย</span></div>}<div className="teacher-note"><MessageCircle size={17} /><div><strong>มีคำแนะนำใหม่เมื่อครูตรวจเสร็จ</strong><span>ระบบแจ้งเตือนจะแสดง feedback และคะแนนในรายการงานของคุณ</span></div></div></section></div>
  </StudioPageFrame>;
}
