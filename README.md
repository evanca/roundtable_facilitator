# FlutterCon Roundtable Facilitators

Interactive static web tools for FlutterCon roundtable discussions.

## Features

- **FlutterCon Europe 2025**: AI in Flutter Development & App Monetization
- **FlutterCon USA 2026**: Is Flutter a Smart Bet in an AI-Driven Job Market?
- **FlutterCon EU 2026 (Berlin)**: Is Flutter a Smart Bet in an AI-Driven Job Market? European edition with sourced numbers
- **6 questions per topic** with hand-raising prompts and follow-ups
- **Roulette wheel** for random topic selection
- **Progress tracking** with localStorage
- **Responsive design** for mobile and desktop

## Usage

Open one of the standalone HTML files in a browser:

- `fluttercon_2025_ai_roundtable.html` - FlutterCon Europe 2025 AI and App Monetization facilitator
- `fluttercon_usa_2026_flutter_ai_job_market.html` - FlutterCon USA 2026 Flutter and AI-driven job market facilitator
- `fluttercon_eu_2026_flutter_ai_job_market.html` - FlutterCon EU 2026 (Berlin) edition of the same topic, with a sources list

Navigate questions Q1-Q6, expand the hand-raising prompts, or use the roulette wheel for random selection.

## Verification

Run all copy verification tests:

```bash
npm test
```

## Editing content

The JSON files are the source of truth. After editing them, write them back into the page and run the tests:

```bash
npm run inject:eu2026 && npm test
```

Use `inject:2025` or `inject:2026` for the other pages.

## Adding a session

1. Copy the closest HTML page and its data folder under new names.
2. Copy the matching `inject_*.js` and `test_*.js` and change the three constants at the top (HTML file, data folder, topic key). The topic key must be unique: the roulette stores its used cards in `localStorage` under that key.
3. In the copied page, change the topic key in `getQuestionTitle()`, in the `onload` call and in the topic picker, and update the question titles (they must match the `question` fields in the JSON).
4. Add `inject:` and `test:` scripts to `package.json` and chain the new test into `npm test`.
5. Section titles must be unique across the page (letters only become the DOM id) and content must not contain `<`.

## Files

- `fluttercon_2025_ai_roundtable.html` - Main application
- `fluttercon_2025_ai/` - AI topic questions (JSON)
- `fluttercon_2025_monetization/` - Monetization questions (JSON)
- `inject_correct_data.js` - Update HTML from JSON
- `test_correct_copy.js` - Verify data integrity
- `fluttercon_usa_2026_flutter_ai_job_market.html` - FlutterCon USA 2026 standalone application
- `fluttercon_usa_2026_flutter_ai_job_market/` - FlutterCon USA 2026 questions (JSON)
- `inject_2026_data.js` - Update 2026 HTML from JSON
- `test_2026_copy.js` - Verify 2026 data integrity
- `fluttercon_eu_2026_flutter_ai_job_market.html` - FlutterCon EU 2026 standalone application
- `fluttercon_eu_2026_flutter_ai_job_market/` - FlutterCon EU 2026 questions (JSON)
- `inject_eu_2026_data.js` - Update EU 2026 HTML from JSON
- `test_eu_2026_copy.js` - Verify EU 2026 data integrity
