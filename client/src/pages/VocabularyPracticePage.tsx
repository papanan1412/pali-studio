import { Brain, Check, ChevronRight, Flame, RotateCcw, Volume2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { StudioPageFrame } from "@/components/StudioPageFrame";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function VocabularyPracticePage() {
  const { data } = trpc.dictionary.search.useQuery({ query: "" });
  const stats = trpc.dictionary.stats.useQuery(undefined, { retry: false });
  const review = trpc.dictionary.review.useMutation({ onSuccess: () => { stats.refetch(); setFlipped(false); setIndex(current => (current + 1) % cards.length); } });
  const cards = useMemo(() => data || [], [data]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = cards[index];
  if (!card) return <StudioPageFrame title="ฝึกจำศัพท์" eyebrow="ทบทวนคำบาลีทีละน้อยทุกวัน"><div className="empty-state"><Brain size={24} /><strong>ยังไม่มีคำศัพท์สำหรับทบทวน</strong><span>เพิ่มคำศัพท์ในพจนานุกรมก่อนเริ่มฝึก</span></div></StudioPageFrame>;
  return <StudioPageFrame title="ฝึกจำศัพท์" eyebrow="ทบทวนคำบาลีทีละน้อยทุกวัน"><div className="practice-topline"><div><p className="eyebrow">รอบทบทวนวันนี้</p><h2>จำให้ได้ ใช้ให้เป็น</h2></div><div className="practice-stats"><span><Flame size={15} /> streak {stats.data?.streak ?? 0}</span><span>{stats.data?.reviewed ?? 0} คำที่เคยทบทวน</span></div></div><section className={`flashcard ${flipped ? "is-flipped" : ""}`} onClick={() => setFlipped(!flipped)}><div className="flashcard-front"><span className="flashcard-index">{index + 1} / {cards.length}</span><strong>{card.displayText}</strong><button onClick={event => { event.stopPropagation(); toast.success(`กำลังอ่าน ${card.displayText}`); }}><Volume2 size={17} /> ฟังเสียง</button><small>แตะเพื่อดูคำแปล</small></div><div className="flashcard-back"><span>ความหมาย</span><h2>{card.meaning}</h2><p>{card.grammarNote}</p><em>{card.example}</em></div></section><div className="practice-actions"><button className="review-button review-button--again" onClick={() => review.mutate({ entryId: card.id, remembered: false })}><X size={18} /> ยังไม่จำ</button><button className="review-button review-button--good" onClick={() => review.mutate({ entryId: card.id, remembered: true })}><Check size={18} /> จำได้แล้ว</button></div><div className="practice-footer"><button className="secondary-button compact" onClick={() => { setIndex((index + cards.length - 1) % cards.length); setFlipped(false); }}><RotateCcw size={15} /> เริ่มรอบใหม่</button><span>ทบทวนซ้ำแบบเว้นระยะเพื่อจำได้นานขึ้น</span><ChevronRight size={15} /></div></StudioPageFrame>;
}
