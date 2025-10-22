<template>
  <div class="home">
    <h1>Welcome to Academica Frontend</h1>
    <p>This is a Vue.js application built with TypeScript, Vue Router, and Pinia for course scheduling management.</p>
    
    <div class="features">
      <h2>Features:</h2>
      <ul>
        <li>Create Schedules</li>
        <li>Compare Sections</li>
        <li>Export to your Google Calendar</li>
      </ul>
    </div>

    <div class="quick-actions">
      <h2>Quick Actions:</h2>
      <div class="action-buttons">
        <RouterLink to="/courses" class="btn btn-primary">
          Manage Courses
        </RouterLink>
        <RouterLink to="/sections" class="btn btn-primary">
          Manage Sections
        </RouterLink>
        <RouterLink to="/schedules" class="btn btn-primary">
          Manage Schedules
        </RouterLink>
      </div>
    </div>

    <div class="api-info">
      <h2>Backend Integration:</h2>
      <p>This frontend connects to your backend API running on <code>http://localhost:8000</code></p>
      <p>All course scheduling operations are handled through the integrated API service layer.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// This is the home page component
</script>

<style scoped>
.home {
  text-align: center;
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

h1 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.features {
  margin-top: 2rem;
  text-align: left;
}

.features ul {
  list-style-type: disc;
  padding-left: 2rem;
}

.features li {
  margin-bottom: 0.5rem;
  color: #555;
}

.quick-actions {
  margin-top: 3rem;
  text-align: center;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  text-decoration: none;
  display: inline-block;
  text-align: center;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.api-info {
  margin-top: 3rem;
  padding: 2rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  text-align: left;
}

.api-info code {
  background: #e9ecef;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-family: monospace;
  color: #495057;
}

@media (max-width: 768px) {
  .action-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .btn {
    width: 200px;
  }
}
</style>
