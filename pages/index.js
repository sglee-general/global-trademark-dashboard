import React, { useEffect, useState } from "react";
import { csv } from "d3-fetch";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";

const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTv9Nf_RdMQwHDRRk1L1PrL6LsBV1hfhjUsZ9MhIV1LPWLOAmmb8BwI-eIavV01nrJORaE0U5Tv4g_b/pub?gid=916788690&single=true&output=csv";
const geoUrl = "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson";

const colorMap = { 
  Green: "#27ae60", Blue: "#3498db", Yellow: "#f1c40f", Red: "#e74c3c", Grey: "#dfe4ea" 
};

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [selectedInfo, setSelectedInfo] = useState(null);

  useEffect(() => {
    csv(SHEET_URL).then((rows) => {
      if (rows) {
        console.log("첫번째 행 데이터 샘플:", rows[0]); // 브라우저 콘솔에서 실제 데이터 확인용
        setData(rows);
      }
    });
  }, []);

  const brands = ["All", ...new Set(data.map(d => d.Brand).filter(Boolean))];
  const filteredData = selectedBrand === "All" ? data : data.filter(d => d.Brand === selectedBrand);

  return (
    <div style={{ minHeight: "100vh", background: "#f1f2f6", padding: "30px", fontFamily: "sans-serif" }}>
      
      <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
        <h1 style={{ fontSize: "24px", color: "#2f3542", fontWeight: "bold" }}>비나우 글로벌 상표권 현황</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <strong>브랜드 필터:</strong>
          <select onChange={(e) => setSelectedBrand(e.target.value)} style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #ccc" }}>
            {brands.map(b => <option key={b}>{b}</option>)}
          </select>
        </div>
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", background: "#fff", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.1)", position: "relative", overflow: "hidden" }}>
        <ComposableMap projectionConfig={{ scale: 145 }} style={{ width: "100%", height: "600px" }}>
          <ZoomableGroup maxZoom={5} minZoom={1} translateExtent={[[0, 0], [800, 600]]}>
            <Geographies geography={geoUrl}>
              {({ geographies }) => geographies.map((geo) => {
                // 1. 지도에서 국가 코드 가져오기 (예: "CHN", "USA")
                const countryISO = (geo.properties.ISO_A3 || geo.id || "").toString().toUpperCase().trim();
                
                // 2. 시트 데이터와 매칭 시도
                const info = filteredData.find(d => {
                  // 시트의 'CountryCode (ISO3)' 컬럼 값을 가져옴
                  const csvCode = (d["CountryCode (ISO3)"] || "").toString().toUpperCase().trim();
                  return csvCode === countryISO && csvCode !== "";
                });

                let fillColor = colorMap.Grey;
                if (info && info.Status) {
                    const statusVal = info.Status.trim();
                    // 대소문자 무관하게 색상 매칭 (green -> Green)
                    const statusKey = Object.keys(colorMap).find(k => k.toLowerCase() === statusVal.toLowerCase());
                    fillColor = colorMap[statusKey] || colorMap.Grey;
                }

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => {
                      const name = geo.properties.ADMIN || geo.properties.name;
                      setSelectedInfo(info ? { ...info, name } : { name, empty: true });
                    }}
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

        {selectedInfo && (
          <div style={{ position: "absolute", bottom: "30px", left: "50%", transform: "translateX(-50%)", width: "320px", background: "#fff", padding: "20px", borderRadius: "18px", boxShadow: "0 15px 40px rgba(0,0,0,0.2)", border: "1px solid #38bdf8", zIndex: 100 }}>
            <button onClick={() => setSelectedInfo(null)} style={{ position: "absolute", top: "12px", right: "12px", border: "none", background: "none", cursor: "pointer", fontSize: "16px", color: "#999" }}>✕</button>
            <h3 style={{ margin: "0 0 10px", borderBottom: "2px solid #38bdf8", paddingBottom: "5px" }}>{selectedInfo.name}</h3>
            {selectedInfo.empty ? (
              <p style={{ fontSize: "14px", color: "#777" }}>이 국가에는 등록된 데이터가 없습니다.</p>
            ) : (
              <div style={{ fontSize: "14px", lineHeight: "1.6" }}>
                <div><strong>브랜드:</strong> {selectedInfo.Brand}</div>
                <div><strong>상태:</strong> {selectedInfo.Status}</div>
                <div><strong>상품류:</strong> {selectedInfo.class}류</div>
                <div style={{ marginTop: "10px", padding: "10px", background: "#f8f9fa", borderRadius: "8px", fontSize: "13px", color: "#555", borderLeft: "4px solid #38bdf8" }}>
                  {selectedInfo.Details}
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
