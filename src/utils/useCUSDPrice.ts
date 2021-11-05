import { useContractKit } from '@celo-tools/use-contractkit'
import { CELO, ChainId as UbeswapChainId, currencyEquals, cUSD, Price, Token } from '@ubeswap/sdk'
import { useMemo } from 'react'

import { UBE } from '../constants'
import { usePairs } from '../data/Reserves'

type TokenPair = [Token | undefined, Token | undefined]

/**
 * Returns the price in cUSD of the input currency
 * @param currency currency to compute the cUSD price of
 */
export function useCUSDPrices(tokens?: Token[]): (Price | undefined)[] | undefined {
  const {
    network: { chainId },
  } = useContractKit()
  const CUSD = cUSD[chainId as unknown as UbeswapChainId]
  const celo = CELO[chainId as unknown as UbeswapChainId]
  const ube = UBE[chainId as unknown as UbeswapChainId]
  const tokenPairs: TokenPair[] = useMemo(
    () =>
      tokens
        ?.map((token) => [
          [token && currencyEquals(token, CUSD) ? undefined : token, CUSD],
          [token && currencyEquals(token, celo) ? undefined : token, celo],
          [celo, CUSD],
          [ube, celo],
          [token && currencyEquals(token, ube) ? undefined : token, ube],
        ])
        .flat() as TokenPair[],
    [CUSD, celo, tokens, ube]
  )
  const pairs = usePairs(tokenPairs).map((x) => x[1])

  return useMemo(() => {
    if (!tokens || !chainId) {
      return undefined
    }

    return tokens.map((token, idx) => {
      const start = idx * 3
      const [cUSDPair, celoPair, celoCUSDPair, ubeCELOPair, ubePair] = [
        pairs[start],
        pairs[start + 1],
        pairs[start + 2],
        pairs[start + 3],
        pairs[start + 4],
      ]

      // handle cUSD
      if (token.equals(CUSD)) {
        return new Price(CUSD, CUSD, '1', '1')
      }

      if (cUSDPair) {
        return cUSDPair.priceOf(token)
      }

      if (celoPair && celoCUSDPair) {
        return celoPair.priceOf(token).multiply(celoCUSDPair.priceOf(celo))
      }

      if (ubePair && ubeCELOPair && celoCUSDPair) {
        return ubePair.priceOf(token).multiply(ubeCELOPair.priceOf(ube)).multiply(celoCUSDPair.priceOf(celo))
      }

      return undefined
    })
  }, [tokens, chainId, pairs, CUSD, celo, ube])
}

/**
 * Returns the price in cUSD of the input currency
 * @param currency currency to compute the cUSD price of
 */
export function useCUSDPrice(token?: Token): Price | undefined {
  const {
    network: { chainId },
  } = useContractKit()
  const CUSD = cUSD[chainId as unknown as UbeswapChainId]
  const celo = CELO[chainId as unknown as UbeswapChainId]
  const tokenPairs: [Token | undefined, Token | undefined][] = useMemo(
    () => [
      [token && currencyEquals(token, CUSD) ? undefined : token, CUSD],
      [token && currencyEquals(token, celo) ? undefined : token, celo],
      [celo, CUSD],
    ],
    [CUSD, celo, token]
  )
  const [[, cUSDPair], [, celoPair], [, celoCUSDPair]] = usePairs(tokenPairs)

  return useMemo(() => {
    if (!token || !chainId) {
      return undefined
    }

    // handle cUSD
    if (token.equals(CUSD)) {
      return new Price(CUSD, CUSD, '1', '1')
    }

    if (cUSDPair) {
      return cUSDPair.priceOf(token)
    }

    if (celoPair && celoCUSDPair) {
      return celoPair.priceOf(token).multiply(celoCUSDPair.priceOf(celo))
    }

    return undefined
  }, [chainId, token, CUSD, cUSDPair, celo, celoCUSDPair, celoPair])
}
