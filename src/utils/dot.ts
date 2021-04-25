import { ApiPromise, WsProvider, Keyring } from '@polkadot/api'
import { mnemonicGenerate } from '@polkadot/util-crypto'
import type { KeyringPair } from '@polkadot/keyring/types'
import type { Text } from '@polkadot/types'

let api: ApiPromise | null = null

declare interface Network {
  api: ApiPromise,
  chain: Text,
  nodeName: Text,
  nodeVersion: Text
}
// 链接账户
export const initNetwork = async (): Promise<Network> => {
  if (!api) {
    const provider = new WsProvider('wss://rpc.polkadot.io')
    api = await ApiPromise.create({
      provider
    })
  }
  // Retrieve the chain & node information information via rpc calls
  const [chain, nodeName, nodeVersion] = await Promise.all([
    api.rpc.system.chain(),
    api.rpc.system.name(),
    api.rpc.system.version()
  ])
  return {
    api,
    chain,
    nodeName,
    nodeVersion
  }
}

// 创建账户
const keyring = new Keyring({ type: 'sr25519' })
keyring.setSS58Format(0) // 0: potkadot前缀 2:kusama前缀
export const createAccount = () => {
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

// 导入keystore
export const importAccountFromKeystore = (file: File): Promise<KeyringPair> => {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.readAsText(file)
    reader.onload = (e) => {
      const fileText = e.target?.result
      if (fileText) {
        const json = JSON.parse(fileText as string)
        const pair = keyring.addFromJson(json)
        resolve(pair)
      }
    }
  })
}

// 用助记词导入
export const importAccountFromMnemonic = (word: string): KeyringPair => {
  return keyring.addFromMnemonic(word)
}

export { mnemonicValidate } from '@polkadot/util-crypto'
