# 12.1

- Unit changes retain the entered quantity and quoted price; normalization reinterprets the selected unit. Quantity inputs retain decimal precision on blur.
- Weight summary updates independently of prices and on input, including kg and per-piece conversions.
- Supplier prepayment is grouped with purchase payment; payment mix applies only to the remaining principal.
- Purchase controls are read before calculation and before changing payment methods; mixed purchase fees use the same central financingLeg routine and preserved contractual settings.
- Monthly, annual and one-time financing rates have plain Persian labels and a contextual formula guide. Purchase fee previews show actual basis, rate, time factor and amount.
- VAT rates and settlement settings are grouped in one collapsed section. Irrelevant timing fields are hidden without deleting stored assumptions.
- Period return uses the unique conventional dated cash-flow IRR compounded over its active horizon. Losses are negative. Nonconventional cash flows have no misleading period return. Profit/peak funding remains a separately named capital-efficiency metric; NPV retains primary decision status.
- Profit margin is shown in the return KPI. Excel has formula-linked dated return calculations and separate capital-efficiency metrics on the existing single sheet.
- Negotiation uses a focused, threshold-aligned price range. Purchase target never exceeds current price and accounts for economic safety and defined financing limits. Sale target reflects the required safety margin.
- Readable Persian type, responsive negotiation details and reduced-motion support.

Validation: 38 deterministic scenarios, 3,000 seeded scenarios, 1,080,866 independently evaluated Excel expressions; dedicated unit-input, fee invariance, negative-return and boundary regressions. Native Excel recalculation is not asserted by these independent expression tests.
