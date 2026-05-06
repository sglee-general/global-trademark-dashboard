import React, { useEffect, useState } from "react";
import { csv } from "d3-fetch";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";

const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTv9Nf_RdMQwHDRRk1L1PrL6LsBV1hfhjUsZ9MhIV1LPWLOAmmb8BwI-eIavV01nrJORaE0U5Tv4g_b/pub?gid=916788690&single=true&output=csv";

// 가장 표준적인 세계 지도 데이터 (ISO_A3 코드가 확실히 포함됨)
const geoUrl = "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson";

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
  const [debugInfo, setDebugInfo] = useState("데이터 로딩 중...");

  useEffect(() => {
    csv(SHEET_URL).then((rows) => {
      if (rows && rows.length > 0) {
        console.log("실제 감지된 컬럼명들:", Object.keys(rows[0]));
        setData(rows);
        setDebugInfo(`데이터 로드 성공! 총 ${rows.length}행 발견.`);
      } else {
        setDebugInfo("데이터를 가져왔으나 내용이 비어있습니다.");
      }
    }).catch(err => {
      setDebugInfo("데이터 로드 실패: " + err.message);
    });
  }, []);

  const brands = ["All", ...new Set(data.map((d) => d.Brand).filter(Boolean))];
  const filteredData = selectedBrand === "All" ? data : data.filter((d) => d.Brand === selectedBrand);

  return (
    <div style={{ fontFamily: "sans-serif", padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <h1 style={{ fontSize: "24px", color: "#2c3e50" }}>🌍 Global Trademark Dashboard</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <strong>Brand:</strong>
          <select 
            onChange={(e) => setSelectedBrand(e.target.value)} 
            style={{ padding: "8px", borderRadius: "8px", border: "1px solid #ddd" }}
          >
            {brands.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </header>
      
      {/* 상태 확인용 (나중에 지우셔도 됩니다) */}
      <div style={{ fontSize: "12px", color: "#999", marginBottom: "10px" }}>{debugInfo}</div>

      <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: "20px", overflow: "hidden", position: "relative", minHeight: "500px" }}>
        <ComposableMap projectionConfig={{ scale: 140 }}>
          <ZoomableGroup center={[20, 10]}>
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  // 지도 데이터에서 국가 코드 추출
                  const countryISO = (geo.properties.ISO_A3 || geo.properties.iso_a3 || "").trim().toUpperCase();
                  const countryName = geo.properties.ADMIN || geo.properties.name;

                  // 💡 핵심: 어떤 컬럼명이든 "ISO3"나 "CountryCode"가 포함된 것을 찾아 매칭
                  const info = filteredData.find((d) => {
                    // 모든 컬럼을 뒤져서 'KOR', 'USA' 같은 코드가 있는지 확인
                    return Object.entries(d).some(([key, value]) => {
                      const isTargetColumn = key.includes("ISO3") || key.includes("CountryCode");
                      return isTargetColumn && value && value.trim().toUpperCase() === countryISO;
                    });
                  });

                  // 상태(Status) 값도 대소문자 무관하게 매칭
                  let fillColor = colorMap.Grey;
                  if (info && info.Status) {
                    const statusKey = info.Status.trim();
                    fillColor = colorMap[statusKey] || colorMap.Grey;
                  }

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={() => {
                        if (info) {
                          setTooltip(`${countryName}: [${info.class || '류 미지정'}] ${info.Status} - ${info.Details || ''}`);
                        } else {
                          setTooltip(`${countryName}: 등록 데이터 없음`);
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
            background: "rgba(0,0,0,0.8)", color: "#fff", padding: "12px",
            borderRadius: "10px", fontSize: "14px", textAlign: "center", pointerEvents: "none", zIndex: 10
          }}>
            {tooltip}
          </div>
        )}
      </div>

      <div style={{ marginTop: "20px", display: "flex", gap: "20px", justifyContent: "center" }}>
        {Object.entries(colorMap).map(([label, color]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "14px", height: "14px", background: color, borderRadius: "3px" }}></div>
            <span style={{ fontSize: "13px", color: "#666" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
