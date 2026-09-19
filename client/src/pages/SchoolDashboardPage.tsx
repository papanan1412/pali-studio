import { BarChart3, BookOpenCheck, Download, Gauge, GraduationCap, Users, ArrowUpRight } from "lucide-react";
import { StudioPageFrame } from "@/components/StudioPageFrame";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

const demoBars = [{ label: "วัดบวรฯ", value: 82 }, { label: "วัดราชฯ", value: 68 }, { label: "วัดปากน้ำ", value: 54 }, { label: "วัดสุทัศน์", value: 41 }];

export default function SchoolDashboardPage() {
  const { user } = useAuth();
  const teacher = trpc.dashboard.teacher.useQuery(undefined, { enabled: user?.role === "teacher" || user?.role === "admin" || user?.role === "owner" });
  const isTeacher = user?.role === "teacher" || user?.role === "admin" || user?.role === "owner";
  const roster = trpc.admin.students.useQuery(undefined, { enabled: isTeacher, retry: false });
  const metrics = teacher.data || { students: 24, pendingHomework: 8, gradedThisWeek: 41, averageScore: 8.2 };
  return <StudioPageFrame title="สำนักเรียน" eyebrow="ดูภาพรวมการเติบโตของผู้เรียน">
    {!user && <div className="auth-banner"><GraduationCap size={20} /><div><strong>แดชบอร์ดตัวอย่างสำหรับผู้ดูแลสำนักเรียน</strong><span>เข้าสู่ระบบเพื่อดูข้อมูลจริงของสำนักเรียนและรายงานรายบุคคล</span></div><button onClick={() => { window.location.href = "/login"; }}>เข้าสู่ระบบ</button></div>}
    {user && !isTeacher && <div className="auth-banner auth-banner--soft"><Gauge size={20} /><div><strong>บัญชีผู้เรียน</strong><span>หน้านี้แสดงภาพรวมสำหรับพระอาจารย์และผู้ดูแลสำนักเรียน</span></div></div>}
    <div className="metric-grid"><div className="metric-card"><div className="metric-icon teal"><Users size={18} /></div><span>ผู้เรียนทั้งหมด</span><strong>{metrics.students}</strong><small>+๔ คนเดือนนี้</small></div><div className="metric-card"><div className="metric-icon coral"><BookOpenCheck size={18} /></div><span>การบ้านรอตรวจ</span><strong>{metrics.pendingHomework}</strong><small>ควรตรวจภายในวันนี้</small></div><div className="metric-card"><div className="metric-icon saffron"><BarChart3 size={18} /></div><span>งานที่ตรวจสัปดาห์นี้</span><strong>{metrics.gradedThisWeek}</strong><small>+๑๘% จากสัปดาห์ก่อน</small></div><div className="metric-card"><div className="metric-icon navy"><Gauge size={18} /></div><span>คะแนนเฉลี่ย</span><strong>{metrics.averageScore || "๘.๒"}<small> / ๑๐</small></strong><small>อยู่ในเกณฑ์ดีมาก</small></div></div>
    <div className="dashboard-grid"><section className="report-card"><div className="panel-heading"><div><h2>ความสม่ำเสมอรายสำนักเรียน</h2><p>เปอร์เซ็นต์ผู้เรียนที่เข้าเรียนต่อเนื่องในเดือนนี้</p></div><button className="export-button" onClick={() => toast.success("เตรียมรายงานสำหรับดาวน์โหลดแล้ว")}><Download size={15} /> ส่งออกรายงาน</button></div><div className="bar-chart">{demoBars.map(bar => <div className="bar-row" key={bar.label}><span>{bar.label}</span><div><i style={{ width: `${bar.value}%` }} /></div><strong>{bar.value}%</strong></div>)}</div></section><section className="report-card focus-card"><div className="focus-orbit" /><div className="focus-icon"><ArrowUpRight size={20} /></div><p className="eyebrow">เป้าหมายเดือนนี้</p><h2>ให้ผู้เรียนส่งการบ้านตรงเวลาเกิน ๘๐%</h2><div className="focus-progress"><div><span style={{ width: "72%" }} /></div><strong>๗๒%</strong></div><p>อีกเพียง ๘% จะถึงเป้าหมายของสำนักเรียน</p></section></div><section className="report-card roster-card"><div className="panel-heading"><div><h2>รายชื่อผู้เรียน</h2><p>ตรวจสอบการเข้าใช้งานล่าสุดและติดตามรายบุคคล</p></div><Users size={20} /></div>{roster.data?.length ? roster.data.map(student => <div className="student-roster-row" key={student.id}><div className="avatar">{(student.name || "ผ").slice(0, 2)}</div><div><strong>{student.name || "ไม่ระบุชื่อ"}</strong><span>{student.email || student.phone || "ยังไม่มีข้อมูลติดต่อ"}</span></div><small>{student.lastSignedIn ? new Date(student.lastSignedIn).toLocaleDateString("th-TH") : "ยังไม่เข้าใช้"}</small></div>) : <div className="empty-state"><Users size={22} /><strong>{isTeacher ? "ยังไม่มีรายชื่อผู้เรียน" : "เข้าสู่ระบบครูเพื่อดูรายชื่อ"}</strong></div>}</section>
  </StudioPageFrame>;
}
