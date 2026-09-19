import { useAuth } from "@/_core/hooks/useAuth";
import { ArrowLeft, BookOpen, BookOpenCheck, GraduationCap, Library, LogIn, UserRound } from "lucide-react";
import { Link, useLocation } from "wouter";

const links = [
  { href: "/", label: "ภาพรวม", icon: GraduationCap },
  { href: "/courses", label: "บทเรียน", icon: BookOpen },
  { href: "/homework", label: "การบ้าน", icon: BookOpenCheck },
  { href: "/dictionary", label: "พจนานุกรม", icon: Library },
  { href: "/school", label: "สำนักเรียน", icon: GraduationCap },
  { href: "/teacher", label: "ตรวจการบ้าน", icon: BookOpenCheck },
  { href: "/media", label: "จัดการสื่อ", icon: Library },
];

function Mark() {
  return <div className="brand-mark brand-mark--small"><span>ป</span><span>า</span><span>ล</span><span>ี</span></div>;
}

export function StudioPageFrame({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useAuth();
  return (
    <div className="feature-app">
      <aside className="feature-sidebar">
        <Link href="/" className="feature-brand"><Mark /><span><strong>บาลีสตูดิโอ</strong><small>LEARN WITH CLARITY</small></span></Link>
        <div className="feature-user">
          <div className="avatar avatar--large">{user?.name?.slice(0, 2) || "ผู้"}</div>
          <div><strong>{user?.name || "ผู้เยี่ยมชม"}</strong><span>{user?.email || "ดูตัวอย่างระบบ"}</span></div>
        </div>
        <nav className="feature-nav">
          <small>เมนูระบบ</small>
          {links.map(item => { const Icon = item.icon; return <Link key={item.href} href={item.href} className={location === item.href ? "active" : ""}><Icon size={17} /><span>{item.label}</span></Link>; })}
        </nav>
        <div className="feature-sidebar-note"><strong>ออกแบบเพื่อการเรียนจริง</strong><span>รองรับพินทุ นิคหิต และวงจรการบ้านครบในที่เดียว</span></div>
      </aside>
      <main className="feature-main">
        <header className="feature-topbar"><Link href="/" className="back-link"><ArrowLeft size={16} /> กลับภาพรวม</Link><div className="feature-actions">{user ? <Link href="/profile" className="profile-chip"><UserRound size={15} /> โปรไฟล์</Link> : <Link href="/login" className="login-chip"><LogIn size={15} /> เข้าสู่ระบบ</Link>}</div></header>
        <div className="feature-content"><p className="eyebrow eyebrow--warm">{eyebrow}</p><h1>{title}</h1>{children}</div>
      </main>
    </div>
  );
}
