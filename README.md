# Daily Focus Planner – MVP

Website quản lý công việc cá nhân, dùng được trên **điện thoại và máy tính**, triển khai miễn phí trên **GitHub Pages (`github.io`)**.

## Đã có trong phiên bản này

- Thêm, chỉnh sửa, xóa công việc; nhập tên, ghi chú, ngày/giờ bắt đầu, deadline, ưu tiên, trạng thái.
- Dashboard tự hiển thị việc đang diễn ra, đến hạn hôm nay, quá hạn, sắp bắt đầu.
- **Ghim việc tập trung theo ngày**; ngày mai không tự mang ghim của hôm nay sang.
- Lịch **tháng/tuần** hiển thị công việc xuyên suốt từ ngày bắt đầu đến deadline (hai đầu mút đều được tính).
- Danh sách công việc có tìm kiếm, lọc theo trạng thái và quá hạn.
- Thống kê tiến độ; xuất dữ liệu JSON; nhập JSON khi dùng thử cục bộ.
- Giao diện responsive + PWA (có thể thêm vào màn hình chính trên điện thoại).
- Chế độ dùng thử trên một thiết bị, **hoặc** tài khoản Supabase để đồng bộ nhiều thiết bị.

**Lưu ý quan trọng:** Bản dùng thử lưu bằng `localStorage` trên một thiết bị, không đồng bộ và có thể mất khi xóa dữ liệu trình duyệt. Muốn đồng bộ giữa điện thoại/máy tính, bạn **phải** làm phần Supabase phía dưới. PWA chỉ cache giao diện; chế độ Supabase chưa hỗ trợ thêm/sửa công việc khi mất kết nối và chưa có push notification tự động khi đóng web.

## A. Xem thử ngay (không cần Supabase)

1. Giải nén `daily-focus-mvp.zip`.
2. Dùng VS Code + extension **Live Server** mở `index.html`, hoặc mở terminal tại thư mục:
   ```bash
   python -m http.server 8000
   ```
   rồi vào `http://localhost:8000/`.
3. Web sẽ mở ở chế độ dùng thử với **4 công việc mẫu** có thể chỉnh sửa/xóa.

Không cần Node.js, không cần `npm install`, không cần build. Các file HTML/CSS/JS thuần giúp triển khai trực tiếp trên GitHub Pages. Nếu về sau phát triển lớn, vẫn có thể chuyển frontend sang React/Vite mà giữ thiết kế database.

## B. Đưa lên GitHub Pages

### Cách dễ nhất: qua trang web GitHub

1. Vào GitHub → **New repository** → đặt tên `daily-focus` → để **Public** → Create.
2. Vào repository → **Add file → Upload files** → kéo toàn bộ **các file và thư mục bên trong** gói ZIP (không chỉ upload ZIP). Đảm bảo `index.html` nằm ở **gốc repository**.
3. Commit vào nhánh `main`.
4. Mở **Settings → Pages** → **Build and deployment** → Source: **Deploy from a branch** → branch `main`, folder `/(root)` → Save.
5. Website sẽ có URL dạng:
   `https://TEN-GITHUB-CUA-BAN.github.io/daily-focus/`

Nếu repo được đặt tên **chính xác** `TEN-GITHUB-CUA-BAN.github.io` thì URL là `https://TEN-GITHUB-CUA-BAN.github.io/`.

> **Lưu ý:** GitHub Pages để các trang công khai trên Internet. Không ghi mật khẩu, token bí mật, dữ liệu công việc cá nhân hay Supabase `service_role` key vào mã nguồn.

### Cách dùng git

```bash
git init
git add .
git commit -m "Initial Daily Focus Planner MVP"
git branch -M main
git remote add origin https://github.com/TEN-GITHUB-CUA-BAN/daily-focus.git
git push -u origin main
```

Chọn Pages → Deploy from a branch như ở trên. Không cần GitHub Actions cho dự án tĩnh này.

## C. Bật đăng nhập và đồng bộ dữ liệu Supabase

### Bước 1 – Tạo dự án Supabase

1. Tạo project ở https://supabase.com/dashboard.
2. Chọn **SQL Editor** → New query → copy toàn bộ `supabase/schema.sql` và **Run**.
3. Trong **Authentication → Providers**, bật Email (nếu chưa có). Cấu hình yêu cầu xác nhận email tùy nhu cầu.
4. Trong **Authentication → URL Configuration**, đặt **Site URL** là URL GitHub Pages chính xác của bạn (kết thúc bằng `/`), ví dụ `https://TEN-GITHUB.github.io/daily-focus/`; bổ sung cùng URL trong **Redirect URLs** cho liên kết xác nhận email.

### Bước 2 – Lấy thông tin kết nối

Vào **Project Settings → API Keys** (hoặc Connect ở giao diện Supabase mới). Cần:

- Project URL dạng `https://xxxxx.supabase.co`.
- **Publishable key** (`sb_publishable_...`) hoặc legacy `anon` key nếu dự án dùng khóa cũ.

**KHÔNG BAO GIỜ dùng `service_role` hoặc secret key trong website.** Đây là frontend công khai, publishable/anon key được phép công khai **chỉ khi RLS đã cấu hình đúng** như SQL kèm theo.

Mở `config.js`, sửa:

```js
window.DAILY_FOCUS_CONFIG = {
  supabaseUrl: 'https://TEN-DU-AN.supabase.co',
  supabaseAnonKey: 'sb_publishable_KEY_CUA_BAN'
};
```

Lưu và commit/push `config.js` lên GitHub, sau đó tải lại trang. Web sẽ hiện màn hình **Đăng nhập / Đăng ký**. Lần đầu hãy đăng ký tài khoản rồi xác nhận email nếu dự án yêu cầu.

**Lưu ý CDN:** Để không cần bước build, `app.js` chỉ tải thư viện `@supabase/supabase-js` từ jsDelivr khi có cấu hình Supabase. Cần Internet và CDN hoạt động để sử dụng tính năng đăng nhập. Có thể thay CDN bằng module cài qua npm trong phiên bản sau.

### Bước 3 – Kiểm tra đồng bộ thực tế

1. Đăng nhập cùng một tài khoản trên máy tính và điện thoại.
2. Thêm công việc trên máy tính.
3. Mở hoặc chuyển lại tab Daily Focus trên điện thoại: app sẽ tải bản cập nhật.
4. Thử chỉnh sửa/trạng thái/ghim rồi kiểm tra thiết bị còn lại.

Đồng bộ đang theo phương thức tải lại dữ liệu khi mở/chuyển về tab (không phải realtime push). Nếu vừa cập nhật trên thiết bị khác, tải lại trang để thấy dữ liệu mới ngay.

## D. Cài lên màn hình chính điện thoại

- Android: mở URL bằng Chrome → menu → **Install app / Add to Home screen** (tùy trình duyệt).
- iPhone: mở URL bằng Safari → **Share** → **Add to Home Screen**.

PWA cần HTTPS để service worker hoạt động; GitHub Pages đã có HTTPS. Có thể phải mở trang hơn một lần mới hiện tùy chọn cài đặt.

## E. Cách hệ thống xác định việc cần xuất hiện

| Điều kiện | Cách hiển thị |
| --- | --- |
| Hôm nay trước ngày bắt đầu | Sắp bắt đầu |
| Ngày bắt đầu ≤ hôm nay ≤ deadline | Đang trong kế hoạch |
| Deadline là hôm nay | Đến hạn hôm nay |
| Qua deadline, chưa hoàn thành | Quá hạn (không biến mất) |
| Đã hoàn thành | Lịch sử; không tính là việc cần làm |
| `focus_date` = ngày được chọn | Ghim tập trung trong đúng ngày đó |

`focus_date` chỉ lưu **một ngày ghim gần nhất** trên mỗi công việc. Không hỗ trợ lịch sử ghim nhiều ngày; đủ cho yêu cầu MVP. Giờ bắt đầu/deadline được lưu và hiển thị, nhưng cảnh báo hạn theo ngày (không tự push đúng giờ).

## F. Cấu trúc file

```text
daily-focus-mvp/
├── index.html             # Giao diện chính
├── styles.css             # Responsive desktop/mobile
├── app.js                 # Dashboard, lịch, công việc, auth, đồng bộ
├── config.js              # Thông số kết nối Supabase (publishable only)
├── manifest.webmanifest   # PWA
├── sw.js                  # Cache giao diện để mở offline
├── assets/
│   ├── favicon.svg
│   ├── icon-192.png
│   └── icon-512.png
└── supabase/
    └── schema.sql         # Database + RLS
```

## G. Giới hạn MVP / cần phát triển ở vòng sau

- Chưa có thông báo nhắc việc hệ thống/push khi website đóng.
- Chưa có nhiệm vụ lặp lại định kỳ, phân loại theo dự án, checklist con.
- Chưa có chỉnh sửa ngoại tuyến cho người dùng Supabase hoặc hàng đợi đồng bộ offline.
- Chưa có chia sẻ công việc giữa nhiều tài khoản.
- Chưa có test tự động end-to-end trên trình duyệt thực (nên kiểm thử trên Chrome/Safari trước khi sử dụng chính thức).

## H. Lỗi thường gặp

- **Web có trang nhưng không thấy dữ liệu từ điện thoại:** đang dùng thử `localStorage` hoặc chưa đăng nhập cùng tài khoản Supabase.
- **`relation public.tasks does not exist`:** chưa chạy `supabase/schema.sql`.
- **`new row violates row-level security policy`:** đang dùng sai tài khoản hoặc chưa chạy đúng RLS SQL.
- **Không nhận email xác nhận:** kiểm tra Email Provider, Site URL, Redirect URLs và hộp thư rác. Email miễn phí Supabase có thể giới hạn gửi.
- **Lỗi kết nối lúc mở web:** kiểm tra Project URL/Key trong `config.js`, trình duyệt có Internet và có truy cập CDN jsDelivr.
- **Trình duyệt vẫn hiện bản web cũ:** tải lại trang (hard refresh); PWA có cache. Service worker được thiết kế ưu tiên mạng để lấy JS/CSS mới.
