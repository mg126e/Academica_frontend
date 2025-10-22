<template>
  <div class="schedules-view">
    <div class="header">
      <h1>Schedule Management</h1>
      <button @click="showCreateForm = !showCreateForm" class="btn btn-primary">
        {{ showCreateForm ? 'Cancel' : 'Create New Schedule' }}
      </button>
    </div>

    <!-- Create Schedule Form -->
    <div v-if="showCreateForm" class="create-form">
      <h2>Create New Schedule</h2>
      <form @submit.prevent="handleCreateSchedule">
        <div class="form-group">
          <label for="scheduleName">Schedule Name:</label>
          <input
            id="scheduleName"
            v-model="newSchedule.name"
            type="text"
            required
            placeholder="e.g., Fall 2024 Schedule"
          />
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="scheduleStore.loading">
            {{ scheduleStore.loading ? 'Creating...' : 'Create Schedule' }}
          </button>
          <button type="button" @click="resetForm" class="btn btn-secondary">
            Reset
          </button>
        </div>
      </form>
    </div>

    <!-- Error Display -->
    <div v-if="scheduleStore.error" class="error-message">
      {{ scheduleStore.error }}
      <button @click="scheduleStore.clearError" class="btn-close">×</button>
    </div>

    <!-- Loading State -->
    <div v-if="scheduleStore.loading && !showCreateForm" class="loading">
      Loading schedules...
    </div>

    <!-- Schedules List -->
    <div v-else class="schedules-list">
      <div v-if="scheduleStore.schedules.length === 0" class="empty-state">
        <p>No schedules found. Create your first schedule to get started!</p>
      </div>
      <div v-else>
        <h2>All Schedules ({{ scheduleStore.scheduleCount }})</h2>
        <div class="schedules-grid">
          <div
            v-for="schedule in scheduleStore.schedules"
            :key="schedule.id"
            class="schedule-card"
          >
            <div class="schedule-header">
              <h3>{{ schedule.name }}</h3>
              <span class="owner">{{ schedule.owner }}</span>
            </div>
            <p class="section-count">{{ schedule.sectionIds.length }} sections</p>
            <div class="schedule-actions">
              <RouterLink :to="`/schedule/${schedule.id}`" class="btn btn-primary btn-sm">
                View Details
              </RouterLink>
              <button
                @click="handleDuplicateSchedule(schedule)"
                class="btn btn-secondary btn-sm"
                :disabled="scheduleStore.loading"
              >
                Duplicate
              </button>
              <button
                @click="handleDeleteSchedule(schedule)"
                class="btn btn-danger btn-sm"
                :disabled="scheduleStore.loading"
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        <!-- User Schedules -->
        <div v-if="scheduleStore.userSchedules.length > 0" class="user-schedules-section">
          <h2>My Schedules ({{ scheduleStore.userSchedules.length }})</h2>
          <div class="schedules-grid">
            <div
              v-for="schedule in scheduleStore.userSchedules"
              :key="schedule.id"
              class="schedule-card"
            >
              <div class="schedule-header">
                <h3>{{ schedule.name }}</h3>
              </div>
              <p class="section-count">{{ schedule.sectionIds.length }} sections</p>
              <div class="schedule-actions">
                <RouterLink :to="`/schedule/${schedule.id}`" class="btn btn-primary btn-sm">
                  View Details
                </RouterLink>
                <button
                  @click="handleDuplicateSchedule(schedule)"
                  class="btn btn-secondary btn-sm"
                  :disabled="scheduleStore.loading"
                >
                  Duplicate
                </button>
                <button
                  @click="handleDeleteSchedule(schedule)"
                  class="btn btn-danger btn-sm"
                  :disabled="scheduleStore.loading"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Duplicate Schedule Modal -->
    <div v-if="showDuplicateModal" class="modal-overlay" @click="closeDuplicateModal">
      <div class="modal" @click.stop>
        <h3>Duplicate Schedule</h3>
        <form @submit.prevent="handleConfirmDuplicate">
          <div class="form-group">
            <label for="duplicateName">New Schedule Name:</label>
            <input
              id="duplicateName"
              v-model="duplicateName"
              type="text"
              required
              placeholder="e.g., Fall 2024 Schedule (Copy)"
            />
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary" :disabled="scheduleStore.loading">
              {{ scheduleStore.loading ? 'Duplicating...' : 'Duplicate' }}
            </button>
            <button type="button" @click="closeDuplicateModal" class="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useScheduleStore } from '@/stores/scheduleStore'
import type { Schedule } from '@/types/api'

const scheduleStore = useScheduleStore()
const showCreateForm = ref(false)
const showDuplicateModal = ref(false)
const duplicateName = ref('')
const scheduleToDuplicate = ref<Schedule | null>(null)

const newSchedule = ref({
  name: ''
})

const handleCreateSchedule = async () => {
  try {
    await scheduleStore.createSchedule(newSchedule.value.name)
    resetForm()
    showCreateForm.value = false
  } catch (error) {
    // Error is handled by the store
  }
}

const resetForm = () => {
  newSchedule.value = {
    name: ''
  }
}

const handleDuplicateSchedule = (schedule: Schedule) => {
  scheduleToDuplicate.value = schedule
  duplicateName.value = `${schedule.name} (Copy)`
  showDuplicateModal.value = true
}

const handleConfirmDuplicate = async () => {
  if (!scheduleToDuplicate.value) return
  
  try {
    await scheduleStore.duplicateSchedule(
      scheduleToDuplicate.value.id,
      duplicateName.value
    )
    closeDuplicateModal()
  } catch (error) {
    // Error is handled by the store
  }
}

const closeDuplicateModal = () => {
  showDuplicateModal.value = false
  scheduleToDuplicate.value = null
  duplicateName.value = ''
}

const handleDeleteSchedule = async (schedule: Schedule) => {
  if (confirm(`Are you sure you want to delete "${schedule.name}"?`)) {
    try {
      await scheduleStore.deleteSchedule(schedule.id)
    } catch (error) {
      // Error is handled by the store
    }
  }
}

onMounted(() => {
  scheduleStore.fetchAllSchedules()
})
</script>

<style scoped>
.schedules-view {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header h1 {
  margin: 0;
  color: #2c3e50;
}

.create-form {
  background: #f8f9fa;
  padding: 2rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  border: 1px solid #dee2e6;
}

.create-form h2 {
  margin-top: 0;
  color: #495057;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #495057;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
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

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #545b62;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-danger:hover {
  background-color: #c82333;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #721c24;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #6c757d;
}

.schedules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.schedule-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s;
}

.schedule-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.schedule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.schedule-header h3 {
  margin: 0;
  color: #2c3e50;
}

.owner {
  background: #e9ecef;
  color: #495057;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.875rem;
}

.section-count {
  color: #6c757d;
  margin: 0.5rem 0;
}

.schedule-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.user-schedules-section {
  margin-top: 3rem;
}

.user-schedules-section h2 {
  color: #495057;
  border-bottom: 2px solid #007bff;
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal h3 {
  margin-top: 0;
  color: #2c3e50;
}
</style>

