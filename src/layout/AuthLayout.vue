<template>
  <div class="login">
    <div class="login__form">
      <RouterView />
    </div>
    <div class="login__info">
      <div class="login__info-box">
        <img src="../assets/images/auth/bg-blue-chart.png" alt="" class="icon-1" />
        <img src="../assets/images/auth/bg-yellow-chart.png" alt="" class="icon-2" />
        <img src="../assets/images/auth/Group-33547.png" width="108" alt="" class="icon-3" />
        <img src="../assets/images/auth/Group-33553.png" width="72" alt="" class="icon-4" />
        <img src="/src/assets/images/layout/login.webp" alt="login" width="100%" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router'
</script>

<style lang="scss">
.login {
  width: 100dvw;
  height: 100dvh;
  padding: 2rem;
  display: flex;
  justify-content: space-around;
  align-items: center;

  &__form {
    width: 45%;
  }
  &__info {
    width: 50%;
    border-radius: 24px;
    padding: 4px;
    &-box {
      background: transparent;
      margin: 3rem auto;
      padding: 1rem;
      position: relative;
    }
  }
}
.banner {
  display: flex;
  background-color: $primary;
  padding: 0.5rem 1.5rem;
  margin: 16px auto;
  border-radius: 1rem;
  color: $white;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  & > div {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
}
.services {
  gap: 1.5rem;
  background-color: $grey-3;
  padding: 1.5rem;
  border-radius: 1rem;
  width: 100%;
  &__header {
    display: flex;
    justify-content: space-between;
    font-weight: bold;
  }
  &__boxes {
    display: flex;
    gap: 1.5rem;
    padding: 1.5rem;
    justify-content: center;
    align-items: center;
    &-tile {
      width: 33.33%;
      background-color: $white;
      padding: 0.5rem;
      border-radius: 0.5rem;
      p {
        font-weight: bold;
        margin: 1.25rem 0;
      }
    }
  }
}
.icon-1 {
  position: absolute;
  right: 0;
  top: 0;
}
.icon-2 {
  position: absolute;
  right: -2em;
  top: 60%;
}
.icon-3 {
  position: absolute;
  right: 10em;
  top: 90%;
}
.icon-4 {
  position: absolute;
  left: 5em;
  top: 95%;
}

@media only screen and (max-width: 770px) {
  .login__info {
    display: none;
  }
  .login__form {
    margin-top: 1rem;
    width: 100%;
  }
  p {
    font-size: 12px;
  }
}

@media only screen and (min-width: 771px) {
  p {
    font-size: 14px;
  }
}
</style>
