<template>
  <div class="courses-view">
    <div class="header">
      <h1>Course Management</h1>
      <div class="header-actions">
        <button @click="showCreateForm = !showCreateForm" class="btn btn-primary">
          {{ showCreateForm ? 'Cancel' : 'Create New Course' }}
        </button>
        <button @click="showFiltering = !showFiltering" class="btn btn-secondary">
          {{ showFiltering ? 'Hide Filters' : 'Show Filters' }}
        </button>
      </div>
    </div>

    <!-- Course Filtering Section -->
    <div v-if="showFiltering" class="filtering-section">
      <h2>Course Filtering</h2>
      
      <!-- Search -->
      <div class="search-section">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search courses..."
          class="search-input"
          @input="handleSearch"
        />
      </div>

      <!-- Active Tags -->
      <div v-if="filteringStore.activeTags.length > 0" class="active-tags">
        <h3>Active Filters:</h3>
        <div class="tags-list">
          <span
            v-for="tag in filteringStore.activeTags"
            :key="tag.id"
            class="tag active-tag"
          >
            {{ tag.id }} ({{ tag.category }})
            <button @click="removeTag(tag.id, tag.category)" class="tag-remove">×</button>
          </span>
          <button @click="clearAllTags" class="btn btn-small btn-outline">Clear All</button>
        </div>
      </div>

      <!-- Available Tags -->
      <div v-if="filteringStore.availableTags.length > 0" class="available-tags">
        <h3>Filter by Tags:</h3>
        <div class="tags-list">
          <span
            v-for="tag in filteringStore.availableTags"
            :key="tag.id"
            class="tag available-tag"
            @click="addTag(tag.id, tag.category)"
          >
            {{ tag.id }} ({{ tag.category }})
          </span>
        </div>
      </div>

      <!-- Filter Actions -->
      <div class="filter-actions">
        <button @click="fetchFilteredCourses" class="btn btn-primary" :disabled="filteringStore.loading">
          {{ filteringStore.loading ? 'Loading...' : 'Apply Filters' }}
        </button>
        <button @click="clearAllTags" class="btn btn-secondary">Clear Filters</button>
      </div>
    </div>

    <!-- Create Course Form -->
    <div v-if="showCreateForm" class="create-form">
      <h2>Create New Course</h2>
      <form @submit.prevent="handleCreateCourse">
        <div class="form-group">
          <label for="courseId">Course ID:</label>
          <input
            id="courseId"
            v-model="newCourse.id"
            type="text"
            required
            placeholder="e.g., CS101"
          />
        </div>
        <div class="form-group">
          <label for="courseTitle">Course Title:</label>
          <input
            id="courseTitle"
            v-model="newCourse.title"
            type="text"
            required
            placeholder="e.g., Introduction to Computer Science"
          />
        </div>
        <div class="form-group">
          <label for="courseDepartment">Department:</label>
          <input
            id="courseDepartment"
            v-model="newCourse.department"
            type="text"
            required
            placeholder="e.g., Computer Science"
          />
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="courseStore.loading">
            {{ courseStore.loading ? 'Creating...' : 'Create Course' }}
          </button>
          <button type="button" @click="resetForm" class="btn btn-secondary">
            Reset
          </button>
        </div>
      </form>
    </div>

    <!-- Error Display -->
    <div v-if="courseStore.error" class="error-message">
      {{ courseStore.error }}
      <button @click="courseStore.clearError" class="btn-close">×</button>
    </div>

    <!-- Loading State -->
    <div v-if="courseStore.loading && !showCreateForm" class="loading">
      Loading courses...
    </div>

    <!-- Courses List -->
    <div v-else class="courses-list">
      <div v-if="displayedCourses.length === 0" class="empty-state">
        <p>No courses found. Create your first course to get started!</p>
      </div>
      <div v-else>
        <h2>Courses ({{ displayedCourses.length }})</h2>
        
        <!-- Filtered Courses -->
        <div v-if="showFiltering && filteringStore.filteredCourses.length > 0" class="filtered-courses">
          <h3>Filtered Results ({{ filteringStore.filteredCourses.length }})</h3>
          <div class="courses-grid">
            <div
              v-for="course in filteringStore.filteredCourses"
              :key="course.course_code"
              class="course-card filtered-course"
            >
              <h4>{{ course.title }}</h4>
              <p class="course-code">{{ course.course_code }} - {{ course.section }}</p>
              <p class="professor">{{ course.professor }}</p>
              <p class="meeting-time">{{ course.meeting_time }}</p>
              <p class="enrollment">{{ course.current_enrollment }}/{{ course.seats_total }} enrolled</p>
              <div class="course-tags">
                <span
                  v-for="tag in course.tags"
                  :key="tag.id"
                  class="course-tag"
                >
                  {{ tag.id }}
                </span>
              </div>
              <button @click="suggestAlternatives(course)" class="btn btn-small">
                Find Alternatives
              </button>
            </div>
          </div>
        </div>

        <!-- Regular Courses -->
        <div v-else class="regular-courses">
          <div class="courses-grid">
            <div
              v-for="course in displayedCourses"
              :key="course.id"
              class="course-card"
            >
              <h3>{{ course.title }}</h3>
              <p class="course-id">{{ course.id }}</p>
              <p class="department">{{ course.department }}</p>
            </div>
          </div>
        </div>

        <!-- Courses by Department -->
        <div v-if="Object.keys(courseStore.coursesByDepartment).length > 0" class="departments-section">
          <h2>Courses by Department</h2>
          <div
            v-for="(courses, department) in courseStore.coursesByDepartment"
            :key="department"
            class="department-group"
          >
            <h3>{{ department }} ({{ courses.length }})</h3>
            <div class="courses-grid">
              <div
                v-for="course in courses"
                :key="course.id"
                class="course-card"
              >
                <h4>{{ course.title }}</h4>
                <p class="course-id">{{ course.id }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCourseStore } from '@/stores/courseStore'
import { useFilteringStore } from '@/stores/filteringStore'

const courseStore = useCourseStore()
const filteringStore = useFilteringStore()

const showCreateForm = ref(false)
const showFiltering = ref(false)
const searchQuery = ref('')

const newCourse = ref({
  id: '',
  title: '',
  department: ''
})

// Computed properties
const displayedCourses = computed(() => {
  if (searchQuery.value) {
    return courseStore.searchCourses(searchQuery.value)
  }
  
  return courseStore.courses
})

// Methods
const handleCreateCourse = async () => {
  try {
    await courseStore.createCourse({ ...newCourse.value })
    resetForm()
    showCreateForm.value = false
  } catch (error) {
    // Error is handled by the store
  }
}

const resetForm = () => {
  newCourse.value = {
    id: '',
    title: '',
    department: ''
  }
}

const handleSearch = () => {
  // Search is handled by the computed property
}

const addTag = async (tagId: string, category: string) => {
  try {
    await filteringStore.addTag(tagId, category)
  } catch (error) {
    // Error is handled by the store
  }
}

const removeTag = async (tagId: string, category: string) => {
  try {
    await filteringStore.removeTag(tagId, category)
  } catch (error) {
    // Error is handled by the store
  }
}

const clearAllTags = async () => {
  try {
    await filteringStore.clearTags()
  } catch (error) {
    // Error is handled by the store
  }
}

const fetchFilteredCourses = async () => {
  try {
    await filteringStore.fetchFilteredCourses()
  } catch (error) {
    // Error is handled by the store
  }
}

const suggestAlternatives = async (course: any) => {
  try {
    const alternatives = await filteringStore.suggestAlternatives(course)
    console.log('Alternative courses:', alternatives)
    // You could show these in a modal or separate section
  } catch (error) {
    console.error('Error getting alternatives:', error)
  }
}

onMounted(async () => {
  await courseStore.fetchAllCourses()
  await filteringStore.fetchFilteredCourses()
  await filteringStore.fetchActiveTags()
})
</script>

<style scoped>
.courses-view {
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

.header-actions {
  display: flex;
  gap: 1rem;
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

.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.course-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s;
}

.course-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.course-card h3,
.course-card h4 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.course-id {
  font-family: monospace;
  background: #e9ecef;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
  margin: 0.5rem 0;
  display: inline-block;
}

.department {
  color: #6c757d;
  font-style: italic;
  margin: 0;
}

.departments-section {
  margin-top: 3rem;
}

.department-group {
  margin-bottom: 2rem;
}

.department-group h3 {
  color: #495057;
  border-bottom: 2px solid #007bff;
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
}

/* Filtering Styles */
.filtering-section {
  background: #f8f9fa;
  padding: 2rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  border: 1px solid #dee2e6;
}

.search-section {
  margin-bottom: 1.5rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
}

.search-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.active-tags, .available-tags {
  margin-bottom: 1.5rem;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.tag {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.active-tag {
  background-color: #007bff;
  color: white;
}

.available-tag {
  background-color: #e9ecef;
  color: #495057;
  border: 1px solid #ced4da;
}

.available-tag:hover {
  background-color: #007bff;
  color: white;
}

.tag-remove {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1.2rem;
  line-height: 1;
  padding: 0;
  margin-left: 0.25rem;
}

.filter-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.btn-outline {
  background: transparent;
  border: 1px solid #007bff;
  color: #007bff;
}

.btn-outline:hover {
  background-color: #007bff;
  color: white;
}

/* Filtered Course Styles */
.filtered-course {
  border-left: 4px solid #007bff;
}

.course-code {
  font-family: monospace;
  background: #e9ecef;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
  margin: 0.5rem 0;
  display: inline-block;
}

.professor {
  color: #6c757d;
  font-style: italic;
  margin: 0.5rem 0;
}

.meeting-time {
  color: #495057;
  font-weight: 500;
  margin: 0.5rem 0;
}

.enrollment {
  color: #28a745;
  font-weight: 500;
  margin: 0.5rem 0;
}

.course-tags {
  margin: 0.5rem 0;
}

.course-tag {
  background-color: #17a2b8;
  color: white;
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  margin-right: 0.25rem;
  display: inline-block;
}
</style>

