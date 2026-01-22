-- Tạo bảng lưu tọa độ tòa nhà
CREATE TABLE IF NOT EXISTS building_coordinates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    building_name VARCHAR(100) NOT NULL,
    point_order INTEGER NOT NULL,
    longitude REAL NOT NULL,
    latitude REAL NOT NULL,
    altitude REAL NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(building_name, point_order)
);

-- Insert 4 tọa độ góc Bến Nhà Rồng
INSERT INTO building_coordinates (building_name, point_order, longitude, latitude, altitude, description)
VALUES 
    ('Ben Nha Rong', 0, 106.7069257, 10.768433, 3, 'Góc Đông Bắc'),
    ('Ben Nha Rong', 1, 106.70703, 10.768215, 3, 'Góc Đông Nam'),
    ('Ben Nha Rong', 2, 106.7067549, 10.76808798, 3, 'Góc Tây Nam'),
    ('Ben Nha Rong', 3, 106.7066515, 10.768303, 3, 'Góc Tây Bắc');

-- Index để query nhanh hơn
CREATE INDEX idx_building_coordinates ON building_coordinates(building_name, point_order);
