-- MUSEUM BENNHARONG DATABASE - SCRIPT PART 1
-- Tables: CONSTRUCTION, COORDINATES, TRIP, ORGANIZATION, USER, ROLE, USER_ROLE, TICKET_TYPE, CUSTOMER

-- =====================================================
-- 1. CONSTRUCTION TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS CONSTRUCTION (
    CONSTRUCTION_ID INTEGER PRIMARY KEY,
    ORGANIZATION_ID INTEGER,
    CODE TEXT NOT NULL,
    NAME TEXT NOT NULL,
    TYPE TEXT,
    DESCRIPTION TEXT,
    COLUMN_HEIGHT REAL,
    WALL_HEIGHT REAL,
    Z_START REAL,
    FLOOR_HEIGHT REAL,
    MODEL_SCALE REAL,
    IMAGE_PATH TEXT,
    MODEL_3D_PATH TEXT,
    SORT_ORDER INTEGER,
    IS_ACTIVE INTEGER DEFAULT 1
);

INSERT INTO CONSTRUCTION VALUES
(1, 1, 'VIEW_DRAGON', 'Toàn cảnh Bến Nhà Rồng', 'Outdoor', 'Toàn cảnh khu vực bảo tàng', 5, 5, 3, 1.5, NULL, '/thamquan_bnr/VIEW_DRAGON/VIEW/VIEW.png', '/3d-map/models/dragon.glb', 1, 1),
(2, 1, 'TUONG', 'Tượng đài Nguyễn Tất Thành', 'Outdoor', 'Tượng đài Bác Hồ tại sân trước', NULL, NULL, NULL, NULL, 4.5, '/thamquan_bnr/VIEW_DRAGON/TUONG/TUONG.jpg', '/3d-map/models/tuong_nguyen_tat_thanh.glb', 2, 1),
(3, 1, 'CONG', 'Cổng vào', 'Outdoor', 'Cổng chính vào bảo tàng', NULL, NULL, NULL, NULL, NULL, '/thamquan_bnr/VIEW_DRAGON/CONG/CONG.jpg', NULL, 3, 1),
(4, 1, 'DAI', 'Đài phun nước', 'Outdoor', 'Đài phun nước trung tâm', NULL, NULL, NULL, NULL, NULL, '/thamquan_bnr/VIEW_DRAGON/DAI/DAI.png', NULL, 4, 1),
(5, 1, 'HCM_ROOM', 'Phòng tưởng niệm Chủ tịch Hồ Chí Minh', 'Floor_1', 'Phòng tưởng niệm chính', NULL, NULL, NULL, NULL, NULL, '/thamquan_bnr/FLOOD_1/HCM_ROOM/HCM.png', NULL, 5, 1),
(6, 1, 'HCM_HT', 'Hồ Chí Minh – Cuộc hành trình của thời đại', 'Floor_1', 'Trưng bày hình ảnh và hiện vật', NULL, NULL, NULL, NULL, NULL, '/thamquan_bnr/FLOOD_1/HCM_HT/HCM_HT.png', NULL, 6, 1),
(7, 1, 'HCM_MN', 'Bác Hồ với miền Nam, miền Nam với Bác Hồ', 'Floor_1', 'Các hoạt động của Bác với miền Nam', NULL, NULL, NULL, NULL, NULL, '/thamquan_bnr/FLOOD_1/HCM_MN/HCM_MN.png', NULL, 7, 1),
(8, 1, 'TL', 'Triển lãm: Đi qua cuộc chiến', 'Floor_1', 'Triển lãm về chiến tranh', NULL, NULL, NULL, NULL, NULL, '/thamquan_bnr/FLOOD_1/TL/TL.png', NULL, 8, 1),
(9, 1, 'TB_SG1910', 'Trưng bày: Sài Gòn những năm 1910', 'Floor_1', 'Sài Gòn thời Nguyễn Tất Thành', NULL, NULL, NULL, NULL, NULL, '/thamquan_bnr/FLOOD_1/TB_SG1910/TB_SG1910.png', NULL, 9, 1),
(10, 1, 'TB_VNTN', 'Trưng bày: Việt Nam những Tuyên ngôn độc lập', 'Floor_1', 'Tuyên ngôn độc lập và lịch sử', NULL, NULL, NULL, NULL, NULL, '/thamquan_bnr/FLOOD_1/TB_VNTN/TB_VNTN.png', NULL, 10, 1),
(11, 1, 'TB_OTO', 'Trưng bày: Xe ô tô hiệu Peugeot', 'Floor_1', 'Xe ô tô lịch sử', NULL, NULL, NULL, NULL, NULL, '/thamquan_bnr/FLOOD_1/TB_OTO/TB_OTO.png', NULL, 11, 1),
(12, 1, 'DT', 'Đền thờ Bác Hồ ở Nam Bộ', 'Floor_2', 'Đền thờ tầng 2', NULL, NULL, NULL, NULL, NULL, '/thamquan_bnr/FLOOD_2/DT/DT.png', NULL, 12, 1),
(13, 1, 'TB_1', 'Phòng trưng bày chủ đề thứ nhất', 'Floor_2', 'Chủ đề 1', NULL, NULL, NULL, NULL, NULL, '/thamquan_bnr/FLOOD_2/TB_1/TB_1.png', NULL, 13, 1),
(14, 1, 'TB_2', 'Phòng trưng bày chủ đề thứ hai', 'Floor_2', 'Chủ đề 2', NULL, NULL, NULL, NULL, NULL, '/thamquan_bnr/FLOOD_2/TB_2/TB_2.png', NULL, 14, 1),
(15, 1, 'TB_3', 'Phòng trưng bày chủ đề thứ ba', 'Floor_2', 'Chủ đề 3', NULL, NULL, NULL, NULL, NULL, '/thamquan_bnr/FLOOD_2/TB_3/TB_3.png', NULL, 15, 1),
(16, 1, 'TB_4', 'Phòng trưng bày chủ đề thứ tư', 'Floor_2', 'Chủ đề 4', NULL, NULL, NULL, NULL, NULL, '/thamquan_bnr/FLOOD_2/TB_4/TB_4.png', NULL, 16, 1),
(17, 1, 'CSDT', 'Một số hình ảnh cuộc sống đời thường', 'Floor_2', 'Cuộc sống đời thường', NULL, NULL, NULL, NULL, NULL, '/thamquan_bnr/FLOOD_2/CSDT/CSDT.png', NULL, 17, 1),
(18, 1, 'HCM_HOC', 'Hồ Chí Minh và học tập suốt đời', 'Floor_2', 'Bác Hồ với học tập', NULL, NULL, NULL, NULL, NULL, '/thamquan_bnr/FLOOD_2/HCM_HOC/HCM_HOC.png', NULL, 18, 1);

-- =====================================================
-- 2. COORDINATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS COORDINATES (
    COORDINATE_ID INTEGER PRIMARY KEY,
    CONSTRUCTION_ID INTEGER,
    LONGITUDE REAL,
    LATITUDE REAL,
    ALTITUDE REAL,
    SORT_ORDER INTEGER,
    FOREIGN KEY (CONSTRUCTION_ID) REFERENCES CONSTRUCTION(CONSTRUCTION_ID)
);

INSERT INTO COORDINATES VALUES
(1, 1, 106.7069257, 10.768433, 1.9, 0),
(2, 1, 106.7070310, 10.768215, 1.9, 1),
(3, 1, 106.706754910, 10.76808798, 1.9, 2),
(4, 1, 106.706651510, 10.768303, 1.9, 3),
(5, 2, 106.7067501165322810, 10.76844917, 3.18, 0),
(6, 3, NULL, NULL, NULL, 0),
(7, 4, NULL, NULL, NULL, 0),
(8, 5, NULL, NULL, NULL, 0),
(9, 6, NULL, NULL, NULL, 0),
(10, 7, NULL, NULL, NULL, 0),
(11, 8, NULL, NULL, NULL, 0),
(12, 9, NULL, NULL, NULL, 0),
(13, 10, NULL, NULL, NULL, 0),
(14, 11, NULL, NULL, NULL, 0),
(15, 12, NULL, NULL, NULL, 0),
(16, 13, NULL, NULL, NULL, 0),
(17, 14, NULL, NULL, NULL, 0),
(18, 15, NULL, NULL, NULL, 0),
(19, 16, NULL, NULL, NULL, 0),
(20, 17, NULL, NULL, NULL, 0),
(21, 18, NULL, NULL, NULL, 0);

-- =====================================================
-- 3. TRIP TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS TRIP (
    TRIP_ID INTEGER PRIMARY KEY,
    CONSTRUCTION_ID INTEGER,
    SORT_ORDER INTEGER,
    DESCRIPTION TEXT,
    FOREIGN KEY (CONSTRUCTION_ID) REFERENCES CONSTRUCTION(CONSTRUCTION_ID)
);

INSERT INTO TRIP VALUES
(1, 3, 0, 'Cổng vào'),
(2, 4, 1, 'Đài phun nước'),
(3, 2, 2, 'Tượng nguyễn tất thành'),
(4, 5, 3, 'Phòng tưởng niệm'),
(5, 6, 4, 'Phòng HCM - Hành trình thời đại'),
(6, 7, 5, 'Phòng Bác Hồ với miền Nam'),
(7, 8, 6, 'Triển lãm: Đi qua cuộc chiến'),
(8, 9, 7, 'Trưng bày: Sài Gòn 1910'),
(9, 10, 8, 'Trưng bày: Tuyên ngôn độc lập'),
(10, 11, 9, 'Trưng bày: Xe ô tô Peugeot'),
(11, 12, 10, 'Đền thờ Bác Hồ'),
(12, 13, 11, 'Phòng trưng bày chủ đề 1'),
(13, 14, 12, 'Phòng trưng bày chủ đề 2'),
(14, 15, 13, 'Phòng trưng bày chủ đề 3'),
(15, 16, 14, 'Phòng trưng bày chủ đề 4'),
(16, 17, 15, 'Cuộc sống đời thường'),
(17, 18, 16, 'HCM và học tập suốt đời');

-- =====================================================
-- 4. ORGANIZATION TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS ORGANIZATION (
    ORGANIZATION_ID INTEGER PRIMARY KEY,
    ORGANIZATION_NAME TEXT NOT NULL,
    DESCRIPTION TEXT
);

INSERT INTO ORGANIZATION VALUES
(1, 'ABC', 'ĐƠN VỊ QUẢN LÝ BẾN NHÀ RỒNG');

-- =====================================================
-- 5. USER TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS USER (
    USER_ID INTEGER PRIMARY KEY,
    USERNAME TEXT UNIQUE NOT NULL,
    PASSWORD TEXT NOT NULL,
    EMAIL TEXT,
    FULLNAME TEXT,
    PHONE TEXT,
    IS_ACTIVE INTEGER DEFAULT 1,
    LAST_LOGIN TEXT,
    CREATED_AT TEXT DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO USER VALUES
(1, 'admin', '0192023a7bbd73250516f069df18b500', 'admin@bennharong.vn', 'Quản trị viên', '0901234567', 1, '2026-01-08 01:41:32', '2026-01-05 06:37:27', '2026-01-05 06:37:27'),
(2, 'manager', '0192023a7bbd73250516f069df18b500', 'manager@bennharong.vn', 'Nguyễn Văn A', '0907654321', 1, NULL, '2026-01-05 06:37:27', '2026-01-05 06:37:27'),
(3, 'nv_banve01', '0192023a7bbd73250516f069df18b500', 'banve01@bennharong.vn', 'Trần Thị B', '0912345678', 1, NULL, '2026-01-05 06:37:27', '2026-01-05 06:37:27'),
(4, 'hdv_long', '0192023a7bbd73250516f069df18b500', 'long.hdv@bennharong.vn', 'Lê Văn Long', '0923456789', 1, NULL, '2026-01-05 06:37:27', '2026-01-05 06:37:27'),
(5, 'baove_cong1', '0192023a7bbd73250516f069df18b500', 'baove01@bennharong.vn', 'Phạm Văn C', '0934567890', 1, NULL, '2026-01-05 06:37:27', '2026-01-05 06:37:27'),
(6, 'opadmin', '0192023a7bbd73250516f069df18b500', 'opadmin@bennharong.vn', 'Operation Admin', '0900000000', 1, '2026-01-06 01:29:19', '2026-01-05 10:15:51', '2026-01-05 10:15:51'),
(7, 'lehoangvu', '0192023a7bbd73250516f069df18b500', 'lhvu27.work@gmail.com', 'Lê Hoàng Vũ', '0931477734', 1, NULL, '2026-01-08 02:00:00', '2026-01-08 02:00:00'),
(8, 'nguyenleminh', '0192023a7bbd73250516f069df18b500', 'minhln@gmail.com', 'Nguyễn Lê Minh', '03712345678', 1, NULL, '2026-01-08 02:00:00', '2026-01-08 02:00:00'),
(9, 'nguyenhoangkim', '0192023a7bbd73250516f069df18b500', 'lehoangkim@gmail.com', 'Nguyễn Hoàng Kim', '0987654398', 1, NULL, '2026-01-08 02:00:00', '2026-01-08 02:00:00'),
(10, 'phamhoanglong', '0192023a7bbd73250516f069df18b500', 'longph@gmail.com', 'Phạm Hoàng Long', '0123987465', 1, NULL, '2026-01-08 02:00:00', '2026-01-08 02:00:00'),
(11, 'vohungcuong', '0192023a7bbd73250516f069df18b500', 'cuong.vh@gmail.com', 'Võ Hùng Cường', '0123456712', 1, NULL, '2026-01-08 02:00:00', '2026-01-08 02:00:00');

-- =====================================================
-- 6. ROLE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS ROLE (
    ROLE_ID INTEGER PRIMARY KEY,
    ROLE_NAME TEXT NOT NULL,
    DESCRIPTION TEXT,
    PERMISSIONS TEXT
);

INSERT INTO ROLE VALUES
(1, 'Admin', 'Quản trị viên hệ thống', 'Toàn quyền hệ thống'),
(2, 'Manager', 'Quản lý bảo tàng', 'Xem tất cả báo cáo, thống kê'),
(3, 'Staff', 'Nhân viên bán vé', 'Bán vé, quản lý khách hàng'),
(4, 'Tour Guide', 'Hướng dẫn viên', 'Quản lý tour, check-in/out'),
(5, 'Security', 'Bảo vệ', 'Check-in, Check-out');

-- =====================================================
-- 7. USER_ROLE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS USER_ROLE (
    USER_ROLE_ID INTEGER PRIMARY KEY,
    USER_ID INTEGER,
    ROLE_ID INTEGER,
    ASSIGNED_AT TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (USER_ID) REFERENCES USER(USER_ID),
    FOREIGN KEY (ROLE_ID) REFERENCES ROLE(ROLE_ID)
);

INSERT INTO USER_ROLE VALUES
(1, 1, 1, '2026-01-05 06:37:27'),
(2, 2, 2, '2026-01-05 06:37:27'),
(3, 3, 3, '2026-01-05 06:37:27'),
(4, 4, 4, '2026-01-05 06:37:27'),
(5, 5, 5, '2026-01-05 06:37:27'),
(6, 6, 1, '2026-01-05 10:15:51'),
(7, 7, 1, '2026-01-08 02:00:00'),
(8, 8, 1, '2026-01-08 02:00:00'),
(9, 9, 1, '2026-01-08 02:00:00'),
(10, 10, 1, '2026-01-08 02:00:00'),
(11, 11, 1, '2026-01-08 02:00:00');

-- =====================================================
-- 8. TICKET_TYPE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS TICKET_TYPE (
    TICKET_TYPE_ID INTEGER PRIMARY KEY,
    TYPE_NAME TEXT NOT NULL,
    PRICE REAL NOT NULL,
    DESCRIPTION TEXT,
    IS_ACTIVE INTEGER DEFAULT 1,
    CREATED_AT TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO TICKET_TYPE VALUES
(1, 'Vé người lớn', 40000, 'Vé dành cho người lớn (từ 16 tuổi trở lên)', 1, '2025-12-16 06:44:19'),
(2, 'Vé trẻ em', 20000, 'Vé dành cho trẻ em (từ 6-15 tuổi)', 1, '2025-12-16 06:44:19'),
(3, 'Vé sinh viên', 25000, 'Vé dành cho sinh viên có thẻ', 1, '2025-12-16 06:44:19'),
(4, 'Vé người cao tuổi', 15000, 'Vé dành cho người trên 60 tuổi', 1, '2025-12-16 06:44:19'),
(5, 'Vé đoàn thể', 30000, 'Vé dành cho đoàn từ 20 người trở lên', 1, '2025-12-16 06:44:19');

-- =====================================================
-- 9. CUSTOMER TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS CUSTOMER (
    CUSTOMER_ID INTEGER PRIMARY KEY,
    FULLNAME TEXT,
    PHONE TEXT,
    EMAIL TEXT,
    ID_NUMBER TEXT,
    NATIONALITY TEXT,
    BIRTH_DATE TEXT,
    GENDER TEXT,
    NOTES TEXT,
    CREATED_AT TEXT DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO CUSTOMER VALUES
(1, 'Nguyen Van B', '0123456789', NULL, NULL, 'Việt Nam', NULL, 'Nam', NULL, '2025-12-16 09:21:32', '2025-12-16 09:21:32'),
(2, 'Nguyen Thi A', '0987654321', NULL, NULL, 'Việt Nam', NULL, 'Nữ', NULL, '2025-12-16 09:24:12', '2025-12-16 09:24:12'),
(3, 'Tran Van C', '0123987456', NULL, NULL, 'Việt Nam', NULL, 'Khác', NULL, '2025-12-16 09:24:32', '2025-12-16 09:24:32'),
(4, 'Luis Trần', '01881234567', NULL, NULL, 'US', NULL, 'Nữ', NULL, '2025-12-16 09:25:11', '2025-12-16 09:25:11'),
(5, 'Võ Hùng Cường', '0123456712', NULL, NULL, 'Canada', NULL, 'Nam', NULL, '2025-12-17 04:15:09', '2025-12-17 04:15:09'),
(6, 'Lê Hoàng Kim', '0987654398', 'lehoangkim@gmail.com', NULL, 'Việt Nam', NULL, 'Nam', NULL, '2025-12-17 04:15:42', '2025-12-17 04:15:42'),
(7, 'Phát', '0987123456', 'phat123@gmail.com', NULL, 'Việt Nam', NULL, 'Nam', NULL, '2025-12-17 10:29:33', '2025-12-17 10:29:33'),
(9, 'Lê Hoàng Vũ', '09123987654', 'vulh@gmail.com', NULL, 'Việt Nam', '2000-06-13', 'Nam', NULL, '2025-12-18 02:11:52', '2025-12-18 02:11:52'),
(10, 'Nguyễn Lê Minh', '03712345678', 'minhln@gmail.com', NULL, 'UK', NULL, 'Nam', NULL, '2025-12-18 02:13:17', '2025-12-18 02:13:17'),
(11, 'Phạm Hoàng Long', '0123987465', 'longph@gmail.com', NULL, 'Việt Nam', NULL, 'Nam', NULL, '2025-12-18 04:19:17', '2025-12-18 04:19:17'),
(12, 'Lê Hoàng Vũ', '0931477734', 'lhvu27.work@gmail.com', NULL, 'Việt Nam', '2025-12-02', 'Nam', NULL, '2025-12-18 04:37:48', '2025-12-18 04:37:48'),
(14, 'Tran xuân', '0256487300', NULL, NULL, 'Việt Nam', NULL, 'Nữ', NULL, '2025-12-18 07:15:39', '2025-12-18 07:15:39'),
(15, 'Dương Hoàng An', '0256487301', 'duongan@example.com', NULL, 'Việt Nam', NULL, 'Nữ', NULL, '2025-12-25 12:26:11', '2025-12-25 12:26:11');
