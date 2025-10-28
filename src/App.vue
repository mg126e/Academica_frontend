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
          <p class="auth-subtitle">Please login or register</p>
          
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
@import url('https://fonts.googleapis.com/css2?family=Caladea:wght@400;700&display=swap');

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
  flex: 0 0 auto;
}

.brand-link {
  font-size: 2.25rem;
  font-weight: bold;
  color: #2c3e50;
  text-decoration: none;
  font-family: 'Caladea', serif;
}

.nav-links {
  flex: 1;
  display: flex;
  gap: 2rem;
  justify-content: center;
  margin-left: -500px;
}

.nav-auth {
  flex: 0 0 auto;
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
  font-family: 'Caladea', serif;
  font-size: 1.5rem;
}

nav a:hover {
  color: #6D88D3;
}

.user-info {
  color: #495057;
  font-weight: 500;
  font-family: 'Caladea', serif;
  font-size: 1.5rem;
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
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.btn-primary {
  background-color: #6D88D3;
  color: white;
}

.btn-primary:hover {
  background-color: #5a73ba;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(109, 136, 211, 0.4);
}

.btn-outline {
  background-color: #CBDEF8;
  color: #41484e;
  border: 1px solid #A3C4F3;
}

.btn-outline:hover {
  background-color: #8bb3ed;
  color: #41484e;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(163, 196, 243, 0.4);
}

main {
  padding: 0;
}

.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #A3C4F3 0%, #FFCFD2 100%);
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
  font-family: 'Caladea', serif;
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
