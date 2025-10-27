<template>
  <div class="confirm-container">
    <div class="confirm-card">
      <h1 class="confirm-title">Confirm Your Email</h1>
      
      <form @submit.prevent="handleConfirm" class="confirm-form">
        <div class="form-group">
          <label for="username">Username</label>
          <input
            id="username"
            v-model="confirmForm.username"
            type="text"
            required
            :disabled="loading"
            class="form-input"
            placeholder="Enter your username"
          />
        </div>

        <div class="form-group">
          <label for="token">Confirmation Token</label>
          <input
            id="token"
            v-model="confirmForm.token"
            type="text"
            required
            :disabled="loading"
            class="form-input"
            placeholder="Enter the token from your email"
          />
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="confirm-button"
        >
          <span v-if="loading">Confirming...</span>
          <span v-else>Confirm Email</span>
        </button>
      </form>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-if="success" class="success-message">
        Email confirmed successfully! You can now login to your account.
      </div>

      <div class="confirm-links">
        <p>
          <router-link to="/login" class="link">Back to Login</router-link>
        </p>
        <p>
          Don't have an account? 
          <router-link to="/register" class="link">Register here</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const confirmForm = reactive({
  username: '',
  token: ''
})

const loading = ref(false)
const error = ref('')
const success = ref(false)

const handleConfirm = async () => {
  loading.value = true
  error.value = ''
  success.value = false

  try {
    await authStore.confirmEmail({
      username: confirmForm.username,
      token: confirmForm.token
    })

    success.value = true
    
    // Clear form
    confirmForm.username = ''
    confirmForm.token = ''

    // Redirect to login after a short delay
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Email confirmation failed'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.confirm-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.confirm-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 400px;
}

.confirm-title {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
  font-size: 28px;
  font-weight: 600;
}

.confirm-form {
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

.confirm-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

.confirm-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.confirm-button:disabled {
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

.confirm-links {
  margin-top: 30px;
  text-align: center;
}

.confirm-links p {
  margin: 8px 0;
  color: #666;
  font-size: 14px;
}

.link {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.link:hover {
  text-decoration: underline;
}
</style>


