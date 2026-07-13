import { useState } from 'react'
import { getEvolutionFamily } from './api/pokeApi'
import './App.css'

function formatName(name) {
  return name.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

const named = (value) => formatName(value.name)

const CONDITION_FORMATTERS = [
  ['base_form', (value) => `From ${named(value)} form`],
  ['evolved_form', (value) => `Into ${named(value)} form`],
  ['gender', (value) => ({ 1: 'Female Pokémon', 2: 'Male Pokémon' })[value] ?? `Gender ${value}`],
  ['held_item', (value) => `Hold ${named(value)}`],
  ['item', (value) => `Use ${named(value)}`],
  ['known_move', (value) => `Know ${named(value)}`],
  ['known_move_type', (value) => `Know a ${named(value)}-type move`],
  ['location', (value) => `At ${named(value)}`],
  ['min_affection', (value) => `${value}+ affection`],
  ['min_beauty', (value) => `${value}+ beauty`],
  ['min_damage_taken', (value) => `Take at least ${value} damage`],
  ['min_happiness', (value) => `${value}+ happiness`],
  ['min_level', (value) => `Reach level ${value}`],
  ['min_move_count', (value) => `Know at least ${value} moves`],
  ['min_steps', (value) => `Walk at least ${value} steps`],
  ['near_special_rock', () => 'Near a special rock'],
  ['needs_multiplayer', () => 'While connected in multiplayer'],
  ['needs_overworld_rain', () => 'While it is raining'],
  ['party_species', (value) => `${named(value)} in the party`],
  ['party_type', (value) => `${named(value)}-type Pokémon in the party`],
  ['region', (value) => `In ${named(value)}`],
  ['relative_physical_stats', (value) => ({ '-1': 'Attack lower than Defense', 0: 'Attack equal to Defense', 1: 'Attack higher than Defense' })[value]],
  ['time_of_day', (value) => `During the ${value}`],
  ['trade_species', (value) => `For ${named(value)}`],
  ['turn_upside_down', () => 'Turn the device upside down'],
  ['used_move', (value) => `Use ${named(value)}`],
]

function describeEvolutionMethod(detail) {
  const trigger = detail.trigger?.name
  let action = ''

  if (trigger === 'trade') action = 'Trade'
  else if (trigger === 'level-up' && detail.min_level == null) action = 'Level up'
  else if (trigger === 'use-item' && !detail.item) action = 'Use an item'
  else if (trigger && !['level-up', 'use-item'].includes(trigger)) action = formatName(trigger)

  const conditions = CONDITION_FORMATTERS.flatMap(([field, format]) => {
    const value = detail[field]
    return value != null && value !== false && value !== '' ? [format(value)] : []
  })

  return [action, ...conditions].filter(Boolean).join(' · ') || 'Special condition'
}

function describeEvolution(details) {
  if (!details.length) return ['Base Pokémon']
  return details.map(describeEvolutionMethod)
}

function EvolutionNode({ pokemon }) {
  return (
    <li>
      <article className="pokemon-card">
        {pokemon.imageUrl && (
          <img src={pokemon.imageUrl} alt={formatName(pokemon.speciesName)} />
        )}
        <div>
          <small>#{String(pokemon.pokemonId).padStart(4, '0')}</small>
          <h3>{formatName(pokemon.speciesName)}</h3>
          <p>{pokemon.types.map(formatName).join(' / ')}</p>
          <ul className="requirements" aria-label="Evolution requirements">
            {describeEvolution(pokemon.evolutionDetails).map((requirement, index) => (
              <li key={`${requirement}-${index}`}>
                {index > 0 && <strong>or </strong>}
                {requirement}
              </li>
            ))}
          </ul>
        </div>
      </article>

      {pokemon.evolvesTo.length > 0 && (
        <ul>
          {pokemon.evolvesTo.map((child) => (
            <EvolutionNode key={child.speciesName} pokemon={child} />
          ))}
        </ul>
      )}
    </li>
  )
}

function App() {
  const [query, setQuery] = useState('')
  const [family, setFamily] = useState(null)
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setStatus('loading')
    setErrorMessage('')

    try {
      setFamily(await getEvolutionFamily(query))
      setStatus('success')
    } catch (error) {
      setFamily(null)
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong.')
      setStatus('error')
    }
  }

  return (
    <main>
      <header>
        <p className="eyebrow">PokéAPI Evolution Explorer</p>
        <h1>Explore a Pokémon evolution family</h1>
        <p>Search by name or Pokédex number to see every evolution path.</p>
      </header>

      <form onSubmit={handleSubmit}>
        <label htmlFor="pokemon">Pokémon name or number</label>
        <div className="search-row">
          <input
            id="pokemon"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Eevee or 133"
            required
          />
          <button disabled={status === 'loading'}>
            {status === 'loading' ? 'Searching…' : 'Search'}
          </button>
        </div>
      </form>

      <section className="results" aria-live="polite">
        {status === 'idle' && <p>Search for a Pokémon to get started.</p>}
        {status === 'loading' && <p>Loading evolution data…</p>}
        {status === 'error' && <p className="error" role="alert">{errorMessage}</p>}
        {status === 'success' && family && (
          <>
            <h2>{formatName(family.speciesName)} evolution family</h2>
            <ul className="evolution-tree">
              <EvolutionNode pokemon={family} />
            </ul>
          </>
        )}
      </section>
    </main>
  )
}

export default App
