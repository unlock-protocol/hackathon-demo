import { WagmiConfig, createClient} from 'wagmi'
import { AppProps } from 'next/app'
import '../styles/index.css'
import { ethers } from 'ethers'
import { NETWORK } from '../lib/constants'


const wagmiClient = createClient({
  provider: new ethers.providers.JsonRpcProvider(`https://rpc.unlock-protocol.com/${NETWORK}`, NETWORK),
})

export default function MyApp({ Component, pageProps }: AppProps) {
  return <WagmiConfig client={wagmiClient}>
    <Component {...pageProps} />
  </WagmiConfig>
}
