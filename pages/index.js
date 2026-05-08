import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import countries from "i18n-iso-countries";
import koLocale from "i18n-iso-countries/langs/ko.json";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from "react-simple-maps";

countries.registerLocale(koLocale);

const geoUrl =
  "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson";

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTv9Nf_RdMQwHDRRk1L1PrL6LsBV1hfhjUsZ9MhIV1LPWLOAmmb8BwI-eIavV01nrJORaE0U5Tv4g_b/pub?output=csv";

const FIXED_BRANDS = ["전체", "넘버즈인", "퓌", "노크", "테이지"];

const INITIAL_MAP_POSITION = {
  coordinates: [10, 15],
  zoom: 1
};

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[\s·.,()]/g, "")
    .trim();
}

function getFinalStatus(rows) {
  if (!rows || rows.length === 0) return "unknown";

  const statuses = rows.map((row) => String(row.STATUS || "").toLowerCase());

  if (statuses.some((status) => status.includes("green"))) {
    return "green";
  }

  if (statuses.some((status) => status.includes("blue"))) {
    return "blue";
  }

  if (statuses.some((status) => status.includes("yellow"))) {
    return "yellow";
  }

  if (statuses.some((status) => status.includes("red"))) {
    return "red";
  }

  return "unknown";
}

function getStatusLabel(status) {
  const normalized = String(status || "").toLowerCase();

  switch (normalized) {
    case "green":
      return "등록 완료";
    case "blue":
      return "출원 진행";
    case "yellow":
      return "이의신청";
    case "red":
      return "거절/분쟁";
    default:
      return "출원 정보 없음";
  }
}

function getColor(country) {
  if (!country) return "#D1D5DB";

  switch (country.STATUS) {
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
}

function getHoverColor(country) {
  if (!country) return "#CBD5E1";

  switch (country.STATUS) {
    case "green":
      return "#16A34A";
    case "blue":
      return "#2563EB";
    case "yellow":
      return "#EAB308";
    case "red":
      return "#DC2626";
    default:
      return "#CBD5E1";
  }
}

function collectCoordinates(coords, points) {
  if (!coords) return;

  if (
    Array.isArray(coords) &&
    typeof coords[0] === "number" &&
    typeof coords[1] === "number"
  ) {
    points.push(coords);
    return;
  }

  if (Array.isArray(coords)) {
    coords.forEach((child) => collectCoordinates(child, points));
  }
}

function getFeatureCenter(geo) {
  const points = [];

  collectCoordinates(geo?.geometry?.coordinates, points);

  if (points.length === 0) {
    return INITIAL_MAP_POSITION.coordinates;
  }

  const lngs = points.map((point) => point[0]);
  const lats = points.map((point) => point[1]);

  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);

  return [(minLng + maxLng) / 2, (minLat + maxLat) / 2];
}

function getSearchZoom(geo) {
  const points = [];

  collectCoordinates(geo?.geometry?.coordinates, points);

  if (points.length === 0) return 2.4;

  const lngs = points.map((point) => point[0]);
  const lats = points.map((point) => point[1]);

  const width = Math.max(...lngs) - Math.min(...lngs);
  const height = Math.max(...lats) - Math.min(...lats);
  const size = Math.max(width, height);

  if (size > 80) return 1.4;
  if (size > 45) return 1.8;
  if (size > 25) return 2.4;
  if (size > 12) return 3.2;
  return 4.2;
}

export default function Home() {
  const [data, setData] = useState([]);
  const [brands, setBrands] = useState(FIXED_BRANDS);
  const [selectedBrand, setSelectedBrand] = useState("전체");
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [allCountries, setAllCountries] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [searchMessage, setSearchMessage] = useState("");
  const [searchedCountryIso, setSearchedCountryIso] = useState(null);

  const [position, setPosition] = useState(INITIAL_MAP_POSITION);

  useEffect(() => {
    Papa.parse(CSV_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const cleaned = results.data.map((item) => ({
          BRAND: item.BRAND?.trim() || "",
          COUNTRY: item.COUNTRY?.trim() || "",
          CODE: item.CODE?.trim() || "",
          CLASS: item.CLASS?.trim() || "",
          TYPE: item.TYPE?.trim() || "",
          STATUS: item.STATUS?.trim() || "",
          DETAILS: item.DETAILS?.trim() || ""
        }));

        setData(cleaned);
        setBrands(FIXED_BRANDS);
      }
    });
  }, []);

  useEffect(() => {
    fetch(geoUrl)
      .then((res) => res.json())
      .then((geoJson) => {
        const features = (geoJson.features || []).filter(
          (geo) => geo.id && geo.id !== "ATA"
        );

        setAllCountries(features);
      })
      .catch(() => {
        setAllCountries([]);
      });
  }, []);

  const filteredData = useMemo(() => {
    if (selectedBrand === "전체") return data;

    return data.filter((item) => item.BRAND === selectedBrand);
  }, [data, selectedBrand]);

  const getCountryData = (iso3) => {
    const rows = filteredData.filter((item) => item.CODE === iso3);

    if (rows.length === 0) return null;

    const statuses = rows.map((row) =>
      String(row.STATUS || "").toLowerCase()
    );

    return {
      COUNTRY: rows[0].COUNTRY,
      STATUS: getFinalStatus(rows),
      GREEN_COUNT: statuses.filter((status) => status.includes("green"))
        .length,
      BLUE_COUNT: statuses.filter((status) => status.includes("blue")).length,
      RED_COUNT: statuses.filter((status) => status.includes("red")).length,
      YELLOW_COUNT: statuses.filter((status) => status.includes("yellow"))
        .length,
      TOTAL_COUNT: rows.length,
      ROWS: rows
    };
  };

  const getGeoCountryName = (geo) => {
    const iso3 = geo?.id;

    if (iso3) {
      const koreanName = countries.getName(iso3, "ko");
      if (koreanName) return koreanName;
    }

    return (
      geo?.properties?.name ||
      geo?.properties?.NAME ||
      geo?.properties?.admin ||
      geo?.properties?.ADMIN ||
      iso3 ||
      "국가명 확인 필요"
    );
  };

  const getDisplayCountryName = (geo, countryData) => {
    if (countryData?.COUNTRY) return countryData.COUNTRY;

    const iso3 = geo?.id;

    const sheetCountryName = data.find(
      (item) => item.CODE === iso3 && item.COUNTRY
    )?.COUNTRY;

    if (sheetCountryName) return sheetCountryName;

    return getGeoCountryName(geo);
  };

  const stats = useMemo(() => {
    const groupedByCountry = {};

    filteredData.forEach((row) => {
      if (!row.CODE) return;

      if (!groupedByCountry[row.CODE]) {
        groupedByCountry[row.CODE] = [];
      }

      groupedByCountry[row.CODE].push(row);
    });

    const countryStatuses = Object.values(groupedByCountry).map((rows) =>
      getFinalStatus(rows)
    );

    const totalManagedCountries = Object.keys(groupedByCountry).length;

    const noDataCountries =
      allCountries.length > 0
        ? Math.max(allCountries.length - totalManagedCountries, 0)
        : 0;

    return {
      totalRows: filteredData.length,
      totalManagedCountries,
      greenCountries: countryStatuses.filter((status) => status === "green")
        .length,
      blueCountries: countryStatuses.filter((status) => status === "blue")
        .length,
      yellowCountries: countryStatuses.filter((status) => status === "yellow")
        .length,
      redCountries: countryStatuses.filter((status) => status === "red")
        .length,
      noDataCountries
    };
  }, [filteredData, allCountries]);

  const handleCountrySelect = (geo, shouldFocus = false) => {
    const iso3 = geo.id;
    const countryData = getCountryData(iso3);
    const countryName = getDisplayCountryName(geo, countryData);

    setSelectedCountry({
      geo,
      data: countryData,
      countryName
    });

    if (shouldFocus) {
      setSearchedCountryIso(iso3);
      setPosition({
        coordinates: getFeatureCenter(geo),
        zoom: getSearchZoom(geo)
      });
    }

    setSearchMessage("");
  };

  const handleSearch = (event) => {
    event.preventDefault();

    const query = normalizeText(searchText);

    if (!query) {
      setSearchMessage("검색할 국가명을 입력해 주세요.");
      return;
    }

    if (allCountries.length === 0) {
      setSearchMessage("국가 데이터를 불러오는 중입니다. 잠시 후 다시 검색해 주세요.");
      return;
    }

    const candidates = allCountries.map((geo) => {
      const iso3 = geo.id;

      const koreanName = countries.getName(iso3, "ko") || "";
      const englishName =
        geo?.properties?.name ||
        geo?.properties?.NAME ||
        geo?.properties?.admin ||
        geo?.properties?.ADMIN ||
        "";

      const sheetCountryName =
        data.find((item) => item.CODE === iso3 && item.COUNTRY)?.COUNTRY || "";

      return {
        geo,
        iso3,
        names: [iso3, koreanName, englishName, sheetCountryName].filter(
          Boolean
        )
      };
    });

    const exactMatch = candidates.find((candidate) =>
      candidate.names.some((name) => normalizeText(name) === query)
    );

    const partialMatch =
      exactMatch ||
      candidates.find((candidate) =>
        candidate.names.some((name) => normalizeText(name).includes(query))
      );

    if (!partialMatch) {
      setSearchMessage("검색 결과가 없습니다. 국가명 또는 ISO 코드를 확인해 주세요.");
      return;
    }

    const countryData = getCountryData(partialMatch.iso3);
    const countryName = getDisplayCountryName(partialMatch.geo, countryData);

    setSelectedCountry({
      geo: partialMatch.geo,
      data: countryData,
      countryName
    });

    setSearchedCountryIso(partialMatch.iso3);

    setPosition({
      coordinates: getFeatureCenter(partialMatch.geo),
      zoom: getSearchZoom(partialMatch.geo)
    });

    setSearchMessage(`${countryName}을 강조 표시했습니다.`);
  };

  const resetMap = () => {
    setPosition(INITIAL_MAP_POSITION);
    setSelectedCountry(null);
    setSearchText("");
    setSearchMessage("");
    setSearchedCountryIso(null);
  };

  const cardLabelStyle = {
    minWidth: "76px",
    fontWeight: "700",
    color: "#0F172A"
  };

  const cardValueStyle = {
    color: "#334155",
    fontWeight: "500"
  };

  const statCards = [
    {
      title: "관리 국가",
      value: `${stats.totalManagedCountries}개국`,
      description: `총 ${stats.totalRows}건`
    },
    {
      title: "등록 완료",
      value: `${stats.greenCountries}개국`,
      description: "권리 확보"
    },
    {
      title: "출원 진행",
      value: `${stats.blueCountries}개국`,
      description: "진행 중"
    },
    {
      title: "이의신청",
      value: `${stats.yellowCountries}개국`,
      description: "확인 필요"
    },
    {
      title: "거절/분쟁",
      value: `${stats.redCountries}개국`,
      description: "리스크 검토"
    },
    {
      title: "출원 정보 없음",
      value: `${stats.noDataCountries}개국`,
      description: "미진행 후보"
    }
  ];

  return (
    <div
      style={{
        fontFamily: "Pretendard, Malgun Gothic, sans-serif",
        background: "#F8FAFC",
        minHeight: "100vh",
        padding: "24px"
      }}
    >
      <div
        style={{
          maxWidth: "1600px",
          margin: "0 auto"
        }}
      >
        <h1
          style={{
            fontSize: "36px",
            fontWeight: "700",
            marginBottom: "24px",
            textAlign: "center"
          }}
        >
          비나우 글로벌 상표권 등록 현황
        </h1>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "18px"
          }}
        >
          {brands.map((brand) => (
            <button
              key={brand}
              onClick={() => {
                setSelectedBrand(brand);
                setSelectedCountry(null);
                setSearchMessage("");
                setSearchedCountryIso(null);
              }}
              style={{
                padding: "10px 18px",
                borderRadius: "999px",
                border:
                  selectedBrand === brand ? "none" : "1px solid #CBD5E1",
                background: selectedBrand === brand ? "#111827" : "white",
                color: selectedBrand === brand ? "white" : "#111827",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              {brand}
            </button>
          ))}
        </div>

        <form
          onSubmit={handleSearch}
          style={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "10px",
            marginBottom: "10px"
          }}
        >
          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="국가명 또는 ISO 코드 검색 예: 미국, 일본, USA, JPN"
            style={{
              width: "420px",
              maxWidth: "100%",
              padding: "12px 14px",
              borderRadius: "12px",
              border: "1px solid #CBD5E1",
              fontSize: "15px",
              outline: "none",
              background: "white"
            }}
          />

          <button
            type="submit"
            style={{
              padding: "12px 18px",
              borderRadius: "12px",
              border: "none",
              background: "#111827",
              color: "white",
              fontWeight: "700",
              cursor: "pointer"
            }}
          >
            검색
          </button>

          <button
            type="button"
            onClick={resetMap}
            style={{
              padding: "12px 18px",
              borderRadius: "12px",
              border: "1px solid #CBD5E1",
              background: "white",
              color: "#111827",
              fontWeight: "700",
              cursor: "pointer"
            }}
          >
            전체 지도 보기
          </button>
        </form>

        {searchMessage && (
          <div
            style={{
              textAlign: "center",
              color: "#475569",
              fontSize: "14px",
              marginBottom: "14px"
            }}
          >
            {searchMessage}
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "18px",
            marginBottom: "18px",
            fontSize: "14px",
            fontWeight: "500"
          }}
        >
          <div>🟩 등록 완료</div>
          <div>🟦 출원 진행</div>
          <div>🟨 이의신청</div>
          <div>🟥 거절/분쟁</div>
          <div>⬜ 출원 정보 없음</div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "12px",
            marginBottom: "20px"
          }}
        >
          {statCards.map((card) => (
            <div
              key={card.title}
              style={{
                background: "white",
                borderRadius: "18px",
                padding: "16px",
                boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
                border: "1px solid #E2E8F0"
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  color: "#64748B",
                  fontWeight: "700",
                  marginBottom: "8px"
                }}
              >
                {card.title}
              </div>

              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "800",
                  color: "#0F172A",
                  marginBottom: "4px"
                }}
              >
                {card.value}
              </div>

              <div
                style={{
                  fontSize: "13px",
                  color: "#64748B"
                }}
              >
                {card.description}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            gap: "20px",
            alignItems: "stretch"
          }}
        >
          <div
            style={{
              flex: 1,
              background: "white",
              borderRadius: "24px",
              padding: "12px",
              boxShadow: "0 4px 24px rgba(0,0,0,0.08)"
            }}
          >
            <ComposableMap
              projectionConfig={{
                scale: 125
              }}
              style={{
                width: "100%",
                height: "68vh"
              }}
            >
              <ZoomableGroup
                zoom={position.zoom}
                center={position.coordinates}
                onMoveEnd={(pos) => setPosition(pos)}
              >
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies
                      .filter((geo) => geo.id && geo.id !== "ATA")
                      .map((geo) => {
                        const iso3 = geo.id;
                        const countryData = getCountryData(iso3);

                        const isSearchMode = Boolean(searchedCountryIso);
                        const isFocusedCountry =
                          searchedCountryIso === geo.id || !isSearchMode;

                        const countryColor = isFocusedCountry
                          ? getColor(countryData)
                          : "#E5E7EB";

                        const hoverColor = isFocusedCountry
                          ? getHoverColor(countryData)
                          : "#CBD5E1";

                        return (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            fill={countryColor}
                            stroke={
                              searchedCountryIso === geo.id
                                ? "#0F172A"
                                : "#FFFFFF"
                            }
                            strokeWidth={
                              searchedCountryIso === geo.id ? 1.1 : 0.5
                            }
                            style={{
                              default: {
                                outline: "none",
                                transition: "all 0.2s ease",
                                opacity: isFocusedCountry ? 1 : 0.42
                              },
                              hover: {
                                fill: hoverColor,
                                stroke: "#0F172A",
                                strokeWidth: 0.9,
                                outline: "none",
                                cursor: "pointer",
                                opacity: 1
                              },
                              pressed: {
                                outline: "none"
                              }
                            }}
                            onClick={() => handleCountrySelect(geo, true)}
                          />
                        );
                      })
                  }
                </Geographies>
              </ZoomableGroup>
            </ComposableMap>
          </div>

          {selectedCountry && (
            <div
              style={{
                width: "420px",
                background: "white",
                borderRadius: "24px",
                padding: "20px",
                boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                height: "68vh",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column"
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px"
                }}
              >
                <h2
                  style={{
                    margin: 0
                  }}
                >
                  {selectedCountry.countryName}
                </h2>

                <button
                  onClick={() => setSelectedCountry(null)}
                  style={{
                    border: "none",
                    background: "#E2E8F0",
                    borderRadius: "8px",
                    padding: "6px 10px",
                    cursor: "pointer"
                  }}
                >
                  ✕
                </button>
              </div>

              {selectedCountry.data ? (
                <>
                  <div
                    style={{
                      marginBottom: "16px",
                      lineHeight: 1.8
                    }}
                  >
                    <div>
                      현재 상태:{" "}
                      <strong>
                        {getStatusLabel(selectedCountry.data.STATUS)}
                      </strong>
                    </div>

                    <div>🟩 등록: {selectedCountry.data.GREEN_COUNT}건</div>
                    <div>🟦 출원: {selectedCountry.data.BLUE_COUNT}건</div>
                    <div>🟨 이의: {selectedCountry.data.YELLOW_COUNT}건</div>
                    <div>🟥 거절: {selectedCountry.data.RED_COUNT}건</div>
                  </div>

                  <div
                    style={{
                      flex: 1,
                      overflowY: "auto",
                      borderTop: "1px solid #E2E8F0",
                      paddingTop: "12px"
                    }}
                  >
                    {selectedCountry.data.ROWS.map((row, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: "14px",
                          borderRadius: "14px",
                          background: "#F8FAFC",
                          marginBottom: "10px"
                        }}
                      >
                        <div
                          style={{
                            fontWeight: "700",
                            fontSize: "16px",
                            marginBottom: "10px",
                            color: "#0F172A"
                          }}
                        >
                          {row.BRAND}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            marginBottom: "6px"
                          }}
                        >
                          <div style={cardLabelStyle}>상품류</div>
                          <div style={cardValueStyle}>: {row.CLASS || "-"}</div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            marginBottom: "6px"
                          }}
                        >
                          <div style={cardLabelStyle}>출원내용</div>
                          <div style={cardValueStyle}>: {row.TYPE || "-"}</div>
                        </div>

                        <div
                          style={{
                            display: "flex"
                          }}
                        >
                          <div style={cardLabelStyle}>상태</div>
                          <div style={cardValueStyle}>
                            : {getStatusLabel(row.STATUS)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div
                  style={{
                    borderTop: "1px solid #E2E8F0",
                    paddingTop: "20px",
                    lineHeight: 1.8,
                    color: "#334155"
                  }}
                >
                  <div>
                    현재 상태: <strong>출원 정보 없음</strong>
                  </div>

                  <div
                    style={{
                      marginTop: "12px",
                      color: "#64748B"
                    }}
                  >
                    아직 해당 국가에 등록/출원 데이터가 없습니다.
                  </div>

                  <div
                    style={{
                      marginTop: "12px",
                      color: "#64748B"
                    }}
                  >
                    해외 진출 또는 판매 예정 국가라면 상표 출원 필요 여부를
                    검토할 수 있습니다.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
