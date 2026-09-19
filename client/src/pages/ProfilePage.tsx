import { AtSign, Building2, Check, KeyRound, Link2, LogIn, Phone, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { StudioPageFrame } from "@/components/StudioPageFrame";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [monasteryName, setMonasteryName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const update = trpc.profile.update.useMutation({ onSuccess: () => toast.success("บันทึกโปรไฟล์แล้ว"), onError: e => toast.error(e.message) });
  useEffect(() => { setName(user?.name || ""); setEmail(user?.email || ""); setPhone(user?.phone || ""); setMonasteryName(user?.monasteryName || ""); setAvatarUrl(user?.avatarUrl || ""); }, [user]);
  return <StudioPageFrame title="โปรไฟล์ผู้เรียน" eyebrow="ตัวตนและสำนักเรียนของคุณ">
    {!user ? <div className="profile-guest"><UserRound size={30} /><h2>เข้าสู่ระบบเพื่อจัดการโปรไฟล์</h2><p>ใช้ชื่อ อีเมล/เบอร์ และรหัสผ่านของปาลีสตูดิโอ</p><button className="primary-button" onClick={() => { window.location.href = "/login"; }}><LogIn size={16} /> เข้าสู่ระบบ</button></div> : <div className="profile-grid"><section className="profile-card"><div className="profile-card-header"><div className="avatar avatar--profile">{avatarUrl ? <img src={avatarUrl} alt="รูปโปรไฟล์" /> : name.slice(0, 2) || "ผู้"}</div><div><h2>{name || "ผู้เรียน"}</h2><span>{email || phone || "ยังไม่มีข้อมูลติดต่อ"}</span></div><span className="role-pill">{user.role === "owner" ? "ผู้ดูแลหลัก" : user.role === "admin" ? "ผู้ดูแลระบบ" : user.role === "teacher" ? "พระอาจารย์" : "ผู้เรียน"}</span></div><label className="profile-field"><span><UserRound size={15} /> ชื่อที่แสดง</span><input value={name} onChange={e => setName(e.target.value)} placeholder="เช่น พระมหาดนัย" /></label><label className="profile-field"><span><AtSign size={15} /> อีเมล</span><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></label><label className="profile-field"><span><Phone size={15} /> เบอร์โทรศัพท์</span><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="0812345678" /></label><label className="profile-field"><span><Building2 size={15} /> วัด / สำนักเรียน</span><input value={monasteryName} onChange={e => setMonasteryName(e.target.value)} placeholder="เช่น วัดบวรนิเวศวิหาร" /></label><label className="profile-field"><span>URL รูปโปรไฟล์</span><input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://..." /></label><button className="primary-button" onClick={() => update.mutate({ name: name.trim(), email: email.trim(), phone: phone.trim(), monasteryName: monasteryName.trim(), avatarUrl: avatarUrl.trim() })} disabled={!name.trim() || update.isPending}><Check size={16} /> บันทึกการเปลี่ยนแปลง</button></section><aside className="profile-side"><div className="profile-side-icon"><ShieldCheck size={20} /></div><p className="eyebrow">บัญชีที่ปลอดภัย</p><h2>ควบคุมตัวตนของคุณ</h2><p>เพิ่มอีเมลและเบอร์โทรเพื่อยืนยันตัวตน กู้รหัสผ่าน และรับการแจ้งเตือนจากสำนักเรียน</p><div className="profile-links"><Link href="/security"><KeyRound size={15} /> ความปลอดภัยและเปลี่ยนรหัสผ่าน <Link2 size={14} /></Link><Link href="/certificates"><ShieldCheck size={15} /> คะแนนและใบประกาศ <Link2 size={14} /></Link></div></aside></div>}
  </StudioPageFrame>;
}
