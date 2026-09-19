import { useEffect, useState } from "react";
import { AtSign, Building2, Check, LogIn, UserRound } from "lucide-react";
import { StudioPageFrame } from "@/components/StudioPageFrame";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [monasteryName, setMonasteryName] = useState("");
  const update = trpc.profile.update.useMutation({ onSuccess: () => toast.success("บันทึกโปรไฟล์แล้ว") });
  useEffect(() => { setName(user?.name || ""); setMonasteryName((user as any)?.monasteryName || ""); }, [user]);
  return <StudioPageFrame title="โปรไฟล์ผู้เรียน" eyebrow="ตัวตนและสำนักเรียนของคุณ">
    {!user ? <div className="profile-guest"><UserRound size={30} /><h2>เข้าสู่ระบบเพื่อจัดการโปรไฟล์</h2><p>ใช้ชื่อ อีเมล และรหัสผ่านของปาลีสตูดิโอ</p><button className="primary-button" onClick={() => { window.location.href = "/login"; }}><LogIn size={16} /> เข้าสู่ระบบ</button></div> : <div className="profile-grid"><section className="profile-card"><div className="profile-card-header"><div className="avatar avatar--profile">{name.slice(0, 2) || "ผู้"}</div><div><h2>{name || "ผู้เรียน"}</h2><span>{user.email || "ยังไม่มีอีเมล"}</span></div><span className="role-pill">{user.role === "owner" ? "ผู้ดูแลหลัก" : user.role === "admin" ? "ผู้ดูแลระบบ" : user.role === "teacher" ? "พระอาจารย์" : "ผู้เรียน"}</span></div><label className="profile-field"><span><UserRound size={15} /> ชื่อที่แสดง</span><input value={name} onChange={e => setName(e.target.value)} placeholder="เช่น พระมหาดนัย" /></label><label className="profile-field"><span><Building2 size={15} /> วัด / สำนักเรียน</span><input value={monasteryName} onChange={e => setMonasteryName(e.target.value)} placeholder="เช่น วัดบวรนิเวศวิหาร" /></label><label className="profile-field"><span><AtSign size={15} /> อีเมล</span><input value={user.email || ""} disabled /></label><button className="primary-button" onClick={() => update.mutate({ name: name.trim(), monasteryName: monasteryName.trim() })} disabled={!name.trim() || update.isPending}><Check size={16} /> บันทึกการเปลี่ยนแปลง</button></section><aside className="profile-side"><div className="profile-side-icon"><Building2 size={20} /></div><p className="eyebrow">บทบาทในระบบ</p><h2>เรียนแบบมีชุมชน</h2><p>สำนักเรียนช่วยให้พระอาจารย์มองเห็นจังหวะการเรียนของผู้เรียนแต่ละคน และส่งคำแนะนำได้ตรงจุด</p></aside></div>}
  </StudioPageFrame>;
}
