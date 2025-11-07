<template>
  <div class="about">
    <h1><div id="Academica">About</div></h1>
    <p>The motivation Motivation for creating Academica was to let 
    students quickly compare classes by professor ratings, section times, 
    and fulfillment of graduation requirements to make planning their academic schedule quick and efficient.</p>
    <p></p>
    <p></p>
    <p>This is how it started:</p>
    <div class="story-images">
      <img
        src="https://raw.githubusercontent.com/mg126e/61040-portfolio/main/assignments/Images/IMG_0285.jpg"
        alt="Early concept sketch of Academica project"
      />
      <img
        src="https://raw.githubusercontent.com/mg126e/61040-portfolio/main/assignments/Images/IMG_0286.jpg"
        alt="Whiteboard planning for Academica project"
      />
    </div>

    <RouterLink to="/" class="cta-link">Click here and see how it's going</RouterLink>
    
  </div>
</template>

<script setup lang="ts">
// About page component
</script>

<style scoped>
.about {
  min-height: 100vh;
  background: white;
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

h1 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

#Academica {
  font-family: 'Caladea', serif;
  font-weight: bold;
}

.story-images {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin: 1.5rem 0 2.5rem;
}

.story-images img {
  flex: 1 1 280px;
  max-width: 100%;
  border-radius: 12px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
  margin: 0 auto;
}

.cta-link {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 1.5rem auto 0;
  padding: 0.75rem 0.84rem;
  background-color:rgb(201, 163, 249);
  color: #fff;
  border-radius: 999px;
  text-decoration: none;
  font-weight: 600;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  opacity: 0.8;
}

.cta-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18);
}
</style>

