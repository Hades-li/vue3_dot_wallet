<template>
  <el-container>
    <el-aside width="100px">Aside</el-aside>
    <el-container>
      <el-header>{{$route.meta.title}}</el-header>
      <el-main>
        <router-view></router-view>
      </el-main>
    </el-container>
  </el-container>
</template>
<script>
export default {
  name: 'layout'
}
</script>

<style lang="scss" scoped>

</style>
