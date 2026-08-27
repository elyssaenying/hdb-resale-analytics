-- Town appreciation: 2017 vs the dynamically detected latest complete year.
--
-- A town is only ranked if it has at least 30 transactions in BOTH
-- comparison years (a conservative floor to avoid unstable medians from
-- thin town-year cells; matches the threshold used in the Python EDA).
-- No town names or growth figures are hardcoded — every value is computed
-- from the data at query time.
--
-- Demonstrates: CTE, conditional aggregation (FILTER), ranking window
-- function (RANK).

-- @title: Town appreciation, 2017 vs latest complete year (>= 30 txns in both years)
WITH town_year_stats AS (
    SELECT
        town,
        COUNT(*) FILTER (WHERE year = 2017) AS txn_2017,
        MEDIAN(resale_price) FILTER (WHERE year = 2017) AS price_2017,
        MEDIAN(price_per_sqm) FILTER (WHERE year = 2017) AS ppsm_2017,
        COUNT(*) FILTER (WHERE year = (SELECT year FROM latest_complete_year)) AS txn_latest,
        MEDIAN(resale_price) FILTER (WHERE year = (SELECT year FROM latest_complete_year)) AS price_latest,
        MEDIAN(price_per_sqm) FILTER (WHERE year = (SELECT year FROM latest_complete_year)) AS ppsm_latest
    FROM hdb_resale
    WHERE is_latest_month = FALSE
      AND year IN (2017, (SELECT year FROM latest_complete_year))
    GROUP BY town
),
qualified AS (
    SELECT *
    FROM town_year_stats
    WHERE txn_2017 >= 30 AND txn_latest >= 30
)
SELECT
    town,
    (SELECT year FROM latest_complete_year) AS latest_complete_year,
    txn_2017,
    ROUND(price_2017, 2) AS price_2017,
    txn_latest,
    ROUND(price_latest, 2) AS price_latest,
    ROUND((price_latest - price_2017) / price_2017 * 100, 2) AS price_growth_pct,
    ROUND((ppsm_latest - ppsm_2017) / ppsm_2017 * 100, 2) AS ppsm_growth_pct,
    RANK() OVER (ORDER BY (price_latest - price_2017) / price_2017 DESC) AS growth_rank
FROM qualified
ORDER BY growth_rank;
