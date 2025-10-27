<template>
  <div class="sections-view">
    <div class="header">
      <h1>Section Management</h1>
      <button @click="showCreateForm = !showCreateForm" class="btn btn-primary">
        {{ showCreateForm ? 'Cancel' : 'Create New Section' }}
      </button>
    </div>

    <!-- Create Section Form -->
    <div v-if="showCreateForm" class="create-form">
      <h2>Create New Section</h2>
      <form @submit.prevent="handleCreateSection">
        <div class="form-row">
          <div class="form-group">
            <label for="courseId">Course ID:</label>
            <select id="courseId" v-model="newSection.courseId" required>
              <option value="">Select a course</option>
              <option v-for="course in courseStore.courses" :key="course.id" :value="course.id">
                {{ course.id }} - {{ course.title }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="sectionNumber">Section Number:</label>
            <input
              id="sectionNumber"
              v-model="newSection.sectionNumber"
              type="text"
              required
              placeholder="e.g., 001"
            />
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="instructor">Instructor:</label>
            <input
              id="instructor"
              v-model="newSection.instructor"
              type="text"
              required
              placeholder="e.g., Dr. Smith"
            />
          </div>
          <div class="form-group">
            <label for="capacity">Capacity:</label>
            <input
              id="capacity"
              v-model.number="newSection.capacity"
              type="number"
              required
              min="1"
              placeholder="e.g., 30"
            />
          </div>
        </div>

        <!-- Time Slots -->
        <div class="time-slots-section">
          <h3>Time Slots</h3>
          <div
            v-for="(timeSlot, index) in newSection.timeSlots"
            :key="index"
            class="time-slot"
          >
            <div class="form-row">
              <div class="form-group">
                <label>Days:</label>
                <div class="checkbox-group">
                  <label v-for="day in daysOfWeek" :key="day" class="checkbox-label">
                    <input
                      type="checkbox"
                      :value="day"
                      v-model="timeSlot.days"
                    />
                    {{ day }}
                  </label>
                </div>
              </div>
              <div class="form-group">
                <label>Start Time:</label>
                <input
                  v-model="timeSlot.startTime"
                  type="time"
                  required
                />
              </div>
              <div class="form-group">
                <label>End Time:</label>
                <input
                  v-model="timeSlot.endTime"
                  type="time"
                  required
                />
              </div>
              <div class="form-group">
                <label>Location (optional):</label>
                <input
                  v-model="timeSlot.location"
                  type="text"
                  placeholder="e.g., Room 101"
                />
              </div>
            </div>
            <button
              type="button"
              @click="removeTimeSlot(index)"
              class="btn btn-danger btn-sm"
              v-if="newSection.timeSlots.length > 1"
            >
              Remove Time Slot
            </button>
          </div>
          <button
            type="button"
            @click="addTimeSlot"
            class="btn btn-secondary"
          >
            Add Time Slot
          </button>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="sectionStore.loading">
            {{ sectionStore.loading ? 'Creating...' : 'Create Section' }}
          </button>
          <button type="button" @click="resetForm" class="btn btn-secondary">
            Reset
          </button>
        </div>
      </form>
    </div>

    <!-- Error Display -->
    <div v-if="sectionStore.error" class="error-message">
      {{ sectionStore.error }}
      <button @click="sectionStore.clearError" class="btn-close">×</button>
    </div>

    <!-- Loading State -->
    <div v-if="sectionStore.loading && !showCreateForm" class="loading">
      Loading sections...
    </div>

    <!-- Sections List -->
    <div v-else class="sections-list">
      <div v-if="sectionStore.sections.length === 0" class="empty-state">
        <p>No sections found. Create your first section to get started!</p>
      </div>
      <div v-else>
        <h2>All Sections ({{ sectionStore.sectionCount }})</h2>
        <div class="sections-grid">
          <div
            v-for="section in sectionStore.sections"
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
          </div>
        </div>

        <!-- Sections by Course -->
        <div v-if="Object.keys(sectionStore.sectionsByCourse).length > 0" class="courses-section">
          <h2>Sections by Course</h2>
          <div
            v-for="(sections, courseId) in sectionStore.sectionsByCourse"
            :key="courseId"
            class="course-group"
          >
            <h3>{{ getCourseTitle(courseId) }} ({{ sections.length }} sections)</h3>
            <div class="sections-grid">
              <div
                v-for="section in sections"
                :key="section.id"
                class="section-card"
              >
                <div class="section-header">
                  <h4>Section {{ section.sectionNumber }}</h4>
                </div>
                <p class="instructor">{{ section.instructor }}</p>
                <p class="capacity">Capacity: {{ section.capacity }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSectionStore } from '@/stores/sectionStore'
import { useCourseStore } from '@/stores/courseStore'
import type { TimeSlot } from '@/types/api'

const sectionStore = useSectionStore()
const courseStore = useCourseStore()
const showCreateForm = ref(false)

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const newSection = ref({
  courseId: '',
  sectionNumber: '',
  instructor: '',
  capacity: 0,
  timeSlots: [
    {
      days: [],
      startTime: '',
      endTime: '',
      location: ''
    }
  ]
})

const handleCreateSection = async () => {
  try {
    await sectionStore.createSection({ ...newSection.value })
    resetForm()
    showCreateForm.value = false
  } catch (error) {
    // Error is handled by the store
  }
}

const resetForm = () => {
  newSection.value = {
    courseId: '',
    sectionNumber: '',
    instructor: '',
    capacity: 0,
    timeSlots: [
      {
        days: [],
        startTime: '',
        endTime: '',
        location: ''
      }
    ]
  }
}

const addTimeSlot = () => {
  newSection.value.timeSlots.push({
    days: [],
    startTime: '',
    endTime: '',
    location: ''
  })
}

const removeTimeSlot = (index: number) => {
  newSection.value.timeSlots.splice(index, 1)
}

const getCourseTitle = (courseId: string) => {
  const course = courseStore.getCourseById(courseId)
  return course ? `${course.id} - ${course.title}` : courseId
}

onMounted(async () => {
  await Promise.all([
    sectionStore.fetchAllSections(),
    courseStore.fetchAllCourses()
  ])
})
</script>

<style scoped>
.sections-view {
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

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
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

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.time-slots-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #dee2e6;
}

.time-slots-section h3 {
  color: #495057;
  margin-bottom: 1rem;
}

.time-slot {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  margin-bottom: 1rem;
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-weight: normal;
  margin-bottom: 0;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  margin: 0;
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

.sections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.section-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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

.section-header h3,
.section-header h4 {
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
  background: #f8f9fa;
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

.courses-section {
  margin-top: 3rem;
}

.course-group {
  margin-bottom: 2rem;
}

.course-group h3 {
  color: #495057;
  border-bottom: 2px solid #007bff;
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
}
</style>

