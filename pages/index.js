import React, { useEffect, useState } from "react";
import { csv } from "d3-fetch";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";

// 구글 시트 CSV URL (사용자님 제공 주소)
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTv9Nf_RdMQwHDRRk1L1PrL6LsBV1hfhjUsZ9MhIV1LPWLOAmmb8BwI-eIavV01nrJORaE0U5Tv4g_b/pub?gid=916788690&single=true&output=csv";

// 1. 더 안정적인 세계 지도 데이터 주소로 교체했습니다.
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const colorMap = {
  Green: "#2ecc71",
  Blue: "#3498db",
  Yellow: "#f1c40f",
  Red: "#e74c3c",
  Grey: "#dcdde1"
};

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [tooltip, setTooltip] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 데이터 로딩 및 에러 처리 추가
    csv(SHEET_URL)
      .then((rows) => {
        console.log("CSV Data Loaded:", rows);
        setData(rows);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Data Load Error:", err);
        setLoading(false);
      });
  }, []);

  const brands = ["All", ...new Set(data.map((d) => d.Brand).filter(Boolean))];
  const filteredData = selectedBrand === "All" ? data : data.filter((d) => d.Brand === selectedBrand);

  if (loading) return <div style={{ padding: "50px", textAlign: "center" }}>데이터를 불러오는 중입니다...</div>;

  return (
    <div style={{ fontFamily: "sans-serif", padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ color: "#2c3e50", fontSize: "24px" }}>🌍 Global Trademark Dashboard</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "14px", fontWeight: "bold" }}>브랜드 선택:</span>
          <select 
            onChange={(e) => setSelectedBrand(e.target.value)} 
            style={{ padding: "8px", borderRadius: "8px", border: "1px solid #ddd", cursor: "pointer" }}
          >
            {brands.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: "20px", overflow: "hidden", position: "relative", minHeight: "500px" }}>
        <ComposableMap projectionConfig={{ scale: 140 }}>
          <ZoomableGroup center={[20, 10]}>
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  // world-atlas 라이브러리는 국가 이름을 geo.properties.name에 담고 있습니다.
                  const countryName = geo.properties.name;
                  
                  // 시트의 'Country' 컬럼과 지도의 국가 이름을 매칭합니다. (가장 확실한 방법)
                  const info = filteredData.find((d) => 
                    d.Country && d.Country.trim().toLowerCase() === countryName.toLowerCase()
                  );

                  const status = info ? info.Status.trim() : "Grey";
                  const fillColor = colorMap[status] || colorMap.Grey;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={() => {
                        if (info) {
                          setTooltip(`${countryName}: [${info.class}] ${info.Status} (${info.Details})`);
                        } else {
                          setTooltip(`${countryName}: 정보 없음`);
                        }
                      }}
                      onMouseLeave={() => setTooltip("")}
                      style={{
                        default: { fill: fillColor, outline: "none", stroke: "#fff", strokeWidth: 0.5 },
                        hover: { fill: "#95a5a6", cursor: "pointer", outline: "none" },
                        pressed: { fill: "#7f8c8d", outline: "none" }
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
        
        {tooltip && (
          <div style={{
            position: "absolute", bottom: "20px", left: "20px", right: "20px",
            background: "rgba(0,0,0,0.8)", color: "#fff", padding: "10px 20px",
            borderRadius: "10px", fontSize: "14px", textAlign: "center", pointerEvents: "none"
          }}>
            {tooltip}
          </div>
        )}
      </div>
      
      <div style={{ marginTop: "20px", display: "flex", gap: "20px", justifyContent: "center", flexWrap: "wrap" }}>
        {Object.entries(colorMap).map(([label, color]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "14px", height: "14px", background: color, borderRadius: "3px" }}></div>
            <span style={{ fontSize: "13px", color: "#555" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
