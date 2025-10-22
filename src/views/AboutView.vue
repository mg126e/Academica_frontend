<template>
  <div class="about">
    <h1>About Academica</h1>
    <p>This is the about page of the Academica application.</p>
    <p>Built with modern web technologies to provide a robust and scalable frontend solution.</p>
    
    <div class="tech-stack">
      <h2>Technology Stack:</h2>
      <div class="tech-grid">
        <div class="tech-item">
          <h3>Vue.js 3</h3>
          <p>Progressive JavaScript framework</p>
        </div>
        <div class="tech-item">
          <h3>TypeScript</h3>
          <p>Type-safe JavaScript development</p>
        </div>
        <div class="tech-item">
          <h3>Vite</h3>
          <p>Fast build tool and dev server</p>
        </div>
        <div class="tech-item">
          <h3>Pinia</h3>
          <p>Modern state management</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// About page component
</script>

<style scoped>
.about {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

h1 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.tech-stack {
  margin-top: 2rem;
}

.tech-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.tech-item {
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.tech-item h3 {
  margin: 0 0 0.5rem 0;
  color: #007bff;
}

.tech-item p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}
</style>

