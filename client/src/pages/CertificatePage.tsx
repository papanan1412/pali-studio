import { Award, Download, FileCheck2, GraduationCap } from "lucide-react";
import { StudioPageFrame } from "@/components/StudioPageFrame";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

export default function CertificatePage() {
  const { user } = useAuth();
  const certificates = trpc.certificates.mine.useQuery(undefined, { enabled: Boolean(user) });
  const courses = trpc.courses.list.useQuery({});
  const issue = trpc.certificates.issue.useMutation({ onSuccess: () => { toast.success("ออกใบประกาศแล้ว"); certificates.refetch(); }, onError: e => toast.error(e.message) });
  if (!user) return <StudioPageFrame title="คะแนนและใบประกาศ" eyebrow="ความสำเร็จที่จับต้องได้"><div className="auth-banner"><GraduationCap size={20} /><div><strong>เข้าสู่ระบบเพื่อดูคะแนนและใบประกาศ</strong><span>สะสมความก้าวหน้าแล้วรับใบประกาศเมื่อผ่านเกณฑ์</span></div><button onClick={() => { window.location.href = "/login"; }}>เข้าสู่ระบบ</button></div></StudioPageFrame>;
  return <StudioPageFrame title="คะแนนและใบประกาศ" eyebrow="ความสำเร็จที่จับต้องได้"><div className="certificate-hero"><div className="certificate-seal"><Award size={28} /></div><div><p className="eyebrow">เส้นทางของคุณ</p><h2>เรียนต่อเนื่อง แล้วให้ผลงานเล่าเรื่อง</h2><p>เกณฑ์เบื้องต้น: เรียนครบทุกบทและผ่านแบบทดสอบอย่างน้อย ๗๐%</p></div></div><section className="profile-card"><div className="panel-heading"><div><h2>ใบประกาศของฉัน</h2><p>ดาวน์โหลดหรือแชร์รหัสใบประกาศได้</p></div><FileCheck2 size={20} /></div>{certificates.data?.length ? certificates.data.map(item => <div className="certificate-row" key={item.certificate.id}><div className="certificate-mini"><Award size={18} /></div><div><strong>{item.course.title}</strong><span>{item.certificate.certificateNo} · ออกเมื่อ {new Date(item.certificate.issuedAt).toLocaleDateString("th-TH")}</span></div><button className="secondary-button compact" onClick={() => toast.info("ระบบสร้าง PDF ใบประกาศจะเชื่อมต่อในขั้นถัดไป")}><Download size={15} /> ดาวน์โหลด</button></div>) : <div className="empty-state"><Award size={23} /><strong>ยังไม่มีใบประกาศ</strong><span>เรียนให้ครบและผ่านแบบทดสอบเพื่อรับใบประกาศ</span></div>}</section><section className="profile-card"><div className="panel-heading"><div><h2>คอร์สที่กำลังเรียน</h2><p>ผู้ดูแลสามารถออกใบประกาศให้เมื่อผ่านเกณฑ์</p></div></div>{(courses.data || []).map(course => <div className="course-certificate-row" key={course.id}><div><strong>{course.title}</strong><span>{course.lessons.length} บทเรียน · {course.paliLevel}</span></div><button className="secondary-button compact" onClick={() => issue.mutate({ courseId: course.id })}><Award size={15} /> ขอใบประกาศ</button></div>)}</section></StudioPageFrame>;
}
