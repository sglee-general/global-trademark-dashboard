import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from "react-simple-maps";

const geoUrl =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTv9Nf_RdMQwHDRRk1L1PrL6LsBV1hfhjUsZ9MhIV1LPWLOAmmb8BwI-eIavV01nrJORaE0U5Tv4g_b/pub?output=csv";

/**
 * ISO3 → ISO2 변환
 * CSV는 ISO2 기준이라 변환 필요
 */
const ISO_MAP = {
  USA: "US",
  KOR: "KR",
  JPN: "JP",
  CHN: "CN",
  GBR: "GB",
  FRA: "FR",
  DEU: "DE",
  ITA: "IT",
  ESP: "ES",
  CAN: "CA",
  AUS: "AU",
  BRA: "BR",
  MEX: "MX",
  RUS: "RU",
  IND: "IN",
  TUR: "TR",
  SAU: "SA",
  ARE: "AE",
  VNM: "VN",
  THA: "TH",
  SGP: "SG",
  IDN: "ID",
  PHL: "PH",
  MYS: "MY"
};

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
      skipEmptyLines: true,
      complete: (results) => {
        const cleaned = results.data.map((item) => ({
          CODE: item.CODE?.trim(),
          BRAND: item.BRAND?.trim(),
          STATUS: item.STATUS?.trim()
        }));

        setData(cleaned);

        const uniqueBrands = [
          ...new Set(cleaned.map((item) => item.BRAND))
        ].filter(Boolean);

        setBrands(uniqueBrands);

        if (uniqueBrands.length > 0) {
          setSelectedBrand(uniqueBrands[0]);
        }
      }
    });
  }, []);

  const filteredData = useMemo(() => {
    return data.filter(
      (item) => item.BRAND === selectedBrand
    );
  }, [data, selectedBrand]);

  const getCountryData = (iso2) => {
    return filteredData.find(
      (item) => item.CODE === iso2
    );
  };

  const getColor = (country) => {
    if (!country) return "#D1D5DB";

    const status = country.STATUS || "";

    if (status.includes("등록")) return "#22C55E";
    if (status.includes("출원")) return "#3B82F6";
    if (status.includes("거절")) return "#EF4444";
    if (status.includes("분쟁")) return "#EF4444";
    if (status.includes("이의")) return "#FACC15";

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
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1px solid #CBD5E1",
            fontSize: "16px",
            background: "white"
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
          borderRadius: "20px",
          padding: "20px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          position: "relative",
          overflow: "hidden"
        }}
      >
        {tooltip && (
          <div
            style={{
              position: "fixed",
              top: tooltip.y + 12,
              left: tooltip.x + 12,
              background: "white",
              padding: "14px",
              borderRadius: "14px",
              boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
              zIndex: 999,
              width: "240px",
              pointerEvents: "none"
            }}
          >
            <div style={{ marginBottom: "6px" }}>
              <strong>국가:</strong> {tooltip.country}
            </div>

            <div style={{ marginBottom: "6px" }}>
              <strong>브랜드:</strong> {tooltip.brand}
            </div>

            <div>
              <strong>상태:</strong> {tooltip.status}
            </div>
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
            onMoveEnd={(pos) => setPosition(pos)}
          >
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const iso3 = geo.id;
                  const iso2 = ISO_MAP[iso3];

                  const countryData =
                    getCountryData(iso2);

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={getColor(countryData)}
                      stroke="#FFFFFF"
                      strokeWidth={0.6}
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
                          country:
                            geo.properties.name ||
                            geo.properties.NAME,
                          brand:
                            countryData?.BRAND || "-",
                          status:
                            countryData?.STATUS ||
                            "정보 없음"
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
          flexWrap: "wrap",
          gap: "18px",
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
