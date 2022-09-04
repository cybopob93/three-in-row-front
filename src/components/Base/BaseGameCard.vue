<script setup lang="ts">
import { RouterLink } from "vue-router";
import { reactive } from "vue";
import IconArrow from "@/components/icons/IconArrow.vue";

interface GameCardProps {
  logo: string;
  title: string;
  description: string;
  link: string;
  stats: Array<{
    value: string;
    code: string;
  }>;
}

const { logo, title, description, link, stats } = defineProps<GameCardProps>();

const state = reactive({
  isOpen: false,
});

function getImageUrl(name: string) {
  return new URL(`../../assets/${name}`, import.meta.url).href
}

function changePreviewState() {
  state.isOpen = !state.isOpen;
}
</script>

<template>
  <section class="base-game-card">
    <div class="base-game-card__preview">
      <RouterLink class="base-game-card__logo" :to="link">
        <img
          :alt="title"
          :src="getImageUrl(`${logo}`)"
          width="56"
          height="56"
        />
      </RouterLink>
      <div class="base-game-card__description">
        <div class="base-game-card__title">
          <RouterLink :to="link">{{ title }}</RouterLink>
          <IconArrow
            class="base-game-card__arrow"
            :class="{ 'base-game-card__arrow--opened': state.isOpen }"
            @click="changePreviewState"
          />
        </div>
        <div class="base-game-card__text">{{ description }}</div>
      </div>
    </div>
    <div v-show="state.isOpen" class="base-game-card__details">
      <div
        v-for="(item, index) in stats"
        :key="index"
        class="base-game-card__detail"
      >
        <span class="base-game-card__detail-count">{{ item.value }}</span>
        <span class="base-game-card__detail-title">{{ item.code }}</span>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.base-game-card {
  background-color: var(--color-background);
  box-shadow: 0px 10px 35px rgba(66, 66, 66, 0.15);
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 54px;

  &__preview {
    display: flex;
    flex: 1;
  }

  &__logo {
    width: 96px;
    height: 96px;
    background-color: var(--color-background);
    border-radius: 50px;
    box-shadow: 0px 10px 35px rgba(66, 66, 66, 0.15);
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 26px;
  }

  &__description {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    flex-direction: column;
    flex: 1;
  }

  &__title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;

    & a {
      font-size: 36px;
      font-weight: 600;
    }
  }

  &__text {
    color: var(--vt-c-dark);
    font-size: 13px;
    font-weight: 50;
  }

  &__arrow {
    cursor: pointer;
    transition: all ease 0.4s;

    &--opened {
      transform: rotate(180deg);
    }
  }
}
</style>