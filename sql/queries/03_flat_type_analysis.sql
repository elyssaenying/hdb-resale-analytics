-- Flat type summary, annual price trend for 3/4/5 ROOM, and 2017 vs
-- latest-complete-year growth for those three types.
--
-- 2017 is used as a fixed historical baseline (matching the Python EDA).
-- The comparison endpoint is the dynamically detected latest_complete_year
-- view, never a hardcoded year.
--
-- Demonstrates: CTE, GROUP BY, MEDIAN, conditional aggregation (FILTER).

-- @title: Flat type summary (pooled across all years)
SELECT
    flat_type,
    COUNT(*) AS transactions,
    ROUND(MEDIAN(resale_price), 2) AS median_price,
    ROUND(MEDIAN(price_per_sqm), 2) AS median_ppsm,
    ROUND(MEDIAN(floor_area_sqm), 2) AS median_floor_area
FROM hdb_resale
GROUP BY flat_type
ORDER BY median_price;

-- @title: Annual median resale price, 3 ROOM / 4 ROOM / 5 ROOM
SELECT
    year,
    (year IN (SELECT year FROM complete_years)) AS is_complete_year,
    ROUND(MEDIAN(resale_price) FILTER (WHERE flat_type = '3 ROOM'), 2) AS median_price_3room,
    ROUND(MEDIAN(resale_price) FILTER (WHERE flat_type = '4 ROOM'), 2) AS median_price_4room,
    ROUND(MEDIAN(resale_price) FILTER (WHERE flat_type = '5 ROOM'), 2) AS median_price_5room
FROM hdb_resale
WHERE is_latest_month = FALSE
  AND flat_type IN ('3 ROOM', '4 ROOM', '5 ROOM')
GROUP BY year
ORDER BY year;

-- @title: 2017 vs latest complete year growth, 3 ROOM / 4 ROOM / 5 ROOM
WITH stats AS (
    SELECT
        flat_type,
        COUNT(*) FILTER (WHERE year = 2017) AS txn_2017,
        MEDIAN(resale_price) FILTER (WHERE year = 2017) AS price_2017,
        COUNT(*) FILTER (WHERE year = (SELECT year FROM latest_complete_year)) AS txn_latest,
        MEDIAN(resale_price) FILTER (WHERE year = (SELECT year FROM latest_complete_year)) AS price_latest
    FROM hdb_resale
    WHERE is_latest_month = FALSE
      AND flat_type IN ('3 ROOM', '4 ROOM', '5 ROOM')
    GROUP BY flat_type
)
SELECT
    flat_type,
    (SELECT year FROM latest_complete_year) AS latest_complete_year,
    txn_2017,
    ROUND(price_2017, 2) AS price_2017,
    txn_latest,
    ROUND(price_latest, 2) AS price_latest,
    ROUND((price_latest - price_2017) / price_2017 * 100, 2) AS price_growth_pct
FROM stats
ORDER BY flat_type;
