-- Annual market trend: transaction count, median resale price, median
-- price/sqm, and year-over-year % change via LAG().
--
-- The latest, still-in-progress month is excluded (is_latest_month = FALSE)
-- so a partial month never deflates its year's aggregates. A year only
-- receives a normal YoY comparison if it is a complete year (all 12
-- calendar months present) per the complete_years view created in
-- scripts/build_database.py — the partial current year still appears in
-- the output for context, with YoY columns as NULL.
--
-- Demonstrates: CTE, GROUP BY, MEDIAN, window function (LAG), CASE.

-- @title: Annual market trend with year-over-year % change
WITH yearly AS (
    SELECT
        year,
        COUNT(*) AS transactions,
        MEDIAN(resale_price) AS median_price,
        MEDIAN(price_per_sqm) AS median_ppsm
    FROM hdb_resale
    WHERE is_latest_month = FALSE
    GROUP BY year
),
yearly_with_lag AS (
    SELECT
        year,
        transactions,
        median_price,
        median_ppsm,
        LAG(median_price) OVER (ORDER BY year) AS prev_median_price,
        LAG(median_ppsm) OVER (ORDER BY year) AS prev_median_ppsm,
        (year IN (SELECT year FROM complete_years)) AS is_complete_year
    FROM yearly
)
SELECT
    year,
    is_complete_year,
    transactions,
    ROUND(median_price, 2) AS median_price,
    ROUND(median_ppsm, 2) AS median_ppsm,
    CASE
        WHEN is_complete_year AND prev_median_price IS NOT NULL
        THEN ROUND((median_price - prev_median_price) / prev_median_price * 100, 2)
        ELSE NULL
    END AS price_yoy_pct,
    CASE
        WHEN is_complete_year AND prev_median_ppsm IS NOT NULL
        THEN ROUND((median_ppsm - prev_median_ppsm) / prev_median_ppsm * 100, 2)
        ELSE NULL
    END AS ppsm_yoy_pct
FROM yearly_with_lag
ORDER BY year;
