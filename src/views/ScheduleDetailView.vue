<template>
  <div class="schedule-detail-view">
    <div class="header">
      <RouterLink to="/schedules" class="btn btn-secondary">
        ← Back to Schedules
      </RouterLink>
      <h1>{{ schedule?.name || 'Schedule Details' }}</h1>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      Loading schedule details...
    </div>

    <!-- Error Display -->
    <div v-else-if="error || scheduleStore.error" class="error-message">
      {{ error || scheduleStore.error }}
      <button v-if="scheduleStore.error" @click="scheduleStore.clearError" class="btn-close">×</button>
    </div>

    <!-- Schedule Content -->
    <div v-else-if="schedule" class="schedule-content">
      <div class="schedule-info">
        <div class="info-card">
          <h2>Schedule Information</h2>
          <div class="info-grid">
            <div class="info-item">
              <label>Name:</label>
              <span>{{ schedule.name }}</span>
            </div>
            <div class="info-item">
              <label>Total Sections:</label>
              <span>{{ schedule.sectionIds.length }}</span>
            </div>
          </div>
        </div>

        <!-- Add Section Form -->
        <div class="add-section-form">
          <h2>Add Section to Schedule</h2>
          
          <!-- No Sections Warning -->
          <div v-if="sectionStore.sections.length === 0" class="warning-message">
            <p><strong>No sections available.</strong></p>
            <p>You need to create sections before you can add them to a schedule.</p>
            <RouterLink to="/sections" class="btn btn-primary">
              Go to Sections Page
            </RouterLink>
          </div>
          
          <!-- No Available Sections Warning -->
          <div v-else-if="availableSections.length === 0" class="info-message">
            <p>All available sections have been added to this schedule.</p>
          </div>
          
          <!-- Add Section Form -->
          <form v-else @submit.prevent="handleAddSection">
            <div class="form-group">
              <label for="sectionSelect">Select Section:</label>
              <select id="sectionSelect" v-model="selectedSectionId" required>
                <option value="">Choose a section</option>
                <option
                  v-for="section in availableSections"
                  :key="section.id"
                  :value="section.id"
                >
                  {{ getSectionDisplayName(section) }}
                </option>
              </select>
            </div>
            <button type="submit" class="btn btn-primary" :disabled="scheduleStore.loading">
              {{ scheduleStore.loading ? 'Adding...' : 'Add Section' }}
            </button>
          </form>
        </div>
      </div>

      <!-- Sections List -->
      <div class="sections-section">
        <h2>Sections in Schedule</h2>
        <div v-if="scheduleSections.length === 0" class="empty-state">
          <p>No sections in this schedule yet. Add sections using the form above.</p>
        </div>
        <div v-else class="sections-grid">
          <div
            v-for="section in scheduleSections"
            :key="section.id"
            class="section-card"
          >
            <div class="section-header">
              <h3>{{ getCourseTitle(section.courseId) }}</h3>
              <span class="section-number">{{ section.sectionNumber }}</span>
            </div>
            <p class="instructor">{{ section.instructor }}</p>
            <p class="capacity">Capacity: {{ section.capacity }}</p>
            <div class="time-slots">
              <h4>Schedule:</h4>
              <div
                v-for="(timeSlot, index) in section.timeSlots"
                :key="index"
                class="time-slot-display"
              >
                <span class="days">{{ timeSlot.days.join(', ') }}</span>
                <span class="time">{{ timeSlot.startTime }} - {{ timeSlot.endTime }}</span>
                <span v-if="timeSlot.location" class="location">{{ timeSlot.location }}</span>
              </div>
            </div>
            <div class="section-actions">
              <button
                @click="handleRemoveSection(section.id)"
                class="btn btn-danger btn-sm"
                :disabled="scheduleStore.loading"
              >
                Remove from Schedule
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Schedule Not Found -->
    <div v-else class="not-found">
      <h2>Schedule Not Found</h2>
      <p>The requested schedule could not be found.</p>
      <RouterLink to="/schedules" class="btn btn-primary">
        Back to Schedules
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useScheduleStore } from '@/stores/scheduleStore'
import { useSectionStore } from '@/stores/sectionStore'
import { useCourseStore } from '@/stores/courseStore'
import type { Section } from '@/types/api'

const route = useRoute()
const scheduleStore = useScheduleStore()
const sectionStore = useSectionStore()
const courseStore = useCourseStore()

const loading = ref(false)
const error = ref<string | null>(null)
const selectedSectionId = ref('')

const scheduleId = computed(() => route.params.id as string)
const schedule = computed(() => scheduleStore.getScheduleById(scheduleId.value))

const scheduleSections = computed(() => {
  if (!schedule.value) return []
  return schedule.value.sectionIds
    .map(id => sectionStore.getSectionById(id))
    .filter(Boolean) as Section[]
})

const availableSections = computed(() => {
  if (!schedule.value) return sectionStore.sections
  return sectionStore.sections.filter(section => 
    !schedule.value!.sectionIds.includes(section.id)
  )
})

const getSectionDisplayName = (section: Section) => {
  const course = courseStore.getCourseById(section.courseId)
  const courseName = course ? `${course.id} - ${course.title}` : section.courseId
  return `${courseName} - Section ${section.sectionNumber} (${section.instructor})`
}

const getCourseTitle = (courseId: string) => {
  const course = courseStore.getCourseById(courseId)
  return course ? `${course.id} - ${course.title}` : courseId
}

const handleAddSection = async () => {
  if (!selectedSectionId.value || !schedule.value) return
  
  try {
    await scheduleStore.addSectionToSchedule(schedule.value.id, selectedSectionId.value)
    selectedSectionId.value = ''
  } catch (error) {
    // Error is handled by the store
  }
}

const handleRemoveSection = async (sectionId: string) => {
  if (!schedule.value) return
  
  if (confirm('Are you sure you want to remove this section from the schedule?')) {
    try {
      await scheduleStore.removeSectionFromSchedule(schedule.value.id, sectionId)
    } catch (error) {
      // Error is handled by the store
    }
  }
}

const loadData = async () => {
  loading.value = true
  error.value = null
  
  try {
    await Promise.all([
      scheduleStore.fetchAllSchedules(),
      sectionStore.fetchAllSections(),
      courseStore.fetchAllCourses()
    ])
  } catch (err) {
    error.value = 'Failed to load schedule data'
    console.error('Error loading data:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

watch(scheduleId, () => {
  loadData()
})
</script>

<style scoped>
.schedule-detail-view {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.header h1 {
  margin: 0;
  color: #2c3e50;
}

.schedule-content {
  display: grid;
  gap: 2rem;
}

.schedule-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.info-card {
  background: #f8f9fa;
  padding: 2rem;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.info-card h2 {
  margin-top: 0;
  color: #495057;
}

.info-grid {
  display: grid;
  gap: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e9ecef;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item label {
  font-weight: 600;
  color: #495057;
}

.add-section-form {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.add-section-form h2 {
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

.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.sections-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.sections-section h2 {
  margin-top: 0;
  color: #495057;
}

.sections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.section-card {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  transition: box-shadow 0.2s;
}

.section-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h3 {
  margin: 0;
  color: #2c3e50;
}

.section-number {
  background: #007bff;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 600;
}

.instructor {
  color: #495057;
  margin: 0.5rem 0;
  font-weight: 500;
}

.capacity {
  color: #6c757d;
  margin: 0.5rem 0;
}

.time-slots h4 {
  margin: 1rem 0 0.5rem 0;
  color: #495057;
  font-size: 1rem;
}

.time-slot-display {
  background: white;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.days {
  font-weight: 600;
  color: #2c3e50;
}

.time {
  color: #495057;
}

.location {
  color: #6c757d;
  font-style: italic;
}

.section-actions {
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

.loading {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
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

.warning-message {
  background-color: #fff3cd;
  color: #856404;
  padding: 1.5rem;
  border-radius: 4px;
  border: 1px solid #ffeaa7;
  text-align: center;
}

.warning-message p {
  margin: 0.5rem 0;
}

.warning-message .btn {
  margin-top: 1rem;
}

.info-message {
  background-color: #d1ecf1;
  color: #0c5460;
  padding: 1rem;
  border-radius: 4px;
  border: 1px solid #bee5eb;
  text-align: center;
}

.info-message p {
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #721c24;
  padding: 0;
  margin-left: 1rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #6c757d;
}

.not-found {
  text-align: center;
  padding: 3rem;
  color: #6c757d;
}

.not-found h2 {
  color: #495057;
  margin-bottom: 1rem;
}

@media (max-width: 768px) {
  .schedule-info {
    grid-template-columns: 1fr;
  }
  
  .sections-grid {
    grid-template-columns: 1fr;
  }
}
</style>

