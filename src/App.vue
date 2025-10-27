<template>
  <div id="app">
    <!-- Show navigation only when authenticated -->
    <nav v-if="authStore.isAuthenticated">
      <div class="nav-brand">
        <RouterLink to="/" class="brand-link">Academica</RouterLink>
      </div>
      <div class="nav-links">
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
      </div>
      <div class="nav-auth">
        <span class="user-info">Welcome, {{ authStore.user?.username }}</span>
        <button @click="handleLogout" class="btn btn-outline">Logout</button>
      </div>
    </nav>
    
    <!-- Show main content when authenticated -->
    <main v-if="authStore.isAuthenticated">
      <RouterView />
    </main>
    
    <!-- Show login/register pages or welcome screen when not authenticated -->
    <div v-else>
      <!-- Show login/register forms when on those routes -->
      <RouterView v-if="isAuthRoute" />
      
      <!-- Show welcome screen when on home page -->
      <div v-else class="auth-container">
        <div class="auth-card">
          <h1 class="auth-title">Welcome to Academica</h1>
          <p class="auth-subtitle">Please login or register to access the application</p>
          
          <div class="auth-buttons">
            <button @click="goToLogin" class="btn btn-primary btn-large">Login</button>
            <button @click="goToRegister" class="btn btn-outline btn-large">Register</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView, useRouter, useRoute } from 'vue-router'
import { onMounted, computed } from 'vue'
import { useAuthStore } from './stores/authStore'
import { useSessionStore } from './stores/sessionStore'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const sessionStore = useSessionStore()

// Check if we're on an authentication route (login, register, confirm)
const isAuthRoute = computed(() => {
  return route.path === '/login' || route.path === '/register' || route.path === '/confirm'
})

const handleLogout = async () => {
  try {
    await sessionStore.endSession()
    authStore.logout()
  } catch (error) {
    console.error('Error during logout:', error)
    // Still logout locally even if session end fails
    authStore.logout()
  }
}

const goToLogin = () => {
  console.log('Login button clicked - navigating to /login')
  router.push('/login')
}

const goToRegister = () => {
  console.log('Register button clicked - navigating to /register')
  router.push('/register')
}

onMounted(() => {
  // Initialize authentication and session stores
  authStore.initializeAuth()
  sessionStore.initializeSession()
})
</script>

<style scoped>
nav {
  padding: 1rem 2rem;
  background-color: #f8f9fa;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav-brand {
  flex: 1;
}

.brand-link {
  font-size: 1.5rem;
  font-weight: bold;
  color: #2c3e50;
  text-decoration: none;
}

.nav-links {
  flex: 2;
  display: flex;
  gap: 2rem;
}

.nav-auth {
  flex: 1;
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: flex-end;
}

nav a {
  text-decoration: none;
  color: #495057;
  font-weight: 500;
  transition: color 0.2s;
}

nav a:hover {
  color: #007bff;
}

.user-info {
  color: #495057;
  font-weight: 500;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.btn-outline {
  background-color: transparent;
  color: #007bff;
  border: 1px solid #007bff;
}

.btn-outline:hover {
  background-color: #007bff;
  color: white;
}

main {
  padding: 1rem;
}

.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.auth-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 40px;
  text-align: center;
  max-width: 500px;
  width: 100%;
}

.auth-title {
  color: #333;
  margin-bottom: 16px;
  font-size: 32px;
  font-weight: 600;
}

.auth-subtitle {
  color: #666;
  margin-bottom: 32px;
  font-size: 16px;
  line-height: 1.5;
}

.auth-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-large {
  padding: 14px 28px;
  font-size: 16px;
  min-width: 120px;
}
</style>
