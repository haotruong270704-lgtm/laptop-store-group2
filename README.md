## #30 — README (B)

| 👤 B · 👀 A | Nhánh `docs/30-readme` · Cần merge trước: #16 và các issue chức năng chính |
|---|---|

**Commit 1/2** `docs(readme): add setup guide and demo accounts` · **2/2** `docs(readme): add timing results and answers to four questions`


📄 **`README.md`**

~~~markdown
# 💻 LaptopStore

Website bán laptop – Exercise 27 mở rộng (FER202). React + Vite, react-bootstrap, React Router, axios, json-server.

| Thành viên | MSSV | GitHub | Phụ trách |
|---|---|---|---|
| Trương Đăng Nguyên Hạo (Leader) |DE180605 | haotruong270704 | Repo, API lõi, đăng nhập/phân quyền, tìm kiếm, routing, hooks, quản trị laptop, form quản trị, kiểm thử |
| Phạm Thùy Dương |DA190054 |td1905 | Trang chủ, danh sách, lọc, chi tiết, đánh giá, Navbar, Dữ liệu, Giỏ hàng, Thanh toán, Đơn hàng, kiểm thử |

- Project board: <link>
- Video demo: <link>
- Release: <link tới v1.0.0>

![Trang chủ](docs/screenshots/home.png)

## 1. Cài đặt & chạy

Yêu cầu: Node.js 20.19+ (hoặc 22 LTS).

```bash
npm install
cp .env.example .env        # VITE_API_URL=http://localhost:3001
npm start                   # json-server :3001 + Vite :5173
npm run reset-db            # khôi phục dữ liệu mẫu, sau đó chạy lại npm start
```

| Tài khoản | Email | Mật khẩu |
|---|---|---|
| Admin | admin@laptopstore.vn | 123456 |
| Khách hàng | khach@laptopstore.vn | 123456 |

## 2. Cấu trúc

```
src/
├── api/        axiosClient (instance + interceptors) và service theo tài nguyên
├── hooks/      useAxios, useDebounce, useAddToCart, useFlashMessage, usePageTitle
├── contexts/   AuthContext, CartContext, ToastContext
├── components/ layout/ common/ laptop/
├── pages/      các trang khách hàng + admin/
└── utils/      format, image, orderStatus
```

Luồng gọi API: `axiosClient` → `services (src/api)` → `hooks (useAxios)` → `pages/components`.

`useAxios` được dùng ở: HomePage, LaptopListPage, LaptopDetailPage, OrderListPage, AdminLaptopPage, AdminLaptopFormPage, AdminOrderPage.

## 3. Kết quả đo thời gian (Phần C2)

Trang chủ, json-server `--delay 500`, 4 request:

| Người đo | Tuần tự | Song song (`Promise.all`) |
|---|---|---|
| Hạo | 2127 ms | 557 ms |
| Dương | 2193 ms | 563 ms |

Song song nhanh gấp khoảng 4 lần vì 4 request chạy cùng lúc, tổng thời gian ≈ request chậm nhất (~500ms) thay vì cộng dồn (~2000ms).

## 4. Trả lời câu hỏi

**1. Vì sao interceptor lỗi phải trả nguyên lỗi hủy thay vì chuẩn hoá?** *(Dương)*
Component nhận biết request bị hủy bằng `isCancel(err)`, hàm này kiểm tra đối tượng lỗi có phải `CanceledError` của axios không. Nếu interceptor đổi lỗi hủy thành `{ status, message }` thì `isCancel()` luôn trả `false` → mỗi lần đổi bộ lọc, request cũ bị hủy lại bị coi là lỗi thật: màn hình hiện Alert "lỗi" giả và tắt loading sai lúc. Hủy request là hành vi chủ động, không phải lỗi cần báo cho người dùng.

**2. Vì sao bước kiểm tra tồn kho dùng `Promise.all` còn bước trừ kho dùng `Promise.allSettled`?** *(Hạo)*
- Bước kiểm tra tồn kho là điều kiện tiên quyết: thiếu thông tin của **bất kỳ** laptop nào thì không thể biết có đủ hàng hay không, nên phải dừng toàn bộ quy trình ngay. `Promise.all` thất bại ngay khi 1 request lỗi — đúng hành vi cần.
- Bước trừ kho / xoá giỏ chạy **sau khi đơn đã được tạo**. Một PATCH hay DELETE lỗi không được làm hỏng kết quả đặt hàng; cần chờ tất cả xong và biết cái nào lỗi để ghi cảnh báo. `Promise.allSettled` không bao giờ reject, trả kết quả từng request.

**3. Vì sao sửa nhanh tồn kho dùng PATCH còn form sửa dùng PUT?** *(Hạo)*
- Sửa nhanh chỉ đổi **một trường** `stock` → PATCH gửi `{ stock }`, server giữ nguyên các trường khác; request nhỏ, không có nguy cơ ghi đè dữ liệu người khác vừa sửa.
- Form sửa thay **toàn bộ** thông tin laptop → PUT gửi đầy đủ object (giữ `sold`, `rating`, `createdAt` cũ). Nếu dùng PUT mà thiếu trường thì json-server xoá trường đó; vì vậy PUT phải gửi đủ, còn PATCH chỉ gửi phần thay đổi.

**4. Vì sao ở StrictMode mỗi trang có 1 request *(canceled)* khi mới vào?** *(Dương)*
Ở chế độ phát triển, `React.StrictMode` cố ý chạy effect 2 lần khi component mount: mount → **cleanup** → mount lại, để phát hiện effect thiếu cleanup. Lần chạy đầu tạo request 1, cleanup gọi `controller.abort()` → request 1 *(canceled)*; lần chạy thứ hai tạo request 2 thành công. Bản build production (`npm run build`) không chạy 2 lần nên không còn request bị hủy. Thấy request *(canceled)* chứng tỏ cleanup hoạt động đúng.

## 5. Kiểm thử

Kết quả 19 kịch bản: [docs/TEST_REPORT.md](docs/TEST_REPORT.md).
~~~

---
