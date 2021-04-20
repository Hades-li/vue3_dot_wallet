import { ApiPromise, WsProvider, Keyring } from '@polkadot/api'
import { mnemonicGenerate } from '@polkadot/util-crypto'
import type { KeyringPair } from '@polkadot/keyring/types'

let apiInstance: ApiPromise | null = null
// 链接账户
export const initNetwork = (): Promise<ApiPromise | Error> => {
  if (!apiInstance) {
    const wsProvider = new WsProvider('wss://rpc.polkadot.io')
    return ApiPromise.create({ provider: wsProvider }).then(api => {
      apiInstance = api
      return Promise.resolve(apiInstance)
    })
  }
  return Promise.reject(new Error('账户已有'))
}

// 创建账户
let keyring: Keyring
export const createAccount = () => {
  if (!keyring) {
    keyring = new Keyring({ type: 'sr25519' })
  }
  const mnemonic = mnemonicGenerate(12)
  const pair = keyring.createFromUri(mnemonic)
  return {
    mnemonic,
    pair
  }
}

// 将Keypair增加到账户中
export const addAccount = (pair: KeyringPair): KeyringPair => {
  return keyring.addPair(pair)
}

export const getPairs = (): KeyringPair[] => {
  return keyring?.getPairs()
}
