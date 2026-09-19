import { ArrowLeft, Eye, EyeOff, KeyRound, LogIn, UserRound } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const login = trpc.auth.login.useMutation({ onSuccess: () => { toast.success("เข้าสู่ระบบแล้ว"); setLocation("/"); }, onError: error => toast.error(error.message) });
  const register = trpc.auth.register.useMutation({ onSuccess: () => { toast.success("สร้างบัญชีสำเร็จ"); setLocation("/"); }, onError: error => toast.error(error.message) });
  const pending = login.isPending || register.isPending;
  const submit = (event: React.FormEvent) => { event.preventDefault(); if (mode === "login") login.mutate({ email, password }); else register.mutate({ name, email, password }); };
  return <div className="login-page"><div className="login-art"><Link href="/" className="login-brand"><div className="brand-mark"><span>ป</span><span>า</span><span>ล</span><span>ี</span></div><span><strong>ปาลีสตูดิโอ</strong><small>LEARN WITH CLARITY</small></span></Link><div className="login-art-copy"><p className="eyebrow">เรียนให้สบายใจ</p><h1>ความรู้ค่อย ๆ งอกงาม<br /><em>เหมือนต้นโพธิ์</em></h1><p>บัญชีเดียวสำหรับบทเรียน การบ้าน พจนานุกรม และความก้าวหน้าของคุณ</p></div><div className="login-pali">พุทฺโธ · ธมฺโม · สงฺโฆ</div></div><main className="login-card-wrap"><Link href="/" className="login-back"><ArrowLeft size={16} /> กลับหน้าหลัก</Link><section className="login-card"><div className="login-icon"><KeyRound size={20} /></div><p className="eyebrow eyebrow--warm">บัญชีของคุณ</p><h2>{mode === "login" ? "ยินดีต้อนรับกลับ" : "สร้างบัญชีใหม่"}</h2><p className="login-subtitle">{mode === "login" ? "กรอกอีเมลและรหัสผ่านเพื่อเรียนต่อ" : "เริ่มต้นเส้นทางเรียนบาลีของคุณ"}</p><div className="login-tabs"><button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>เข้าสู่ระบบ</button><button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>สมัครสมาชิก</button></div><form onSubmit={submit}>{mode === "register" && <label><span><UserRound size={14} /> ชื่อที่แสดง</span><input value={name} onChange={e => setName(e.target.value)} placeholder="เช่น พระมหาดนัย" required /></label>}<label><span>อีเมล</span><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required /></label><label><span>รหัสผ่าน {mode === "register" && <small>(อย่างน้อย 8 ตัวอักษร)</small>}</span><div className="password-field"><input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="กรอกรหัสผ่าน" minLength={8} required /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="แสดงหรือซ่อนรหัสผ่าน">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label><button className="primary-button login-submit" disabled={pending}>{pending ? "กำลังดำเนินการ..." : mode === "login" ? <><LogIn size={16} /> เข้าสู่ระบบ</> : "สร้างบัญชี"}</button></form><p className="login-security">รหัสผ่านถูกเข้ารหัสก่อนจัดเก็บ และระบบไม่ส่งรหัสผ่านออกไปภายนอก</p></section></main></div>;
}
