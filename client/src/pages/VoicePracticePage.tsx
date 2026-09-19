import { Headphones, Mic, Play, Square, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { StudioPageFrame } from "@/components/StudioPageFrame";
import { toast } from "sonner";

const words = [{ pali: "พุทฺโธ", meaning: "ผู้รู้ ผู้ตื่น ผู้เบิกบาน" }, { pali: "ธมฺโม", meaning: "คำสอนของพระพุทธเจ้า" }, { pali: "สงฺโฆ", meaning: "หมู่พระสาวก" }];

export default function VoicePracticePage() {
  const [index, setIndex] = useState(0);
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const word = words[index];
  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl); }, [audioUrl]);
  const speak = () => { if (!("speechSynthesis" in window)) return toast.error("เบราว์เซอร์นี้ยังไม่รองรับเสียงอ่าน"); window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(word.pali); utterance.lang = "th-TH"; utterance.rate = 0.72; window.speechSynthesis.speak(utterance); };
  const start = async () => { try { const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); chunks.current = []; const next = new MediaRecorder(stream); next.ondataavailable = event => chunks.current.push(event.data); next.onstop = () => { const url = URL.createObjectURL(new Blob(chunks.current, { type: "audio/webm" })); setAudioUrl(url); stream.getTracks().forEach(track => track.stop()); }; next.start(); recorder.current = next; setRecording(true); } catch { toast.error("กรุณาอนุญาตการใช้ไมโครโฟนเพื่อฝึกเสียง"); } };
  const stop = () => { recorder.current?.stop(); recorder.current = null; setRecording(false); };
  return <StudioPageFrame title="ฝึกอ่านออกเสียง" eyebrow="ฟังตัวอย่าง แล้วลองอ่านตาม"><div className="voice-hero"><div className="voice-orbit"><Headphones size={28} /></div><div><p className="eyebrow">SOUND PRACTICE</p><h2>เสียงที่ชัด เริ่มจากการฟังอย่างตั้งใจ</h2><p>กดฟังตัวอย่าง แล้วอัดเสียงของคุณเพื่อฟังย้อนกลับ</p></div></div><section className="voice-card"><span className="flashcard-index">คำที่ {index + 1} / {words.length}</span><strong>{word.pali}</strong><span>{word.meaning}</span><button className="primary-button" onClick={speak}><Volume2 size={17} /> ฟังตัวอย่าง</button><div className="voice-divider" /><div className="record-controls">{recording ? <button className="danger-button" onClick={stop}><Square size={16} /> หยุดอัดเสียง</button> : <button className="secondary-button" onClick={start}><Mic size={16} /> อัดเสียงของฉัน</button>}{audioUrl && <audio controls src={audioUrl} />}</div>{audioUrl && <p className="muted-note">เสียงถูกเก็บไว้ชั่วคราวในเบราว์เซอร์เครื่องนี้ ยังไม่ส่งขึ้นระบบ</p>}</section><div className="voice-nav"><button className="secondary-button compact" onClick={() => setIndex((index + words.length - 1) % words.length)}>คำก่อนหน้า</button><button className="secondary-button compact" onClick={() => setIndex((index + 1) % words.length)}><Play size={14} /> คำถัดไป</button></div></StudioPageFrame>;
}
