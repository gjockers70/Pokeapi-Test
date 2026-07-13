# PokéAPI Evolution Explorer

A small React app for looking up a Pokémon and seeing its complete evolution
family, including branching paths such as Eevee's. It is intended for players
and developers who want a quick, visual alternative to following several
linked API responses by hand.

## What it does

- Searches by Pokémon name or Pokédex number.
- Displays artwork, types, and evolution paths.
- Shows all evolution methods and their conditions, including unusual rules.
- Presents a readable message when a Pokémon does not exist or the API fails.

## Run locally

You need a current Node.js LTS release and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Other useful commands are:

```bash
npm run lint
npm run build
npm run preview
```

The project has no backend, API key, or environment variables.

## API endpoints

The app uses the public [PokéAPI](https://pokeapi.co/):

- `GET /api/v2/pokemon-species/{name-or-id}` finds the species and provides its
  evolution-chain URL.
- `GET /api/v2/evolution-chain/{id}` provides the nested evolution paths and
  evolution conditions.
- `GET /api/v2/pokemon/{name}` supplies the Pokédex number, artwork, and types
  for each member of the family.

These endpoints are used together because no single PokéAPI response contains
all of the relationship and display data needed by the visualizer.

## Failure handling

A search for a nonexistent Pokémon produces a handled `404` and displays a
specific message instead of leaving an unhandled rejection or crashed screen.
Network failures, non-success responses, and unreadable JSON also produce
user-facing error messages.

## Known limitations

- Requirement wording is intentionally concise and may not explain every
  version-specific game mechanic behind an API value.
- Localized Pokémon names are not supported by PokéAPI's name lookup endpoint.
- Results are not cached, so a branching family makes one detail request per
  Pokémon in addition to the species and evolution-chain requests.
- The app depends on the availability and response format of the public API.
