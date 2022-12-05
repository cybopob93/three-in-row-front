<script setup lang="ts">
import type { GameCard } from "@/models/games";
import BaseGameCard from "@/components/Base/BaseGameCard.vue";

const links: Array<GameCard> = [
  {
    link: "/games/3-in-row-html",
    title: "3 in row based on html",
    logo: "logo.svg",
    description: "html",
    stats: [
      {
        value: "1k",
        code: "count_games",
      },
      {
        value: "1k",
        code: "currently_played",
      },
    ],
  },
  {
    link: "/games/3-in-row-canvas",
    title: "3 in row based on canvas",
    logo: "logo.svg",
    description: "canvas",
    stats: [
      {
        value: "1k",
        code: "count_games",
      },
      {
        value: "1k",
        code: "currently_played",
      },
    ],
  },
];
</script>

<template>
  <base-game-card
    v-for="item in links"
    :key="item.title"
    :logo="item.logo"
    :title="item.title"
    :description="item.description"
    :link="item.link"
    :stats="item.stats"
  ></base-game-card>
</template>
