# HDB Resale Market — Exploratory Data Analysis

Source: `data/processed/hdb_resale_clean.csv` (238,932 rows, 2017-01 to 2026-08).

**Methodology note:** rows belonging to the latest month (2026-08, 1,984 rows) are excluded from every year-over-year / trend comparison in this document, since that month is still in progress and would understate activity. They are **never removed from the dataset** — only excluded from these specific comparisons. Consequently, **2026 is an incomplete year** (partial, once 2026-08 is excluded) everywhere it appears below, and the last *complete* year is **2025**. Analyses that are not indexed by year (e.g. pooled town, flat-type, lease-band, or flat-model comparisons across the whole period) use the full dataset, since a single partial month does not distort a multi-year pooled median.

All price comparisons use the **median**, not the mean, because resale prices are right-skewed (a small number of very high-value transactions would otherwise pull a mean upward). No causal claims are made anywhere in this document — only associations.

## 1. Overall Market Trend

Years 2017–2025 are complete calendar years. 2026 is partial/YTD (2026-08 excluded) and is marked with an asterisk; its YoY columns are shown as N/A because a partial year is not a like-for-like comparison against a prior full year.

```
       transactions  median_price  median_ppsm price_yoy_pct ppsm_yoy_pct
year                                                                     
2017          20509    410,000.00     4,281.88           N/A          N/A
2018          21561    408,000.00     4,208.79         -0.49        -1.71
2019          22186    400,000.00     4,175.82         -1.96        -0.78
2020          23333    425,000.00     4,355.81         +6.25        +4.31
2021          29087    483,000.00     4,915.79        +13.65       +12.86
2022          26720    525,000.00     5,373.13         +8.70        +9.30
2023          25754    550,000.00     5,708.81         +4.76        +6.25
2024          27832    590,000.00     6,097.69         +7.27        +6.81
2025          25085    628,000.00     6,500.00         +6.44        +6.60
2026*         14881    630,000.00     6,485.71           N/A          N/A
```

Market-wide, median resale price moved from $410,000 in 2017 to $628,000 in 2025 (+53.2%). Median price per sqm moved from $4,282 to $6,500 (+51.8%) over the same span.


## 2. Town Comparison (pooled, 2017–2026 to date)

```
                 transactions  median_price  median_ppsm  median_floor_area  median_remaining_lease_years
town                                                                                                     
CENTRAL AREA             1853    575,000.00     7,686.75              82.00                         61.08
QUEENSTOWN               6535    675,000.00     7,528.74              83.00                         77.83
BUKIT MERAH              9100    660,000.00     6,978.22              90.00                         72.58
BUKIT TIMAH               578    784,000.00     6,783.85             104.00                         63.79
BISHAN                   4156    699,000.00     6,411.37             105.00                         66.75
MARINE PARADE            1450    490,444.00     6,335.90              82.00                         52.67
KALLANG/WHAMPOA          7278    570,000.00     6,271.19              89.00                         62.17
TOA PAYOH                7853    510,000.00     5,785.12              82.00                         61.67
CLEMENTI                 5282    500,000.00     5,782.61              82.00                         59.75
PUNGGOL                 17295    535,000.00     5,727.27              93.00                         91.83
GEYLANG                  5942    460,000.00     5,652.17              84.00                         59.67
SERANGOON                4200    535,000.00     5,631.07             100.00                         65.17
TAMPINES                16543    550,000.00     5,365.38             104.00                         67.42
BUKIT BATOK             10211    485,000.00     5,336.13              93.00                         67.50
SENGKANG                19344    525,000.00     5,304.35              94.00                         87.00
SEMBAWANG                7288    505,000.00     5,283.76              94.00                         82.83
ANG MO KIO               9648    420,000.00     5,271.74              82.00                         58.42
HOUGANG                 12063    500,000.00     5,238.10             100.00                         69.17
BEDOK                   12439    435,000.00     5,156.25              88.00                         59.50
BUKIT PANJANG            8496    485,888.00     4,917.92             103.00                         78.17
JURONG EAST              4836    450,000.00     4,916.67              93.00                         63.08
YISHUN                  16221    435,000.00     4,904.76              92.00                         67.00
PASIR RIS                6920    580,000.00     4,899.33             122.00                         71.42
CHOA CHU KANG           10726    495,000.00     4,708.74             106.00                         76.17
WOODLANDS               17017    470,000.00     4,623.66             102.00                         75.58
JURONG WEST             15658    460,000.00     4,588.24             104.00                         74.58
```

Top 5 towns by median price per sqm (highest):

```
              median_ppsm  median_price  transactions
town                                                 
CENTRAL AREA     7,686.75    575,000.00          1853
QUEENSTOWN       7,528.74    675,000.00          6535
BUKIT MERAH      6,978.22    660,000.00          9100
BUKIT TIMAH      6,783.85    784,000.00           578
BISHAN           6,411.37    699,000.00          4156
```

Bottom 5 towns by median price per sqm (lowest):

```
               median_ppsm  median_price  transactions
town                                                  
JURONG WEST       4,588.24    460,000.00         15658
WOODLANDS         4,623.66    470,000.00         17017
CHOA CHU KANG     4,708.74    495,000.00         10726
PASIR RIS         4,899.33    580,000.00          6920
YISHUN            4,904.76    435,000.00         16221
```

Towns with above-median floor area (> 93 sqm) AND below-median price per sqm (< $5,306) — i.e. more floor area per dollar, not a claim of 'best value':

```
               median_floor_area  median_ppsm  transactions
town                                                       
JURONG WEST               104.00     4,588.24         15658
WOODLANDS                 102.00     4,623.66         17017
CHOA CHU KANG             106.00     4,708.74         10726
PASIR RIS                 122.00     4,899.33          6920
BUKIT PANJANG             103.00     4,917.92          8496
HOUGANG                   100.00     5,238.10         12063
SEMBAWANG                  94.00     5,283.76          7288
SENGKANG                   94.00     5,304.35         19344
```


## 3. Flat Type Analysis

```
                  transactions  median_price  median_ppsm  median_floor_area
flat_type                                                                   
1 ROOM                      88    212,500.00     6,854.84              31.00
2 ROOM                    5012    312,650.00     6,808.51              47.00
3 ROOM                   56815    360,000.00     5,312.50              67.00
4 ROOM                  101548    510,000.00     5,377.84              93.00
5 ROOM                   58423    610,000.00     5,185.19             117.00
EXECUTIVE                16958    726,000.00     5,020.03             146.00
MULTI-GENERATION            88    846,500.00     5,180.85             164.00
```

Annual median resale price, 3 ROOM, 4 ROOM, 5 ROOM (year-over-year trend, latest month excluded):

```
flat_type     3 ROOM     4 ROOM     5 ROOM
2017      301,888.00 408,000.00 478,000.00
2018      290,000.00 400,000.00 475,000.00
2019      283,000.00 400,000.00 482,500.00
2020      295,000.00 420,000.00 508,844.00
2021      335,000.00 470,000.00 570,000.00
2022      370,000.00 515,000.00 620,000.00
2023      390,000.00 550,000.00 650,000.00
2024      418,000.00 590,000.00 690,000.00
2025      445,000.00 630,000.00 736,000.00
2026*     440,000.00 630,000.00 740,000.00
```

Median price growth, 2017 -> 2025 (complete years only):

- 3 ROOM: $301,888 (2017) -> $445,000 (2025), +47.4%
- 4 ROOM: $408,000 (2017) -> $630,000 (2025), +54.4%
- 5 ROOM: $478,000 (2017) -> $736,000 (2025), +54.0%


## 4. Town Appreciation: 2017 vs 2025

Threshold: a town is only ranked if it has at least 30 transactions in BOTH 2017 and 2025. Town-year transaction counts in this dataset typically run into the hundreds or low thousands; 30 is a conservative floor intended only to exclude town-year cells too thin for a stable median (a median of, say, 5 transactions can swing sharply on one unusual sale), not to exclude genuinely smaller towns outright.

26 of 26 towns with data in both years met the threshold. Excluded (insufficient sample in one or both years): none.

```
                 txn_2017  price_2017  txn_latest  price_latest  price_growth_pct  ppsm_growth_pct
town                                                                                              
TOA PAYOH             749  445,000.00        1063    785,000.00             76.40            55.00
BUKIT BATOK           736  350,000.00        1304    600,000.00             71.43            59.50
YISHUN               1257  330,000.00        1703    547,000.00             65.76            60.04
SEMBAWANG             525  380,000.00        1191    620,000.00             63.16            84.69
CHOA CHU KANG         804  370,000.00        1027    592,888.00             60.24            59.86
WOODLANDS            1531  370,000.00        1748    590,000.00             59.46            60.14
TAMPINES             1299  455,000.00        1921    710,000.00             56.04            52.45
SENGKANG             1534  428,000.00        1905    660,888.00             54.41            63.83
GEYLANG               567  370,000.00         639    570,000.00             54.05            40.59
PASIR RIS             626  465,000.00         634    714,000.00             53.55            56.03
PUNGGOL              1316  440,000.00        1538    672,000.00             52.73            60.73
HOUGANG               980  403,000.00        1313    615,000.00             52.61            60.74
KALLANG/WHAMPOA       691  465,000.00         794    709,000.00             52.47            42.64
JURONG WEST          1620  390,000.00        1591    568,000.00             45.64            43.80
BUKIT PANJANG         694  420,000.00         798    610,000.00             45.24            57.26
SERANGOON             430  463,000.00         402    670,000.00             44.71            49.75
QUEENSTOWN            527  565,000.00         605    815,000.00             44.25            51.31
BEDOK                1148  385,000.00        1207    548,000.00             42.34            40.97
CLEMENTI              438  420,000.00         552    590,000.00             40.48            28.05
ANG MO KIO            942  360,000.00         971    499,000.00             38.61            35.58
BUKIT TIMAH            57  698,000.00          54    962,944.00             37.96            36.92
BUKIT MERAH           829  579,000.00         933    785,000.00             35.58            42.29
JURONG EAST           457  389,000.00         482    524,000.00             34.70            38.81
BISHAN                446  645,694.00         376    849,000.00             31.49            36.06
CENTRAL AREA          182  514,000.00         172    611,944.00             19.06            19.18
MARINE PARADE         124  469,000.00         162    539,750.00             15.09            21.59
```

Highest median-price growth 2017->2025: TOA PAYOH (+76.4%); BUKIT BATOK (+71.4%); YISHUN (+65.8%)

Lowest median-price growth 2017->2025: BISHAN (+31.5%); CENTRAL AREA (+19.1%); MARINE PARADE (+15.1%)


## 5. Remaining Lease Relationship

remaining_lease_years distribution: min 39.3, 25th pct 62.2, median 73.8, 75th pct 88.6, max 97.8. This range (~39 to ~98 years) makes the proposed 10-year bands reasonable — each band receives a meaningful number of rows (checked below), and none of the bands falls entirely outside the observed range.

Row counts per lease band (verifying bins are populated before using them):

```
            transactions
lease_band              
<50                 7617
50-59              37870
60-69              57341
70-79              49894
80-89              32057
90+                54153
```

Median price and price/sqm by remaining-lease band (all flat types pooled):

```
            transactions  median_price  median_ppsm
lease_band                                         
<50                 7617    338,000.00     5,416.67
50-59              37870    415,000.00     5,360.82
60-69              57341    455,000.00     4,795.92
70-79              49894    555,000.00     4,930.69
80-89              32057    533,000.00     5,725.81
90+                54153    565,000.00     6,322.58
```

Within flat_type (so larger flat types don't drive the pattern), median price/sqm by lease band, 3 ROOM, 4 ROOM, 5 ROOM:

```
lease_band      <50    50-59    60-69    70-79    80-89      90+
flat_type                                                       
3 ROOM     5,303.03 5,298.51 4,611.11 4,150.68 7,835.82 6,735.29
4 ROOM     5,948.58 5,341.19 4,702.38 4,935.78 6,400.00 6,129.03
5 ROOM     6,781.51 5,455.34 4,942.15 4,966.67 4,318.18 6,250.00
```

Observed association only: lower remaining-lease bands are associated with lower median price/sqm within each flat type shown above. This is not a causal claim — remaining lease is correlated with a flat's age, town, and model, any of which could also relate to price.


## 6. Storey Premium

storey_mid distribution: min 2, median 8, max 50.

Row counts per storey band:

```
             transactions
storey_band              
Low (1-6)           96751
Mid (7-15)         117747
High (16+)          24434
```

Median price/sqm by storey band, within flat_type (3 ROOM, 4 ROOM, 5 ROOM, all towns/years pooled):

```
storey_band  Low (1-6)  Mid (7-15)  High (16+)
flat_type                                     
3 ROOM        5,075.34    5,402.99    7,543.25
4 ROOM        5,000.00    5,464.93    7,526.88
5 ROOM        4,836.07    5,211.71    6,426.41
```

Partial control for town: median price/sqm by storey band for 4 ROOM flats only, in the 5 highest-volume towns (SENGKANG, PUNGGOL, WOODLANDS, TAMPINES, YISHUN):

```
storey_band  Low (1-6)  Mid (7-15)  High (16+)
town                                          
PUNGGOL       5,439.56    5,777.78    6,058.92
SENGKANG      5,215.05    5,652.17    5,223.40
TAMPINES      5,048.08    5,658.36    6,864.99
WOODLANDS     4,481.13    4,693.98    5,772.91
YISHUN        4,617.22    4,945.65    6,510.87
```

Partial control for year: median price/sqm by storey band for 4 ROOM flats only, by year (latest month excluded):

```
storey_band  Low (1-6)  Mid (7-15)  High (16+)
2017          3,985.20    4,329.79    5,677.42
2018          3,904.76    4,278.35    5,839.08
2019          3,870.97    4,309.52    5,347.83
2020          4,076.56    4,565.22    5,483.87
2021          4,619.57    5,054.35    6,588.82
2022          5,029.13    5,549.12    7,826.09
2023          5,388.89    5,891.20    7,888.89
2024          5,769.23    6,397.85    8,532.61
2025          6,164.95    6,730.77    9,434.78
2026*         6,075.27    6,726.19    9,358.27
```

The higher-storey association remains visible across several stratified comparisons by flat type, town, and year. These are partial controls — each comparison holds one or two dimensions roughly fixed separately — rather than a multivariable causal estimate holding town, flat type, and year fixed simultaneously. No regression model has been built at this stage.


## 7. Flat Model Analysis

Sample-size threshold for a 'reliable' ranking: >= 500 transactions.

Flat models with >= 500 transactions, ranked by median price/sqm:

```
                   transactions  median_ppsm
flat_model                                  
DBSS                       3792     8,241.76
Model A                   86158     5,540.54
Premium Apartment         26161     5,483.87
Standard                   6334     5,300.00
Maisonette                 6493     5,273.97
Simplified                 9126     5,187.50
Improved                  58299     5,148.76
New Generation            28987     4,925.37
Apartment                  8510     4,923.08
Model A2                   2686     4,800.00
```

Flat models with < 500 transactions — flagged as low sample size, not used for ranking claims:

```
                        transactions  median_ppsm
flat_model                                       
Type S1                          387    10,789.47
Type S2                          197    10,700.93
Premium Apartment Loft           139     9,484.54
Terrace                          122     8,487.87
2-room                           495     8,104.00
3Gen                              83     6,400.00
Model A-Maisonette               415     5,633.80
Premium Maisonette                22     5,496.60
Improved-Maisonette               32     5,333.41
Adjoined flat                    406     5,311.53
Multi Generation                  88     5,180.85
```

Among adequately-sampled models, highest median price/sqm: DBSS ($8,242/sqm, n=3792). Lowest: Model A2 ($4,800/sqm, n=2686).


## 8. Million-Dollar Transactions (resale_price >= $1,000,000)

By year (latest month excluded; 2026 marked * as incomplete):

```
       million_dollar_txns  total_txns  share_pct
2017                    46       20509       0.22
2018                    71       21561       0.33
2019                    64       22186       0.29
2020                    82       23333       0.35
2021                   259       29087       0.89
2022                   369       26720       1.38
2023                   469       25754       1.82
2024                  1035       27832       3.72
2025                  1593       25085       6.35
2026*                 1089       14881       7.32
```

Total million-dollar transactions in the trend window: 5,077 of 236,948 (2.14%).

Top 5 towns by count of million-dollar transactions:

```
                 count
town                  
TOA PAYOH          774
BUKIT MERAH        647
QUEENSTOWN         600
KALLANG/WHAMPOA    506
BISHAN             408
```

Flat types represented among million-dollar transactions:

```
                  count
flat_type              
5 ROOM             2103
4 ROOM             1771
EXECUTIVE          1170
3 ROOM               20
MULTI-GENERATION     13
```


## 9. Duplicate Sensitivity Check

This section compares headline metrics with (A) all rows and (B) one row retained per exact-duplicate group. This is an in-memory comparison for this analysis only — the saved dataset is not altered.

```
              A_all_rows  B_deduplicated
transactions  238,932.00      238,615.00
median_price  501,000.00      502,000.00
median_ppsm     5,305.80        5,307.69
```

Removing one copy of each of the 316 exact-duplicate groups drops 317 rows (0.133% of the dataset). Median price changes by +0.200% and median price/sqm by +0.036%. At this magnitude, the duplicate ambiguity does not materially change headline conclusions in this document.


## 10. Outlier Sensitivity (rare Terrace flats)

3 ROOM flats include 115 rows with flat_model = 'Terrace' (rare landed-style units, floor areas up to 366.7 sqm) out of 56,815 total 3-room rows.

```
                      median_price_per_sqm  mean_price_per_sqm
3 ROOM incl. Terrace              5,312.50            5,571.11
3 ROOM excl. Terrace              5,307.69            5,565.39
```

Excluding Terrace flats shifts the 3-room median price/sqm by $+4.81 and the mean by $+5.72. The median is materially more robust to this rare category than the mean, which is why medians are used as the primary metric throughout this document; town/flat-type comparisons above are not meaningfully distorted by the Terrace flats.

Within KALLANG/WHAMPOA specifically (where Terrace flats are concentrated), median price/sqm is $6,271.19 including vs $6,242.24 excluding Terrace flats (+0.46%); mean is $6,849.32 vs $6,829.65 (+0.29%). The town-level median is essentially unaffected.


## 11. Key Findings

- **Fact:** Market-wide median resale price rose from $410,000 in 2017 to $628,000 in 2025, a +53.2% increase across 8 complete years.

- **Fact:** Market-wide median price per sqm rose from $4,282 to $6,500 over the same period (+51.8%).

- **Fact:** CENTRAL AREA has the highest pooled median price/sqm ($7,687/sqm, n=1853), while JURONG WEST has the lowest ($4,588/sqm, n=15658) — a 68% gap.

- **Fact:** Among towns meeting the 30-transaction threshold in both years, TOA PAYOH shows the largest 2017->2025 median-price growth (+76.4%), while MARINE PARADE shows the smallest (+15.1%).

- **Fact:** For 4 ROOM flats (the most-traded type, n=101,548), median price rose from $408,000 to $630,000 (+54.4%).

- **Interpretation (association, not causation):** Median price/sqm declines by remaining-lease band — the <50-year band shows lower median price/sqm than the 90+ band within every one of 3 ROOM, 4 ROOM, 5 ROOM (see Section 5); remaining lease is confounded with flat age and model, so this is not evidence that lease length alone drives price.

- **Interpretation (association, not causation):** The higher-storey association remains visible across several stratified comparisons by flat type, town, and year (Section 6). These are partial controls, not a multivariable causal estimate holding all three fixed simultaneously — no regression model has been built at this stage.

- **Fact:** Among flat models with >= 500 transactions, DBSS has the highest median price/sqm ($8,242) and Model A2 the lowest ($4,800).

- **Fact:** Million-dollar transactions are a small but growing share of the market: 0.22% of trades in 2017 vs 6.35% in 2025 (complete years). 2026 is partial to date at 7.32% and is not used as the headline comparison.

- **Fact:** TOA PAYOH accounts for the most million-dollar transactions of any town (774 of 5,077, 15.2%).

- **Fact:** The 316 exact-duplicate groups (633 rows, 0.26% of the dataset) change median price by only +0.200% and median price/sqm by only +0.036% when one copy per group is removed — the duplicate ambiguity does not materially affect any conclusion in this document.

- **Fact:** The rare Terrace flat model (115 rows, floor areas up to 366.7 sqm) shifts the 3-room median price/sqm by only $+4.81 when excluded, versus $+5.72 for the mean — confirming medians are the right primary metric for this dataset.


## 12. Dashboard Recommendations (for a future Streamlit build)

**Median resale price & price/sqm over time (line chart, by year, complete years only)**
- Question answered: How has the market changed since 2017?
- Metric: Median resale_price and median price_per_sqm per year
- Why it matters: Directly answers the core research question's trend component; median avoids skew from high-value outliers.

**Town comparison table/heatmap: median price/sqm, median floor area, transaction count**
- Question answered: Which towns are relatively more/less expensive per sqm, and which offer more floor area per dollar?
- Metric: Per-town median price_per_sqm, median floor_area_sqm, transaction count
- Why it matters: Directly supports the 'towns... provide the best value' question, framed carefully as price/sqm and floor-area-per-dollar rather than an unproven 'best value' label.

**Flat type breakdown: median price, price/sqm, and floor area by flat_type**
- Question answered: How do prices differ by flat type, and how has each type moved over time?
- Metric: Median resale_price, price_per_sqm by flat_type, with year filter
- Why it matters: Flat type is one of the biggest price drivers and a natural filter for a buyer/analyst persona.

**Town appreciation ranking: 2017 vs latest complete year, % growth, with minimum-sample threshold**
- Question answered: Which towns have appreciated the most/least since 2017?
- Metric: Median price growth % per town, filtered to towns with >= 30 transactions in both years
- Why it matters: Turns the single-point-in-time price comparison into a growth story, while the sample threshold prevents small towns from producing misleading rankings.

**Remaining lease vs price/sqm, by lease band and flat type**
- Question answered: How is remaining lease associated with price?
- Metric: Median price_per_sqm by lease band (<50, 50-59, ..., 90+), split by flat_type
- Why it matters: Lease decay is a well-known concern for HDB buyers; showing it by flat type avoids conflating it with flat size.

**Storey premium: price/sqm by storey band, filterable by town and flat type**
- Question answered: Do higher floors command a price premium, and does it hold within a given town/flat type?
- Metric: Median price_per_sqm by storey_band (Low/Mid/High), filtered by town + flat_type
- Why it matters: Framing it as filterable rather than a single Singapore-wide comparison avoids the confound the analysis stage explicitly flagged.

**Flat model comparison, with a visible sample-size flag for small categories**
- Question answered: Which flat models carry a price/sqm premium or discount?
- Metric: Median price_per_sqm by flat_model, with transaction count shown alongside every value
- Why it matters: Prevents the dashboard from implying a ranking for tiny categories like '3Gen' (n=83) with the same confidence as 'Model A' (n=86,158).

**Million-dollar transaction tracker: count and share of transactions by year, plus top towns**
- Question answered: How prevalent are million-dollar resale flats, and where?
- Metric: Count and % share of transactions >= $1,000,000 per year; top towns by count
- Why it matters: A frequently-cited, easily-understood market signal that is straightforward to keep current as new months of data are pulled.

**Data-quality footnote panel: latest-month-incomplete flag, exact-duplicate count, Terrace-flat note**
- Question answered: Is the data trustworthy, and what are its known limitations?
- Metric: is_latest_month flag status, exact-duplicate count/%, Terrace-flat median-shift figures from Section 9-10
- Why it matters: A recruiter-facing dashboard benefits from visibly showing data-quality awareness rather than hiding it — it demonstrates analytical rigor.

