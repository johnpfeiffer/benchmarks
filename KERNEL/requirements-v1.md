This is a custom page to visualize and sort and analyze various things

# MVP Goal

AI model analysis

## MVP Dashboard Feature

Use the data that will be embedded via a JSON

Create a visualization of bar graphs of intelligence with it sorted by default from highest on the left to lowest on the right

Also provide a table of the values below with headers Provider, Model Name, Score

Every header is sortable for asc or desc via a click

Based on data from (and give credit to via the footer)
- https://artificialanalysis.ai/

## MVP fixes

make the width fit screen width as much as possible to get more of the chart visible, also make the vertical bars 1/3 thinner 
Labels for each bar along the x axis should be diagonal (and multi-line if necessary) so more labels are actually visible

color coding the barchart:
Anthropic gets "anthropic orange"   (#cc785c)
OpenAI gets "black" #1f1f1f
Grok gets purple #736cd3
Z.AI gets blue #1c7ff8
Google gets green #34A853
Deepseek get a different blue #2243e6
Kimi another blue #047AFE
Nvidia the funny green #86b737
Qwen (alibaba?) gets an orange-ish #F54F35
Cerebras to be a brighter orange #F15929

Leave anything missed as gray

## NEW FEATURE - select and de-select models
All models start as selected by default, model names in the table become a "button", if it is clicked again it becomes unselected (background gray) and removed from the chart

## NEW FEATURE - SWE benchmark

There is a new data source: app/src/data/swe.json

Based on data from (and give credit to via the footer)
- https://senior-swe-bench.snorkel.ai/

Incorporate the data into the existing Table as new columns: "tasteful_solve_rate_pct" "basic_solve_rate_pct" "avg_steps" "avg_tokens"

It is fine to put an * for each one that does not have values

Then below the table create a new chart based just on swe.json
- same design as the first chart including colors and diagonal labels


## NEW FEATURE - Open Weights button

Add is a button  "Open Weights Only" (unselected by default) beside the "Model Details" table header.
- when it is selected then update the selection to only be the Open Weight Models (therefore reflected in the Table - which affects the Chart)

Which means updating the JSON to have a boolean attribute Open Weight (Kimi, MiniMax, DeepSeek, Nemotron, Qwen, Z.AI, GLM, Mistral, Gemma, GPT-OSS)


