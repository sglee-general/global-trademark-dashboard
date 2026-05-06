import React, { useEffect, useState } from "react";
import { csv } from "d3-fetch";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";

// 스프레드시트 CSV URL
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTv9Nf_RdMQwHDRRk1L1PrL6LsBV1hfhjUsZ9MhIV1LPWLOAmmb8BwI-eIavV01nrJORaE0U5Tv4g_b/pub?gid=916788690&single=true&output=csv";
const geoUrl = "https://raw.githubusercontent.com/lotusms/world-map-data/main/world-110m.json";

const colorMap = {
  Green: "#2ecc71", Blue: "#3498db", Yellow: "#f1c40f", Red: "#e74c3c", Grey: "#dcdde1"
};

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [tooltip, setTooltip] = useState("");

  useEffect(() => {
    csv(SHEET_URL).then((rows) => {
      console.log("Data Loaded:", rows[0]); // 데이터가 잘 오는지 브라우저 콘솔에서 확인용
      setData(rows);
    });
  }, []);

  const brands = ["All", ...new Set(data.map(d => d.Brand))];
  const filteredData = selectedBrand === "All" ? data : data.filter(d => d.Brand === selectedBrand);

  return (
    <div style={{ fontFamily: "sans-serif", padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ color: "#2c3e50" }}>🌍 Global Trademark Dashboard</h1>
        <select onChange={(e) => setSelectedBrand(e.target.value)} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }}>
          {brands.map(b => b && <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: "20px", overflow: "hidden", position: "relative" }}>
        <ComposableMap projectionConfig={{ scale: 160 }}>
          <ZoomableGroup>
            <Geographies geography={geoUrl}>
              {({ geographies }) => geographies.map((geo) => {
                // 지도 데이터에 따라 ISO_A3가 대문자인지 소문자인지 다를 수 있습니다.
                const countryISO = geo.properties.ISO_A3 || geo.properties.iso_a3 || geo.id;
                const { NAME } = geo.properties;
                
                // 실제 시트의 컬럼명인 'CountryCode (ISO3)'로 데이터를 찾습니다.
                const info = filteredData.find(d => 
                  d['CountryCode (ISO3)'] && d['CountryCode (ISO3)'].trim() === countryISO
                );

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={() => info && setTooltip(`${NAME}: [${info.class}] ${info.Status} (${info.Details})`)}
                    onMouseLeave={() => setTooltip("")}
                    style={{
                      default: { 
                        fill: info ? (colorMap[info.Status.trim()] || colorMap.Grey) : colorMap.Grey, 
                        outline: "none", stroke: "#fff", strokeWidth: 0.5 
                      },
                      hover: { fill: "#95a5a6", cursor: "pointer", outline: "none" }
                    }}
                  />
                );
              })}
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
        {tooltip && <div style={{ position: "absolute", bottom: "20px", left: "20px", background: "rgba(0,0,0,0.8)", color: "#fff", padding: "10px 20px", borderRadius: "30px", fontSize: "14px", pointerEvents: "none" }}>{tooltip}</div>}
      </div>
      
      <div style={{ marginTop: "20px", display: "flex", gap: "20px", justifyContent: "center" }}>
        {Object.entries(colorMap).map(([label, color]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "12px", height: "12px", background: color, borderRadius: "2px" }}></div>
            <span style={{ fontSize: "13px", color: "#666" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
