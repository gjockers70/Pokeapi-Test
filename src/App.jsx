import { useState } from 'react'
import { getEvolutionFamily } from './api/pokeApi'
import './App.css'

function formatName(name) {
  return name.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function describeEvolution(details) {
  const detail = details[0]
  if (!detail) return 'Base Pokémon'

  const conditions = []
  if (detail.min_level) conditions.push(`Level ${detail.min_level}`)
  if (detail.item) conditions.push(`Use ${formatName(detail.item.name)}`)
  if (detail.held_item) conditions.push(`Hold ${formatName(detail.held_item.name)}`)
  if (detail.min_happiness) conditions.push(`${detail.min_happiness}+ happiness`)
  if (detail.time_of_day) conditions.push(`During the ${detail.time_of_day}`)
  if (!conditions.length && detail.trigger?.name) {
    conditions.push(formatName(detail.trigger.name))
  }

  return conditions.join(' · ') || 'Special condition'
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
          <span>{describeEvolution(pokemon.evolutionDetails)}</span>
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
