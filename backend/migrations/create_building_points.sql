-- Drop bảng cũ nếu có
DROP TABLE IF EXISTS building_coordinates;

-- Tạo bảng mới theo structure yêu cầu
CREATE TABLE IF NOT EXISTS building_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    longitude REAL NOT NULL,
    latitude REAL NOT NULL,
    z REAL NOT NULL,
    "order" INTEGER NOT NULL,
    contruction_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(contruction_id, "order")
);

-- Insert 4 tọa độ tầng 1 (contruction_id = 1)
INSERT INTO building_points (longitude, latitude, z, "order", contruction_id)
VALUES 
    (106.7069257, 10.768433, 3, 1, 1),
    (106.70703, 10.768215, 3, 2, 1),
    (106.7067549, 10.76808798, 3, 3, 1),
    (106.7066515, 10.768303, 3, 4, 1);

-- Index để query nhanh
CREATE INDEX idx_building_points ON building_points(contruction_id, "order");
