-- Remaining lease and storey band relationships with price/sqm.
--
-- IMPORTANT: these are correlational summaries only. Grouping by lease
-- band or storey band and comparing medians does not isolate a causal
-- effect of lease length or storey height on price — both are confounded
-- with town, flat model, and flat age. No regression/multivariable model
-- is built here; this matches the Python EDA's stated limitation.
--
-- Demonstrates: CTE, CASE (banding), GROUP BY, MEDIAN.

-- @title: Remaining lease bands (all flat types pooled)
WITH banded AS (
    SELECT
        *,
        CASE
            WHEN remaining_lease_years < 50 THEN '<50'
            WHEN remaining_lease_years < 60 THEN '50-59'
            WHEN remaining_lease_years < 70 THEN '60-69'
            WHEN remaining_lease_years < 80 THEN '70-79'
            WHEN remaining_lease_years < 90 THEN '80-89'
            ELSE '90+'
        END AS lease_band
    FROM hdb_resale
)
SELECT
    lease_band,
    COUNT(*) AS transactions,
    ROUND(MEDIAN(resale_price), 2) AS median_price,
    ROUND(MEDIAN(price_per_sqm), 2) AS median_ppsm
FROM banded
GROUP BY lease_band
ORDER BY
    CASE lease_band
        WHEN '<50' THEN 1 WHEN '50-59' THEN 2 WHEN '60-69' THEN 3
        WHEN '70-79' THEN 4 WHEN '80-89' THEN 5 ELSE 6
    END;

-- @title: Remaining lease bands by flat type (3 ROOM / 4 ROOM / 5 ROOM)
WITH banded AS (
    SELECT
        *,
        CASE
            WHEN remaining_lease_years < 50 THEN '<50'
            WHEN remaining_lease_years < 60 THEN '50-59'
            WHEN remaining_lease_years < 70 THEN '60-69'
            WHEN remaining_lease_years < 80 THEN '70-79'
            WHEN remaining_lease_years < 90 THEN '80-89'
            ELSE '90+'
        END AS lease_band
    FROM hdb_resale
    WHERE flat_type IN ('3 ROOM', '4 ROOM', '5 ROOM')
)
SELECT
    flat_type,
    lease_band,
    COUNT(*) AS transactions,
    ROUND(MEDIAN(price_per_sqm), 2) AS median_ppsm
FROM banded
GROUP BY flat_type, lease_band
ORDER BY flat_type,
    CASE lease_band
        WHEN '<50' THEN 1 WHEN '50-59' THEN 2 WHEN '60-69' THEN 3
        WHEN '70-79' THEN 4 WHEN '80-89' THEN 5 ELSE 6
    END;

-- @title: Storey band vs price/sqm by flat type (correlational only)
WITH banded AS (
    SELECT
        *,
        CASE
            WHEN storey_mid <= 6 THEN 'Low (1-6)'
            WHEN storey_mid <= 15 THEN 'Mid (7-15)'
            ELSE 'High (16+)'
        END AS storey_band
    FROM hdb_resale
    WHERE flat_type IN ('3 ROOM', '4 ROOM', '5 ROOM')
)
SELECT
    flat_type,
    storey_band,
    COUNT(*) AS transactions,
    ROUND(MEDIAN(price_per_sqm), 2) AS median_ppsm
FROM banded
GROUP BY flat_type, storey_band
ORDER BY flat_type,
    CASE storey_band WHEN 'Low (1-6)' THEN 1 WHEN 'Mid (7-15)' THEN 2 ELSE 3 END;
