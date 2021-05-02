<template>
  <div>
    <el-card>
      <span>区块：</span>
      <span>{{ nodeState.chain }}</span>&nbsp;
      <span>节点名称：</span>
      <span>{{ nodeState.nodeName }}</span>&nbsp;
      <span>版本：</span>
      <span>{{ nodeState.nodeVersion }}</span>
    </el-card>
  </div>
  <div class="wallet">
    <el-card>
      <el-button type="primary" @click="newAccount">
        创建钱包
      </el-button>
      <el-form class="form-create">
        <el-form-item>
          <h3>助记词</h3>
          <div>{{ account.mnemonic }}</div>
        </el-form-item>
      </el-form>
      <el-form>
        <el-form-item>
          <h3>地址</h3>
          <div>{{ account.address }}</div>
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
          <el-button type="success" :disabled="!(name && passphrase && currentPair)" @click="genAccount">生成账户
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card class="right">
      <el-button class="import-btn">导入钱包 <input type="file" @change="importAccount"></el-button>
      <el-button @click="importFromMnemonic">助记词导入</el-button>
      <ul class="list">
        <li v-for="(item, index) in pairs" :key="index">
          <h3>name</h3>
          <div>{{ item.meta.name }}</div>
          <h3>地址</h3>
          <div>{{ item.address }}</div>
          <el-button type="success" @click="beforeSend(item.address)">发送</el-button>
        </li>
      </ul>
    </el-card>
  </div>
  <div class="deal">
    <el-card>
      <template #header>
        <span>交易</span>
      </template>
      <el-form>
        <el-form-item label="发送地址">
          <el-input v-model="transferState.sendAddress" readonly></el-input>
        </el-form-item>
        <el-form-item label="接收地址">
          <el-input v-model="transferState.receiveAddress"></el-input>
        </el-form-item>
        <el-form-item label="接收地址">
          <el-input v-model="transferState.num"></el-input>
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="transferState.password"></el-input>
        </el-form-item>
        <el-button type="primary" :disabled="!(transferState.sendAddress && transferState.receiveAddress)"
                   @click="sendBalance">发送
        </el-button>
      </el-form>
    </el-card>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, onMounted } from 'vue'
import {
  initNetwork,
  createAccount,
  addAccount,
  getPairs,
  importAccountFromKeystore,
  importAccountFromMnemonic,
  mnemonicValidate,
  getBalance,
  transferBalance,
  getPair
} from '@/utils/dot'
import type { KeyringPair } from '@polkadot/keyring/types'
import { saveAs } from 'file-saver'
import { ElMessageBox, ElLoading } from 'element-plus'

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
    const nodeState = reactive({
      chain: '',
      nodeName: '',
      nodeVersion: ''
    })
    const pairs = ref<KeyringPair[]>([])
    const currentPair = ref<KeyringPair | null>(null) // 当前填写的pair
    const passphrase = ref('') // 密码
    const name = ref('') // 名称（不重要）
    const transferState = reactive({
      sendAddress: '',
      receiveAddress: '',
      num: 0,
      password: ''
    })

    initNetwork().then(({
      api,
      chain,
      nodeName,
      nodeVersion
    }) => {
      nodeState.chain = chain.toString()
      nodeState.nodeName = nodeName.toString()
      nodeState.nodeVersion = nodeVersion.toString()
      getBalance('5HbiGvEUL9YRBNgQKFxEMLu6RYEB1xp5rsUzwaLwfQD3mRBq')
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

    // 导入keystore
    function importAccount (e: Event) {
      const target = e.target as HTMLInputElement
      importAccountFromKeystore(target.files![0]).then(keyring => {
        pairs.value = getPairs()
        console.log(pairs.value)
      })
    }

    // 助记词导入
    function importFromMnemonic () {
      ElMessageBox.prompt('请输入助记词(每个助记词中已"空格"隔开)', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputValidator (value) {
          return mnemonicValidate(value)
        }
      }).then(({ value }) => {
        importAccountFromMnemonic(value)
        pairs.value = getPairs()
      })
    }

    function beforeSend (address: string) {
      transferState.sendAddress = address
    }

    function sendBalance () {
      const pair = getPair(transferState.sendAddress)
      const p = transferBalance(pair, transferState.receiveAddress, transferState.num, transferState.password)
      if (p) {
        p.then(hex => {
          console.log(hex)
        })
      }
    }

    onMounted(() => {
      const loading = ElLoading.service({
        text: '正在接入网络'
      })
      initNetwork().finally(() => {
        loading.close()
      })
    })
    return {
      pairs,
      account,
      currentPair,
      name,
      passphrase,
      transferState,
      nodeState,
      newAccount,
      genAccount,
      importAccount,
      importFromMnemonic,
      beforeSend,
      sendBalance
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
    cursor: pointer;
  }
}
</style>
