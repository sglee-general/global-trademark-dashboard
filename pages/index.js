import React, { useEffect, useState } from "react";
import { csv } from "d3-fetch";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";

// 1. 데이터 소스 (사용자님의 구글 시트 CSV)
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTv9Nf_RdMQwHDRRk1L1PrL6LsBV1hfhjUsZ9MhIV1LPWLOAmmb8BwI-eIavV01nrJORaE0U5Tv4g_b/pub?gid=916788690&single=true&output=csv";
const geoUrl = "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson";

// 2. 상태별 색상 (비나우 브랜드 가이드에 맞춘 깔끔한 톤)
const colorMap = {
  Green: "#27ae60",  // 등록 완료
  Blue: "#3498db",   // 출원 중
  Yellow: "#f1c40f", // 이의신청/거절이유
  Red: "#e74c3c",    // 거절/분쟁
  Grey: "#dfe4ea"    // 미출원/정보없음
};

export default function BenowDashboard() {
  const [data, setData] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [selectedInfo, setSelectedInfo] = useState(null); // 클릭한 국가 정보

  useEffect(() => {
    csv(SHEET_URL).then((rows) => {
      setData(rows);
    });
  }, []);

  const brands = ["All", ...new Set(data.map((d) => d.Brand).filter(Boolean))];
  const filteredData = selectedBrand === "All" ? data : data.filter((d) => d.Brand === selectedBrand);

  return (
    <div style={{ minHeight: "100vh", background: "#f1f2f6", padding: "30px", fontFamily: "'Pretendard', sans-serif" }}>
      
      {/* 상단 헤더 영역 */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ fontSize: "26px", color: "#2f3542", fontWeight: "bold", margin: 0 }}>
          비나우 글로벌 상표권 현황
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#fff", padding: "8px 15px", borderRadius: "12px", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
          <span style={{ fontSize: "14px", fontWeight: "bold", color: "#57606f" }}>브랜드 필터</span>
          <select 
            onChange={(e) => setSelectedBrand(e.target.value)} 
            style={{ border: "none", outline: "none", fontSize: "14px", cursor: "pointer", fontWeight: "500" }}
          >
            {brands.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

      {/* 지도 영역 */}
      <div style={{ 
        maxWidth: "1100px", margin: "0 auto", background: "#fff", borderRadius: "24px", 
        boxShadow: "0 10px 30px rgba(0,0,0,0.1)", position: "relative", overflow: "hidden", border: "1px solid #eee"
      }}>
        <ComposableMap 
          projectionConfig={{ scale: 145 }} 
          style={{ width: "100%", height: "600px" }}
        >
          {/* ZoomableGroup에서 무분별한 휠 확대를 방지하고 드래그를 최적화함 */}
          <ZoomableGroup 
            maxZoom={5} 
            minZoom={1}
            translateExtent={[[0, 0], [800, 600]]} // 지도 이탈 방지
          >
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const countryISO = (geo.properties.ISO_A3 || geo.properties.iso_a3 || "").toUpperCase();
                  const countryName = geo.properties.ADMIN || geo.properties.name;

                  // 데이터 매칭
                  const info = filteredData.find((d) => 
                    d["CountryCode (ISO3)"] && d["CountryCode (ISO3)"].trim().toUpperCase() === countryISO
                  );

                  const status = info ? info.Status.trim() : "Grey";
                  const fillColor = colorMap[status] || colorMap.Grey;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onClick={() => {
                        // 클릭 시 모달 데이터 세팅
                        setSelectedInfo(info ? { ...info, countryName } : { countryName, Status: "정보 없음", empty: true });
                      }}
                      style={{
                        default: { fill: fillColor, outline: "none", stroke: "#fff", strokeWidth: 0.5 },
                        hover: { fill: "#ced4da", cursor: "pointer", outline: "none" },
                        pressed: { fill: "#adb5bd", outline: "none" }
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>

        {/* 클릭 시 상세 정보 모달 (화면 중앙 하단 배정) */}
        {selectedInfo && (
          <div style={{
            position: "absolute", bottom: "30px", left: "50%", transform: "translateX(-50%)",
            width: "320px", background: "#fff", padding: "20px", borderRadius: "18px",
            boxShadow: "0 15px 40px rgba(0,0,0,0.2)", border: "1px solid #38bdf8", zIndex: 100
          }}>
            <button 
              onClick={() => setSelectedInfo(null)}
              style={{ position: "absolute", top: "12px", right: "12px", border: "none", background: "none", cursor: "pointer", fontSize: "16px", color: "#999" }}
            >
              ✕
            </button>
            <h3 style={{ margin: "0 0 12px", color: "#2f3542", borderBottom: "2px solid #38bdf8", paddingBottom: "5px", display: "inline-block" }}>
              {selectedInfo.countryName}
            </h3>
            {selectedInfo.empty ? (
              <p style={{ fontSize: "14px", color: "#747d8c", margin: "10px 0" }}>상표권 등록 데이터가 없습니다.</p>
            ) : (
              <div style={{ fontSize: "14px", color: "#2f3542", lineHeight: "1.8" }}>
                <div><strong>브랜드:</strong> {selectedInfo.Brand}</div>
                <div><strong>현재 상태:</strong> <span style={{ color: colorMap[selectedInfo.Status.trim()], fontWeight: "bold" }}>{selectedInfo.Status}</span></div>
                <div><strong>상품류:</strong> {selectedInfo.class}류 ({selectedInfo.TYPE})</div>
                <div style={{ 
                  marginTop: "10px", padding: "10px", background: "#f1f2f6", borderRadius: "8px", 
                  fontSize: "13px", color: "#57606f", borderLeft: "4px solid #38bdf8" 
                }}>
                  {selectedInfo.Details}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 하단 범례 */}
      <div style={{ marginTop: "30px", display: "flex", gap: "25px", justifyContent: "center" }}>
        {Object.entries(colorMap).map(([label, color]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "14px", height: "14px", background: color, borderRadius: "4px" }}></div>
            <span style={{ fontSize: "13px", color: "#57606f", fontWeight: "500" }}>
              {label === "Grey" ? "미출원/정보없음" : label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
