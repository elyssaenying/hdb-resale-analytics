-- Million-dollar transactions (resale_price >= $1,000,000).
--
-- The headline year-over-year comparison uses complete years only. The
-- current partial/YTD year is reported separately for context and must
-- not be read as a full-year figure.
--
-- Demonstrates: CTE, conditional aggregation (FILTER), GROUP BY.

-- @title: Million-dollar transactions by year (complete years only)
SELECT
    year,
    COUNT(*) FILTER (WHERE resale_price >= 1000000) AS million_dollar_txns,
    COUNT(*) AS total_txns,
    ROUND(COUNT(*) FILTER (WHERE resale_price >= 1000000) * 100.0 / COUNT(*), 2) AS share_pct
FROM hdb_resale
WHERE is_latest_month = FALSE
  AND year IN (SELECT year FROM complete_years)
GROUP BY year
ORDER BY year;

-- @title: Current year to date (partial/YTD, NOT a complete-year figure)
SELECT
    year,
    COUNT(*) FILTER (WHERE resale_price >= 1000000) AS million_dollar_txns,
    COUNT(*) AS total_txns,
    ROUND(COUNT(*) FILTER (WHERE resale_price >= 1000000) * 100.0 / COUNT(*), 2) AS share_pct
FROM hdb_resale
WHERE is_latest_month = FALSE
  AND year NOT IN (SELECT year FROM complete_years)
GROUP BY year
ORDER BY year;

-- @title: Top 5 towns by million-dollar transaction count (latest month excluded)
SELECT
    town,
    COUNT(*) AS million_dollar_txns
FROM hdb_resale
WHERE is_latest_month = FALSE AND resale_price >= 1000000
GROUP BY town
ORDER BY million_dollar_txns DESC
LIMIT 5;

-- @title: Flat type distribution among million-dollar transactions (latest month excluded)
SELECT
    flat_type,
    COUNT(*) AS million_dollar_txns
FROM hdb_resale
WHERE is_latest_month = FALSE AND resale_price >= 1000000
GROUP BY flat_type
ORDER BY million_dollar_txns DESC;
