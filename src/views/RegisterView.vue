<template>
  <div class="register-container">
    <div class="register-card">
      <h1 class="register-title">Create Account</h1>
      
      <form @submit.prevent="handleRegister" class="register-form">
        <div class="form-group">
          <label for="username">Username</label>
          <input
            id="username"
            v-model="registerForm.username"
            type="text"
            required
            :disabled="loading"
            class="form-input"
            placeholder="Choose a username"
          />
        </div>


        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="registerForm.password"
            type="password"
            required
            :disabled="loading"
            class="form-input"
            placeholder="Create a password"
            minlength="6"
          />
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            required
            :disabled="loading"
            class="form-input"
            placeholder="Confirm your password"
          />
        </div>

        <button
          type="submit"
          :disabled="loading || !passwordsMatch"
          class="register-button"
        >
          <span v-if="loading">Creating Account...</span>
          <span v-else>Create Account</span>
        </button>
      </form>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-if="success" class="success-message">
        Account created successfully! You can now login to your account.
      </div>

      <div class="register-links">
        <p>
          Already have an account? 
          <router-link to="/login" class="link">Login here</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const registerForm = reactive({
  username: '',
  password: ''
})

const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')
const success = ref(false)

const passwordsMatch = computed(() => {
  return registerForm.password === confirmPassword.value && registerForm.password.length > 0
})

const handleRegister = async () => {
  if (!passwordsMatch.value) {
    error.value = 'Passwords do not match'
    return
  }

  loading.value = true
  error.value = ''
  success.value = false

  try {
    await authStore.register({
      username: registerForm.username,
      email: '', // No email required
      password: registerForm.password
    })

    success.value = true
    
    // Clear form
    registerForm.username = ''
    registerForm.password = ''
    confirmPassword.value = ''

    // Redirect to login after a short delay
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Registration failed'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Caladea:wght@400;700&display=swap');

.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #A3C4F3 0%, #FFCFD2 100%);
  padding: 20px;
}

.register-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 400px;
}

.register-title {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
  font-size: 28px;
  font-weight: 600;
  font-family: 'Caladea', serif;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 500;
  color: #555;
  font-size: 14px;
}

.form-input {
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
}

.form-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.register-button {
  background: #6D88D3;
  color: white;
  border: none;
  padding: 14px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  margin-top: 10px;
}

.register-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.register-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.error-message {
  background-color: #fee;
  color: #c33;
  padding: 12px 16px;
  border-radius: 8px;
  margin-top: 20px;
  border: 1px solid #fcc;
}

.success-message {
  background-color: #efe;
  color: #363;
  padding: 12px 16px;
  border-radius: 8px;
  margin-top: 20px;
  border: 1px solid #cfc;
}

.register-links {
  margin-top: 30px;
  text-align: center;
}

.register-links p {
  margin: 8px 0;
  color: #666;
  font-size: 14px;
}

.link {
  color: #6D88D3;
  text-decoration: none;
  font-weight: 500;
}

.link:hover {
  text-decoration: underline;
}
</style>

