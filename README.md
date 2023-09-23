
# Install deps:

```bash
yarn add wagmi ethers@5 @unlock-protocol/paywall @unlock-protocol/networks @unlock-protocol/contracts
```

# Update App.js to include wagmi config

This is not Unlock specific:

Add a constant to `constants.ts` for the network we will use.

```js
export const NETWORK = 5 // also called chain id
```

```jsx
import { WagmiConfig, createClient} from 'wagmi'
import { AppProps } from 'next/app'
import '../styles/index.css'
import { ethers } from 'ethers'
import { NETWORK } from '../lib/constants'

// Create a WAGMI client
const wagmiClient = createClient({
  // Unlock provides some RPC providers but you can use your own!
  provider: new ethers.providers.JsonRpcProvider(`https://rpc.unlock-protocol.com/${NETWORK}`, NETWORK),
})

export default function MyApp({ Component, pageProps }: AppProps) {
  return <WagmiConfig client={wagmiClient}>
    <Component {...pageProps} />
  </WagmiConfig>
}

```

# Add a `TokenGate` component:

This component is in fact pretty simple:

- It wraps any component that needs to be token-gated
- It checks the "status" of the user (has a membership or not), if the user is connected
- If the user is not connected, it renders a subcomponent to prompt the user to connect
- If the user is connected and they do NOT have a membership NFT, it renders a `Checkout` sub-component that promps them to purchase a membership!
- If the user is connected AND they have a membership, it renders he children!

```tsx
import { useAccount, useConnect, useContractRead } from "wagmi"
import {InjectedConnector} from "wagmi/connectors/injected"
import { PublicLockV13 } from "@unlock-protocol/contracts"
import { LOCK, NETWORK } from "../lib/constants"
import { ethers } from "ethers"
import { Paywall } from "@unlock-protocol/paywall"
import networks from '@unlock-protocol/networks'


export const TokenGate = ({children}) => {
  const {isConnected, address} = useAccount()

  const {data: isMember, isError, isLoading} = useContractRead({
    address: LOCK,
    abi: PublicLockV13.abi,
    functionName: 'balanceOf',
    chainId: NETWORK,
    enabled: !!address,
    args: [address],
    watch: true,
    select: (data: ethers.BigNumber) => {
      return data.gt(0)
    }
  })

  if (isLoading) {
    return <div>Loading...</div>
  }
  
  if (isError) {
    return <div>There was an error checking your membership status. Please reload the page!</div>
  }

  // User not connected
  if (!isConnected)  {
    return <Connect />
  }

  // User does not have membership
  if (!isMember) {
    return <Checkout />
  }

  // All good: user is connected and they have a membership!
  return children
}

/**
 * Connect subcomponent!
 * @returns 
 */
const Connect = () => {
  const {connect} = useConnect({
    connector: new InjectedConnector()
  })
  return <section>
    <p className="mb-4">To view this post you need to be be a member!</p>
    <button onClick={() =>  connect()} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Sign-In
      </button>
    </section>
}

/**
 * Checkout subcomponent!
 * @returns 
 */
const Checkout = () => {
  const {connector} = useAccount()
  const checkout = () => {
    const paywall = new Paywall(networks)
    const provider = connector!.provider
    paywall.connect(provider)
    paywall.loadCheckoutModal({
      locks: {
        [LOCK]: {
          network: NETWORK,
        }
      },
      pessimistic: true,
    })
  }

  return  (
    <section>
      <p className="mb-4">You currently don't have a membership... </p>
      <button onClick={() =>  checkout()} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Purchase one now!
      </button>
    </section>
  )
}

```

# Wrap the components that renders the content

We just replace `post-body.tsx` with this:

```tsx

import { TokenGate } from './token-gate'
import markdownStyles from './markdown-styles.module.css'

type Props = {
  content: string
}

const PostBody = ({ content }: Props) => {
  return (
    <div className="max-w-2xl mx-auto">
      <TokenGate>
        <div
          className={markdownStyles['markdown']}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </TokenGate>
    </div>
  )
}

export default PostBody

```

# That's it!

Please jump in [Unlock's Discord](https://discord.unlock-protocol.com/) if you have any question!
