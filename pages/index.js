import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from "react-simple-maps";

const geoUrl =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTv9Nf_RdMQwHDRRk1L1PrL6LsBV1hfhjUsZ9MhIV1LPWLOAmmb8BwI-eIavV01nrJORaE0U5Tv4g_b/pub?output=csv";

/**
 * 숫자 국가코드 → ISO3 변환
 */
const ISO_MAP = {
  "410": "KOR",
  "156": "CHN",
  "840": "USA",
  "392": "JPN",
  "608": "PHL",
  "704": "VNM",
  "764": "THA",
  "458": "MYS",
  "702": "SGP",
  "276": "DEU",
  "250": "FRA",
  "380": "ITA",
  "724": "ESP",
  "620": "PRT",
  "528": "NLD",
  "56": "BEL",
  "442": "LUX",
  "40": "AUT",
  "203": "CZE",
  "703": "SVK",
  "348": "HUN",
  "616": "POL",
  "300": "GRC",
  "191": "HRV",
  "356": "IND",
  "344": "HKG",
  "158": "TWN"
};

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

  const getCountryData = (iso3) => {
    const rows = filteredData.filter(
      (item) => item.CODE === iso3
    );

    if (rows.length === 0)
      return null;

    const statuses = rows.map((r) =>
      r.STATUS.toLowerCase()
    );

    let finalStatus = "green";

    if (
      statuses.some((s) =>
        s.includes("red")
      )
    ) {
      finalStatus = "red";
    } else if (
      statuses.some((s) =>
        s.includes("yellow")
      )
    ) {
      finalStatus = "yellow";
    } else if (
      statuses.some((s) =>
        s.includes("blue")
      )
    ) {
      finalStatus = "blue";
    }

    return {
      COUNTRY:
        rows[0].COUNTRY,
      BRAND:
        selectedBrand,
      STATUS:
        finalStatus,
      DETAILS: rows
        .map((r) => r.DETAILS)
        .filter(Boolean)
        .join(", "),
      COUNT: rows.length
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

      case "red":
        return "#EF4444";

      case "yellow":
        return "#FACC15";

      default:
        return "#9CA3AF";
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

      case "red":
        return "거절/분쟁";

      case "yellow":
        return "이의신청";

      default:
        return "정보 없음";
    }
  };

  return (
    <div
      style={{
        fontFamily:
          "Pretendard, sans-serif",
        background:
          "#F8FAFC",
        minHeight: "100vh",
        padding: "20px"
      }}
    >
      <h1
        style={{
          fontSize: "34px",
          fontWeight: 700,
          marginBottom: "20px"
        }}
      >
        비나우 글로벌 상표권 등록 현황
      </h1>

      <select
        value={selectedBrand}
        onChange={(e) =>
          setSelectedBrand(
            e.target.value
          )
        }
        style={{
          marginBottom: "20px",
          padding:
            "12px 16px",
          borderRadius: "12px",
          border:
            "1px solid #CBD5E1",
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

      {tooltip && (
        <div
          style={{
            position: "fixed",
            top: tooltip.y + 10,
            left: tooltip.x + 10,
            background: "white",
            padding: "14px",
            borderRadius: "14px",
            boxShadow:
              "0 8px 24px rgba(0,0,0,0.15)",
            zIndex: 999,
            width: "280px"
          }}
        >
          <div>
            <strong>국가:</strong>{" "}
            {tooltip.country}
          </div>

          <div>
            <strong>브랜드:</strong>{" "}
            {tooltip.brand}
          </div>

          <div>
            <strong>상태:</strong>{" "}
            {tooltip.status}
          </div>

          <div>
            <strong>건수:</strong>{" "}
            {tooltip.count}
          </div>

          <div>
            <strong>상세:</strong>{" "}
            {tooltip.details}
          </div>
        </div>
      )}

      <ComposableMap>
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
            {({ geographies }) =>
              geographies.map(
                (geo) => {
                  const iso3 =
                    ISO_MAP[geo.id];

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
                        hover: {
                          fill:
                            "#111827",
                          outline:
                            "none"
                        }
                      }}
                      onMouseEnter={(
                        evt
                      ) => {
                        setTooltip(
                          {
                            x:
                              evt.clientX,
                            y:
                              evt.clientY,
                            country:
                              countryData?.COUNTRY ||
                              "",
                            brand:
                              countryData?.BRAND ||
                              "-",
                            status:
                              getStatusLabel(
                                countryData?.STATUS
                              ),
                            count:
                              countryData?.COUNT ||
                              0,
                            details:
                              countryData?.DETAILS ||
                              "-"
                          }
                        );
                      }}
                      onMouseLeave={() =>
                        setTooltip(
                          null
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
  );
}
