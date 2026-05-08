import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from "react-simple-maps";

const geoUrl =
  "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson";

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTv9Nf_RdMQwHDRRk1L1PrL6LsBV1hfhjUsZ9MhIV1LPWLOAmmb8BwI-eIavV01nrJORaE0U5Tv4g_b/pub?output=csv";

export default function Home() {
  const [data, setData] = useState([]);

  const [brands, setBrands] =
    useState([]);

  const [selectedBrand, setSelectedBrand] =
    useState("전체");

  const [selectedCountry, setSelectedCountry] =
    useState(null);

  const [position, setPosition] = useState({
    coordinates: [10, 15],
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
            BRAND:
              item.BRAND?.trim() || "",

            COUNTRY:
              item.COUNTRY?.trim() || "",

            CODE:
              item.CODE?.trim() || "",

            CLASS:
              item.CLASS?.trim() || "",

            TYPE:
              item.TYPE?.trim() || "",

            STATUS:
              item.STATUS?.trim() || "",

            DETAILS:
              item.DETAILS?.trim() || ""
          })
        );

        setData(cleaned);

        setBrands([
          "전체",
          "넘버즈인",
          "퓌",
          "노크",
          "테이지"
        ]);
      }
    });
  }, []);

  const filteredData = useMemo(() => {
    if (selectedBrand === "전체")
      return data;

    return data.filter(
      (item) =>
        item.BRAND === selectedBrand
    );
  }, [data, selectedBrand]);

  const getCountryData = (iso3) => {
    const rows = filteredData.filter(
      (item) => item.CODE === iso3
    );

    if (rows.length === 0)
      return null;

    const statuses = rows.map((r) =>
      r.STATUS.toLowerCase()
    );

    /**
     * 우선순위
     * 등록 > 출원 > 이의 > 거절
     */

    let finalStatus = "red";

    if (
      statuses.some((s) =>
        s.includes("green")
      )
    ) {
      finalStatus = "green";
    } else if (
      statuses.some((s) =>
        s.includes("blue")
      )
    ) {
      finalStatus = "blue";
    } else if (
      statuses.some((s) =>
        s.includes("yellow")
      )
    ) {
      finalStatus = "yellow";
    }

    return {
      COUNTRY:
        rows[0].COUNTRY,

      STATUS:
        finalStatus,

      GREEN_COUNT:
        statuses.filter((s) =>
          s.includes("green")
        ).length,

      BLUE_COUNT:
        statuses.filter((s) =>
          s.includes("blue")
        ).length,

      RED_COUNT:
        statuses.filter((s) =>
          s.includes("red")
        ).length,

      YELLOW_COUNT:
        statuses.filter((s) =>
          s.includes("yellow")
        ).length,

      TOTAL_COUNT:
        rows.length,

      ROWS: rows
    };
  };

  const getColor = (country) => {
    if (!country)
      return "#D1D5DB";

    switch (
      country.STATUS
    ) {
      case "green":
        return "#22C55E";

      case "blue":
        return "#3B82F6";

      case "yellow":
        return "#FACC15";

      case "red":
        return "#EF4444";

      default:
        return "#D1D5DB";
    }
  };

  const getStatusLabel = (
    status
  ) => {
    switch (status) {
      case "green":
        return "등록 완료";

      case "blue":
        return "출원 진행";

      case "yellow":
        return "이의신청";

      case "red":
        return "거절/분쟁";

      default:
        return "정보 없음";
    }
  };

  return (
    <div
      style={{
        fontFamily:
          "Pretendard, Malgun Gothic, sans-serif",

        background:
          "#F8FAFC",

        minHeight: "100vh",

        padding: "24px"
      }}
    >
      {/* 제목 */}
      <h1
        style={{
          fontSize: "36px",

          fontWeight: "700",

          marginBottom: "24px"
        }}
      >
        비나우 글로벌 상표권 등록 현황
      </h1>

      {/* 브랜드 버튼 */}
      <div
        style={{
          display: "flex",

          flexWrap: "wrap",

          gap: "12px",

          marginBottom: "20px"
        }}
      >
        {brands.map((brand) => (
          <button
            key={brand}
            onClick={() => {
              setSelectedBrand(
                brand
              );

              setSelectedCountry(
                null
              );
            }}
            style={{
              padding:
                "10px 18px",

              borderRadius:
                "999px",

              border:
                selectedBrand === brand
                  ? "none"
                  : "1px solid #CBD5E1",

              background:
                selectedBrand === brand
                  ? "#111827"
                  : "white",

              color:
                selectedBrand === brand
                  ? "white"
                  : "#111827",

              fontWeight: "600",

              cursor: "pointer",

              transition:
                "all 0.2s"
            }}
          >
            {brand}
          </button>
        ))}
      </div>

      {/* 범례 */}
      <div
        style={{
          display: "flex",

          flexWrap: "wrap",

          gap: "18px",

          marginBottom: "20px",

          fontSize: "14px",

          fontWeight: "500"
        }}
      >
        <div>🟩 등록 완료</div>
        <div>🟦 출원 진행</div>
        <div>🟨 이의신청</div>
        <div>🟥 거절/분쟁</div>
        <div>⬜ 정보 없음</div>
      </div>

      <div
        style={{
          display: "flex",

          gap: "20px"
        }}
      >
        {/* 지도 */}
        <div
          style={{
            flex: 1,

            background:
              "white",

            borderRadius:
              "24px",

            padding: "12px",

            boxShadow:
              "0 4px 24px rgba(0,0,0,0.08)"
          }}
        >
          <ComposableMap
            projectionConfig={{
              scale: 125
            }}
            style={{
              width: "100%",

              height: "70vh"
            }}
          >
            <ZoomableGroup
              zoom={
                position.zoom
              }
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
                  geographies
                    .filter(
                      (geo) =>
                        ![
                          "ATA"
                        ].includes(
                          geo.id
                        )
                    )
                    .map(
                      (geo) => {
                        const iso3 =
                          geo.id;

                        const countryData =
                          getCountryData(
                            iso3
                          );

                        return (
                          <Geography
                            key={
                              geo.rsmKey
                            }
                            geography={
                              geo
                            }
                            fill={getColor(
                              countryData
                            )}
                            stroke="#FFFFFF"
                            strokeWidth={
                              0.5
                            }
                            style={{
                              default:
                                {
                                  outline:
                                    "none"
                                },

                              hover:
                                {
                                  fill:
                                    "#111827",

                                  outline:
                                    "none",

                                  cursor:
                                    "pointer"
                                },

                              pressed:
                                {
                                  outline:
                                    "none"
                                }
                            }}
                            onClick={() =>
                              setSelectedCountry(
                                {
                                  geo,

                                  data:
                                    countryData
                                }
                              )
                            }
                          />
                        );
                      }
                    )
                }
              </Geographies>
            </ZoomableGroup>
          </ComposableMap>
        </div>

        {/* 우측 정보 패널 */}
        {selectedCountry && (
          <div
            style={{
              width: "380px",

              background:
                "white",

              borderRadius:
                "24px",

              padding: "20px",

              boxShadow:
                "0 4px 24px rgba(0,0,0,0.08)",

              height: "70vh",

              overflow:
                "hidden",

              display: "flex",

              flexDirection:
                "column"
            }}
          >
            {/* 헤더 */}
            <div
              style={{
                display: "flex",

                justifyContent:
                  "space-between",

                alignItems:
                  "center",

                marginBottom:
                  "16px"
              }}
            >
              <h2
                style={{
                  margin: 0
                }}
              >
                {
                  selectedCountry
                    .data
                    ?.COUNTRY
                }
              </h2>

              <button
                onClick={() =>
                  setSelectedCountry(
                    null
                  )
                }
                style={{
                  border: "none",

                  background:
                    "#E2E8F0",

                  borderRadius:
                    "8px",

                  padding:
                    "6px 10px",

                  cursor:
                    "pointer"
                }}
              >
                ✕
              </button>
            </div>

            {/* 요약 */}
            {selectedCountry
              .data ? (
              <>
                <div
                  style={{
                    marginBottom:
                      "16px",

                    lineHeight:
                      1.8
                  }}
                >
                  <div>
                    현재 상태:
                    {" "}
                    <strong>
                      {getStatusLabel(
                        selectedCountry
                          .data
                          .STATUS
                      )}
                    </strong>
                  </div>

                  <div>
                    🟩 등록:
                    {" "}
                    {
                      selectedCountry
                        .data
                        .GREEN_COUNT
                    }
                    건
                  </div>

                  <div>
                    🟦 출원:
                    {" "}
                    {
                      selectedCountry
                        .data
                        .BLUE_COUNT
                    }
                    건
                  </div>

                  <div>
                    🟨 이의:
                    {" "}
                    {
                      selectedCountry
                        .data
                        .YELLOW_COUNT
                    }
                    건
                  </div>

                  <div>
                    🟥 거절:
                    {" "}
                    {
                      selectedCountry
                        .data
                        .RED_COUNT
                    }
                    건
                  </div>
                </div>

                {/* 상세 리스트 */}
                <div
                  style={{
                    flex: 1,

                    overflowY:
                      "auto",

                    borderTop:
                      "1px solid #E2E8F0",

                    paddingTop:
                      "12px"
                  }}
                >
                  {selectedCountry.data.ROWS.map(
                    (
                      row,
                      idx
                    ) => (
                      <div
                        key={
                          idx
                        }
                        style={{
                          padding:
                            "12px",

                          borderRadius:
                            "14px",

                          background:
                            "#F8FAFC",

                          marginBottom:
                            "10px"
                        }}
                      >
                        <div
                          style={{
                            fontWeight:
                              "700",

                            fontSize:
                              "15px",

                            marginBottom:
                              "4px"
                          }}
                        >
                          {
                            row.BRAND
                          }
                        </div>

                        <div>
                          {
                            row.CLASS
                          }
                        </div>

                        <div>
                          {
                            row.TYPE
                          }
                        </div>

                        <div
                          style={{
                            marginTop:
                              "6px",

                            color:
                              "#334155",

                            fontWeight:
                              "500"
                          }}
                        >
                          {
                            row.DETAILS
                          }
                        </div>
                      </div>
                    )
                  )}
                </div>
              </>
            ) : (
              <div>
                정보 없음
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
