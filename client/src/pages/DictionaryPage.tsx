import { BookMarked, Brain, Heart, Search, Sparkles, Volume2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { StudioPageFrame } from "@/components/StudioPageFrame";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

const fallback = [{ id: 1, displayText: "พุทฺโธ", searchIndex: "พุทโธ", meaning: "ผู้รู้ ผู้ตื่น ผู้เบิกบาน; พระพุทธเจ้า", grammarNote: "นามศัพท์ ปฐมาวิภัตติ เอกวจนะ", example: "พุทฺโธ ธมฺมํ เทเสติ" }, { id: 2, displayText: "ธมฺโม", searchIndex: "ธมโม", meaning: "ธรรมะ; คำสอนของพระพุทธเจ้า", grammarNote: "นามศัพท์ ปฐมาวิภัตติ เอกวจนะ", example: "ธมฺโม ปาเปติ สุคตึ" }, { id: 3, displayText: "สงฺโฆ", searchIndex: "สงโฆ", meaning: "หมู่; คณะ; พระสงฆ์สาวก", grammarNote: "นามศัพท์ ปฐมาวิภัตติ เอกวจนะ", example: "สงฺโฆ สีลสมฺปนฺโน" }, { id: 4, displayText: "ตสฺมา", searchIndex: "ตสมา", meaning: "เพราะเหตุนั้น; เพราะฉะนั้น", grammarNote: "นิบาตบอกเหตุผล", example: "ตสฺมา อปฺปมาเทน สมฺปาเทถ" }];

export default function DictionaryPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const { data } = trpc.dictionary.search.useQuery({ query });
  const favorites = trpc.dictionary.favorites.useQuery(undefined, { enabled: Boolean(user), retry: false });
  const toggle = trpc.dictionary.toggleFavorite.useMutation({ onSuccess: () => favorites.refetch() });
  const entries = useMemo(() => { if (data?.length) return data; const normalized = query.replace(/[ฺํ]/g, "").toLowerCase(); return fallback.filter(item => !normalized || `${item.displayText} ${item.meaning}`.replace(/[ฺํ]/g, "").toLowerCase().includes(normalized)); }, [data, query]);
  const isFavorite = (id: number) => Boolean(favorites.data?.some(item => item.entry.id === id));
  return <StudioPageFrame title="พจนานุกรมบาลี" eyebrow="ค้นศัพท์ให้เห็นอรรถ"><div className="dictionary-hero"><div className="dictionary-hero-icon"><BookMarked size={24} /></div><div><h2>ค้นหาคำบาลีได้แบบที่คุณถนัด</h2><p>พิมพ์ “พุทโธ” หรือ “พุทฺโธ” ก็ได้ผลลัพธ์เดียวกัน</p></div><Sparkles size={20} /></div><div className="dictionary-toolbar"><div className="dictionary-search"><Search size={19} /><input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="ค้นคำบาลี เช่น พุทโธ, ธมโม, ตสมา" /><kbd>ค้นหา</kbd></div><Link className="primary-button compact" href="/vocabulary"><Brain size={15} /> ฝึกจำศัพท์</Link></div><div className="dictionary-list">{entries.map(entry => <article className="dictionary-entry" key={entry.id}><div className="dictionary-word"><strong>{entry.displayText}</strong><div className="word-actions"><button onClick={() => toast.success(`กำลังอ่านออกเสียง ${entry.displayText}`)} aria-label="ฟังเสียง"><Volume2 size={16} /></button><button className={isFavorite(entry.id) ? "favorite active" : "favorite"} onClick={() => user ? toggle.mutate({ entryId: entry.id }) : toast.info("เข้าสู่ระบบเพื่อบันทึกคำโปรด")} aria-label="บันทึกคำโปรด"><Heart size={16} fill={isFavorite(entry.id) ? "currentColor" : "none"} /></button></div><small>ค้นได้จาก {entry.searchIndex}</small></div><div className="dictionary-meaning"><h3>{entry.meaning}</h3><span>{entry.grammarNote}</span><p>ตัวอย่าง: <em>{entry.example}</em></p></div></article>)}{!entries.length && <div className="empty-state"><Search size={22} /><strong>ยังไม่มีคำนี้ในพจนานุกรม</strong><span>ลองค้นคำอื่น หรือเพิ่มเข้าคลังศัพท์ในภายหลัง</span></div>}</div></StudioPageFrame>;
}
