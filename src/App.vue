<template>
  <div id="app">
    <nav>
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="/about">About</RouterLink>
      <RouterLink to="/courses">Courses</RouterLink>
      <RouterLink to="/sections">Sections</RouterLink>
      <RouterLink to="/schedules">Schedules</RouterLink>
    </nav>
    <main>
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<style scoped>
nav {
  padding: 1rem;
  background-color: #f0f0f0;
  margin-bottom: 1rem;
}

nav a {
  margin-right: 1rem;
  text-decoration: none;
  color: #333;
  font-weight: bold;
}

nav a:hover {
  color: #007bff;
}

main {
  padding: 1rem;
}
</style>
