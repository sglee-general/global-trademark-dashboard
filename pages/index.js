import React, { useEffect, useState } from "react";
import { csv } from "d3-fetch";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";

// 1. 사용자님의 구글 시트 CSV URL
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTv9Nf_RdMQwHDRRk1L1PrL6LsBV1hfhjUsZ9MhIV1LPWLOAmmb8BwI-eIavV01nrJORaE0U5Tv4g_b/pub?gid=916788690&single=true&output=csv";

// 2. ISO_A3(KOR, USA...) 코드가 확실히 들어있는 지도 데이터로 교체
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

  useEffect(() => {
    csv(SHEET_URL).then((rows) => {
      console.log("시트 데이터 로드 성공:", rows[0]); // 브라우저 콘솔에서 확인 가능
      setData(rows);
    });
  }, []);

  const brands = ["All", ...new Set(data.map((d) => d.Brand).filter(Boolean))];
  const filteredData = selectedBrand === "All" ? data : data.filter((d) => d.Brand === selectedBrand);

  return (
    <div style={{ fontFamily: "sans-serif", padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
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

      <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: "20px", overflow: "hidden", position: "relative", minHeight: "500px" }}>
        <ComposableMap projectionConfig={{ scale: 140 }}>
          <ZoomableGroup center={[20, 10]}>
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  // 지도 데이터의 ISO 3자리 코드 (ISO_A3) 추출
                  const countryISO = geo.properties.ISO_A3 || geo.properties.iso_a3;
                  const countryName = geo.properties.ADMIN || geo.properties.name;

                  // 시트의 'CountryCode (ISO3)' 컬럼과 지도의 코드를 매칭
                  const info = filteredData.find((d) => 
                    d["CountryCode (ISO3)"] && d["CountryCode (ISO3)"].trim().toUpperCase() === countryISO
                  );

                  const status = info ? info.Status.trim() : "Grey";
                  const fillColor = colorMap[status] || colorMap.Grey;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={() => {
                        if (info) {
                          setTooltip(`${countryName}: [${info.class}류] ${info.Status} (${info.Details})`);
                        } else {
                          setTooltip(`${countryName}: 데이터 없음`);
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
            borderRadius: "10px", fontSize: "14px", textAlign: "center", pointerEvents: "none"
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
