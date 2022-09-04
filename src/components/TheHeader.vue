<script setup lang="ts">
import { RouterLink } from "vue-router";
</script>

<template>
  <header class="container__main--in header">
    <RouterLink to="/" class="header__logo">
      <img
        alt="Vue logo"
        class="logo"
        src="@/assets/logo.svg"
        width="104"
        height="40"
      />
    </RouterLink>

    <nav class="header__nav">
      <RouterLink to="/stats">Stats</RouterLink>
      <RouterLink to="/about">About</RouterLink>
    </nav>

    <div class="header__button button-container">
      <RouterLink to="/">
        <span>To Game</span>
      </RouterLink>
    </div>
  </header>
</template>

<style lang="scss" scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-background);
  padding-top: 16px;
  padding-bottom: 16px;
  box-shadow: 0px 4px 25px rgba(0, 0, 0, 0.1);
  margin-bottom: 32px;

  &__logo {
    width: 104px;
    height: 40px;
    margin-right: 200px;
  }

  &__nav {
    flex: 1;
    display: flex;
    justify-content: space-between;
  }

  &__button {
    margin-left: 100px;
  }
}
</style>