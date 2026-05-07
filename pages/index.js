import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import Papa from 'papaparse';
import { Tooltip } from 'react-tooltip';

// 세계 지도 TopoJSON 데이터 URL
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// 구글 시트 CSV URL
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTv9Nf_RdMQwHDRRk1L1PrL6LsBV1hfhjUsZ9MhIV1LPWLOAmmb8BwI-eIavV01nrJORaE0U5Tv4g_b/pub?output=csv";

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [tooltipContent, setTooltipContent] = useState('');

  // 1. 데이터 불러오기
  useEffect(() => {
    Papa.parse(CSV_URL, {
      download: true,
      header: true,
      complete: (results) => {
        const rawData = results.data;
        setData(rawData);
        
        // 중복 제거된 브랜드 목록 생성
        const uniqueBrands = [...new Set(rawData.map(item => item.BRAND))].filter(Boolean);
        setBrands(uniqueBrands);
        if (uniqueBrands.length > 0) setSelectedBrand(uniqueBrands[0]);
      },
    });
  }, []);

  // 2. 상태별 색상 매핑 함수
  const getColor = (status) => {
    switch (status) {
      case '등록': return '#4CAF50'; // 초록색
      case '출원': return '#2196F3'; // 파란색
      case '거절':
      case '분쟁': return '#F44336'; // 빨간색
      case '이의신청': return '#FFEB3B'; // 노란색
      default: return '#E0E0E0'; // 회색 (정보 없음)
    }
  };

  return (
    <div style={{ fontFamily: "'Pretendard', 'Malgun Gothic', sans-serif", padding: '20px' }}>
      <Head>
        <title>비나우 글로벌 상표권 현황</title>
      </Head>

      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#333' }}>비나우 글로벌 상표권 등록 현황</h1>
        
        <div style={{ marginTop: '20px' }}>
          <label htmlFor="brand-select" style={{ marginRight: '10px', fontWeight: 'bold' }}>브랜드 선택: </label>
          <select 
            id="brand-select"
            value={selectedBrand} 
            onChange={(e) => setSelectedBrand(e.target.value)}
            style={{ padding: '8px 15px', borderRadius: '5px', border: '1px solid #ccc' }}
          >
            {brands.map(brand => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
        </div>
      </header>

      <main style={{ border: '1px solid #ddd', borderRadius: '10px', overflow: 'hidden', background: '#f9f9f9', cursor: 'grab' }}>
        <ComposableMap projectionConfig={{ rotate: [-10, 0, 0], scale: 147 }}>
          <ZoomableGroup 
            filterZoomEvent={(evt) => {
              // 컨트롤 키를 누른 상태에서만 휠 줌이 작동하도록 설정
              if (evt.type === 'wheel') return evt.ctrlKey;
              return true;
            }}
          >
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  // 현재 선택된 브랜드와 국가 코드가 일치하는 데이터 찾기
                  const countryData = data.find(
                    (d) => d.CODE === geo.id || d.CODE === geo.properties.ISO_A3 || d.CODE === geo.properties.ISO_A2
                  );
                  const isSelectedBrand = countryData?.BRAND === selectedBrand;
                  const status = isSelectedBrand ? countryData?.STATUS : null;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={() => {
                        if (isSelectedBrand) {
                          setTooltipContent(`${geo.properties.name} - ${countryData.BRAND}: ${countryData.STATUS}`);
                        } else {
                          setTooltipContent(`${geo.properties.name}: 정보 없음`);
                        }
                      }}
                      onMouseLeave={() => setTooltipContent("")}
                      style={{
                        default: {
                          fill: getColor(status),
                          outline: "none",
                          stroke: "#fff",
                          strokeWidth: 0.5
                        },
                        hover: {
                          fill: "#CFD8DC",
                          outline: "none"
                        },
                        pressed: {
                          fill: "#FF5722",
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
        <Tooltip>{tooltipContent}</Tooltip>
      </main>

      <footer style={{ marginTop: '20px', fontSize: '0.9em', color: '#666' }}>
        <p>* 지도를 이동하려면 드래그하세요. 확대하려면 <strong>Ctrl + 스크롤</strong>을 사용하세요.</p>
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
          <span><span style={{ color: '#4CAF50' }}>●</span> 등록</span>
          <span><span style={{ color: '#2196F3' }}>●</span> 출원 중</span>
          <span><span style={{ color: '#FFEB3B' }}>●</span> 이의신청</span>
          <span><span style={{ color: '#F44336' }}>●</span> 거절/분쟁</span>
          <span><span style={{ color: '#E0E0E0' }}>●</span> 미진행</span>
        </div>
      </footer>
    </div>
  );
}
