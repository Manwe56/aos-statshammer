<div align="center">
    <a href="https://aos-statshammer.netlify.app/" target="_blank">
        <img width="128" src="docs/logo256.png">
    </a>
</div>

# Age of Sigmar Statshammer

A tool for calculating and comparing damage outputs for Warhammer Age of Sigmar units
(also referred to as Mathhammer).

The production deploy of the tool is located at: https://aos-statshammer.netlify.app/

The tool works by adding a number of weapon profiles to various units, which can contain
a number of modifiers (abilities)

<div align="center">
    <a href="https://aos-statshammer.netlify.app/" target="_blank">
        <img width="100%" src="docs/compare.png">
    </a>
</div>

## Features

- **Average Damage Stats**
  - Gather the average damage that each unit is expected to do against each possible save.
  - This average is a calculated value (not simulated)
  - The average damage is presented the following forms:
    - Table
    - Bar Graph
    - Line Graph
    - Radar Graph
- **Profile Modifiers**
  - Add various modifiers, or abilities, to your weapon profiles in order to replicate the vast array of unit rules/abilities.
  - Some examples are:
    - 'Deal `x` Mortal Wounds on a roll of `y`'
    - 'Rerolls'
    - 'Leader Bonuses'
- **Target Modifiers**
  - Add various modifiers, or abilities, to the target to which stats are generated against (the opponents unit).
  - Some examples are: 
    - 'Ethereal' 
    - 'Rerolls'
    - 'Negate wounds and mortal wounds on a roll of `y`'
- **Simulations**
  - Generating `x` simulations to gather the following:
    - **Discrete** Probabilities
    - **Cumulative** Probabilities
    - Various **Sample Metrics** (mean, max, variance, etc.).
  - The number of simulations is customizable from the simulations screen.
- **Import/Export JSON**
  - Save your crafted units so that you can re-import them later
- **Export PDF**
  - Export the full stats, as well as, simulations to PDF form
- **Dark Theme**
- **Persisitent data between refreshes**
- **And more**
  - Keep an eye on the [Github Releases](https://github.com/Manwe56/aos-statshammer/releases)

## Roadmap Features

- Ability to add modifiers to the unit as a whole, and not just to each profile
- Ability to provide points costs to provide stats for average damage / 100 points

## Installation

Ensure that you have `node` and `pnpm` installed.

Install the packages:

```bash
pnpm install
```

## Usage

### `pnpm start`

Runs the app in development mode.

Open http://localhost:3000 to view it in the browser

### `pnpm test`

Runs the tests.

## Configuration

Create a `.env.local` file to configure optional runtime settings:

```bash
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
REACT_APP_LISTS_CHAT_ENDPOINT=/.netlify/functions/gemini-chat
```

`REACT_APP_GOOGLE_CLIENT_ID` enables Google sign-in from the Settings page.
`REACT_APP_LISTS_CHAT_ENDPOINT` is optional and defaults to `/.netlify/functions/gemini-chat`.

When deployed on Netlify, configure these server-side environment variables:

```bash
GEMINI_API_KEY=your-google-ai-api-key
GEMINI_MODEL=gemini-2.0-flash
GEMINI_SYSTEM_CONTEXT=Optional default assistant context
GOOGLE_OAUTH_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

`GEMINI_API_KEY` must stay server-side only (never in frontend env variables).

For local testing of `/.netlify/functions/*`, run the app with Netlify Dev:

```bash
npx netlify dev
```

### Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
