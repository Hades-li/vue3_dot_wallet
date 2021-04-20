<template>
  <div class="wallet">
    <el-card>
      <el-button type="primary" @click="newAccount">
        创建钱包
      </el-button>
      <el-form class="form-create">
        <el-form-item >
          <h3>助记词</h3>
          <div>{{account.mnemonic}}</div>
        </el-form-item>
      </el-form>
      <el-form>
        <el-form-item>
          <h3>地址</h3>
          <div>{{account.address}}</div>
        </el-form-item>
        <el-form-item>
          <h3>输入名称</h3>
          <el-input v-model="name"></el-input>
        </el-form-item>
        <el-form-item>
          <h3>密码</h3>
          <el-input type="password" v-model="passphrase"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="success" :disabled="!(name && passphrase && currentPair)" @click="genAccount">生成账户</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card class="right">
      <el-button class="import-btn">导入钱包 <input type="file"> </el-button>
      <ul class="list">
        <li v-for="(item, index) in pairs" :key="index">
          <h3>name</h3>
          <div>{{item.meta.name}}</div>
          <h3>地址</h3>
          <div>{{item.address}}</div>
        </li>
      </ul>
    </el-card>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref } from 'vue'
import { initNetwork, createAccount, addAccount, getPairs } from '@/utils/dot'
import type { KeyringPair } from '@polkadot/keyring/types'
import { saveAs } from 'file-saver'

declare interface Account {
  mnemonic?: string,
  privateKey?: string,
  address?: string
}

export default defineComponent({
  name: 'wallet',
  setup () {
    const account = reactive<Account>({
      mnemonic: '',
      address: ''
    })
    const pairs = ref<KeyringPair[]>([])
    const currentPair = ref<KeyringPair | null>(null) // 当前填写的pair
    const passphrase = ref('') // 密码
    const name = ref('') // 名称（不重要）

    initNetwork().then(api => {
      console.log(api)
    })
    // 创建账户
    function newAccount () {
      // const wallet = createWallet()
      const item = createAccount()
      account.mnemonic = item.mnemonic
      account.address = item.pair.address
      pairs.value = getPairs()
      currentPair.value = item.pair
    }
    // 生成账户
    function genAccount () {
      // todo
      if (currentPair.value && name.value && passphrase.value) {
        currentPair.value.setMeta({
          name: name.value
        })
        const pair = addAccount(currentPair.value)

        const json = pair.toJson(passphrase.value)
        const blob = new Blob([JSON.stringify(json)], { type: 'application/json; charset=utf-8' })
        pairs.value = getPairs()
        saveAs(blob, `${pair.meta.name ? pair.meta.name : 'noName'}-${pair.address}.json`)
      }
    }
    return {
      pairs,
      account,
      currentPair,
      name,
      passphrase,
      newAccount,
      genAccount
    }
  }
})
</script>

<style lang="scss" scoped>
.wallet {
  display: flex;
  .right {
    margin-left: 10px;
  }
}
.list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.import-btn {
  position: relative;
  input[type=file] {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
  }
}
</style>
