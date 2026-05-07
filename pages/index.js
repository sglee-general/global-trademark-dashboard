import { useEffect, useState } from "react";
import Papa from "papaparse";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from "react-simple-maps";

const geoUrl =
  "https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries.json";

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTv9Nf_RdMQwHDRRk1L1PrL6LsBV1hfhjUsZ9MhIV1LPWLOAmmb8BwI-eIavV01nrJORaE0U5Tv4g_b/pub?output=csv";

export default function Home() {
  const [data, setData] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [tooltip, setTooltip] = useState(null);
  const [position, setPosition] = useState({
    coordinates: [0, 20],
    zoom: 1
  });

  useEffect(() => {
    Papa.parse(CSV_URL, {
      download: true,
      header: true,
      complete: (results) => {
        setData(results.data);

        const uniqueBrands = [
          ...new Set(results.data.map((item) => item.BRAND))
        ];

        setBrands(uniqueBrands);

        if (uniqueBrands.length > 0) {
          setSelectedBrand(uniqueBrands[0]);
        }
      }
    });
  }, []);

  const getCountryData = (iso) => {
    return data.find(
      (item) =>
        item.CODE === iso &&
        item.BRAND === selectedBrand
    );
  };

  const getColor = (country) => {
    if (!country) return "#D1D5DB";

    const status = country.STATUS?.toLowerCase();

    if (status?.includes("등록")) return "#22C55E";
    if (status?.includes("출원")) return "#3B82F6";
    if (status?.includes("거절")) return "#EF4444";
    if (status?.includes("분쟁")) return "#EF4444";
    if (status?.includes("이의")) return "#FACC15";

    return "#9CA3AF";
  };

  return (
    <div
      style={{
        fontFamily: "Pretendard, Malgun Gothic, sans-serif",
        background: "#F8FAFC",
        minHeight: "100vh",
        padding: "20px"
      }}
    >
      <h1
        style={{
          fontSize: "32px",
          fontWeight: "700",
          marginBottom: "20px"
        }}
      >
        비나우 글로벌 상표권 등록 현황
      </h1>

      <div style={{ marginBottom: "20px" }}>
        <select
          value={selectedBrand}
          onChange={(e) => setSelectedBrand(e.target.value)}
          style={{
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #CBD5E1",
            fontSize: "16px"
          }}
        >
          {brands.map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </select>
      </div>

      <div
        style={{
          background: "white",
          borderRadius: "16px",
          padding: "20px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
          position: "relative"
        }}
      >
        {tooltip && (
          <div
            style={{
              position: "absolute",
              top: tooltip.y,
              left: tooltip.x,
              background: "white",
              padding: "12px",
              borderRadius: "10px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              zIndex: 10,
              width: "220px"
            }}
          >
            <div><strong>국가:</strong> {tooltip.country}</div>
            <div><strong>브랜드:</strong> {tooltip.brand}</div>
            <div><strong>상태:</strong> {tooltip.status}</div>
          </div>
        )}

        <ComposableMap
          projectionConfig={{
            scale: 160
          }}
          style={{
            width: "100%",
            height: "auto"
          }}
        >
          <ZoomableGroup
            zoom={position.zoom}
            center={position.coordinates}
            onMoveEnd={setPosition}
          >
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const iso = geo.properties.ISO_A2;
                  const countryData = getCountryData(iso);

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={getColor(countryData)}
                      stroke="#FFFFFF"
                      strokeWidth={0.5}
                      style={{
                        default: {
                          outline: "none"
                        },
                        hover: {
                          fill: "#0F172A",
                          outline: "none",
                          cursor: "pointer"
                        },
                        pressed: {
                          outline: "none"
                        }
                      }}
                      onMouseEnter={(evt) => {
                        setTooltip({
                          x: evt.clientX,
                          y: evt.clientY,
                          country: geo.properties.NAME,
                          brand:
                            countryData?.BRAND || "-",
                          status:
                            countryData?.STATUS || "정보 없음"
                        });
                      }}
                      onMouseLeave={() => {
                        setTooltip(null);
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      <div
        style={{
          display: "flex",
          gap: "20px",
          marginTop: "20px",
          fontSize: "14px"
        }}
      >
        <div>🟩 등록 완료</div>
        <div>🟦 출원 진행</div>
        <div>🟥 거절/분쟁</div>
        <div>🟨 이의신청</div>
        <div>⬜ 정보 없음</div>
      </div>
    </div>
  );
}
