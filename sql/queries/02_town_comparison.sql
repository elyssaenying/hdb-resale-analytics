-- Per-town summary statistics, pooled across the whole dataset, ranked by
-- median price per sqm using a ranking window function.
--
-- Terminology note: towns are described only by "higher" / "lower" price
-- per sqm. This is NOT labeled "best value" — price per sqm alone does not
-- account for floor area, location preference, or amenities, so no value
-- judgement is made here.
--
-- Demonstrates: CTE, GROUP BY, MEDIAN, ranking window function (RANK).

-- @title: Town comparison, ranked by median price per sqm
WITH town_stats AS (
    SELECT
        town,
        COUNT(*) AS transactions,
        MEDIAN(resale_price) AS median_price,
        MEDIAN(price_per_sqm) AS median_ppsm,
        MEDIAN(floor_area_sqm) AS median_floor_area,
        MEDIAN(remaining_lease_years) AS median_remaining_lease_years
    FROM hdb_resale
    GROUP BY town
)
SELECT
    town,
    transactions,
    ROUND(median_price, 2) AS median_price,
    ROUND(median_ppsm, 2) AS median_ppsm,
    ROUND(median_floor_area, 2) AS median_floor_area,
    ROUND(median_remaining_lease_years, 2) AS median_remaining_lease_years,
    RANK() OVER (ORDER BY median_ppsm DESC) AS price_per_sqm_rank
FROM town_stats
ORDER BY price_per_sqm_rank;
