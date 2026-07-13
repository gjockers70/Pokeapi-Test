const API_ROOT = 'https://pokeapi.co/api/v2'

export class PokeApiError extends Error {
  constructor(message, { status = null, cause } = {}) {
    super(message, { cause })
    this.name = 'PokeApiError'
    this.status = status
  }
}

async function requestJson(url, signal) {
  let response

  try {
    response = await fetch(url, { signal })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new PokeApiError('Unable to reach PokéAPI.', { cause: error })
  }

  if (!response.ok) {
    const message = response.status === 404
      ? 'No Pokémon was found with that name or number.'
      : `PokéAPI returned an error (${response.status}).`

    throw new PokeApiError(message, { status: response.status })
  }

  try {
    return await response.json()
  } catch (error) {
    throw new PokeApiError('PokéAPI returned an unreadable response.', {
      status: response.status,
      cause: error,
    })
  }
}

function getIdFromUrl(url) {
  const match = url?.match(/\/(\d+)\/?$/)
  return match ? Number(match[1]) : null
}

function mapChainNode(node) {
  if (!node?.species?.name || !node.species.url) {
    throw new PokeApiError('PokéAPI returned incomplete evolution data.')
  }

  return {
    speciesName: node.species.name,
    speciesId: getIdFromUrl(node.species.url),
    evolutionDetails: node.evolution_details ?? [],
    evolvesTo: (node.evolves_to ?? []).map(mapChainNode),
  }
}

async function addPokemonDetails(node, signal) {
  const pokemon = await requestJson(
    `${API_ROOT}/pokemon/${encodeURIComponent(node.speciesName)}`,
    signal,
  )

  if (!pokemon.id || !Array.isArray(pokemon.types)) {
    throw new PokeApiError('PokéAPI returned incomplete Pokémon data.')
  }

  return {
    ...node,
    pokemonId: pokemon.id,
    imageUrl:
      pokemon.sprites?.other?.['official-artwork']?.front_default ??
      pokemon.sprites?.front_default ??
      null,
    types: pokemon.types.map(({ type }) => type.name),
    evolvesTo: await Promise.all(
      node.evolvesTo.map((child) => addPokemonDetails(child, signal)),
    ),
  }
}

export async function getEvolutionFamily(query, { signal } = {}) {
  const normalizedQuery = String(query).trim().toLowerCase()

  if (!normalizedQuery) {
    throw new PokeApiError('Enter a Pokémon name or Pokédex number.')
  }

  const species = await requestJson(
    `${API_ROOT}/pokemon-species/${encodeURIComponent(normalizedQuery)}`,
    signal,
  )

  if (!species.evolution_chain?.url) {
    throw new PokeApiError('No evolution chain is available for this Pokémon.')
  }

  const evolution = await requestJson(species.evolution_chain.url, signal)

  if (!evolution.chain) {
    throw new PokeApiError('PokéAPI returned incomplete evolution data.')
  }

  return addPokemonDetails(mapChainNode(evolution.chain), signal)
}
