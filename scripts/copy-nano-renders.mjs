import fs from "fs";
import path from "path";

const brainDir = "C:\\Users\\venki\\.gemini\\antigravity-ide\\brain\\42bfe44a-40f8-41e5-bfa6-3189a814c7dd";
const illustrationsDir = path.join(process.cwd(), "public", "illustrations");

const mappings = [
  { prefix: "blog_affordability_migration_west_nano_", target: "blog-affordability-migration-west.png" },
  { prefix: "blog_second_property_investment_nano_", target: "blog-second-property-investment.png" },
  { prefix: "blog_property_mutation_telangana_nano_", target: "blog-property-mutation-telangana.png" },
  { prefix: "blog_future_city_vision_nano_", target: "blog-future-city-vision.png" },
  { prefix: "blog_tellapur_kollur_emerging_nano_", target: "blog-tellapur-kollur-emerging.png" },
  { prefix: "blog_hyderabad_vs_bangalore_realty_nano_", target: "blog-hyderabad-vs-bangalore-realty.png" },
  { prefix: "blog_chevella_moinabad_belt_nano_", target: "blog-chevella-moinabad-belt.png" },
  { prefix: "blog_clubhouse_lifestyle_nano_", target: "blog-clubhouse-lifestyle.png" },
  { prefix: "blog_hyderabad_west_schools_nano_", target: "blog-hyderabad-west-schools.png" },
  { prefix: "blog_small_budget_plot_investment_nano_", target: "blog-small-budget-plot-investment.png" },
  { prefix: "blog_agricultural_vs_residential_land_nano_", target: "blog-agricultural-vs-residential-land.png" },
  { prefix: "blog_plotted_development_boom_nano_", target: "blog-plotted-development-boom.png" },
  { prefix: "blog_building_villa_on_plot_nano_", target: "blog-building-villa-on-plot.png" },
  { prefix: "blog_capital_gains_tax_land_nano_", target: "blog-capital-gains-tax-land.png" },
  { prefix: "blog_down_payment_planning_nano_", target: "blog-down-payment-planning.png" },
  { prefix: "blog_east_vs_west_hyderabad_nano_", target: "blog-east-vs-west-hyderabad.png" },
  { prefix: "blog_gst_real_estate_nano_", target: "blog-gst-real-estate.png" },
  { prefix: "blog_patancheru_industrial_corridor_nano_", target: "blog-patancheru-industrial-corridor.png" },
  { prefix: "blog_iit_hyderabad_kandi_effect_nano_", target: "blog-iit-hyderabad-kandi-effect.png" },
  { prefix: "blog_mokila_villa_corridor_nano_", target: "blog-mokila-villa-corridor.png" },
  { prefix: "blog_kokapet_neopolis_effect_nano_", target: "blog-kokapet-neopolis-effect.png" },
  { prefix: "blog_mmts_shankarpally_connectivity_nano_", target: "blog-mmts-shankarpally-connectivity.png" },
  { prefix: "blog_shankarpally_vs_kokapet_nano_", target: "blog-shankarpally-vs-kokapet.png" },
  { prefix: "blog_shankarpally_vs_mokila_nano_", target: "blog-shankarpally-vs-mokila.png" },
  { prefix: "blog_land_banking_strategy_nano_", target: "blog-land-banking-strategy.png" },
  { prefix: "blog_weekend_homes_hyderabad_nano_", target: "blog-weekend-homes-hyderabad.png" },
  { prefix: "blog_market_cycles_land_nano_", target: "blog-market-cycles-land.png" },
  { prefix: "blog_sustainable_villa_design_nano_", target: "blog-sustainable-villa-design.png" },
  { prefix: "blog_construction_cost_planning_nano_", target: "blog-construction-cost-planning.png" },
  { prefix: "blog_verify_land_titles_nano_", target: "blog-verify-land-titles.png" },
  { prefix: "blog_women_property_ownership_nano_", target: "blog-women-property-ownership.png" },
  { prefix: "blog_regional_ring_road_progress_nano_", target: "blog-regional-ring-road-progress.png" },
  { prefix: "blog_tax_benefits_property_nano_", target: "blog-tax-benefits-property.png" },
  { prefix: "blog_airport_connectivity_west_nano_", target: "blog-airport-connectivity-west.png" },
  { prefix: "blog_rental_yield_vs_appreciation_nano_", target: "blog-rental-yield-vs-appreciation.png" },
  { prefix: "blog_land_appreciation_hyderabad_west_nano_", target: "blog-land-appreciation-hyderabad-west.png" },
  { prefix: "blog_it_sector_hyderabad_realty_nano_", target: "blog-it-sector-hyderabad-realty.png" },
  { prefix: "blog_real_estate_gold_equity_nano_", target: "blog-real-estate-vs-gold-vs-equity.png" },
  { prefix: "blog_nri_guide_plot_investment_nano_", target: "blog-nri-guide-plot-investment.png" },
  { prefix: "blog_vaastu_villa_plots_nano_", target: "blog-vaastu-villa-plots.png" },
  { prefix: "blog_orr_exit3_corridor_nano_", target: "blog-orr-exit3-corridor.png" },
];

const files = fs.readdirSync(brainDir);

for (const map of mappings) {
  const match = files.find((f) => f.startsWith(map.prefix));
  if (match) {
    const srcPath = path.join(brainDir, match);
    const destPath = path.join(illustrationsDir, map.target);
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied Nano 3D render ${match} -> ${map.target}`);
  }
}
