import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import Papa from 'papaparse';
import { Tooltip } from 'react-tooltip';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTv9Nf_RdMQwHDRRk1L1PrL6LsBV1hfhjUsZ9MhIV1LPWLOAmmb8BwI-eIavV01nrJORaE0U5Tv4g_b/pub?output=csv";

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [tooltipContent, setTooltipContent] = useState(null);

  useEffect(() => {
    Papa.parse(CSV_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rawData = results.data;
        setData(rawData);
        
        const uniqueBrands = [...new Set(rawData.map(item => item.BRAND))].filter(Boolean);
        setBrands(uniqueBrands);
        if (uniqueBrands.length > 0) setSelectedBrand(uniqueBrands[0]);
      },
    });
  }, []);

  // 1. STATUS(색상명)를 실제 색상 코드로 변환하는 함수
  const getColor = (statusColor) => {
    if (!statusColor) return '#E0E0E0'; // 정보 없음 (회색)
    
    const color = statusColor.toLowerCase().trim();
    switch (color) {
      case 'green': return '#4CAF50';  // 등록 (초록)
      case 'blue': return '#2196F3';   // 출원 (파란)
      case 'red': return '#F44336';    // 거절/분쟁 (빨간)
      case 'yellow': return '#FFEB3B'; // 이의신청 (노란)
      default: return '#E0E0E0';       // 기본값 (회색)
    }
  };

  return (
    <div style={{ fontFamily: "'Pretendard', 'Malgun Gothic', sans-serif", padding: '20px', backgroundColor: '#fff' }}>
      <Head>
        <title>비나우 글로벌 상표권 현황</title>
      </Head>

      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#222', fontSize: '2rem', fontWeight: '800' }}>비나우 글로벌 상표권 등록 현황</h1>
        
        <div style={{ marginTop: '20px' }}>
          <label htmlFor="brand-select" style={{ marginRight: '10px', fontWeight: '600' }}>조회할 브랜드 선택: </label>
          <select 
            id="brand-select"
            value={selectedBrand} 
            onChange={(e) => setSelectedBrand(e.target.value)}
            style={{ 
              padding: '10px 20px', 
              borderRadius: '8px', 
              border: '2px solid #333',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            {brands.map(brand => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
        </div>
      </header>

      <main style={{ 
        border: '1px solid #eee', 
        borderRadius: '15px', 
        overflow: 'hidden', 
        background: '#fcfcfc', 
        boxShadow: '0 4px 15px rgba(0,0,0,0.05)' 
      }}>
        <ComposableMap projectionConfig={{ rotate: [-10, 0, 0], scale: 140 }}>
          <ZoomableGroup 
            filterZoomEvent={(evt) => {
              if (evt.type === 'wheel') return evt.ctrlKey;
              return true;
            }}
          >
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  // 현재 선택된 브랜드와 국가 코드(ISO_A3 등)가 매칭되는 행 찾기
                  const countryData = data.find(
                    (d) => d.BRAND === selectedBrand && (d.CODE === geo.id || d.CODE === geo.properties.ISO_A3)
                  );

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={() => {
                        if (countryData) {
                          setTooltipContent({
                            name: geo.properties.name,
                            brand: countryData.BRAND,
                            class: countryData.CLASS,
                            details: countryData.DETAILS,
                            status: countryData.STATUS
                          });
                        } else {
                          setTooltipContent({ name: geo.properties.name, status: '정보 없음' });
                        }
                      }}
                      onMouseLeave={() => setTooltipContent(null)}
                      style={{
                        default: {
                          fill: getColor(countryData?.STATUS),
                          outline: "none",
                          stroke: "#fff",
                          strokeWidth: 0.5
                        },
                        hover: {
                          fill: "#B0BEC5",
                          outline: "none",
                          cursor: "pointer"
                        },
                        pressed: {
                          fill: "#78909C",
                          outline: "none"
                        }
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
        
        {/* 툴팁 구현 */}
        {tooltipContent && (
          <Tooltip 
            anchorSelect="svg" 
            content="" 
            style={{ backgroundColor: "rgba(255, 255, 255, 0.95)", color: "#333", borderRadius: '8px', padding: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', zIndex: 1000, border: '1px solid #ddd' }}
          >
            <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
              <strong style={{ fontSize: '16px', color: '#000' }}>📍 {tooltipContent.name}</strong><br/>
              <hr style={{ margin: '8px 0', border: '0.5px solid #eee' }} />
              {tooltipContent.brand ? (
                <>
                  <b>브랜드:</b> {tooltipContent.brand}<br/>
                  <b>CLASS:</b> {tooltipContent.class || '-'}<br/>
                  <b>상세내용:</b> {tooltipContent.details || '-'}<br/>
                  <b>현재상태:</b> {tooltipContent.status}
                </>
              ) : (
                <span>진행 정보가 없습니다.</span>
              )}
            </div>
          </Tooltip>
        )}
      </main>

      <footer style={{ marginTop: '30px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', gap: '20px', padding: '15px 30px', background: '#f5f5f5', borderRadius: '50px', fontSize: '0.9rem' }}>
          <span><span style={{ color: '#4CAF50' }}>●</span> Green (등록)</span>
          <span><span style={{ color: '#2196F3' }}>●</span> Blue (출원 중)</span>
          <span><span style={{ color: '#FFEB3B' }}>●</span> Yellow (이의신청)</span>
          <span><span style={{ color: '#F44336' }}>●</span> Red (거절/분쟁)</span>
          <span><span style={{ color: '#E0E0E0' }}>●</span> Grey (미진행)</span>
        </div>
        <p style={{ marginTop: '15px', color: '#888', fontSize: '0.8rem' }}>* Ctrl + 마우스 휠을 사용하여 지도를 확대/축소할 수 있습니다.</p>
      </footer>
    </div>
  );
}
