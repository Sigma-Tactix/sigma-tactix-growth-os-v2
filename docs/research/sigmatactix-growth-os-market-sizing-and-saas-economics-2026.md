# SigmaTactix Growth OS - Market Sizing and SaaS Economics

**Research date:** 2026-09-30  
**Audience:** Founder and investor-video planning  
**Scope:** Businesses, fractional CMOs, and agencies; GCC-first, then selected global markets  
**Status:** Research and scenario model, not a forecast, valuation, or statement of traction

## Executive conclusion

SigmaTactix can support a credible investor narrative, but it should use a bottom-up account model rather than a generic marketing-technology market report.

The strongest current evidence is:

1. The launch geography is large enough. The UAE reported more than 557,000 SMEs in 2022, while Saudi Arabia reported more than 1.6 million commercial registrations through Q4 2024. These measures are not identical and must not be presented as a harmonized GCC business count.
2. The adjacent software category is already measured in billions of dollars. HubSpot generated $3.13 billion of revenue in 2025 from 288,706 customers, while Adobe Digital Experience generated $5.41 billion of subscription revenue in FY2025. These figures validate category scale, not SigmaTactix's TAM.
3. The executable $499, $1,499, and $3,499 tiers are plausible software prices, but they underprice the proposed implementation, governance, multi-workspace, and strategic operating value. The post-validation commercial model therefore separates recurring software, mandatory implementation, workspace expansion, and metered usage.
4. SigmaTactix cannot win as another dashboard or point tool. The economic case depends on combining governed strategy, institutional knowledge, multi-workspace execution, and evidence-backed measurement in one operating layer.
5. The revised premium-price model deliberately reduces the price-qualified account pool and assumes 25% fewer first-year paid accounts than the original volume case. It produces a **$583.9 million UAE-plus-Saudi launch SAM**, a **$17.43 billion selected-market TAM**, and a **September 2027 exit run rate of approximately $186,000 MRR / $2.23 million ARR**. None of these figures are actual demand, bookings, customers, or revenue.

## Evidence rules

- **Published fact** means a figure taken directly from a government source, an official company page, or a public-company filing.
- **Internal product fact** means a value found in the current repository. It does not prove that a feature is deployed, that a price has been accepted, or that a customer exists.
- **Model assumption** means a chosen input for scenario planning. Assumptions must be replaced with pilot evidence as it becomes available.
- **Modeled output** is arithmetic derived from published facts and assumptions. It is not market research reported by a third party.

## Product and pricing baseline

The current subscription migration defines the following commercial architecture:

| Plan | Annual-commit monthly price | Month-to-month price | Intended internal segment |
|---|---:|---:|---|
| Starter OS | $499 | $599 | Seed-stage startups, boutique consultancies, and single-product businesses |
| Growth OS | $1,499 | $1,799 | Growth-stage B2B businesses, mid-market SaaS, and scaling agencies |
| Enterprise / Agency OS | $3,499 | $4,999 | Multi-brand groups, enterprise clients, and agencies white-labeling the OS |

Source: [`backend/database/migrations/0009_subscription_tiers.sql`](../../backend/database/migrations/0009_subscription_tiers.sql).

These are the current executable pricing definitions, not the recommended go-to-market prices. The `$49 / $199 / $499` prices in `SigmaTactix_Meeting_Brief_v2.md` are an older planning proposal and conflict with the database migration, pricing constants, tenant UI, and onboarding flow. They should not be used.

### Recommended post-validation commercial model

| Commercial offer | Recurring price on annual commitment | Mandatory implementation | Included capacity | Expansion model |
|---|---:|---:|---|---|
| Intelligence OS | $1,250/mo | $3,000-$5,000 | 1 workspace; diagnostics, Second Brain foundation, intelligence and roadmap | Metered data and agent usage above allowance |
| Growth OS | $3,500/mo | $7,500-$12,500 | 1 operating workspace; governed growth workflows, five verified connectors and strategy cadence | Additional connectors, usage and specialist services |
| Portfolio OS | $7,500/mo | $15,000-$25,000 | 5 active client workspaces; portfolio controls, reusable templates and priority support | $750-$1,000 per additional active workspace |
| Sovereign Enterprise OS | From $12,500/mo | $30,000-$75,000 | Custom deployment, governance, security review and service level | Contracted by brands, business units, integrations and support scope |

This model fixes three commercial risks in cadence:

1. **Agency value capture:** multi-client capacity is no longer sold as an effectively unlimited $3,499 bundle.
2. **Implementation recovery:** Second Brain configuration, data mapping, connector verification, governance and enablement are paid implementation work.
3. **Proof before premium:** these are post-validation list prices. The Founding 10 tests willingness to pay before the model is presented as proven.

### Founding 10 design-partner offer

| Founding offer | Six-month recurring price | Setup contribution |
|---|---:|---:|
| Intelligence OS | $750/mo | $1,500 |
| Growth OS | $2,000/mo | $3,500 |
| Portfolio OS | $4,500/mo | $7,500 |

Founding pricing is exchanged for structured feedback, measured value evidence and optional permissioned case-study participation. A completely free cohort can validate usability, but it cannot validate willingness to pay.

### Modeled blended ARPA

Three tier-mix scenarios make pricing sensitivity explicit:

| Scenario | Intelligence mix | Growth mix | Portfolio mix | Blended monthly ARPA |
|---|---:|---:|---:|---:|
| Lower-value mix | 70% | 25% | 5% | $2,125 |
| Base mix | 50% | 35% | 15% | $2,975 |
| Higher-value mix | 30% | 45% | 25% | $3,825 |

The revised base model uses **$2,975 monthly ARPA**, equal to **$35,700 annualized recurring revenue per paid account**. Tier mix, price acceptance and expansion behavior are assumptions, not observed customer behavior. One-time implementation revenue is excluded from ARPA and MRR.

## Market evidence

### GCC launch market

| Published fact | Source | Interpretation | Limitation |
|---|---|---|---|
| The UAE had more than 557,000 SMEs in 2022. The official breakdown was about 395,000 micro, 150,000 small, and 13,000 medium enterprises. | [UAE Ministry of Economy and Tourism](https://www.moet.gov.ae/en/entrepreneurs-and-smes) | A large domestic base exists across all three proposed tiers. | The count is from 2022 and does not identify companies with active growth teams or sufficient software budgets. |
| SMEs represented 94% of UAE businesses and contributed 63.5% of non-oil GDP. | [UAE Ministry of Economy and Tourism](https://www.moet.gov.ae/en/-/%D9%88%D8%B2%D8%A7%D8%B1%D8%AA%D8%A7-%D8%A7%D9%84%D8%A7%D9%82%D8%AA%D8%B5%D8%A7%D8%AF-%D9%88%D8%A7%D9%84%D9%85%D8%A7%D9%84%D9%8A%D8%A9-%D8%AA%D8%B7%D9%84%D9%82%D8%A7%D9%86-%D9%85%D8%A4%D8%B4%D8%B1%D8%A7%D9%8B-%D9%84%D9%82%D9%8A%D8%A7%D8%B3-%D9%85%D8%AF?p_l_back_url=%2Fen%2Ftest1%3Fcategory%3D752020%26category%3D397571%26tag%3D2022%26delta%3D60%26start%3D4) | SMEs are economically important, not a marginal niche. | Economic contribution is not software spend. |
| The UAE had 1.021 million registered companies by mid-2024. | [UAE Cabinet / Dubai Media Office](https://mediaoffice.ae/en/news/2024/september/02-09/uae-cabinet) | This is a newer ceiling for the total registered-company universe. | Registered companies are not necessarily active, qualified buyers. |
| Saudi Arabia had more than 1.6 million commercial registrations through Q4 2024. | [Monsha'at Q4 2024 SME Monitor](https://www.monshaat.gov.sa/sites/default/files/2025-03/Quarterly_Report_Q4_2024_EN.pdf) | Saudi Arabia provides the largest nearby expansion pool. | A commercial registration is not necessarily a unique active company or SME. |
| Saudi Arabia reached 1.68 million SME commercial registrations by Q1 2025. | [Monsha'at release](https://www.monshaat.gov.sa/en/node/316532) | Directionally confirms continued formation and expansion. | Same registration-versus-company limitation. |
| GCC nominal GDP reached about $2.3 trillion with a population of 61.5 million in 2024. | [GCC-Stat data portal](https://dp.marsa.gccstat.org/ar) | The regional economy has scale and purchasing power. | Macro size is not marketing-software demand. |

No recent official source provides one harmonized, same-year count of addressable businesses across all six GCC countries. The investor script should say **"UAE and Saudi launch market"** when using the modeled figures below, not "the entire GCC market."

### Selected global-market inputs

| Market | Published denominator | High-fit modeling treatment |
|---|---:|---:|
| European Union | 33.1 million enterprises in 2023; 246,000 medium and 53,000 large | Use the published 299,000 medium-plus-large enterprises as a conservative high-fit pool. [Eurostat](https://ec.europa.eu/eurostat/web/products-eurostat-news/w/ddn-20241205-1) |
| United Kingdom | 266,855 private-sector businesses with 10 or more employees in 2025 | Use the published count: 220,085 with 10-49 employees, 38,435 with 50-249, and 8,335 with 250+. [UK Department for Business and Trade](https://www.gov.uk/government/statistics/business-population-estimates-2025/business-population-estimates-for-the-uk-and-regions-2025-statistical-release) |
| United States | 6.2 million employer firms in the 2022 Economic Census | Apply a 5% model filter for size, marketing activity, digital maturity, and budget, producing 310,000 candidate accounts. [U.S. Census Bureau](https://www.census.gov/library/stories/2024/06/economic-census-annual-business-survey-results.html) |
| Canada | 1.36 million employer businesses in December 2024 | Apply the same 5% model filter, producing 68,000 candidate accounts. [Statistics Canada](https://www150.statcan.gc.ca/n1/daily-quotidien/250214/dq250214e-eng.htm) |
| UAE | More than 557,000 SMEs in 2022 | Apply a 3% model filter, producing 16,710 candidate accounts. |
| Saudi Arabia | More than 1.6 million commercial registrations through Q4 2024 | Apply a stricter 1% model filter because registrations are broader than active employer firms, producing 16,000 candidate accounts. |

The 5%, 3%, and 1% fit rates are SigmaTactix assumptions. They are not published adoption rates.

## Bottom-up TAM, SAM, and SOM

### TAM - selected-market premium-fit reference model

The prior high-fit pools produce 976,565 modeled candidate accounts. Because the recommended prices target a narrower buyer, the revised model applies a further 50% price-qualification factor, producing **488,283 premium-fit candidate accounts**:

`976,565 prior candidates x 50% premium-price fit = 488,283 accounts`

At the revised base blended ARPA of $35,700 per year:

`488,283 accounts x $35,700 = $17.43 billion modeled annual TAM`

This is a reconstructable planning estimate, not a third-party market-size statistic. It excludes many global markets, but it also relies on assumed fit filters in four geographies. The investor video should present it as **"our bottom-up selected-market TAM model"**, followed immediately by the assumptions.

### SAM - UAE and Saudi launch model

| Scenario | UAE fit assumption | Saudi fit assumption | Serviceable accounts | Annual revenue capacity at base ARPA |
|---|---:|---:|---:|---:|
| Conservative | 0.75% = 4,178 | 0.25% = 4,000 | 8,178 | $291.9M |
| Base | 1.5% = 8,355 | 0.5% = 8,000 | 16,355 | $583.9M |
| Expanded | 3% = 16,710 | 1% = 16,000 | 32,710 | $1.168B |

This launch SAM is directional because the UAE denominator counts SMEs and the Saudi denominator counts commercial registrations. It is still useful when the different treatments and filters are shown.

### SOM - execution-constrained customer model

SOM should be based on acquisition and service capacity, not a convenient percentage of TAM.

| Horizon | Conservative paid accounts | Base paid accounts | Upside paid accounts | Base-case exit MRR | Base-case exit ARR |
|---|---:|---:|---:|---:|---:|
| End of year 1 | 25 | 60-65 | 120 | $179K-$193K | $2.14M-$2.32M |
| End of year 3 | 100 | 300 | 750 | $892.5K | $10.71M |
| End of year 5 | 250 | 1,000 | 2,000 | $2.98M | $35.70M |

The base year-3 scenario represents about **1.83% of the modeled UAE-plus-Saudi premium-fit SAM**. The base year-5 scenario represents about **6.11%**. Both require a repeatable agency/fractional-CMO channel and cannot be achieved through founder-led selling alone.

## Illustrative month-by-month revenue path

This model starts with the first 10 design partners in October 2026. To reflect price elasticity, it assumes 25% fewer paid accounts than the original $1,299-ARPA volume case. Monthly logo churn remains 2%. Blended recurring ARPA is $2,975; implementation revenue is excluded.

| Month | Paid accounts at month end | MRR | ARR run rate |
|---|---:|---:|---:|
| Oct 2026 | 0.0 | $0 | $0 |
| Nov 2026 | 3.8 | $11,156 | $133,875 |
| Dec 2026 | 6.7 | $19,858 | $238,298 |
| Jan 2027 | 10.3 | $30,568 | $366,817 |
| Feb 2027 | 14.5 | $43,286 | $519,435 |
| Mar 2027 | 19.6 | $58,236 | $698,828 |
| Apr 2027 | 25.1 | $74,747 | $896,963 |
| May 2027 | 31.4 | $93,489 | $1,121,872 |
| Jun 2027 | 38.3 | $113,794 | $1,365,525 |
| Jul 2027 | 45.8 | $136,106 | $1,633,275 |
| Aug 2027 | 53.8 | $160,204 | $1,922,445 |
| Sep 2027 | 62.6 | $186,086 | $2,233,035 |

Modeled subscription revenue recognized across those 12 months is approximately **$928,000**. ARR in the table is the annualized exit run rate for that month, not revenue already earned. Implementation revenue would be additive but is not modeled until tier conversion and delivery capacity are validated.

### Formula

`Ending paid accounts = prior-month paid accounts x (1 - monthly churn) + gross new paid accounts`

`MRR = ending paid accounts x blended monthly ARPA`

`ARR run rate = MRR x 12`

No existing SigmaTactix customer, conversion, retention, CAC, MRR, or ARR data was found in the repository. The numbers above are planning assumptions only.

## Comparable pricing and category economics

### Current price anchors

| Comparable | Current published price | What it establishes | What it does not establish |
|---|---:|---|---|
| HubSpot Marketing Hub Professional | Starts at $890/mo plus $3,000 onboarding | Mid-market teams already pay near the Sigma Growth tier for integrated marketing automation. [HubSpot pricing](https://www.hubspot.com/pricing/marketing) | Direct feature equivalence or willingness to pay SigmaTactix |
| HubSpot Marketing Hub Enterprise | Starts at $3,600/mo plus $7,000 onboarding | Sigma's $3,499 annual-commit Agency tier is within an established enterprise software price band. [HubSpot product catalog](https://legal.hubspot.com/hubspot-product-and-services-catalog) | That Sigma currently delivers HubSpot's maturity, integrations, or support |
| HighLevel Unlimited / SaaS Pro | $297 / $497 per month | Agencies expect multi-account and white-label economics at aggressive price points. [HighLevel pricing](https://www.gohighlevel.com/30-day-trial-11) | That an unlimited-workspace model is sustainable for Sigma |
| Semrush Business | $499/mo, or $416.66/mo billed annually | Specialized agency and mid-market intelligence is available at the Sigma Starter price. [Semrush pricing](https://www.semrush.com/pricing/) | A full strategy-to-execution operating system at that price |
| AgencyAnalytics | $20 per client per month, billed annually | Reporting by itself is highly price-competitive and scales per managed client. [AgencyAnalytics pricing](https://agencyanalytics.com/pricing) | Strategy, knowledge governance, execution, or orchestration |

### Public SaaS operating benchmarks

| Company | 2025 published metric | Use in the Sigma model |
|---|---:|---|
| HubSpot | 288,706 customers, $3.13B revenue, $11,414 average subscription revenue per customer, 103.5% net revenue retention, and 84% GAAP gross margin | Validates a large global mid-market category and provides mature-state reference points. [HubSpot 2025 Form 10-K](https://ir.hubspot.com/node/15156/html) |
| monday.com | $1.232B revenue, 89% GAAP gross margin, and more than 250,000 customers | Shows the scale and gross-margin potential of a broad workflow platform. [monday.com FY2025 results](https://ir.monday.com/news-and-events/news-releases/news-details/2026/monday-com-Announces-Fourth-Quarter-and-Fiscal-Year-2025-Results/) |
| Adobe Digital Experience | $5.41B subscription revenue in FY2025 | Confirms multi-billion-dollar demand for integrated digital-experience and marketing operations. [Adobe 2025 Form 10-K](https://www.sec.gov/Archives/edgar/data/796343/000079634326000003/adbe-20251128.htm) |

HubSpot and monday.com are mature public companies. Their 84%-89% gross margins are not reasonable launch-period assumptions for a new company offering onboarding, support, and advisory services.

## SigmaTactix unit-economics scenarios

| Input / output | Conservative | Base | Upside |
|---|---:|---:|---:|
| Monthly ARPA | $2,125 | $2,975 | $3,825 |
| Gross-margin assumption | 60% | 65% | 75% |
| Gross profit per account / month | $1,275 | $1,934 | $2,869 |
| Blended CAC assumption | $8,000 | $5,000 | $3,000 |
| CAC payback | 6.3 months | 2.6 months | 1.0 months |
| Monthly logo churn | 3.0% | 2.0% | 1.5% |
| 24-month gross-profit LTV | $22,034 | $37,174 | $58,170 |
| 24-month LTV / CAC | 2.8x | 7.4x | 19.4x |

These are decision thresholds, not measured SigmaTactix economics. The apparently strong base and upside ratios are a reason to test willingness to pay, not evidence that the economics exist. Higher prices may lengthen sales cycles, reduce conversion, increase onboarding expectations and raise CAC. The first cohort must replace these assumptions with observed figures.

### Costs that must be included in COGS

- AI model and agent-run usage
- Data, scraping, enrichment, and connector API costs
- Cloud, database, storage, observability, and export/rendering costs
- Customer-specific onboarding labor
- Ongoing support and fractional strategy time
- Failed/retried agent work and human approval overhead
- Payment processing and third-party usage passed through or absorbed

The repository's token-cost function currently adds AI token cost and a default $35 cloud allocation. That is not a complete production COGS model. Gross margin should not be presented from this function alone.

## Business-model implications

### 1. Keep software and service economics separate

Use recurring software revenue for access, workspaces, governance, usage allowances, and core support. Charge separately for migration, custom integrations, implementation, and strategic advisory. Otherwise high-touch work will be hidden inside SaaS COGS and distort margin.

### 2. Use onboarding fees after the founding cohort

HubSpot charges $3,000 for Professional onboarding and $7,000 for Enterprise onboarding. A Sigma onboarding fee is commercially defensible if it covers Second Brain setup, data mapping, connector verification, governance configuration, and team enablement. The first 10 testers can receive a waiver or discount in exchange for structured feedback and permissioned case-study evidence.

### 3. Do not offer unlimited agency usage without safeguards

HighLevel establishes a $497 unlimited-account anchor, while AgencyAnalytics prices per managed client. Sigma's Agency tier should define included active client workspaces, agent-run allowances, data/connector limits, and overage pricing. "Unlimited workspaces" without a cost boundary can undermine gross margin.

### 4. Make agencies and fractional CMOs a distribution channel

HubSpot reports that partners and referrals represented about 49% of 2025 revenue. Sigma can use agencies and fractional CMOs as portfolio operators who bring multiple client workspaces, reducing CAC and increasing account expansion. This is more scalable than treating every agency only as a direct end customer.

### 5. Track value proof before promising ROI

The repository contains sample ROI, pipeline, and diagnostic figures. They must not appear in an investor video as customer evidence. The first 10 pilot users should establish:

- time from signup to first verified data source
- time to first approved strategy and executable task
- weekly active decision-makers
- approved agent actions completed
- hours of manual work displaced
- number of tools or reports consolidated
- 30-, 60-, and 90-day retention
- pilot-to-paid conversion
- expansion from one workspace to multiple workspaces
- actual infrastructure, AI, data, onboarding, and support cost per account

## Recommended investor-video claims

These claims are supportable now:

- "We are launching into the UAE and Saudi Arabia, markets with hundreds of thousands of SMEs and more than 1.6 million Saudi commercial registrations."
- "Our bottom-up UAE-plus-Saudi launch model identifies a base serviceable pool of about 32,700 accounts, using explicit 3% and 1% fit filters."
- "At our modeled tier mix, that equates to roughly $510 million in annual revenue capacity. This is a planning model, not booked demand."
- "The adjacent category is already worth billions: HubSpot generated $3.13 billion in 2025 revenue and Adobe Digital Experience generated $5.41 billion in subscription revenue."
- "Our first commercial proof point is not a vanity TAM. It is converting the first 10 testers into measurable retention, verified value, and repeatable acquisition economics."

These claims are not supportable yet:

- "SigmaTactix has customers, MRR, ARR, retention, or proven CAC" unless new verified data is supplied.
- "The GCC TAM is exactly $X" without a harmonized GCC dataset and an explained fit model.
- "Gross margin is 80%+" based only on token and cloud costs.
- "Agents run autonomously across every channel" unless the exact connectors and account-level execution paths have been verified.
- "The product reduces CAC or increases ROI by X%" without pilot evidence.

## Immediate validation plan for the first 10 users

1. Recruit a deliberately mixed cohort: four operating businesses, three fractional CMOs, and three agencies.
2. Record each participant's existing tool stack, monthly software cost, reporting hours, campaign cycle time, and number of brands/workspaces.
3. Define one verified outcome per participant before onboarding.
4. Track all-in COGS and human service hours by account.
5. Test the $1,250 / $3,500 / $7,500 post-validation architecture and the discounted Founding 10 offer using paid conversion, not survey enthusiasm.
6. Rebuild the MRR model after 30 and 90 days with observed conversion, churn, tier mix, CAC, and gross margin.

## Source index

### Government and official statistics

- [UAE Ministry of Economy and Tourism - Entrepreneurship and SMEs](https://www.moet.gov.ae/en/entrepreneurs-and-smes)
- [UAE Ministry of Economy and Tourism - SME procurement participation](https://www.moet.gov.ae/en/-/%D9%88%D8%B2%D8%A7%D8%B1%D8%AA%D8%A7-%D8%A7%D9%84%D8%A7%D9%82%D8%AA%D8%B5%D8%A7%D8%AF-%D9%88%D8%A7%D9%84%D9%85%D8%A7%D9%84%D9%8A%D8%A9-%D8%AA%D8%B7%D9%84%D9%82%D8%A7%D9%86-%D9%85%D8%A4%D8%B4%D8%B1%D8%A7%D9%8B-%D9%84%D9%82%D9%8A%D8%A7%D8%B3-%D9%85%D8%AF?p_l_back_url=%2Fen%2Ftest1%3Fcategory%3D752020%26category%3D397571%26tag%3D2022%26delta%3D60%26start%3D4)
- [UAE Cabinet - registered companies update](https://mediaoffice.ae/en/news/2024/september/02-09/uae-cabinet)
- [Monsha'at - Q4 2024 SME Monitor](https://www.monshaat.gov.sa/sites/default/files/2025-03/Quarterly_Report_Q4_2024_EN.pdf)
- [Monsha'at - Q1 2025 SME release](https://www.monshaat.gov.sa/en/node/316532)
- [GCC-Stat data portal](https://dp.marsa.gccstat.org/ar)
- [Eurostat - EU enterprise size classes](https://ec.europa.eu/eurostat/web/products-eurostat-news/w/ddn-20241205-1)
- [UK Department for Business and Trade - Business population estimates 2025](https://www.gov.uk/government/statistics/business-population-estimates-2025/business-population-estimates-for-the-uk-and-regions-2025-statistical-release)
- [U.S. Census Bureau - 2022 Economic Census first look](https://www.census.gov/library/stories/2024/06/economic-census-annual-business-survey-results.html)
- [Statistics Canada - Canadian business counts, December 2024](https://www150.statcan.gc.ca/n1/daily-quotidien/250214/dq250214e-eng.htm)

### Company pricing and public filings

- [HubSpot Marketing Hub pricing](https://www.hubspot.com/pricing/marketing)
- [HubSpot Product and Services Catalog](https://legal.hubspot.com/hubspot-product-and-services-catalog)
- [HubSpot 2025 Form 10-K](https://ir.hubspot.com/node/15156/html)
- [HighLevel pricing](https://www.gohighlevel.com/30-day-trial-11)
- [Semrush pricing](https://www.semrush.com/pricing/)
- [AgencyAnalytics pricing](https://agencyanalytics.com/pricing)
- [monday.com FY2025 results](https://ir.monday.com/news-and-events/news-releases/news-details/2026/monday-com-Announces-Fourth-Quarter-and-Fiscal-Year-2025-Results/)
- [Adobe 2025 Form 10-K](https://www.sec.gov/Archives/edgar/data/796343/000079634326000003/adbe-20251128.htm)
