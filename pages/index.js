import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from "react-simple-maps";

const geoUrl =
  "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson";

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTv9Nf_RdMQwHDRRk1L1PrL6LsBV1hfhjUsZ9MhIV1LPWLOAmmb8BwI-eIavV01nrJORaE0U5Tv4g_b/pub?output=csv";

export default function Home() {
  const [data, setData] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] =
    useState("");

  const [tooltip, setTooltip] =
    useState(null);

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
        const cleaned = results.data.map(
          (item) => ({
            COUNTRY:
              item.COUNTRY?.trim() ||
              item["국가명"]?.trim() ||
              "",
            CODE:
              item.CODE?.trim() || "",
            BRAND:
              item.BRAND?.trim() || "",
            STATUS:
              item.STATUS?.trim() || ""
          })
        );

        setData(cleaned);

        const uniqueBrands = [
          ...new Set(
            cleaned.map(
              (item) => item.BRAND
            )
          )
        ].filter(Boolean);

        setBrands(uniqueBrands);

        if (uniqueBrands.length > 0) {
          setSelectedBrand(
            uniqueBrands[0]
          );
        }
      }
    });
  }, []);

  const filteredData = useMemo(() => {
    return data.filter(
      (item) =>
        item.BRAND === selectedBrand
    );
  }, [data, selectedBrand]);

  /**
   * 국가별 데이터 집계
   */
  const getCountryData = (iso3) => {
    const rows = filteredData.filter(
      (item) => item.CODE === iso3
    );

    if (rows.length === 0) return null;

    const statuses = rows.map(
      (r) => r.STATUS || ""
    );

    let finalStatus = "등록";

    if (
      statuses.some(
        (s) =>
          s.includes("거절") ||
          s.includes("분쟁")
      )
    ) {
      finalStatus = "거절/분쟁";
    } else if (
      statuses.some((s) =>
        s.includes("이의")
      )
    ) {
      finalStatus = "이의신청";
    } else if (
      statuses.some((s) =>
        s.includes("출원")
      )
    ) {
      finalStatus = "출원";
    }

    return {
      COUNTRY:
        rows[0].COUNTRY || "",
      BRAND: selectedBrand,
      STATUS: finalStatus,
      COUNT: rows.length
    };
  };

  const getColor = (country) => {
    if (!country) return "#D1D5DB";

    const status = country.STATUS;

    if (status.includes("등록"))
      return "#22C55E";

    if (status.includes("출원"))
      return "#3B82F6";

    if (
      status.includes("거절") ||
      status.includes("분쟁")
    )
      return "#EF4444";

    if (status.includes("이의"))
      return "#FACC15";

    return "#9CA3AF";
  };

  return (
    <div
      style={{
        fontFamily:
          "Pretendard, Malgun Gothic, sans-serif",
        background: "#F8FAFC",
        minHeight: "100vh",
        padding: "20px"
      }}
    >
      <h1
        style={{
          fontSize: "34px",
          fontWeight: "700",
          marginBottom: "20px"
        }}
      >
        비나우 글로벌 상표권 등록 현황
      </h1>

      <div
        style={{
          marginBottom: "20px"
        }}
      >
        <select
          value={selectedBrand}
          onChange={(e) =>
            setSelectedBrand(
              e.target.value
            )
          }
          style={{
            padding: "12px 16px",
            borderRadius: "12px",
            border:
              "1px solid #CBD5E1",
            background: "white",
            fontSize: "16px",
            minWidth: "240px"
          }}
        >
          {brands.map((brand) => (
            <option
              key={brand}
              value={brand}
            >
              {brand}
            </option>
          ))}
        </select>
      </div>

      <div
        style={{
          background: "white",
          borderRadius: "24px",
          padding: "20px",
          boxShadow:
            "0 4px 24px rgba(0,0,0,0.08)",
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
              boxShadow:
                "0 8px 24px rgba(0,0,0,0.15)",
              zIndex: 999,
              width: "260px",
              pointerEvents: "none"
            }}
          >
            <div
              style={{
                marginBottom: "6px"
              }}
            >
              <strong>국가:</strong>{" "}
              {tooltip.country}
            </div>

            <div
              style={{
                marginBottom: "6px"
              }}
            >
              <strong>브랜드:</strong>{" "}
              {tooltip.brand}
            </div>

            <div
              style={{
                marginBottom: "6px"
              }}
            >
              <strong>상태:</strong>{" "}
              {tooltip.status}
            </div>

            <div>
              <strong>건수:</strong>{" "}
              {tooltip.count}
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
            center={
              position.coordinates
            }
            onMoveEnd={(pos) =>
              setPosition(pos)
            }
          >
            <Geographies geography={geoUrl}>
              {({
                geographies
              }) =>
                geographies.map(
                  (geo) => {
                    const iso3 =
                      geo.properties
                        .ISO_A3;

                    const countryData =
                      getCountryData(
                        iso3
                      );

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={getColor(
                          countryData
                        )}
                        stroke="#FFFFFF"
                        strokeWidth={
                          0.6
                        }
                        style={{
                          default: {
                            outline:
                              "none"
                          },
                          hover: {
                            fill: "#111827",
                            outline:
                              "none",
                            cursor:
                              "pointer"
                          },
                          pressed: {
                            outline:
                              "none"
                          }
                        }}
                        onMouseEnter={(
                          evt
                        ) => {
                          setTooltip({
                            x: evt.clientX,
                            y: evt.clientY,
                            country:
                              countryData?.COUNTRY ||
                              geo
                                .properties
                                .ADMIN,
                            brand:
                              countryData?.BRAND ||
                              "-",
                            status:
                              countryData?.STATUS ||
                              "정보 없음",
                            count:
                              countryData?.COUNT ||
                              0
                          });
                        }}
                        onMouseLeave={() => {
                          setTooltip(
                            null
                          );
                        }}
                      />
                    );
                  }
                )
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
