# บาลีสตูดิโอ

เว็บไซต์ต้นแบบแบบ mobile-first สำหรับแพลตฟอร์มเรียนบาลีออนไลน์ ออกแบบจากพิมพ์เขียวที่เน้นความเรียบง่าย โหลดไว และใช้งานได้สบายบนมือถือของพระ เณร และผู้เรียนทุกวัย

## สิ่งที่มีในต้นแบบนี้

- แดชบอร์ดภาพรวมพร้อมบทเรียนที่กำลังเรียนและความคืบหน้า
- การ์ดคอร์สเรียนพร้อม progress และปุ่มเรียนต่อ
- ช่องค้นหาบทเรียนและคำบาลีที่ normalize เครื่องหมายพินทุ/นิคหิตในฝั่ง UI
- Pali Word of the Day พร้อมปุ่มฟังเสียงและสลับคำศัพท์
- การ์ดวงจรการบ้านสำหรับอัปโหลดรูปให้พระอาจารย์ตรวจ
- เมนู responsive ทั้ง sidebar บนเดสก์ท็อปและ bottom navigation บนมือถือ
- GitHub Actions สำหรับ build และ deploy ไปยัง GitHub Pages

## รันในเครื่อง

```bash
pnpm install
pnpm dev
```

ตรวจ TypeScript และ build production:

```bash
pnpm check
pnpm build
```

## โครงสร้างและการต่อยอด

เวอร์ชันนี้เป็น **frontend prototype** จึงใช้ข้อมูลจำลองและ toast เพื่อแสดง interaction ที่สำคัญก่อน หากจะเปิดใช้งานจริง ควรต่อกับ LINE LIFF, Bunny Stream/Cloudflare Stream, object storage และฐานข้อมูลตามสถาปัตยกรรมในพิมพ์เขียว พร้อมเพิ่ม auth และระบบสิทธิ์สำหรับผู้เรียน/พระอาจารย์

## Deploy บน GitHub Pages

ไฟล์ `.github/workflows/deploy.yml` จะทำงานเมื่อ push ไปยัง branch `main` โดย build ด้วย Vite และ publish โฟลเดอร์ `dist/public` ไปยัง GitHub Pages อัตโนมัติ
