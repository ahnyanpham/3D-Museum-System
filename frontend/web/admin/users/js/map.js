const MapManager = {
    view: null,
    layer: null,

    async init() {
        console.log('3D Map Manager initialized - Using iframe (map.js disabled)');
        // ❌ DISABLED: Tránh load map 2 lần vì index.html trong iframe đã load rồi
        // this.initMap3D();
    },

    // ❌ DISABLED: Comment toàn bộ initMap3D để tránh duplicate loading
    /*
    initMap3D() {
        require([
            "esri/Map",
            "esri/views/SceneView",
            "esri/layers/GraphicsLayer",
            "esri/Graphic",
            "esri/geometry/Polygon",
            "esri/geometry/Point",
            "esri/symbols/PolygonSymbol3D",
            "esri/symbols/ExtrudeSymbol3DLayer",
            "esri/symbols/PointSymbol3D",
            "esri/symbols/ObjectSymbol3DLayer",
            "esri/widgets/Search",
            "esri/geometry/geometryEngine",
            "esri/geometry/Polyline"
        ], (Map, SceneView, GraphicsLayer, Graphic, Polygon, Point,
            PolygonSymbol3D, ExtrudeSymbol3DLayer, PointSymbol3D, ObjectSymbol3DLayer,
            Search, geometryEngine, Polyline) => {

            this.layer = new GraphicsLayer();
            const mainColor = '#fbc2aa';

            const map = new Map({
                basemap: "satellite",
                ground: "world-elevation",
                layers: [this.layer]
            });

            this.view = new SceneView({
                container: "map",
                map: map,
                camera: {
                    position: {
                        x: 106.70701,
                        y: 10.76826,
                        z: 80
                    },
                    tilt: 65,
                    heading: 20
                }
            });

            // Add search widget
            const searchWidget = new Search({
                view: this.view,
                popupEnabled: false
            });
            this.view.ui.add(searchWidget, { position: "top-right" });

            // Add navigation buttons
            this.addNavigationButtons();

            this.view.when(() => {
                // Vẽ toàn bộ Bến Nhà Rồng 3D
                this.drawCompleteBuilding(mainColor);

                // Thêm markers 4 khu vực
                this.addLocationMarkers();
            });
        });
    },

    addNavigationButtons() {
        // Tạo control panel
        const panel = document.createElement('div');
        panel.style.cssText = `
            position: absolute;
            bottom: 30px;
            right: 15px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            z-index: 10;
        `;

        const buttons = [
            { text: '🎯 Tổng quan', action: () => this.flyToOverview() },
            { text: '🏛️ Bảo tàng', action: () => this.flyToMuseum() },
            { text: '🌳 Công viên', action: () => this.flyToPark() },
            { text: '🗿 Tượng đài', action: () => this.flyToStatue() },
            { text: '🛍️ Souvenir', action: () => this.flyToShop() }
        ];

        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.textContent = btn.text;
            button.style.cssText = `
                padding: 10px 15px;
                background: white;
                border: 2px solid #667eea;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                transition: all 0.3s;
            `;
            button.addEventListener('mouseenter', () => {
                button.style.background = '#667eea';
                button.style.color = 'white';
                button.style.transform = 'scale(1.05)';
            });
            button.addEventListener('mouseleave', () => {
                button.style.background = 'white';
                button.style.color = 'black';
                button.style.transform = 'scale(1)';
            });
            button.addEventListener('click', btn.action);
            panel.appendChild(button);
        });

        this.view.ui.add(panel, 'manual');
    },

    flyToOverview() {
        this.view.goTo({
            target: { x: 106.70701, y: 10.76826, z: 0 },
            zoom: 17,
            tilt: 65,
            heading: 20
        }, { duration: 2000 });
    },

    flyToMuseum() {
        this.view.goTo({
            target: { x: 106.7068328, y: 10.7682339, z: 15 },
            zoom: 18,
            tilt: 70,
            heading: 0
        }, { duration: 2000 });
    },

    flyToPark() {
        this.view.goTo({
            target: { x: 106.7062075, y: 10.7683534, z: 5 },
            zoom: 18,
            tilt: 60
        }, { duration: 2000 });
    },

    flyToStatue() {
        this.view.goTo({
            target: { x: 106.706688, y: 10.7684965, z: 10 },
            zoom: 19,
            tilt: 70
        }, { duration: 2000 });
    },

    flyToShop() {
        this.view.goTo({
            target: { x: 106.7060141, y: 10.7681563, z: 5 },
            zoom: 19,
            tilt: 60
        }, { duration: 2000 });
    },

    addLocationMarkers() {
        const locations = [
            {
                name: 'Bến Nhà Rồng - Bảo Tàng Hồ Chí Minh',
                x: 106.7068328,
                y: 10.7682339,
                z: 20,
                color: '#667eea',
                size: 8
            },
            {
                name: 'Công Viên Bến Nhà Rồng',
                x: 106.7062075,
                y: 10.7683534,
                z: 10,
                color: '#43e97b',
                size: 6
            },
            {
                name: 'Tượng Nguyễn Tất Thành',
                x: 106.706688,
                y: 10.7684965,
                z: 15,
                color: '#f093fb',
                size: 7
            },
            {
                name: 'Á Đông Souvenir',
                x: 106.7060141,
                y: 10.7681563,
                z: 8,
                color: '#4facfe',
                size: 5
            }
        ];

        require(["esri/Graphic", "esri/geometry/Point"], (Graphic, Point) => {
            locations.forEach(loc => {
                const point = new Point({
                    x: loc.x,
                    y: loc.y,
                    z: loc.z,
                    spatialReference: { wkid: 4326 }
                });

                const graphic = new Graphic({
                    geometry: point,
                    symbol: {
                        type: "point-3d",
                        symbolLayers: [{
                            type: "object",
                            resource: { primitive: "sphere" },
                            width: loc.size,
                            height: loc.size,
                            depth: loc.size,
                            material: { color: loc.color }
                        }]
                    },
                    attributes: { name: loc.name },
                    popupTemplate: {
                        title: loc.name,
                        content: `<b>Địa điểm:</b> ${loc.name}<br><b>Tọa độ:</b> ${loc.x.toFixed(5)}, ${loc.y.toFixed(5)}`
                    }
                });

                this.layer.add(graphic);
            });
        });
    },

    drawCompleteBuilding(mainColor) {
        // TẦNG 1
        const floor1Z = 2;
        const floor1Height = 1.5;
        const colHeight1 = 5;

        const floor1Points = [
            [106.7069257, 10.768433, floor1Z],
            [106.70703, 10.768215, floor1Z],
            [106.7067549, 10.76808798, floor1Z],
            [106.7066515, 10.768303, floor1Z],
            [106.7069257, 10.768433, floor1Z]
        ];

        this.drawFloor(floor1Points, floor1Height, mainColor, colHeight1);

        // TẦNG 2
        const floor2Z = floor1Z + floor1Height + colHeight1;
        const floor2Points = floor1Points.map(p => [p[0], p[1], floor2Z]);
        this.drawFloor(floor2Points, 0.375, mainColor, 5);

        // TẦNG 3
        const floor3Z = floor2Z + 0.375 + 5;
        const floor3Points = floor1Points.map(p => [p[0], p[1], floor3Z]);
        this.drawFloor(floor3Points, 0.375, mainColor, 5);
    },

    drawFloor(points, height, color, colHeight) {
        require(["esri/Graphic", "esri/geometry/Polygon", "esri/symbols/PolygonSymbol3D",
                 "esri/symbols/ExtrudeSymbol3DLayer"],
            (Graphic, Polygon, PolygonSymbol3D, ExtrudeSymbol3DLayer) => {

            const polygon = new Polygon({
                rings: [points],
                spatialReference: { wkid: 4326 }
            });

            const graphic = new Graphic({
                geometry: polygon,
                symbol: new PolygonSymbol3D({
                    symbolLayers: [
                        new ExtrudeSymbol3DLayer({
                            size: height,
                            material: { color: color },
                            edges: {
                                type: "solid",
                                color: [80, 80, 80, 0.8],
                                size: 1
                            }
                        })
                    ]
                })
            });

            this.layer.add(graphic);

            // Vẽ cột (đơn giản hóa)
            this.drawColumns(points, height, colHeight, color);
        });
    },

    drawColumns(floorPoints, floorHeight, colHeight, color) {
        // Vẽ 4 cột góc đơn giản
        const corners = [0, 1, 2, 3];

        require(["esri/Graphic", "esri/geometry/Point"], (Graphic, Point) => {
            corners.forEach(i => {
                const p = floorPoints[i];
                const point = new Point({
                    x: p[0],
                    y: p[1],
                    z: p[2] + floorHeight,
                    spatialReference: { wkid: 4326 }
                });

                const graphic = new Graphic({
                    geometry: point,
                    symbol: {
                        type: "point-3d",
                        symbolLayers: [{
                            type: "object",
                            resource: { primitive: "cylinder" },
                            width: 0.5,
                            height: colHeight,
                            depth: 0.5,
                            material: { color: color }
                        }]
                    }
                });

                this.layer.add(graphic);
            });
        });
    }
    */
};

console.log('3D Map module loaded - iframe mode (duplicate loading disabled)');
