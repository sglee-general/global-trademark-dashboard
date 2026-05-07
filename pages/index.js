import React, { useEffect, useState } from "react";
import { csv } from "d3-fetch";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";

const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTv9Nf_RdMQwHDRRk1L1PrL6LsBV1hfhjUsZ9MhIV1LPWLOAmmb8BwI-eIavV01nrJORaE0U5Tv4g_b/pub?output=csv";
const geoUrl = "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson";

const colorMap = { Green: "#27ae60", Blue: "#3498db", Yellow: "#f1c40f", Red: "#e74c3c", Grey: "#dfe4ea" };

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [selectedInfo, setSelectedInfo] = useState(null);
  const [detectedColumns, setDetectedColumns] = useState([]); // 진단용

  useEffect(() => {
    csv(SHEET_URL).then((rows) => {
      if (rows && rows.length > 0) {
        setData(rows);
        setDetectedColumns(Object.keys(rows[0])); // 첫 줄의 컬럼명들 추출
      }
    });
  }, []);

  const brands = ["All", ...new Set(data.map(d => d.Brand || d.brand).filter(Boolean))];
  const filteredData = selectedBrand === "All" ? data : data.filter(d => (d.Brand || d.brand) === selectedBrand);

  return (
    <div style={{ minHeight: "100vh", background: "#f1f2f6", padding: "30px", fontFamily: "sans-serif" }}>
      
      <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
        <h1 style={{ fontSize: "24px", color: "#2f3542", fontWeight: "bold" }}>비나우 글로벌 상표권 현황</h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <select onChange={(e) => setSelectedBrand(e.target.value)} style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #ccc" }}>
            {brands.map(b => <option key={b}>{b}</option>)}
          </select>
        </div>
      </div>

      {/* 🛠️ 데이터 진단 바 (매칭이 안 될 때 확인용, 해결 후 삭제 가능) */}
      <div style={{ maxWidth: "1100px", margin: "0 auto 10px", fontSize: "11px", color: "#888", background: "#eee", padding: "5px 15px", borderRadius: "5px" }}>
        검출된 시트 항목명: {detectedColumns.join(", ")}
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", background: "#fff", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.1)", position: "relative", overflow: "hidden" }}>
        <ComposableMap projectionConfig={{ scale: 145 }} style={{ width: "100%", height: "600px" }}>
          <ZoomableGroup maxZoom={5} minZoom={1} translateExtent={[[0, 0], [800, 600]]}>
            <Geographies geography={geoUrl}>
              {({ geographies }) => geographies.map((geo) => {
                // 지도에서 국가 코드 추출 (ISO_A3 형식이 가장 표준)
                const countryISO = (geo.properties.ISO_A3 || geo.properties.iso_a3 || geo.id || "").toString().toUpperCase().trim();
                
                // 💡 매칭 로직 강화: 모든 컬럼을 뒤져서 'ISO3'나 'CODE'가 포함된 열의 값이 지도 코드와 같은지 확인
                const info = filteredData.find(d => {
                  return Object.entries(d).some(([key, value]) => {
                    const k = key.toUpperCase();
                    const isCodeCol = k.includes("ISO3") || k.includes("CODE");
                    return isCodeCol && value && value.toString().toUpperCase().trim() === countryISO;
                  });
                });

                let fillColor = colorMap.Grey;
                if (info) {
                    // Status 컬럼도 유연하게 찾음
                    const statusKey = Object.keys(info).find(k => k.toUpperCase().includes("STATUS"));
                    const statusVal = info[statusKey]?.trim();
                    fillColor = colorMap[statusVal] || colorMap.Grey;
                }

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => setSelectedInfo(info ? { ...info, name: geo.properties.ADMIN || geo.properties.name } : { name: geo.properties.ADMIN || geo.properties.name, empty: true })}
                    style={{
                      default: { fill: fillColor, outline: "none", stroke: "#fff", strokeWidth: 0.5 },
                      hover: { fill: "#adb5bd", cursor: "pointer", outline: "none" },
                      pressed: { fill: "#6c757d", outline: "none" }
                    }}
                  />
                );
              })}
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>

        {/* 클릭 상세 정보 모달 */}
        {selectedInfo && (
          <div style={{ position: "absolute", bottom: "30px", left: "50%", transform: "translateX(-50%)", width: "320px", background: "#fff", padding: "20px", borderRadius: "18px", boxShadow: "0 15px 40px rgba(0,0,0,0.2)", border: "1px solid #38bdf8", zIndex: 100 }}>
            <button onClick={() => setSelectedInfo(null)} style={{ position: "absolute", top: "12px", right: "12px", border: "none", background: "none", cursor: "pointer", fontSize: "16px", color: "#999" }}>✕</button>
            <h3 style={{ margin: "0 0 10px", borderBottom: "2px solid #38bdf8", paddingBottom: "5px" }}>{selectedInfo.name}</h3>
            {selectedInfo.empty ? (
              <p style={{ fontSize: "14px", color: "#777" }}>이 국가에는 등록된 데이터가 없습니다.</p>
            ) : (
              <div style={{ fontSize: "14px", lineHeight: "1.6" }}>
                <div><strong>브랜드:</strong> {selectedInfo.Brand || selectedInfo.brand}</div>
                <div><strong>상태:</strong> {selectedInfo.Status || selectedInfo.status}</div>
                <div><strong>상품류:</strong> {selectedInfo.class || selectedInfo.CLASS}류</div>
                <div style={{ marginTop: "10px", padding: "10px", background: "#f8f9fa", borderRadius: "8px", fontSize: "13px", color: "#555", borderLeft: "4px solid #38bdf8" }}>
                  {selectedInfo.Details || selectedInfo.details}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ marginTop: "20px", display: "flex", gap: "25px", justifyContent: "center" }}>
        {Object.entries(colorMap).map(([label, color]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "14px", height: "14px", background: color, borderRadius: "4px" }}></div>
            <span style={{ fontSize: "13px", color: "#555" }}>{label === "Grey" ? "미출원/정보없음" : label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
