
import { useAccount, useConnect, useContractRead } from "wagmi"
import {InjectedConnector} from "wagmi/connectors/injected"
import { PublicLockV13 } from "@unlock-protocol/contracts"
import { LOCK, NETWORK } from "../lib/constants"
import { ethers } from "ethers"
import { Paywall } from "@unlock-protocol/paywall"
import networks from '@unlock-protocol/networks'

/**
 * Connect component!
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
 * Checkout component!
 * @returns 
 */
const Checkout = () => {
  const {connector} = useAccount()
  const checkout = () => {
    console.log(connector)
    const paywall = new Paywall(networks)
    const provider = connector!.provider
    console.log(paywall)
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

  return   (
    <section>
      <p className="mb-4">You currently don't have a membership... </p>
      <button onClick={() =>  checkout()} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Purchase one now!
      </button>
    </section>
  )
}

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

  if (!isConnected)  {
    return <Connect />
  }

  if (isLoading) {
    return <div>Loading...</div>
  }
  
  if (isError) {
    return <div>There was an error checking your membership status. Please reload the page!</div>
  }

  if (!isMember) {
    return <Checkout />
  }

  // All good!
  return children
  
}
