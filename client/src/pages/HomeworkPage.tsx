import { CheckCircle2, ClipboardCheck, ImagePlus, Loader2, MessageCircle, Send, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { StudioPageFrame } from "@/components/StudioPageFrame";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
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
  const chooseFile = (picked: File | undefined) => { if (!picked) return; if (!picked.type.startsWith("image/")) return toast.error("กรุณาเลือกไฟล์รูปภาพ"); if (picked.size > 5_000_000) return toast.error("ไฟล์ต้องไม่เกิน 5 MB"); setFile(picked); setPreview(URL.createObjectURL(picked)); };
  const send = async () => { if (!user) return startLogin(); if (!file) return toast.error("กรุณาเลือกรูปการบ้านก่อน"); const reader = new FileReader(); reader.onload = () => submit.mutate({ lessonId, fileName: file.name, contentType: file.type, dataUrl: String(reader.result), note }); reader.readAsDataURL(file); };
  const rows = homework.data || [];
  return <StudioPageFrame title="วงจรการบ้าน" eyebrow="ส่งงาน รับคำแนะนำ เติบโตไปด้วยกัน">
    <div className="homework-layout"><section className="upload-panel"><div className="panel-heading"><div><h2>ส่งการบ้านให้พระอาจารย์</h2><p>ถ่ายรูปหน้าสมุดให้เห็นชัด แล้วแนบเข้ามาในระบบ</p></div><div className="upload-badge"><ClipboardCheck size={17} /> ตรวจภายใน ๑–๒ วัน</div></div><label className="select-label">เลือกบทเรียน<select value={lessonId} onChange={e => setLessonId(Number(e.target.value))}>{lessonOptions.map(option => <option key={option.id} value={option.id}>{option.title}</option>)}</select></label><button className={`dropzone ${preview ? "has-preview" : ""}`} onClick={() => inputRef.current?.click()}>{preview ? <img src={preview} alt="ตัวอย่างรูปการบ้าน" /> : <><ImagePlus size={27} /><strong>แตะเพื่อเลือกรูปการบ้าน</strong><span>JPG, PNG ขนาดไม่เกิน 5 MB</span></>}<input ref={inputRef} type="file" accept="image/*" hidden onChange={e => chooseFile(e.target.files?.[0])} /></button>{file && <div className="file-row"><span><ImagePlus size={15} /> {file.name}</span><button onClick={() => { setFile(null); setPreview(""); }} aria-label="ลบไฟล์"><X size={15} /></button></div>}<label className="select-label">โน้ตถึงพระอาจารย์<textarea value={note} onChange={e => setNote(e.target.value)} placeholder="เช่น ตรงไหนที่ยังไม่แน่ใจ อยากขอคำแนะนำเป็นพิเศษ..." /></label><button className="primary-button full-button" onClick={send} disabled={submit.isPending}>{submit.isPending ? <Loader2 size={16} className="spin" /> : <Send size={16} />} {submit.isPending ? "กำลังส่ง..." : "ส่งการบ้าน"}</button></section><section className="status-panel"><div className="panel-heading"><div><h2>งานของฉัน</h2><p>ติดตามสถานะและคำแนะนำจากพระอาจารย์</p></div><span className="pending-count">{rows.filter((row: any) => row.submission?.status === "pending").length || 2} งานรอตรวจ</span></div>{rows.length ? rows.map((row: any) => <div className="submission-row" key={row.submission.id}><div className="submission-icon"><Upload size={16} /></div><div><strong>{row.lesson.title}</strong><span>{row.submission.status === "graded" ? "ตรวจแล้ว" : "รอตรวจ"}</span></div><span className={`status-pill ${row.submission.status}`}>{row.submission.status === "graded" ? "ตรวจแล้ว" : "รอตรวจ"}</span></div>) : <><div className="submission-row"><div className="submission-icon"><Upload size={16} /></div><div><strong>แบบฝึกหัดบทที่ ๐๓</strong><span>ส่งเมื่อวานนี้</span></div><span className="status-pill pending">รอตรวจ</span></div><div className="submission-row"><div className="submission-icon graded"><CheckCircle2 size={16} /></div><div><strong>แบบฝึกหัดบทที่ ๐๒</strong><span>มีคำแนะนำใหม่</span></div><span className="status-pill graded">๘ / ๑๐</span></div></>}<div className="teacher-note"><MessageCircle size={17} /><div><strong>อยากให้อาจารย์อธิบายด้วยเสียง?</strong><span>ในเวอร์ชันจริง พระอาจารย์จะส่ง feedback เสียงสั้น ๆ กลับมาพร้อมรูปที่วงตรวจ</span></div></div></section></div>
  </StudioPageFrame>;
}
