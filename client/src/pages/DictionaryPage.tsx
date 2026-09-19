import { BookMarked, Search, Sparkles, Volume2 } from "lucide-react";
import { useMemo, useState } from "react";
import { StudioPageFrame } from "@/components/StudioPageFrame";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const fallback = [{ id: 1, displayText: "พุทฺโธ", searchIndex: "พุทโธ", meaning: "ผู้รู้ ผู้ตื่น ผู้เบิกบาน; พระพุทธเจ้า", grammarNote: "นามศัพท์ ปฐมาวิภัตติ เอกวจนะ", example: "พุทฺโธ ธมฺมํ เทเสติ" }, { id: 2, displayText: "ธมฺโม", searchIndex: "ธมโม", meaning: "ธรรมะ; คำสอนของพระพุทธเจ้า", grammarNote: "นามศัพท์ ปฐมาวิภัตติ เอกวจนะ", example: "ธมฺโม ปาเปติ สุคตึ" }, { id: 3, displayText: "สงฺโฆ", searchIndex: "สงโฆ", meaning: "หมู่; คณะ; พระสงฆ์สาวก", grammarNote: "นามศัพท์ ปฐมาวิภัตติ เอกวจนะ", example: "สงฺโฆ สีลสมฺปนฺโน" }, { id: 4, displayText: "ตสฺมา", searchIndex: "ตสมา", meaning: "เพราะเหตุนั้น; เพราะฉะนั้น", grammarNote: "นิบาตบอกเหตุผล", example: "ตสฺมา อปฺปมาเทน สมฺปาเทถ" }];

export default function DictionaryPage() {
  const [query, setQuery] = useState("");
  const { data } = trpc.dictionary.search.useQuery({ query });
  const entries = useMemo(() => { if (data?.length) return data; const normalized = query.replace(/[ฺํ]/g, "").toLowerCase(); return fallback.filter(item => !normalized || `${item.displayText} ${item.meaning}`.replace(/[ฺํ]/g, "").toLowerCase().includes(normalized)); }, [data, query]);
  return <StudioPageFrame title="พจนานุกรมบาลี" eyebrow="ค้นศัพท์ให้เห็นอรรถ">
    <div className="dictionary-hero"><div className="dictionary-hero-icon"><BookMarked size={24} /></div><div><h2>ค้นหาคำบาลีได้แบบที่คุณถนัด</h2><p>พิมพ์ “พุทโธ” หรือ “พุทฺโธ” ก็ได้ผลลัพธ์เดียวกัน</p></div><Sparkles size={20} /></div><div className="dictionary-search"><Search size={19} /><input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="ค้นคำบาลี เช่น พุทโธ, ธมโม, ตสมา" /><kbd>ค้นหา</kbd></div><div className="dictionary-list">{entries.map(entry => <article className="dictionary-entry" key={entry.id}><div className="dictionary-word"><strong>{entry.displayText}</strong><button onClick={() => toast.success(`กำลังอ่านออกเสียง ${entry.displayText}`)} aria-label="ฟังเสียง"><Volume2 size={16} /></button><small>ค้นได้จาก {entry.searchIndex}</small></div><div className="dictionary-meaning"><h3>{entry.meaning}</h3><span>{entry.grammarNote}</span><p>ตัวอย่าง: <em>{entry.example}</em></p></div></article>)}{!entries.length && <div className="empty-state"><Search size={22} /><strong>ยังไม่มีคำนี้ในพจนานุกรม</strong><span>ลองค้นคำอื่น หรือเพิ่มเข้าคลังศัพท์ในภายหลัง</span></div>}</div>
  </StudioPageFrame>;
}
