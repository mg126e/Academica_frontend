<template>
  <div class="home">
    <!-- Header with Schedule Selector -->
    <div class="header">
      <div class="schedule-controls">
        <div class="schedule-selector">
          <label for="scheduleSelect">Current Schedule:</label>
          <div class="custom-dropdown-wrapper">
            <select 
              id="scheduleSelect" 
              v-model="selectedScheduleId" 
              @change="onScheduleChange"
              class="schedule-dropdown"
            >
              <option value="">Select a schedule</option>
              <option 
                v-for="schedule in userSchedules" 
                :key="schedule.id" 
                :value="schedule.id"
              >
                {{ schedule.name }}
              </option>
            </select>
            <button
              v-if="selectedScheduleId"
              @click.stop="confirmDeleteSchedule(selectedScheduleId)"
              class="delete-schedule-btn"
              title="Delete this schedule"
            >
              ×
            </button>
          </div>
        </div>
        <div class="schedule-actions">
          <button @click="showNewScheduleModal = true" class="btn btn-primary">
            New Schedule
          </button>
          <button 
            @click="showDuplicateScheduleModal = true" 
            class="btn btn-secondary"
            :disabled="!selectedScheduleId"
            :title="selectedScheduleId ? 'Duplicate current schedule' : 'Select a schedule first'"
          >
            Duplicate
          </button>
        </div>
      </div>
      <div class="export-action">
        <button 
          @click="exportToGoogleCalendar" 
          class="btn btn-success"
          :disabled="!selectedScheduleId || !currentSchedule || currentSchedule.sectionIds.length === 0"
          :title="!selectedScheduleId || !currentSchedule || currentSchedule.sectionIds.length === 0 ? 'Add sections to your schedule first' : 'Export to Google Calendar'"
        >
          Export to Google Calendar
        </button>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="main-content">
      <!-- Section Search Sidebar -->
      <div class="course-search-sidebar">
        <div class="search-header">
          <button @click="openCreateSectionModal" class="btn-create-section">
            New Course
          </button>
          <div class="search-controls">
            <input
              v-model="sectionSearchQuery"
              type="text"
              placeholder="Search sections..."
              class="search-input"
              @input="onSearchInput"
            />
            <button 
              @click="showAdvancedFilters = !showAdvancedFilters" 
              class="btn-advanced-filters"
              :class="{ 'active': showAdvancedFilters }"
            >
              {{ showAdvancedFilters ? '− Filters' : '+ Filters' }}
            </button>
          </div>
          
          <!-- Advanced Filters -->
          <div v-if="showAdvancedFilters" class="advanced-filters">
            <div class="filter-row">
              <label>Department</label>
              <select v-model="selectedDepartment" class="filter-select">
                <option value="">All Departments</option>
                <option v-for="dept in departments" :key="dept" :value="dept">
                  {{ dept }}
                </option>
              </select>
            </div>
            
            <div class="filter-row">
              <label>Professor</label>
              <select v-model="selectedProfessor" class="filter-select">
                <option value="">All Professors</option>
                <option v-for="prof in professors" :key="prof" :value="prof">
                  {{ prof }}
                </option>
              </select>
            </div>
            
            <div class="filter-row">
              <label>Distribution Requirements</label>
              <div class="distribution-checkboxes">
                <label 
                  v-for="dist in distributions" 
                  :key="dist" 
                  class="checkbox-label"
                >
                  <input 
                    type="checkbox" 
                    :value="dist" 
                    v-model="selectedDistributions"
                    class="checkbox-input"
                  />
                  <span class="checkbox-text">{{ getDistributionDisplayName(dist) }}</span>
                </label>
              </div>
              <small v-if="filteringStore.filteredCourses.length === 0" class="filter-note">
                ℹ️ Distribution data not available (CourseFiltering API required)
              </small>
            </div>
            
            <div class="filter-row">
              <label>Time</label>
              <select v-model="selectedTimeFilter" class="filter-select">
                <option v-for="filter in timeFilters" :key="filter.value" :value="filter.value">
                  {{ filter.label }}
                </option>
              </select>
            </div>
            
            <button @click="clearFilters" class="btn-clear-filters">
              Clear All Filters
            </button>
          </div>
          
          <!-- AI Course Suggestions -->
          <div class="ai-suggestions-section">
            <button 
              @click="showAISuggestionModal = true" 
              class="btn-ai-suggestions"
              :disabled="!currentSchedule || currentSchedule.sectionIds.length === 0"
              :title="!currentSchedule || currentSchedule.sectionIds.length === 0 ? 'Add sections to your schedule first' : 'Get AI suggestions based on a course in your schedule'"
            >
              Get AI Course Suggestions
            </button>
            
            <div v-if="aiSuggestedCourses.length > 0" class="suggested-courses">
              <div class="suggested-courses-header">
                <h4>AI Suggested Courses:</h4>
                <button 
                  @click="aiSuggestionsCollapsed = !aiSuggestionsCollapsed"
                  class="btn-collapse-suggestions"
                  :title="aiSuggestionsCollapsed ? 'Expand suggestions' : 'Collapse suggestions'"
                >
                  {{ aiSuggestionsCollapsed ? '▼' : '▲' }}
                </button>
              </div>
              
              <div v-if="!aiSuggestionsCollapsed" class="suggestions-content">
                <p class="suggestion-context">Based on: {{ aiBaseCourse?.course_code }} - {{ aiBaseCourse?.title }}</p>
                <div 
                  v-for="suggestion in aiSuggestedCourses.slice(0, 3)" 
                  :key="suggestion.course_code + suggestion.section"
                  class="suggested-course-item"
                  @mouseenter="hoveredSuggestedCourse = suggestion"
                  @mouseleave="hoveredSuggestedCourse = null"
                  @click="showSuggestionInfoPopup(suggestion)"
                >
                  <div class="suggested-course-header">
                    <strong>{{ suggestion.course_code }}</strong>
                    <span class="section-badge">{{ suggestion.section }}</span>
                  </div>
                  <div class="suggested-course-title">{{ suggestion.title }}</div>
                  <div class="suggested-course-details">
                    <span>{{ suggestion.professor }}</span>
                    <span>{{ suggestion.meeting_time }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Active Filters Display -->
          <div v-if="hasActiveFilters" class="active-filters">
            <span class="filter-label">Active:</span>
            <span v-if="selectedDepartment" class="filter-tag">
              Dept: {{ selectedDepartment }}
              <button @click="selectedDepartment = ''" class="remove-filter">×</button>
            </span>
            <span v-if="selectedProfessor" class="filter-tag">
              Prof: {{ selectedProfessor }}
              <button @click="selectedProfessor = ''" class="remove-filter">×</button>
            </span>
            <span v-for="dist in selectedDistributions" :key="dist" class="filter-tag">
              Dist: {{ getDistributionDisplayName(dist) }}
              <button @click="removeDistribution(dist)" class="remove-filter">×</button>
            </span>
            <span v-if="selectedTimeFilter" class="filter-tag">
              Time: {{ timeFilters.find(f => f.value === selectedTimeFilter)?.label }}
              <button @click="selectedTimeFilter = ''" class="remove-filter">×</button>
            </span>
          </div>
        </div>
        
        <div class="course-list">
          <div v-if="filteredSections.length === 0" class="no-courses">
            <p v-if="sectionSearchQuery || selectedDepartment">
              No sections found matching your criteria.
            </p>
            <p v-else>
              No sections available. <RouterLink to="/sections">Create sections</RouterLink>
            </p>
          </div>
          <div v-else class="course-items">
            <div
              v-for="section in filteredSections"
              :key="section.id"
              class="course-item"
              :class="{ 'section-hovered': hoveredSection?.id === section.id }"
              @click="selectSection(section)"
              @mouseenter="hoveredSection = section"
              @mouseleave="hoveredSection = null"
            >
              <div class="course-info">
                <div class="course-id">{{ getSectionDisplayText(section) }}</div>
                <div class="course-title">{{ getCourseTitle(section.courseId) }}</div>
                <div class="section-details">
                  <span class="instructor">{{ section.instructor }}</span>
                  <span class="time-info">{{ getTimeSlotSummary(section) }}</span>
                </div>
                <div v-if="getSectionDistribution(section.id)" class="distribution-info">
                  <span class="distribution-badge-small">{{ getDistributionDisplayName(getSectionDistribution(section.id) || '') }}</span>
                </div>
              </div>
              <button
                v-if="!isSectionInSchedule(section.id)"
                @click.stop="addSectionToSchedule(section)"
                class="btn-add-course"
                :disabled="!selectedScheduleId"
                :title="selectedScheduleId ? 'Add section to schedule' : 'Select a schedule first'"
              >
                +
              </button>
              <span v-else class="course-added">✓</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Calendar View -->
      <div class="calendar-container">
      <div class="calendar-header">
        <div class="time-column"></div>
        <div class="day-header" v-for="day in days" :key="day">{{ day }}</div>
      </div>
      
      <div class="calendar-body">
        <div class="time-slot" v-for="time in timeSlots" :key="time">
          <div class="time-label">{{ time }}</div>
          <div class="day-column" v-for="day in days" :key="day">
            <template v-for="(course, index) in getCoursesForTimeSlot(day, time)" :key="course.id">
              <div 
                :class="[
                  'course-block', 
                  course.color, 
                  { 'preview-block': course.isPreview },
                  { 'split-block': getCoursesForTimeSlot(day, time).length === 2 },
                  { 'split-left': getCoursesForTimeSlot(day, time).length === 2 && index === 0 },
                  { 'split-right': getCoursesForTimeSlot(day, time).length === 2 && index === 1 }
                ]"
                @click="showCourseDetails(course)"
                @mouseenter="!course.isPreview && (hoveredCourse = course)"
                @mouseleave="hoveredCourse = null"
              >
                <div class="course-code">{{ course.courseId }}</div>
                <div class="course-time">{{ course.startTime }} - {{ course.endTime }}</div>
                <button
                  v-if="!course.isPreview && selectedScheduleId"
                  @click.stop="removeSectionFromSchedule(course.sectionId)"
                  class="remove-section-btn"
                  title="Remove from schedule"
                >
                  ×
                </button>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
    </div>

    <!-- Course Details Modal -->
    <div v-if="selectedCourse" class="modal-overlay" @click="closeCourseDetails">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedCourse.courseId }}</h3>
          <button @click="closeCourseDetails" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="course-info">
            <div class="info-item">
              <label>Course:</label>
              <span>{{ selectedCourse.courseName || selectedCourse.courseId }}</span>
            </div>
            <div class="info-item">
              <label>Days:</label>
              <span>{{ selectedCourse.day.join(', ') }}</span>
            </div>
            <div class="info-item">
              <label>Time:</label>
              <span>{{ selectedCourse.startTime }} - {{ selectedCourse.endTime }}</span>
            </div>
            <div class="info-item" v-if="selectedCourse.instructor">
              <label>Instructor:</label>
              <span>{{ selectedCourse.instructor }}</span>
            </div>
            <div class="info-item" v-if="getSectionDistribution(selectedCourse.sectionId)">
              <label>Distribution:</label>
              <span class="distribution-badge">{{ getDistributionDisplayName(getSectionDistribution(selectedCourse.sectionId) || '') }}</span>
            </div>
            <div class="info-item" v-if="selectedCourse.description">
              <label>Description:</label>
              <span>{{ selectedCourse.description }}</span>
            </div>
          </div>

          <!-- Professor Rating Section -->
          <div v-if="selectedCourse.instructor" class="professor-rating-section">
            <h4>Professor Rating</h4>
            
            <div v-if="loadingRating" class="rating-loading">
              Loading rating...
            </div>
            
            <div v-else-if="professorRating && isWellesleyProfessor(professorRating) && professorRating.numRatings > 0 && professorRating.rating !== null && professorRating.rating > 0" class="rating-details">
              <div class="rating-header">
                <div class="rating-score">
                  <div class="score-number" :class="getRatingClass(professorRating.rating)">
                    {{ professorRating.rating !== null ? professorRating.rating.toFixed(1) : 'N/A' }}
                  </div>
                  <div class="score-label">/ 5.0</div>
                </div>
                <div class="rating-meta">
                  <div class="rating-count">{{ professorRating.numRatings }} ratings</div>
                  <div class="rating-school">{{ professorRating.schoolName }}</div>
                </div>
              </div>
              
              <div class="rating-stats">
                <div class="stat-item" v-if="professorRating.difficulty !== null">
                  <span class="stat-label">Difficulty:</span>
                  <span class="stat-value" :class="getDifficultyClass(professorRating.difficulty)">
                    {{ professorRating.difficulty.toFixed(1) }} / 5.0
                  </span>
                </div>
                <div class="stat-item" v-if="professorRating.wouldTakeAgainPercent !== null">
                  <span class="stat-label">Would Take Again:</span>
                  <span class="stat-value">{{ professorRating.wouldTakeAgainPercent.toFixed(0) }}%</span>
                </div>
              </div>
              
              <div class="rating-footer">
                <small>Data from Rate My Professor • Last updated: {{ new Date(professorRating.lastUpdated).toLocaleDateString() }}</small>
                <button @click="refreshProfessorRating" class="btn-refresh" :disabled="loadingRating" :title="loadingRating ? 'Refreshing...' : 'Refresh Rating'">
                  <span class="refresh-icon">↻</span>
                </button>
              </div>
            </div>
            
            <div v-else class="rating-not-found">
              <p v-if="ratingNotAvailableForUserCreated">
                Rating not available - Rate My Professor ratings are not available for user-created courses.
              </p>
              <p v-else-if="professorRating && professorRating.schoolName && !isWellesleyProfessor(professorRating)">
                Rating not displayed - professor does not teach at Wellesley College
              </p>
              <p v-else-if="professorRating && professorRating.numRatings === 0">
                No ratings available - professor has not been rated yet
                <button @click="refreshProfessorRating" class="btn-refresh" :disabled="loadingRating" :title="loadingRating ? 'Refreshing...' : 'Refresh Rating'">
                  <span class="refresh-icon">↻</span>
                </button>
              </p>
              <p v-else>
                No rating available for this professor
                <button @click="refreshProfessorRating" class="btn-refresh" :disabled="loadingRating" :title="loadingRating ? 'Refreshing...' : 'Refresh Rating'">
                  <span class="refresh-icon">↻</span>
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- New Schedule Modal -->
    <div v-if="showNewScheduleModal" class="modal-overlay" @click="closeNewScheduleModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Create New Schedule</h3>
          <button @click="closeNewScheduleModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="createNewSchedule">
            <div class="form-group">
              <label for="scheduleName">Schedule Name:</label>
              <input
                id="scheduleName"
                v-model="newScheduleName"
                type="text"
                required
                placeholder="e.g., Fall 2024 Schedule"
                class="form-input"
              />
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" :disabled="loading">
                {{ loading ? 'Creating...' : 'Create Schedule' }}
              </button>
              <button type="button" @click="closeNewScheduleModal" class="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Duplicate Schedule Modal -->
    <div v-if="showDuplicateScheduleModal" class="modal-overlay" @click="closeDuplicateScheduleModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Duplicate Schedule</h3>
          <button @click="closeDuplicateScheduleModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="duplicateCurrentSchedule">
            <div class="form-group">
              <label for="duplicateScheduleName">New Schedule Name:</label>
              <input
                id="duplicateScheduleName"
                v-model="duplicateScheduleName"
                type="text"
                required
                :placeholder="currentSchedule ? `${currentSchedule.name} (Copy)` : 'Enter schedule name'"
                class="form-input"
              />
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" :disabled="loading">
                {{ loading ? 'Duplicating...' : 'Duplicate Schedule' }}
              </button>
              <button type="button" @click="closeDuplicateScheduleModal" class="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- AI Suggestion Modal -->
    <div v-if="showAISuggestionModal" class="modal-overlay" @click="closeAISuggestionModal">
      <div class="modal ai-modal" @click.stop>
        <div class="modal-header">
          <h3>Choose a Course for AI Suggestions</h3>
          <button @click="closeAISuggestionModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <p class="modal-description">
            Select a course from your current schedule. AI will suggest similar courses as alternatives.
          </p>
          
          <div v-if="loadingAISuggestions" class="loading-state">
            <div class="spinner"></div>
            <p>Getting AI suggestions...</p>
          </div>
          
          <div v-else class="schedule-sections-list">
            <div 
              v-for="sectionId in currentSchedule?.sectionIds" 
              :key="sectionId"
              class="schedule-section-item"
              @click="getAISuggestionsForSection(sectionId)"
            >
              <div class="section-item-content">
                <div class="section-item-header">
                  <strong>{{ getSectionCourseCode(sectionId) }}</strong>
                  <span class="section-number">{{ getSectionNumber(sectionId) }}</span>
                </div>
                <div class="section-item-title">{{ getSectionCourseTitle(sectionId) }}</div>
                <div class="section-item-instructor">{{ getSectionInstructor(sectionId) }}</div>
              </div>
              <div class="section-item-arrow">→</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Suggestion Info Popup -->
    <div v-if="showSuggestionInfoPopupState" class="modal-overlay suggestion-info-overlay" @click="closeSuggestionInfoPopup">
      <div class="suggestion-info-popup" @click.stop>
        <div class="suggestion-info-content">
          <h3 class="suggestion-info-title">Search the course code to learn more about this suggestions</h3>
          <button @click="closeSuggestionInfoPopup" class="suggestion-info-close-btn">&times;</button>
        </div>
      </div>
    </div>

    <!-- Course Hover Tooltip -->
    <div v-if="hoveredCourse" class="tooltip" :style="tooltipStyle">
      <div class="tooltip-content">
        <div class="tooltip-title">{{ hoveredCourse.courseId }}</div>
        <div class="tooltip-time">{{ hoveredCourse.startTime }} - {{ hoveredCourse.endTime }}</div>
      </div>
    </div>

    <!-- Conflict Resolution Modal -->
    <div v-if="showConflictModal" class="modal-overlay" @click="closeConflictModal">
      <div class="modal conflict-modal" @click.stop>
        <div class="modal-header">
          <h3>Schedule Conflict</h3>
          <button @click="closeConflictModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <p class="conflict-message">
            This time slot can only hold <strong>2 sections</strong> maximum. 
            Please select which section to replace:
          </p>
          <div class="conflict-sections">
            <div
              v-for="conflict in conflictingSections"
              :key="conflict.sectionId"
              class="conflict-section-card"
              @click="replaceSection(conflict.sectionId)"
            >
              <h4>{{ conflict.courseId }} - {{ conflict.sectionNumber }}</h4>
              <p class="conflict-course-name">{{ conflict.courseName }}</p>
              <p class="conflict-instructor">{{ conflict.instructor }}</p>
              <p class="conflict-time">{{ conflict.day }} {{ conflict.startTime }} - {{ conflict.endTime }}</p>
              <button class="btn btn-danger btn-sm">Replace This Section</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Alert Modal -->
    <div v-if="showAlertModal" class="modal-overlay" @click="closeAlertModal">
      <div class="modal alert-modal" @click.stop>
        <div class="modal-header">
          <h3>Notice</h3>
          <button @click="closeAlertModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <p class="alert-message">{{ alertMessage }}</p>
          <div class="modal-actions">
            <button @click="closeAlertModal" class="btn btn-primary">OK</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirmModal" class="modal-overlay" @click="closeDeleteConfirmModal">
      <div class="modal confirm-modal" @click.stop>
        <div class="modal-header">
          <h3>Confirm Deletion</h3>
          <button @click="closeDeleteConfirmModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <p class="confirm-message">
            Are you sure you want to delete <strong>"{{ scheduleToDeleteName }}"</strong>?
          </p>
          <p class="confirm-warning">This action cannot be undone.</p>
          <div class="modal-actions">
            <button @click="closeDeleteConfirmModal" class="btn btn-cancel">Cancel</button>
            <button @click="handleDeleteSchedule" class="btn btn-delete">Delete</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Section Modal -->
    <div v-if="showCreateSectionModal" class="modal-overlay" @click="closeCreateSectionModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Create New Course</h3>
          <button @click="closeCreateSectionModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="handleCreateSection">
            <h4 class="form-section-title">Course Information</h4>
            
            <div class="form-group">
              <label for="newCourseId">Course Number:</label>
              <input
                id="newCourseId"
                v-model="newSection.courseId"
                type="text"
                required
                placeholder="e.g., CS 101, MATH 241"
                class="form-input"
              />
              <small class="form-help-text">Department will be automatically extracted (e.g., CS from "CS 101")</small>
            </div>

            <div class="form-group">
              <label for="newCourseTitle">Course Name:</label>
              <input
                id="newCourseTitle"
                v-model="newSection.courseTitle"
                type="text"
                required
                placeholder="e.g., Introduction to Computer Science"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="newCourseDepartment">Department:</label>
              <input
                id="newCourseDepartment"
                v-model="newSection.department"
                type="text"
                required
                placeholder="e.g., CS, MATH, ENGL"
                class="form-input"
              />
              <small class="form-help-text">Auto-filled from course number, but can be edited</small>
            </div>

            <div class="form-group">
              <label>Time Slots:</label>
              <div v-for="(timeSlot, index) in newSection.timeSlots" :key="index" class="time-slot-group">
                <div class="time-slot-header">
                  <h4>Time Slot {{ index + 1 }}</h4>
                  <button
                    v-if="newSection.timeSlots.length > 1"
                    type="button"
                    @click="removeTimeSlot(index)"
                    class="btn-remove-slot"
                  >
                    Remove
                  </button>
                </div>
                
                <div class="form-group">
                  <label>Days:</label>
                  <div class="days-checkboxes">
                    <label v-for="day in daysOfWeek" :key="day" class="checkbox-label">
                      <input
                        type="checkbox"
                        :value="day"
                        v-model="timeSlot.days"
                        class="checkbox-input"
                      />
                      <span>{{ day }}</span>
                    </label>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>Start Time:</label>
                    <input
                      v-model="timeSlot.startTime"
                      type="time"
                      required
                      class="form-input"
                    />
                  </div>

                  <div class="form-group">
                    <label>End Time:</label>
                    <input
                      v-model="timeSlot.endTime"
                      type="time"
                      required
                      class="form-input"
                    />
                  </div>
                </div>

                <div class="form-group">
                  <label>Location:</label>
                  <input
                    v-model="timeSlot.location"
                    type="text"
                    placeholder="e.g., Room 101, Building A"
                    class="form-input"
                  />
                </div>
              </div>

              <button type="button" @click="addTimeSlot" class="btn-add-slot">
                + Add Time Slot
              </button>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary" :disabled="loading">
                {{ loading ? 'Creating...' : 'Create' }}
              </button>
              <button type="button" @click="closeCreateSectionModal" class="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useScheduleStore } from '@/stores/scheduleStore'
import { useSectionStore } from '@/stores/sectionStore'
import { useCourseStore } from '@/stores/courseStore'
import { useFilteringStore } from '@/stores/filteringStore'
import { ProfessorRatingsApi, CourseSchedulingApi } from '@/services/api'
import type { Schedule, Section, Course, ProfessorRating, FilteredCourse, TimeSlot } from '@/types/api'

// Stores
const scheduleStore = useScheduleStore()
const sectionStore = useSectionStore()
const courseStore = useCourseStore()
const filteringStore = useFilteringStore()

// Reactive data
const selectedScheduleId = ref('')
const selectedCourse = ref<any>(null)
const hoveredCourse = ref<any>(null)
const showNewScheduleModal = ref(false)
const newScheduleName = ref('')
const showDuplicateScheduleModal = ref(false)
const duplicateScheduleName = ref('')
const loading = ref(false)
const tooltipStyle = ref({})
const professorRating = ref<ProfessorRating | null>(null)
const loadingRating = ref(false)
const ratingNotAvailableForUserCreated = ref(false)

// AI Suggestions
const aiSuggestedCourses = ref<FilteredCourse[]>([])
const loadingAISuggestions = ref(false)
const showAISuggestionModal = ref(false)
const aiBaseCourse = ref<FilteredCourse | null>(null)
const aiSuggestionsCollapsed = ref(false)
const showSuggestionInfoPopupState = ref(false)

// Section search
const sectionSearchQuery = ref('')
const selectedDepartment = ref('')
const selectedProfessor = ref('')
const selectedDistributions = ref<string[]>([])
const selectedTimeFilter = ref('')
const showAdvancedFilters = ref(false)
const selectedSectionForDetails = ref<Section | null>(null)
const hoveredSection = ref<Section | null>(null)
const hoveredSuggestedCourse = ref<FilteredCourse | null>(null)

// Create Section Modal
const showCreateSectionModal = ref(false)
const showAlertModal = ref(false)
const alertMessage = ref('')
const showDeleteConfirmModal = ref(false)
const scheduleToDelete = ref<string | null>(null)
const scheduleToDeleteName = ref('')
const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const newSection = ref({
  courseId: '',
  courseTitle: '',
  department: '',
  sectionNumber: '1',
  instructor: '',
  timeSlots: [
    {
      days: [] as string[],
      startTime: '',
      endTime: '',
      location: ''
    }
  ]
})

// Helper function to extract department from course ID
const extractDepartment = (courseId: string): string => {
  if (!courseId || !courseId.trim()) return ''
  const trimmed = courseId.trim()
  // Extract department code (letters before first space, number, or dash)
  // Examples: "CS 101" -> "CS", "MATH241" -> "MATH", "ENGL 101A" -> "ENGL", "CS-101" -> "CS"
  const match = trimmed.match(/^([A-Za-z]+)/)
  return match ? match[1].toUpperCase() : ''
}

// Track if department was manually edited by user
const departmentManuallyEdited = ref(false)

// Watch courseId to auto-update department (only if not manually edited)
watch(() => newSection.value.courseId, (newCourseId, oldCourseId) => {
  // Only auto-update if course ID changed and department wasn't manually edited
  if (newCourseId && newCourseId !== oldCourseId && !departmentManuallyEdited.value) {
    const extracted = extractDepartment(newCourseId)
    if (extracted) {
      newSection.value.department = extracted
    }
  }
})

// Watch department to track if user manually edited it
watch(() => newSection.value.department, (newDept, oldDept) => {
  if (newSection.value.courseId && newDept !== oldDept) {
    const extracted = extractDepartment(newSection.value.courseId)
    // If the department doesn't match what would be auto-extracted, it was manually edited
    if (newDept && extracted && newDept !== extracted) {
      departmentManuallyEdited.value = true
    }
  }
})
const showConflictModal = ref(false)
const conflictingSections = ref<any[]>([])
const sectionToAdd = ref<Section | null>(null)

// Constants
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30', '22:00'
]

// Helper to convert day names to abbreviations used by calendar
const dayNameMap: Record<string, string> = {
  // Full day names
  'Monday': 'Mon',
  'Tuesday': 'Tue',
  'Wednesday': 'Wed',
  'Thursday': 'Thu',
  'Friday': 'Fri',
  'Saturday': 'Sat',
  'Sunday': 'Sun',
  // Single letter codes
  'M': 'Mon',
  'T': 'Tue',
  'W': 'Wed',
  'R': 'Thu',  // Thursday is often 'R' to avoid confusion with Tuesday
  'F': 'Fri',
  'S': 'Sat',
  'U': 'Sun',  // Sunday is sometimes 'U'
  // Alternative single letter codes
  'Th': 'Thu',
  'Tu': 'Tue',
  'Sa': 'Sat',
  'Su': 'Sun'
}

const convertDayName = (day: string): string => {
  return dayNameMap[day] || day
}

// Color palette for courses - Pastel Rainbow
const courseColors = [
  'bg-color-1', 'bg-color-2', 'bg-color-3', 
  'bg-color-4', 'bg-color-5', 'bg-color-6', 'bg-color-7'
]

// Computed properties
const userSchedules = computed(() => scheduleStore.userSchedules)

const currentSchedule = computed(() => {
  if (!selectedScheduleId.value) return null
  return scheduleStore.getScheduleById(selectedScheduleId.value)
})

const scheduleCourses = computed(() => {
  if (!currentSchedule.value) return []
  
  const courses: any[] = []
  const sections = currentSchedule.value.sectionIds
    .map(id => sectionStore.getSectionById(id))
    .filter(Boolean) as Section[]
  
  // Add actual schedule sections
  sections.forEach((section, index) => {
    const course = courseStore.getCourseById(section.courseId)
    
    if (course) {
      // Convert time slots to course blocks
      section.timeSlots.forEach(timeSlot => {
        timeSlot.days.forEach(day => {
          const abbreviatedDay = convertDayName(day)
          courses.push({
            id: `${section.id}-${day}-${timeSlot.startTime}`,
            courseId: `${course.id}-${section.sectionNumber}`,
            courseName: course.title,
            day: [abbreviatedDay],
            startTime: timeSlot.startTime,
            endTime: timeSlot.endTime,
            location: timeSlot.location,
            instructor: section.instructor,
            color: courseColors[index % courseColors.length],
            sectionId: section.id,
            isPreview: false
          })
        })
      })
    }
  })
  
  // Add hovered section as preview
  if (hoveredSection.value) {
    const course = courseStore.getCourseById(hoveredSection.value.courseId)
    if (course) {
      hoveredSection.value.timeSlots.forEach(timeSlot => {
        timeSlot.days.forEach(day => {
          const abbreviatedDay = convertDayName(day)
          courses.push({
            id: `preview-${hoveredSection.value!.id}-${day}-${timeSlot.startTime}`,
            courseId: `${course.id}-${hoveredSection.value!.sectionNumber}`,
            courseName: course.title,
            day: [abbreviatedDay],
            startTime: timeSlot.startTime,
            endTime: timeSlot.endTime,
            location: timeSlot.location,
            instructor: hoveredSection.value!.instructor,
            color: 'preview-color',
            sectionId: hoveredSection.value!.id,
            isPreview: true
          })
        })
      })
    }
  }
  
  // Add hovered suggested course as preview
  if (hoveredSuggestedCourse.value) {
    const timeSlots = parseMeetingTime(hoveredSuggestedCourse.value.meeting_time)
    timeSlots.forEach((timeSlot, slotIndex) => {
      timeSlot.days.forEach(day => {
        const abbreviatedDay = convertDayName(day)
        courses.push({
          id: `preview-suggested-${hoveredSuggestedCourse.value!.course_code}-${day}-${timeSlot.startTime}`,
          courseId: `${hoveredSuggestedCourse.value!.course_code}-${hoveredSuggestedCourse.value!.section}`,
          courseName: hoveredSuggestedCourse.value!.title,
          day: [abbreviatedDay],
          startTime: timeSlot.startTime,
          endTime: timeSlot.endTime,
          location: timeSlot.location || '',
          instructor: hoveredSuggestedCourse.value!.professor,
          color: 'preview-color',
          sectionId: null,
          isPreview: true
        })
      })
    })
  }
  
  return courses
})

// Section search computed properties
const departments = computed(() => {
  const depts = new Set(
    sectionStore.sections
      .map(section => {
        const course = courseStore.getCourseById(section.courseId)
        return course?.department
      })
      .filter(Boolean)
  )
  return Array.from(depts).sort()
})

const professors = computed(() => {
  const profs = new Set(
    sectionStore.sections
      .map(section => section.instructor)
      .filter(Boolean)
  )
  return Array.from(profs).sort()
})

// Map distribution abbreviations to full names for display
const getDistributionDisplayName = (abbr: string): string => {
  const distributionMap: Record<string, string> = {
    'SBA': 'Social and Behavioral Analysis',
    'MM': 'Mathematical Modeling and Problem Solving',
    'ARS': 'Arts, Music, Theatre, Film, and Video',
    'LL': 'Language and Literature',
    'HS': 'Historical Studies',
    'NPS': 'Natural and Physical Science',
    'EC': 'Epistemology and Cognition',
    'REP': 'Religion, Ethics, and Moral Philosophy'
  }
  
  // Handle comma-separated values
  if (abbr.includes(',')) {
    return abbr.split(',')
      .map(a => distributionMap[a.trim()] || a.trim())
      .join(', ')
  }
  
  return distributionMap[abbr] || abbr
}

const distributions = computed(() => {
  // Get unique distribution requirements from all available sources
  const distros = new Set<string>()
  
  // Helper function to add distributions, handling comma-separated values
  const addDistribution = (distStr: string) => {
    if (!distStr) return
    
    // Split by comma and clean each part
    distStr.split(',').forEach(dist => {
      const cleaned = dist.trim()
      // Filter out empty strings, "null", "undefined", and "N/A"
      if (cleaned && cleaned.toLowerCase() !== 'null' && cleaned.toLowerCase() !== 'undefined' && cleaned.toLowerCase() !== 'n/a') {
        distros.add(cleaned)
      }
    })
  }
  
  // Check sections first (most direct)
  sectionStore.sections.forEach(section => {
    if (section.distribution) {
      addDistribution(section.distribution)
    }
  })
  
  // Check courses
  courseStore.courses.forEach(course => {
    if (course.distribution) {
      addDistribution(course.distribution)
    }
  })
  
  // Check filtered courses (if available)
  filteringStore.filteredCourses.forEach(course => {
    if (course.distribution) {
      addDistribution(course.distribution)
    }
  })
  
  // Also check tags with category 'distribution'
  filteringStore.filteredCourses.forEach(course => {
    course.tags.forEach(tag => {
      if (tag.category === 'distribution' || tag.category === 'Distribution') {
        addDistribution(tag.id)
      }
    })
  })
  
  // Fallback: common distribution requirements
  if (distros.size === 0) {
    return [
      'Arts, Music, Theatre, Film, Video',
      'Epistemology and Cognition',
      'Historical Studies',
      'Language and Literature',
      'Mathematical Modeling and Problem Solving',
      'Natural and Physical Sciences',
      'Religion, Ethics, and Moral Philosophy',
      'Social and Behavioral Analysis'
    ]
  }
  
  return Array.from(distros).sort()
})

const timeFilters = [
  { value: '', label: 'Any Time' },
  { value: 'morning', label: 'Morning (8:00-12:00)' },
  { value: 'afternoon', label: 'Afternoon (12:00-17:00)' },
  { value: 'evening', label: 'Evening (17:00-22:00)' }
]

const filteredSections = computed(() => {
  let sections = sectionStore.sections
  
  // Filter by search query
  if (sectionSearchQuery.value.trim()) {
    const query = sectionSearchQuery.value.toLowerCase()
    sections = sections.filter(section => {
      const course = courseStore.getCourseById(section.courseId)
      const courseId = course?.id.toLowerCase() || ''
      const courseTitle = course?.title.toLowerCase() || ''
      const instructor = section.instructor.toLowerCase()
      const sectionNumber = section.sectionNumber.toLowerCase()
      const distribution = (getSectionDistribution(section.id) || '').toLowerCase()
      
      return courseId.includes(query) || 
             courseTitle.includes(query) || 
             instructor.includes(query) ||
             sectionNumber.includes(query) ||
             distribution.includes(query)
    })
  }
  
  // Filter by department
  if (selectedDepartment.value) {
    sections = sections.filter(section => {
      const course = courseStore.getCourseById(section.courseId)
      return course?.department === selectedDepartment.value
    })
  }
  
  // Filter by professor
  if (selectedProfessor.value) {
    sections = sections.filter(section => {
      return section.instructor === selectedProfessor.value
    })
  }
  
  // Filter by distribution requirements (multiple allowed)
  if (selectedDistributions.value.length > 0) {
    sections = sections.filter(section => {
      const distribution = getSectionDistribution(section.id)
      if (!distribution) return false
      
      // Check if section has ALL selected distributions (AND logic, not OR)
      // Handle comma-separated distributions in the section data
      const sectionDistros = distribution.split(',').map(d => d.trim()).filter(Boolean)
      
      // Section must have ALL selected distributions
      return selectedDistributions.value.every(selectedDist => sectionDistros.includes(selectedDist))
    })
  }
  
  // Filter by time
  if (selectedTimeFilter.value) {
    sections = sections.filter(section => {
      return section.timeSlots.some(slot => {
        const startHour = parseInt(slot.startTime.split(':')[0])
        
        switch (selectedTimeFilter.value) {
          case 'morning':
            return startHour >= 8 && startHour < 12
          case 'afternoon':
            return startHour >= 12 && startHour < 17
          case 'evening':
            return startHour >= 17 && startHour <= 22
          default:
            return true
        }
      })
    })
  }
  
  return sections
})

// Helper to convert time to minutes for comparison
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

// Helper to find which time slot a course belongs to
const getTimeSlotForCourse = (courseStartTime: string): string => {
  const courseMinutes = timeToMinutes(courseStartTime)
  
  // Find the time slot this course starts in or after
  for (let i = 0; i < timeSlots.length; i++) {
    const slotMinutes = timeToMinutes(timeSlots[i])
    const nextSlotMinutes = i < timeSlots.length - 1 ? timeToMinutes(timeSlots[i + 1]) : slotMinutes + 30
    
    // If course starts in this slot's time range, return this slot
    if (courseMinutes >= slotMinutes && courseMinutes < nextSlotMinutes) {
      return timeSlots[i]
    }
  }
  
  // If course is before first slot, use first slot
  if (courseMinutes < timeToMinutes(timeSlots[0])) {
    return timeSlots[0]
  }
  
  // If course is after last slot, use last slot
  return timeSlots[timeSlots.length - 1]
}

// Methods
const getCoursesForTimeSlot = (day: string, time: string) => {
  const filtered = scheduleCourses.value.filter(course => {
    const dayMatch = course.day.includes(day)
    const courseTimeSlot = getTimeSlotForCourse(course.startTime)
    const timeMatch = courseTimeSlot === time
    
    return dayMatch && timeMatch
  })
  
  return filtered
}

const onScheduleChange = () => {
  // Schedule change is handled by the computed properties
}

const confirmDeleteSchedule = (scheduleId: string) => {
  const schedule = scheduleStore.getScheduleById(scheduleId)
  if (!schedule) return
  
  scheduleToDelete.value = scheduleId
  scheduleToDeleteName.value = schedule.name
  showDeleteConfirmModal.value = true
}

const handleDeleteSchedule = async () => {
  if (!scheduleToDelete.value) return
  
  try {
    await scheduleStore.deleteSchedule(scheduleToDelete.value)
    
    // If the deleted schedule was selected, clear selection
    if (selectedScheduleId.value === scheduleToDelete.value) {
      selectedScheduleId.value = ''
    }
    
    // Close modal and reset
    closeDeleteConfirmModal()
    
    // Success is indicated by the schedule being removed from the list
  } catch (error) {
    console.error('Error deleting schedule:', error)
    showAlert('Failed to delete schedule. Please try again.')
  }
}

const closeDeleteConfirmModal = () => {
  showDeleteConfirmModal.value = false
  scheduleToDelete.value = null
  scheduleToDeleteName.value = ''
}

const showCourseDetails = async (course: any) => {
  selectedCourse.value = course
  professorRating.value = null
  ratingNotAvailableForUserCreated.value = false
  
  // Fetch professor rating for this section
  if (course.sectionId) {
    loadingRating.value = true
    try {
      const response = await ProfessorRatingsApi.getRatingForSection({ 
        sectionId: course.sectionId 
      })
      if (response.success && response.data) {
        professorRating.value = response.data
        ratingNotAvailableForUserCreated.value = false
      } else if (response.success === false) {
        // Rating not available for user-created courses
        professorRating.value = null
        ratingNotAvailableForUserCreated.value = true
      }
    } catch (error) {
      console.error('Error fetching professor rating:', error)
      // Silently fail - rating is optional
      ratingNotAvailableForUserCreated.value = false
    } finally {
      loadingRating.value = false
    }
  }
}

const closeCourseDetails = () => {
  selectedCourse.value = null
  professorRating.value = null
  ratingNotAvailableForUserCreated.value = false
}

const refreshProfessorRating = async () => {
  if (!selectedCourse.value || !selectedCourse.value.instructor) return
  
  loadingRating.value = true
  ratingNotAvailableForUserCreated.value = false
  try {
    console.log('Refreshing rating for:', selectedCourse.value.instructor)
    const response = await ProfessorRatingsApi.refreshRating({
      instructorName: selectedCourse.value.instructor
    })
    
    console.log('Refresh response:', response)
    
    if (response.success && response.data) {
      professorRating.value = response.data
      ratingNotAvailableForUserCreated.value = false
      // Success is indicated by the rating being updated in the UI
    } else if (response.success === false) {
      // Rating not available for user-created courses
      professorRating.value = null
      ratingNotAvailableForUserCreated.value = true
      showAlert(response.message || 'Rating not available for user-created courses.')
    } else {
      ratingNotAvailableForUserCreated.value = false
      showAlert(response.message || 'Could not refresh rating. Professor may not be found on Rate My Professor.')
    }
  } catch (error) {
    console.error('Error refreshing professor rating:', error)
    ratingNotAvailableForUserCreated.value = false
    showAlert('Failed to refresh rating. Please try again.')
  } finally {
    loadingRating.value = false
  }
}

const createNewSchedule = async () => {
  if (!newScheduleName.value.trim()) {
    showAlert('Please enter a schedule name.')
    return
  }
  
  // Check if user is authenticated
  if (!scheduleStore.currentUserId) {
    console.error('No user ID available. User may not be authenticated.')
    showAlert('Please log in to create a schedule.')
    return
  }
  
  loading.value = true
  try {
    console.log('Creating new schedule...')
    console.log('Current user ID:', scheduleStore.currentUserId)
    console.log('Schedule name:', newScheduleName.value.trim())
    console.log('User schedules before:', scheduleStore.userSchedules.length)
    
    const newSchedule = await scheduleStore.createSchedule(newScheduleName.value.trim())
    console.log('Schedule created successfully:', newSchedule)
    console.log('User schedules after:', scheduleStore.userSchedules.length)
    
    // Select the newly created schedule
    selectedScheduleId.value = newSchedule.id
    closeNewScheduleModal()
    
    // Show success message (using custom modal instead of browser alert)
    // Success is already indicated by the schedule being selected and modal closing
    // No need for additional popup
  } catch (error) {
    console.error('Error creating schedule:', error)
    
    // Show more specific error message
    const errorMessage = error instanceof Error ? error.message : 'Failed to create schedule. Please try again.'
    showAlert(`Error: ${errorMessage}`)
  } finally {
    loading.value = false
  }
}

const closeNewScheduleModal = () => {
  showNewScheduleModal.value = false
  newScheduleName.value = ''
}

const duplicateCurrentSchedule = async () => {
  if (!selectedScheduleId.value) {
    showAlert('Please select a schedule to duplicate.')
    return
  }
  
  if (!duplicateScheduleName.value.trim()) {
    showAlert('Please enter a name for the duplicated schedule.')
    return
  }
  
  loading.value = true
  
  try {
    console.log('Duplicating schedule...')
    console.log('Source schedule ID:', selectedScheduleId.value)
    console.log('New schedule name:', duplicateScheduleName.value.trim())
    
    const newSchedule = await scheduleStore.duplicateSchedule(
      selectedScheduleId.value,
      duplicateScheduleName.value.trim()
    )
    console.log('Schedule duplicated successfully:', newSchedule)
    
    // Validate that we got a schedule back
    if (!newSchedule || !newSchedule.id) {
      throw new Error('Failed to duplicate schedule: invalid response')
    }
    
    // Select the newly duplicated schedule
    selectedScheduleId.value = newSchedule.id
    closeDuplicateScheduleModal()
    
    // Success is already indicated by the schedule being selected and modal closing
    // No need for additional popup
  } catch (error) {
    console.error('Failed to duplicate schedule:', error)
    showAlert('Failed to duplicate schedule. Please try again.')
  } finally {
    loading.value = false
  }
}

const closeDuplicateScheduleModal = () => {
  showDuplicateScheduleModal.value = false
  duplicateScheduleName.value = ''
}

// Create Section Modal functions
const openCreateSectionModal = () => {
  if (!selectedScheduleId.value) {
    showAlert('Please select a schedule or create a new one')
    return
  }
  showCreateSectionModal.value = true
}

const showAlert = (message: string) => {
  alertMessage.value = message
  showAlertModal.value = true
}

const closeAlertModal = () => {
  showAlertModal.value = false
  alertMessage.value = ''
}

const closeCreateSectionModal = () => {
  showCreateSectionModal.value = false
  resetSectionForm()
}

const resetSectionForm = () => {
  newSection.value = {
    courseId: '',
    courseTitle: '',
    department: '',
    sectionNumber: '1',
    instructor: '',
    timeSlots: [
      {
        days: [],
        startTime: '',
        endTime: '',
        location: ''
      }
    ]
  }
  departmentManuallyEdited.value = false
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

const handleCreateSection = async () => {
  try {
    // Validate course fields
    if (!newSection.value.courseId || !newSection.value.courseId.trim()) {
      showAlert('Please enter a course number.')
      return
    }
    
    if (!newSection.value.courseTitle || !newSection.value.courseTitle.trim()) {
      showAlert('Please enter a course name.')
      return
    }
    
    if (!newSection.value.department || !newSection.value.department.trim()) {
      showAlert('Please enter a department. It should be auto-filled from the course number.')
      return
    }
    
    // Validate section fields
    // Section number defaults to '1', no need to validate
    // Instructor is optional, no validation needed
    
    // Filter and validate time slots
    const validTimeSlots = newSection.value.timeSlots
      .filter(slot => {
        // Filter out empty slots (no days selected)
        if (!slot.days || slot.days.length === 0) {
          return false
        }
        
        // Validate that required fields are present
        if (!slot.startTime || !slot.endTime) {
          return false
        }
        
        return true
      })
      .map(slot => ({
        days: slot.days,
        startTime: slot.startTime,
        endTime: slot.endTime,
        location: slot.location || '' // Location can be empty
      }))
    
    if (validTimeSlots.length === 0) {
      showAlert('Please add at least one time slot with at least one day selected.')
      return
    }
    
    // Validate that start time is before end time for each slot
    for (const slot of validTimeSlots) {
      const start = new Date(`2000-01-01T${slot.startTime}`)
      const end = new Date(`2000-01-01T${slot.endTime}`)
      
      if (start >= end) {
        showAlert(`For time slot ${slot.days.join(', ')}, start time must be before end time.`)
        return
      }
    }
    
    loading.value = true
    
    // Step 1: Create the course
    let courseId = newSection.value.courseId.trim()
    
    // Check if course already exists
    const existingCourse = courseStore.getCourseById(courseId)
    
    if (!existingCourse) {
      // Create new course
      console.log('Creating new course...')
      const courseData = {
        id: courseId,
        title: newSection.value.courseTitle.trim(),
        department: newSection.value.department.trim().toUpperCase()
      }
      
      console.log('Course data:', JSON.stringify(courseData, null, 2))
      
      try {
        const createdCourse = await courseStore.createCourse(courseData)
        console.log('Course created successfully:', createdCourse)
        courseId = createdCourse.id
      } catch (error) {
        console.error('Error creating course:', error)
        const errorMessage = error instanceof Error ? error.message : 'Failed to create course.'
        
        // Provide more helpful error messages for timeout errors
        let userMessage = errorMessage
        if (errorMessage.includes('timed out') || errorMessage.includes('504')) {
          userMessage = 'The server is taking too long to respond. This often happens when the backend service is waking up from sleep (Render.com free tier). Please wait a moment and try again.'
        }
        
        showAlert(`Error creating course: ${userMessage}`)
        throw error
      }
    } else {
      console.log('Course already exists, using existing course:', existingCourse)
      courseId = existingCourse.id
    }
    
    // Step 2: Check for conflicts before creating the section (if a schedule is selected)
    if (selectedScheduleId.value) {
      // Refresh schedule data to ensure we have the latest sections
      try {
        await scheduleStore.fetchAllSchedules()
      } catch (error) {
        console.error('Error refreshing schedule:', error)
      }
      
      // Create a temporary section object for conflict checking
      const tempSection: Section = {
        id: 'temp', // Temporary id, not used by getConflictingSections
        courseId: courseId,
        sectionNumber: newSection.value.sectionNumber.trim() || '1',
        instructor: newSection.value.instructor?.trim() || '',
        capacity: 1,
        timeSlots: validTimeSlots
      }
      
      const conflicts = getConflictingSections(tempSection)
      
      if (conflicts.length >= 2) {
        // Show modal to choose which section to replace
        // But first we need to create the section, so we'll handle this after creation
        // Store the section data for later use
        const sectionData = {
          courseId: courseId,
          sectionNumber: newSection.value.sectionNumber.trim() || '1',
          instructor: newSection.value.instructor?.trim() || '',
          capacity: 1,
          timeSlots: validTimeSlots
        }
        
        console.log('Creating section with data:', JSON.stringify(sectionData, null, 2))
        
        // Create the section first
        const createdSection = await sectionStore.createSection(sectionData)
        
        // Then show conflict modal
        sectionToAdd.value = createdSection
        conflictingSections.value = conflicts
        showConflictModal.value = true
        // Conflict modal will show - no need for additional alert
        closeCreateSectionModal()
        loading.value = false
        return
      }
    }
    
    // Step 2: Create the section
    // Set default capacity to 1 since it's not required from user
    const sectionData = {
      courseId: courseId,
      sectionNumber: newSection.value.sectionNumber.trim() || '1',
      instructor: newSection.value.instructor?.trim() || '',
      capacity: 1,
      timeSlots: validTimeSlots
    }
    
    console.log('Creating section with data:', JSON.stringify(sectionData, null, 2))
    
    // Create the section
    let createdSection: Section
    try {
      createdSection = await sectionStore.createSection(sectionData)
    } catch (error) {
      // If we get a 500 error, it might be a conflict the backend detected
      const errorMessage = error instanceof Error ? error.message : ''
      if ((errorMessage.includes('500') || errorMessage.includes('internal server')) && selectedScheduleId.value) {
        // Try to check conflicts and show modal
        try {
          await scheduleStore.fetchAllSchedules()
        } catch (fetchError) {
          console.error('Error refreshing schedule:', fetchError)
        }
        
        const tempSection: Section = {
          id: 'temp',
          courseId: courseId,
          sectionNumber: newSection.value.sectionNumber.trim() || '1',
          instructor: newSection.value.instructor?.trim() || '',
          capacity: 1,
          timeSlots: validTimeSlots
        }
        
        const conflicts = getConflictingSections(tempSection)
        if (conflicts.length >= 2) {
          // We need to create the section first, but it failed
          // This is a problem - the backend rejected it
          // Let's show a helpful error message
          showAlert('Failed to create section due to schedule conflicts. The time slot you selected conflicts with existing courses in your schedule. Please choose a different time or remove conflicting courses first.')
          loading.value = false
          throw error
        }
      }
      throw error
    }
    
    // Refresh sections list to ensure it's searchable (though it's already added to the store)
    await sectionStore.fetchAllSections()
    
    // Refresh courses list to ensure the course is available
    await courseStore.fetchAllCourses()
    
    // Automatically add the section to the currently selected schedule if one exists
    if (selectedScheduleId.value && createdSection?.id) {
      // Refresh schedule data to ensure we have the latest sections
      try {
        await scheduleStore.fetchAllSchedules()
      } catch (error) {
        console.error('Error refreshing schedule:', error)
      }
      
      // Check for conflicts before adding
      const conflicts = getConflictingSections(createdSection)
      
      if (conflicts.length >= 2) {
        // Show modal to choose which section to replace
        sectionToAdd.value = createdSection
        conflictingSections.value = conflicts
        showConflictModal.value = true
        // Conflict modal will show - no need for additional alert
        closeCreateSectionModal()
        return
      }
      
      // If conflicts < 2, add directly (or handle appropriately)
      try {
        await scheduleStore.addSectionToSchedule(selectedScheduleId.value, createdSection.id)
        console.log('Section automatically added to schedule:', selectedScheduleId.value)
      } catch (error) {
        console.error('Error adding section to schedule:', error)
        // If we get an error (like 500), it might be a conflict the backend detected
        // Check conflicts again and show modal as fallback
        const errorMessage = error instanceof Error ? error.message : ''
        if (errorMessage.includes('500') || errorMessage.includes('internal server')) {
          const conflicts = getConflictingSections(createdSection)
          if (conflicts.length >= 2) {
            sectionToAdd.value = createdSection
            conflictingSections.value = conflicts
            showConflictModal.value = true
            // Conflict modal will show - no need for additional alert
            closeCreateSectionModal()
            return
          }
        }
        // Don't fail the whole operation if adding to schedule fails
        // Just log the error and continue
      }
    }
    
    // Success is indicated by the modal closing and section appearing in the schedule
    closeCreateSectionModal()
  } catch (error) {
    console.error('Error creating section:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to create section. Please try again.'
    
    // Provide more helpful error messages for timeout errors
    let userMessage = errorMessage
    if (errorMessage.includes('timed out') || errorMessage.includes('504')) {
      userMessage = 'The server is taking too long to respond. This often happens when the backend service is waking up from sleep (Render.com free tier).\n\nPlease wait 10-15 seconds and try again. Your form data has been preserved.'
    } else if (errorMessage.includes('502') || errorMessage.includes('503')) {
      userMessage = 'The server is temporarily unavailable. This may be because the backend service is starting up.\n\nPlease wait a moment and try again. Your form data has been preserved.'
    }
    
    showAlert(`Error: ${userMessage}`)
  } finally {
    loading.value = false
  }
}

// Section search methods
const onSearchInput = () => {
  // Search is handled by computed property
}

const hasActiveFilters = computed(() => {
  return !!(
    selectedDepartment.value ||
    selectedProfessor.value ||
    selectedDistributions.value.length > 0 ||
    selectedTimeFilter.value
  )
})

const clearFilters = () => {
  selectedDepartment.value = ''
  selectedProfessor.value = ''
  selectedDistributions.value = []
  selectedTimeFilter.value = ''
  sectionSearchQuery.value = ''
}

const removeDistribution = (dist: string) => {
  const index = selectedDistributions.value.indexOf(dist)
  if (index > -1) {
    selectedDistributions.value.splice(index, 1)
  }
}

// AI Course Suggestions
const closeAISuggestionModal = () => {
  showAISuggestionModal.value = false
}

const getAISuggestionsForSection = async (sectionId: string) => {
  const section = sectionStore.getSectionById(sectionId)
  if (!section) {
    showAlert('Section not found')
    return
  }
  
  const course = courseStore.getCourseById(section.courseId)
  if (!course) {
    showAlert('Course not found for selected section')
    return
  }
  
  loadingAISuggestions.value = true
  aiSuggestedCourses.value = []
  
  try {
    // Try to find the course in filtered courses to get full details
    let baseCourse: FilteredCourse | null = null
    
    // Try to match with filtered courses first (they have complete data)
    const courseCode = course.id.replace(/\s+/g, '').toLowerCase()
    const filteredCourse = filteringStore.filteredCourses.find(fc => {
      const fcCode = fc.course_code.replace(/\s+/g, '').toLowerCase()
      return fcCode === courseCode || fc.course_code === course.id
    })
    
    if (filteredCourse) {
      // Use the filtered course data, but ensure title is not empty
      baseCourse = {
        ...filteredCourse,
        // Use course title from our database if filtered course title is empty
        title: filteredCourse.title && filteredCourse.title.trim() !== '' 
          ? filteredCourse.title 
          : (course.title || course.id)
      }
      console.log('Using filtered course data:', baseCourse)
    } else {
      // Create a FilteredCourse object from available data
      const timeSlot = section.timeSlots[0]
      const daysStr = timeSlot?.days.join(', ') || ''
      const meetingTime = timeSlot ? `${daysStr} ${timeSlot.startTime}-${timeSlot.endTime}` : 'TBA'
      
      // Ensure we have a valid title
      const courseTitle = course.title || course.id || 'Unknown Course'
      
      baseCourse = {
        course_code: course.id,
        section: section.sectionNumber,
        title: courseTitle,
        professor: section.instructor,
        meeting_time: meetingTime,
        current_enrollment: 0,
        seats_available: section.capacity,
        seats_total: section.capacity,
        distribution: course.distribution || '',
        tags: [
          { id: course.department, category: 'Department' },
          ...(course.distribution ? [{ id: course.distribution, category: 'Distribution' }] : []),
          { id: section.instructor, category: 'Professor' }
        ]
      }
      console.log('Created course object from section data:', baseCourse)
    }
    
    // Validate that we have necessary data for AI
    if (!baseCourse.title || baseCourse.title === '') {
      showAlert('This course is missing title information. AI suggestions require complete course data. Please try a different course.')
      closeAISuggestionModal()
      loadingAISuggestions.value = false
      return
    }
    
    aiBaseCourse.value = baseCourse
    console.log('Getting AI suggestions based on:', baseCourse)
    
    // Get suggestions using the base variant
    const suggestions = await filteringStore.suggestAlternatives(baseCourse, 'base')
    
    console.log('AI Suggestions received:', suggestions)
    console.log('Number of suggestions:', Array.isArray(suggestions) ? suggestions.length : 0)
    
    // API now returns array directly (fixed backend)
    aiSuggestedCourses.value = Array.isArray(suggestions) ? suggestions.slice(0, 3) : []
    
    // Expand suggestions by default when new ones are loaded
    aiSuggestionsCollapsed.value = false
    
    // Close modal and show results
    closeAISuggestionModal()
    
    if (aiSuggestedCourses.value.length === 0) {
      showAlert(`AI could not find alternative suggestions for ${baseCourse.course_code}. This may be because:\n- The course is too unique or specialized\n- Not enough similar courses exist in the database\n- The AI service needs more context\n\nTry selecting a different course from your schedule.`)
    }
  } catch (error) {
    console.error('Error getting AI suggestions:', error)
    closeAISuggestionModal()
    showAlert('Failed to get AI suggestions. The AI service may be unavailable.')
  } finally {
    loadingAISuggestions.value = false
  }
}

// Parse meeting_time string to TimeSlot format
// Example formats: "MWF 09:00-10:30", "TuTh 14:00-15:30", "Mon Wed Fri 10:00-11:00"
const parseMeetingTime = (meetingTime: string): TimeSlot[] => {
  if (!meetingTime || !meetingTime.trim()) {
    return []
  }
  
  const timeSlots: TimeSlot[] = []
  
  // Day abbreviations mapping
  const dayMap: Record<string, string> = {
    'M': 'Monday',
    'T': 'Tuesday',
    'W': 'Wednesday',
    'R': 'Thursday',
    'F': 'Friday',
    'MWF': 'Monday,Wednesday,Friday',
    'MW': 'Monday,Wednesday',
    'TuTh': 'Tuesday,Thursday',
    'TTh': 'Tuesday,Thursday',
    'TR': 'Tuesday,Thursday',
    'Mon': 'Monday',
    'Tue': 'Tuesday',
    'Wed': 'Wednesday',
    'Thu': 'Thursday',
    'Fri': 'Friday',
    'Monday': 'Monday',
    'Tuesday': 'Tuesday',
    'Wednesday': 'Wednesday',
    'Thursday': 'Thursday',
    'Friday': 'Friday'
  }
  
  // Pattern to match: days (MWF, Mon Wed, etc.) followed by time (HH:MM-HH:MM)
  const timePattern = /(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/
  const timeMatch = meetingTime.match(timePattern)
  
  if (!timeMatch) {
    return [] // Can't parse time
  }
  
  const startTime = timeMatch[1]
  const endTime = timeMatch[2]
  
  // Extract day part (everything before the time)
  const dayPart = meetingTime.substring(0, timeMatch.index).trim()
  
  // Parse days
  const days: string[] = []
  
  // Try to match common patterns
  if (dayPart.includes('MWF') || dayPart.includes('Mon Wed Fri')) {
    days.push('Monday', 'Wednesday', 'Friday')
  } else if (dayPart.includes('MW') || dayPart.includes('Mon Wed')) {
    days.push('Monday', 'Wednesday')
  } else if (dayPart.includes('TuTh') || dayPart.includes('TTh') || dayPart.includes('TR') || dayPart.includes('Tue Thu')) {
    days.push('Tuesday', 'Thursday')
  } else {
    // Try single day mappings
    const dayTokens = dayPart.split(/\s+/)
    dayTokens.forEach(token => {
      const trimmed = token.trim()
      if (dayMap[trimmed]) {
        const mapped = dayMap[trimmed]
        if (mapped.includes(',')) {
          days.push(...mapped.split(','))
        } else {
          days.push(mapped)
        }
      } else if (trimmed.length === 1 && ['M', 'T', 'W', 'R', 'F'].includes(trimmed)) {
        days.push(dayMap[trimmed])
      }
    })
  }
  
  // Remove duplicates and filter to weekdays only
  const uniqueDays = [...new Set(days)].filter(day => 
    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(day)
  )
  
  if (uniqueDays.length > 0) {
    timeSlots.push({
      days: uniqueDays,
      startTime: startTime,
      endTime: endTime,
      location: '' // Location not available in meeting_time string
    })
  }
  
  return timeSlots
}

// Show suggestion info popup
const showSuggestionInfoPopup = (suggestion: FilteredCourse) => {
  showSuggestionInfoPopupState.value = true
}

// Close suggestion info popup
const closeSuggestionInfoPopup = () => {
  showSuggestionInfoPopupState.value = false
}

// Add suggested course to schedule using the new endpoint
const addSuggestedCourseToSchedule = async (suggestedCourse: FilteredCourse) => {
  if (!selectedScheduleId.value) {
    showAlert('Please select a schedule first')
    return
  }
  
  try {
    loading.value = true
    
    // Use the new endpoint that handles everything on the backend
    const response = await CourseSchedulingApi.addSectionByCourseCode({
      scheduleId: selectedScheduleId.value,
      courseCode: suggestedCourse.course_code.trim(),
      sectionNumber: suggestedCourse.section.trim() || '1'
    })
    
    if (response.success) {
      // Success - refresh schedule to show the new course
      try {
        await scheduleStore.fetchAllSchedules()
        await sectionStore.fetchAllSections()
      } catch (fetchError) {
        console.error('Error refreshing schedule:', fetchError)
      }
      
      // Clear hover state
      hoveredSuggestedCourse.value = null
      
      // Success is indicated by the UI updating with the new course
      // No alert needed - the course appears in the schedule
    } else {
      // Handle specific error messages
      let errorMessage = response.message || 'Failed to add course to schedule'
      
      if (response.message?.includes('Section not found') || response.message?.includes('section not found')) {
        errorMessage = 'This section is no longer available. Please try a different course.'
      } else if (response.message?.includes('Schedule not found') || response.message?.includes('schedule not found')) {
        errorMessage = 'Schedule not found. Please refresh and try again.'
      } else if (response.message?.includes('conflict') || response.message?.includes('Conflict')) {
        errorMessage = 'This course conflicts with existing courses in your schedule. Please choose a different time slot.'
      }
      
      showAlert(errorMessage)
    }
  } catch (error) {
    console.error('Error adding suggested course:', error)
    
    const errorMsg = error instanceof Error ? error.message : ''
    
    // Handle specific error cases
    if (errorMsg.includes('Unauthorized') || errorMsg.includes('unauthorized')) {
      showAlert('You are not authorized to modify this schedule.')
    } else if (errorMsg.includes('500') || errorMsg.includes('internal server')) {
      showAlert('The server encountered an error. Please try again or add the course manually.')
    } else {
      showAlert('Failed to add course to schedule. Please try again.')
    }
  } finally {
    loading.value = false
  }
}

// Helper functions for modal section display
const getSectionCourseCode = (sectionId: string) => {
  const section = sectionStore.getSectionById(sectionId)
  if (!section) return ''
  const course = courseStore.getCourseById(section.courseId)
  return course?.id || section.courseId
}

const getSectionNumber = (sectionId: string) => {
  const section = sectionStore.getSectionById(sectionId)
  return section?.sectionNumber || ''
}

const getSectionCourseTitle = (sectionId: string) => {
  const section = sectionStore.getSectionById(sectionId)
  if (!section) return ''
  const course = courseStore.getCourseById(section.courseId)
  return course?.title || ''
}

const getSectionInstructor = (sectionId: string) => {
  const section = sectionStore.getSectionById(sectionId)
  return section?.instructor || ''
}

// Export to Google Calendar
const exportToGoogleCalendar = () => {
  if (!currentSchedule.value || currentSchedule.value.sectionIds.length === 0) {
    showAlert('No sections in the schedule to export.')
    return
  }

  // Count total time slots across all sections
  let totalTimeSlots = 0
  currentSchedule.value.sectionIds.forEach((sectionId) => {
    const section = sectionStore.getSectionById(sectionId)
    if (section) {
      totalTimeSlots += section.timeSlots.length
    }
  })
  
  const confirmExport = confirm(
    `This will open ${totalTimeSlots} Google Calendar tab${totalTimeSlots > 1 ? 's' : ''} to add your course${totalTimeSlots > 1 ? 's' : ''}.\n\n` +
    'Each course will need to be saved individually in Google Calendar.\n\n' +
    'If tabs don\'t open, please disable your popup blocker for this site.\n\n' +
    'Continue?'
  )

  if (!confirmExport) return

  let successCount = 0
  let tabIndex = 0
  
  currentSchedule.value.sectionIds.forEach((sectionId) => {
    const section = sectionStore.getSectionById(sectionId)
    if (!section) return

    const course = courseStore.getCourseById(section.courseId)
    if (!course) return

    // For each time slot, create a calendar event
    section.timeSlots.forEach(timeSlot => {
      const calendarUrl = generateGoogleCalendarUrl(section, course, timeSlot)
      
      // Skip if URL generation failed due to invalid dates
      if (!calendarUrl) {
        console.warn('Skipping time slot due to invalid dates:', timeSlot)
        return
      }
      
      // Add a small delay between opening tabs to avoid popup blockers
      // Use tabIndex to ensure each tab opens at a different time
      setTimeout(() => {
        window.open(calendarUrl, '_blank')
      }, tabIndex * 500)
      
      tabIndex++
      successCount++
    })
  })

  setTimeout(() => {
    showAlert(
      `Opened ${successCount} Google Calendar window${successCount > 1 ? 's' : ''}.\n\n` +
      'Please save each event in your Google Calendar.\n\n' +
      '💡 Tip: If not all tabs opened, check your popup blocker settings.'
    )
  }, tabIndex * 500 + 500)
}

const generateGoogleCalendarUrl = (section: Section, course: Course, timeSlot: TimeSlot): string => {
  // Event title: Course Code - Course Title
  const title = `${course.id} - ${course.title}`
  
  // Get the first day of class (you might want to make this configurable)
  // For now, we'll use a default semester start date
  const semesterStart = new Date('2025-01-27') // Spring 2025 example
  const firstClassDate = getNextDayOfWeek(semesterStart, timeSlot.days[0])
  
  // Convert time to Date objects
  const [startHour, startMin] = timeSlot.startTime.split(':').map(Number)
  const [endHour, endMin] = timeSlot.endTime.split(':').map(Number)
  
  const startDateTime = new Date(firstClassDate)
  startDateTime.setHours(startHour, startMin, 0, 0)
  
  const endDateTime = new Date(firstClassDate)
  endDateTime.setHours(endHour, endMin, 0, 0)
  
  // Format dates for Google Calendar (YYYYMMDDTHHMMSS)
  const formatDateTime = (date: Date) => {
    const dateObj = new Date(date)
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      console.error('Invalid date:', date)
      return null
    }
    
    return dateObj.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }
  
  const startDate = formatDateTime(startDateTime)
  const endDate = formatDateTime(endDateTime)
  
  // Skip if either date is invalid
  if (!startDate || !endDate) {
    console.error('Skipping section with invalid dates:', section)
    return ''
  }
  
  // Create recurrence rule (weekly on specified days until end of semester)
  const semesterEnd = new Date('2025-05-15') // Spring 2025 example
  const untilDate = semesterEnd.toISOString().replace(/[-:]/g, '').split('T')[0]
  
  // Convert days to Google Calendar format (SU, MO, TU, WE, TH, FR, SA)
  const dayMap: Record<string, string> = {
    // Full names
    'Sunday': 'SU', 'Monday': 'MO', 'Tuesday': 'TU', 'Wednesday': 'WE',
    'Thursday': 'TH', 'Friday': 'FR', 'Saturday': 'SA',
    // Abbreviations
    'Sun': 'SU', 'Mon': 'MO', 'Tue': 'TU', 'Wed': 'WE', 'Thu': 'TH', 'Fri': 'FR', 'Sat': 'SA',
    // Single letters
    'M': 'MO', 'T': 'TU', 'W': 'WE', 'R': 'TH', 'F': 'FR', 'S': 'SA', 'U': 'SU',
    // Two-letter codes
    'Tu': 'TU', 'Th': 'TH', 'Sa': 'SA', 'Su': 'SU'
  }
  const recurDays = timeSlot.days.map(day => dayMap[day] || day.substring(0, 2).toUpperCase()).join(',')
  const recurrence = `RRULE:FREQ=WEEKLY;BYDAY=${recurDays};UNTIL=${untilDate}`
  
  // Event details
  const details = `Instructor: ${section.instructor}\\nSection: ${section.sectionNumber}\\nLocation: ${timeSlot.location}`
  
  // Build Google Calendar URL
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startDate}/${endDate}`,
    details: details,
    location: timeSlot.location,
    recur: recurrence
  })
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

const getNextDayOfWeek = (fromDate: Date, dayName: string): Date => {
  // Comprehensive day mapping supporting full names, abbreviations, and single letters
  const dayMap: Record<string, number> = {
    // Full names
    'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
    'Thursday': 4, 'Friday': 5, 'Saturday': 6,
    // Abbreviations
    'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6,
    // Single letters
    'M': 1, 'T': 2, 'W': 3, 'R': 4, 'F': 5, 'S': 6, 'U': 0,
    // Two-letter codes
    'Tu': 2, 'Th': 4, 'Sa': 6, 'Su': 0
  }
  
  const targetDay = dayMap[dayName]
  
  // Validate that we have a valid day
  if (targetDay === undefined) {
    console.error('Invalid day name:', dayName)
    return new Date(NaN) // Return invalid date
  }
  
  const currentDay = fromDate.getDay()
  const daysUntilTarget = (targetDay - currentDay + 7) % 7
  
  const resultDate = new Date(fromDate)
  resultDate.setDate(fromDate.getDate() + daysUntilTarget)
  
  return resultDate
}

const selectSection = (section: Section) => {
  selectedSectionForDetails.value = section
  // You could show section details here
}

const getSectionDisplayText = (section: Section) => {
  const course = courseStore.getCourseById(section.courseId)
  return `${course?.id || section.courseId} - ${section.sectionNumber}`
}

const getCourseTitle = (courseId: string) => {
  const course = courseStore.getCourseById(courseId)
  return course?.title || courseId
}

const getTimeSlotSummary = (section: Section) => {
  if (section.timeSlots.length === 0) return 'No time specified'
  const firstSlot = section.timeSlots[0]
  const abbreviatedDays = firstSlot.days.map(day => convertDayName(day))
  const daysStr = abbreviatedDays.join(', ')
  return `${daysStr} ${firstSlot.startTime}-${firstSlot.endTime}`
}

const getSectionDistribution = (sectionId: string) => {
  const section = sectionStore.getSectionById(sectionId)
  if (!section) return null
  
  // First check if section itself has distribution (most efficient - NEW!)
  if (section.distribution) {
    // Clean up the distribution string (remove leading commas/spaces)
    return section.distribution.replace(/^[,\s]+/, '').trim()
  }
  
  // Fallback: check the course
  const course = courseStore.getCourseById(section.courseId)
  if (!course) return null
  
  if (course.distribution) {
    // Clean up the distribution string (remove leading commas/spaces)
    return course.distribution.replace(/^[,\s]+/, '').trim()
  }
  
  // Last resort: Try to find in filtered courses (if available)
  if (filteringStore.filteredCourses.length === 0) {
    return null // No filtered course data available
  }
  
  const filteredCourse = filteringStore.filteredCourses.find(fc => {
    // More flexible matching - try multiple strategies
    const courseCode = course.id.replace(/\s+/g, '').toLowerCase()
    const courseCodeWithSpace = course.id.toLowerCase()
    const fcCode = fc.course_code.replace(/\s+/g, '').toLowerCase()
    const fcCodeOriginal = fc.course_code.toLowerCase()
    const fcTitle = fc.title.toLowerCase()
    const courseTitle = course.title.toLowerCase()
    
    // Try exact matches
    if (courseCode === fcCode || courseCodeWithSpace === fcCodeOriginal) {
      return true
    }
    
    // Try contains
    if (fcCode.includes(courseCode) || courseCode.includes(fcCode)) {
      return true
    }
    
    // Try title match
    if (fcTitle === courseTitle) {
      return true
    }
    
    // Try department code match (first part before space/dash)
    const courseDept = course.id.split(/[\s-]/)[0]
    const fcDept = fc.course_code.split(/[\s-]/)[0]
    const courseNum = course.id.split(/[\s-]/)[1]
    const fcNum = fc.course_code.split(/[\s-]/)[1]
    
    if (courseDept === fcDept && courseNum === fcNum) {
      return true
    }
    
    return false
  })
  
  if (filteredCourse?.distribution) {
    return filteredCourse.distribution
  }
  
  // Check tags for distribution
  if (filteredCourse?.tags) {
    const distributionTag = filteredCourse.tags.find(tag => 
      tag.category === 'distribution' || tag.category === 'Distribution'
    )
    if (distributionTag) {
      return distributionTag.id
    }
  }
  
  return null
}

const isSectionInSchedule = (sectionId: string) => {
  if (!currentSchedule.value) return false
  return currentSchedule.value.sectionIds.includes(sectionId)
}

// Helper to check if two time ranges overlap
const timeRangesOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
  const s1 = timeToMinutes(start1)
  const e1 = timeToMinutes(end1)
  const s2 = timeToMinutes(start2)
  const e2 = timeToMinutes(end2)
  
  return s1 < e2 && s2 < e1
}

// Check if adding a section would create conflicts
const getConflictingSections = (newSection: Section): any[] => {
  if (!currentSchedule.value) return []
  
  const conflicts: any[] = []
  const existingSections = currentSchedule.value.sectionIds
    .map(id => sectionStore.getSectionById(id))
    .filter(Boolean) as Section[]
  
  // Check each time slot of the new section
  newSection.timeSlots.forEach(newSlot => {
    newSlot.days.forEach(newDay => {
      const newDayAbbr = convertDayName(newDay)
      
      // Check against all existing sections
      existingSections.forEach(existing => {
        existing.timeSlots.forEach(existingSlot => {
          existingSlot.days.forEach(existingDay => {
            const existingDayAbbr = convertDayName(existingDay)
            
            // If same day and overlapping times
            if (newDayAbbr === existingDayAbbr && 
                timeRangesOverlap(newSlot.startTime, newSlot.endTime, 
                                  existingSlot.startTime, existingSlot.endTime)) {
              const course = courseStore.getCourseById(existing.courseId)
              if (!conflicts.find(c => c.sectionId === existing.id)) {
                conflicts.push({
                  sectionId: existing.id,
                  courseId: course?.id || existing.courseId,
                  sectionNumber: existing.sectionNumber,
                  courseName: course?.title || '',
                  instructor: existing.instructor,
                  day: existingDayAbbr,
                  startTime: existingSlot.startTime,
                  endTime: existingSlot.endTime
                })
              }
            }
          })
        })
      })
    })
  })
  
  return conflicts
}

const addSectionToSchedule = async (section: Section) => {
  if (!selectedScheduleId.value) {
    showAlert('Please select a schedule first')
    return
  }
  
  // Check for conflicts
  const conflicts = getConflictingSections(section)
  
  if (conflicts.length >= 2) {
    // Show modal to choose which section to replace
    sectionToAdd.value = section
    conflictingSections.value = conflicts
    showConflictModal.value = true
    return
  }
  
  try {
    await scheduleStore.addSectionToSchedule(selectedScheduleId.value, section.id)
    // Success - no need for alert, the UI will update
  } catch (error) {
    console.error('Error adding section to schedule:', error)
    const errorMsg = error instanceof Error ? error.message : 'Failed to add section to schedule'
    showAlert(`Error: ${errorMsg}`)
  }
}

const replaceSection = async (sectionIdToRemove: string) => {
  if (!selectedScheduleId.value || !sectionToAdd.value) return
  
  try {
    // Remove the selected section
    await scheduleStore.removeSectionFromSchedule(selectedScheduleId.value, sectionIdToRemove)
    // Add the new section
    await scheduleStore.addSectionToSchedule(selectedScheduleId.value, sectionToAdd.value.id)
    // Close modal
    closeConflictModal()
  } catch (error) {
    console.error('Error replacing section:', error)
    showAlert('Failed to replace section')
  }
}

const closeConflictModal = () => {
  showConflictModal.value = false
  conflictingSections.value = []
  sectionToAdd.value = null
}

// Helper methods for professor rating display
const isWellesleyProfessor = (rating: ProfessorRating | null): boolean => {
  if (!rating) return false
  // Allow professors with no school name (undefined/blank) or Wellesley College
  if (!rating.schoolName || rating.schoolName.trim() === '') return true
  return rating.schoolName.toLowerCase().includes('wellesley')
}

const getRatingClass = (rating: number | null): string => {
  if (rating === null) return 'rating-na'
  if (rating >= 4.0) return 'rating-great'
  if (rating >= 3.0) return 'rating-good'
  if (rating >= 2.0) return 'rating-average'
  return 'rating-poor'
}

const getDifficultyClass = (difficulty: number | null): string => {
  if (difficulty === null) return ''
  if (difficulty >= 4.0) return 'difficulty-hard'
  if (difficulty >= 3.0) return 'difficulty-moderate'
  return 'difficulty-easy'
}

const removeSectionFromSchedule = async (sectionId: string) => {
  if (!selectedScheduleId.value) return
  
  try {
    await scheduleStore.removeSectionFromSchedule(selectedScheduleId.value, sectionId)
    // Success - no need for alert, the UI will update
  } catch (error) {
    console.error('Error removing section from schedule:', error)
    const errorMsg = error instanceof Error ? error.message : 'Failed to remove section from schedule'
    showAlert(`Error: ${errorMsg}`)
  }
}

// Watch for schedule changes
watch(selectedScheduleId, (newId) => {
  if (newId && userSchedules.value.length > 0) {
    // Schedule is already selected
  }
})

// Initialize data
onMounted(async () => {
  // Load essential data in parallel, but allow each to fail independently
  // This ensures the app works even if one API times out
  const loadPromises = [
    scheduleStore.fetchAllSchedules().catch(err => {
      console.warn('⚠️ Failed to load schedules (app will still work):', err)
    }),
    sectionStore.fetchAllSections().catch(err => {
      console.error('Error loading sections:', err)
    }),
    courseStore.fetchAllCourses().catch(err => {
      console.error('Error loading courses:', err)
    })
  ]
  
  // Wait for all, but don't fail if one times out
  await Promise.allSettled(loadPromises)
  
  // Try to load filtering data, but don't fail if unavailable
  try {
    await Promise.all([
      filteringStore.fetchFilteredCourses(),
      filteringStore.fetchActiveTags()
    ])
  } catch (filteringError) {
    console.info('ℹ️ CourseFiltering API not available - distribution features will be limited')
  }
  
  // Select the first schedule if available (may be empty if fetch failed)
  if (userSchedules.value.length > 0) {
    selectedScheduleId.value = userSchedules.value[0].id
  }
})
</script>

<style scoped>
.home {
  min-height: 100vh;
  background: white;
  padding: 0.25rem;
}

/* Header Styles */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.header h1 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.5rem;
}

.schedule-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.schedule-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.schedule-selector label {
  font-weight: 600;
  color: #495057;
}

.schedule-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.export-action {
  display: flex;
  align-items: center;
}

.schedule-dropdown {
  padding: 0.5rem 35px 0.5rem 1rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  background: white;
  font-size: 1rem;
  min-width: 200px;
}

.schedule-dropdown:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.custom-dropdown-wrapper {
  position: relative;
  display: inline-block;
}

.delete-schedule-btn {
  position: absolute;
  right: 23px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: #999;
  font-size: 1.5rem;
  line-height: 1;
  padding: 0;
  width: 24px;
  height: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
  pointer-events: auto;
}

.delete-schedule-btn:hover {
  color: #333;
}

/* Main Content Layout */
.main-content {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 0.375rem;
  align-items: stretch;
}

/* Calendar Styles */
.calendar-container {
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow: visible;
}

.calendar-header {
  display: grid;
  grid-template-columns: 50px repeat(5, 1fr);
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  position: sticky;
  top: 0;
  z-index: 10;
}

.time-column {
  padding: 0.5rem;
  font-weight: 600;
  color: #495057;
  border-right: 1px solid #dee2e6;
  font-size: 0.75rem;
}

.day-header {
  padding: 0.5rem;
  text-align: center;
  font-weight: 600;
  color: #495057;
  font-size: 0.875rem;
  background: #f8f9fa;
  position: relative;
}

.day-header:not(:last-child)::after {
  content: '';
  position: absolute;
  right: 0;
  top: 20%;
  bottom: 20%;
  width: 1px;
  background: #e9ecef;
  opacity: 0.3;
}

.calendar-body {
  /* Remove fixed height and scrolling - let it flow with page */
}

.time-slot {
  display: grid;
  grid-template-columns: 50px repeat(5, 1fr);
  border-bottom: 1px solid #f1f3f4;
  min-height: 60px;
  transition: background-color 0.2s ease;
}

.time-slot:hover {
  background: #fafbfc;
}

.time-label {
  padding: 0.5rem;
  font-size: 0.75rem;
  color: #6c757d;
  border-right: 1px solid #dee2e6;
  display: flex;
  align-items: center;
  background: #f8f9fa;
}

.day-column {
  position: relative;
  min-height: 60px;
  padding: 2px;
  background: #ffffff;
  transition: background-color 0.2s ease;
  margin-right: 1px;
}

.day-column:last-child {
  margin-right: 0;
}

.day-column:nth-child(even) {
  background: #fafbfc;
}

.day-column:hover {
  background: #f8f9fa;
}

/* Course Block Styles */
.course-block {
  position: absolute;
  left: 2px;
  right: 2px;
  top: 2px;
  bottom: 2px;
  border-radius: 4px;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: visible;
}

.course-block:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  z-index: 10;
}

.remove-section-btn {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 18px;
  height: 18px;
  padding: 0;
  background: transparent;
  color: #6c757d;
  border: none;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  font-weight: bold;
}

.course-block:hover .remove-section-btn {
  opacity: 1;
}

.remove-section-btn:hover {
  color: #000000;
  transform: scale(1.2);
}

.preview-block {
  opacity: 0.6;
  border: 2px dashed #007bff !important;
  background: repeating-linear-gradient(
    45deg,
    rgba(0, 123, 255, 0.1),
    rgba(0, 123, 255, 0.1) 10px,
    rgba(0, 123, 255, 0.2) 10px,
    rgba(0, 123, 255, 0.2) 20px
  ) !important;
  animation: preview-pulse 2s ease-in-out infinite;
  pointer-events: none;
  z-index: 5;
}

@keyframes preview-pulse {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 0.8;
  }
}

.preview-color {
  background: rgba(0, 123, 255, 0.3);
}

.split-block {
  padding: 0.3rem;
}

.split-left {
  left: 2px;
  right: 50%;
  width: calc(50% - 3px);
}

.split-right {
  left: 50%;
  right: 2px;
  width: calc(50% - 3px);
}

.split-block .course-code {
  font-size: 0.7rem;
}

.split-block .course-time {
  font-size: 0.6rem;
}

.course-code {
  font-weight: 600;
  font-size: 0.85rem;
  color: #283848;
  line-height: 1.2;
  margin-bottom: 0.15rem;
}

.course-time {
  font-size: 0.7rem;
  color: #41484e;
  line-height: 1.2;
  margin-bottom: 0.15rem;
}

/* Color Classes - Light Pastel Rainbow */
.bg-color-1 {
  background-color: #FFD9DD;
  opacity: 0.85;
}

.bg-color-2 {
  background-color: #FFEFDD;
  opacity: 0.85;
}

.bg-color-3 {
  background-color: #FFFFDD;
  opacity: 0.85;
}

.bg-color-4 {
  background-color: #DDFFE4;
  opacity: 0.85;
}

.bg-color-5 {
  background-color: #DDF0FF;
  opacity: 0.85;
}

.bg-color-6 {
  background-color: #E4D9FF;
  opacity: 0.85;
}

.bg-color-7 {
  background-color: #F0D9FF;
  opacity: 0.85;
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
  border-radius: 8px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #dee2e6;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.close-btn:hover {
  background: #f8f9fa;
  color: #495057;
}

.modal-body {
  padding: 1.5rem;
}

/* Alert Modal Styles */
.alert-modal {
  max-width: 400px;
}

.alert-message {
  font-size: 1rem;
  line-height: 1.6;
  color: #495057;
  margin: 0 0 1.5rem 0;
  text-align: center;
}

/* Confirm Modal Styles */
.confirm-modal {
  max-width: 450px;
}

.confirm-message {
  font-size: 1rem;
  line-height: 1.6;
  color: #495057;
  margin: 0 0 0.75rem 0;
  text-align: center;
}

.confirm-message strong {
  color: #2c3e50;
  font-weight: 600;
}

.confirm-warning {
  font-size: 0.9rem;
  color: #dc3545;
  margin: 0 0 1.5rem 0;
  text-align: center;
  font-weight: 500;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
}

.btn-danger {
  background: #dc3545;
  color: white;
  font-weight: 600;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(220, 53, 69, 0.3);
}

.btn-delete {
  background: #1a5490;
  color: white;
  font-weight: 600;
}

.btn-delete:hover:not(:disabled) {
  background: #154376;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(26, 84, 144, 0.3);
}

.btn-cancel {
  background: white;
  color: #1a5490;
  border: 2px solid #1a5490;
  font-weight: 600;
}

.btn-cancel:hover:not(:disabled) {
  background: #f8f9fa;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(26, 84, 144, 0.2);
}

.course-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f8f9fa;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item label {
  font-weight: 600;
  color: #495057;
  min-width: 100px;
}

.info-item span {
  color: #6c757d;
  text-align: right;
  flex: 1;
}

.distribution-badge {
  background: #e5d1ffff;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  display: inline-block;
  box-shadow: 0 2px 4px rgba(166, 139, 199, 0.3);
}

.distribution-info {
  margin-top: 0.5rem;
}

.distribution-badge-small {
  background: white;
  color: #41484e;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-block;
  box-shadow: 0 1px 2px rgba(166, 139, 199, 0.2);
  border: 1.5px solid #ac97c6ff;
}

/* Form Styles */
.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #495057;
}

.form-section-title {
  margin: 1.5rem 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #dee2e6;
  color: #2c3e50;
  font-size: 1.1rem;
  font-weight: 600;
}

.form-section-title:first-child {
  margin-top: 0;
}

.form-help-text {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.85rem;
  color: #6c757d;
  font-style: italic;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
}

.form-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

/* Button Styles */
.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
  text-decoration: none;
  display: inline-block;
  text-align: center;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #CBDEF8;
  color: #41484e;
}

.btn-primary:hover:not(:disabled) {
  background-color: #CBDEF8;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(184, 165, 243, 0.4);
}

.btn-secondary {
  background-color: #CBDEF8;
  color: #41484e;
}

.btn-secondary:hover {
  background-color: #A3C4F3;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(184, 165, 243, 0.4);
}

.btn-success {
  background-color: #D7C6F2;
  color: #41484e;
}

.btn-success:hover:not(:disabled) {
  background-color: #B89BE8;
  color: #41484e;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(163, 196, 243, 0.4);
}

.btn-success:disabled {
  background-color: #D7C6F2;
  cursor: not-allowed;
  opacity: 0.65;
}

/* Tooltip Styles */
.tooltip {
  position: fixed;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  z-index: 1001;
  pointer-events: none;
}

.tooltip-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.tooltip-title {
  font-weight: 600;
}

.tooltip-time {
  color: #e9ecef;
}

/* Conflict Modal Styles */
.conflict-modal {
  max-width: 600px;
}

.conflict-message {
  margin-bottom: 1.5rem;
  font-size: 1rem;
  color: #495057;
  text-align: center;
}

.conflict-sections {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.conflict-section-card {
  background: #f8f9fa;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.conflict-section-card:hover {
  border-color: #dc3545;
  background: #fff;
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.2);
  transform: translateY(-2px);
}

.conflict-section-card h4 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.conflict-course-name {
  margin: 0.25rem 0;
  color: #495057;
  font-weight: 500;
}

.conflict-instructor {
  margin: 0.25rem 0;
  color: #6c757d;
  font-style: italic;
}

.conflict-time {
  margin: 0.5rem 0 1rem 0;
  color: #007bff;
  font-weight: 500;
}

.conflict-section-card .btn {
  width: 100%;
}

/* Professor Rating Styles */
.professor-rating-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 2px solid #e9ecef;
}

.professor-rating-section h4 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.rating-loading {
  text-align: center;
  padding: 1rem;
  color: #6c757d;
  font-style: italic;
}

.rating-not-found {
  text-align: center;
  padding: 1rem;
  color: #6c757d;
  background: #f8f9fa;
  border-radius: 8px;
}

.rating-not-found p {
  margin: 0;
}

.rating-details {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #dee2e6;
}

.rating-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.rating-score {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.score-number {
  font-size: 3rem;
  font-weight: bold;
  line-height: 1;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.rating-great {
  color: #28a745;
  border: 2px solid #28a745;
}

.rating-good {
  color: #20c997;
  border: 2px solid #20c997;
}

.rating-average {
  color: #ffc107;
  border: 2px solid #ffc107;
}

.rating-poor {
  color: #dc3545;
  border: 2px solid #dc3545;
}

.rating-na {
  color: #6c757d;
  border: 2px solid #6c757d;
}

.score-label {
  font-size: 0.9rem;
  color: #6c757d;
  margin-top: 0.25rem;
}

.rating-meta {
  flex: 1;
}

.rating-count {
  font-size: 1.1rem;
  font-weight: 600;
  color: #495057;
  margin-bottom: 0.25rem;
}

.rating-school {
  font-size: 0.9rem;
  color: #6c757d;
}

.rating-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.stat-item {
  background: white;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.stat-label {
  font-weight: 600;
  color: #495057;
  font-size: 0.9rem;
}

.stat-value {
  font-weight: bold;
  font-size: 1rem;
}

.difficulty-easy {
  color: #28a745;
}

.difficulty-moderate {
  color: #ffc107;
}

.difficulty-hard {
  color: #dc3545;
}

.rating-footer {
  text-align: center;
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.rating-footer small {
  color: #6c757d;
  font-size: 0.75rem;
  flex: 1;
}

.btn-refresh {
  padding: 0.4rem;
  font-size: 1.2rem;
  background: #17a2b8;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.btn-refresh:hover:not(:disabled) {
  background: #138496;
  transform: rotate(180deg);
}

.btn-refresh:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.btn-refresh:disabled .refresh-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.refresh-icon {
  display: block;
  font-size: 1.2rem;
}

.rating-not-found {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.rating-not-found p {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  margin: 0;
}

.rating-not-found .btn-refresh {
  align-self: flex-start;
  margin-top: 0.5rem;
}

/* Create Section Modal Styles */
.time-slot-group {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  border: 1px solid #dee2e6;
}

.time-slot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.time-slot-header h4 {
  margin: 0;
  font-size: 0.95rem;
  color: #495057;
}

.btn-remove-slot {
  padding: 0.25rem 0.75rem;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-remove-slot:hover {
  background: #c82333;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.days-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.days-checkboxes .checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.9rem;
}

.btn-add-slot {
  padding: 0.5rem 1rem;
  background: #90DBF4;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 0.5rem;
}

.btn-add-slot:hover {
  background: #7bc8e8;
}

/* Responsive Design */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .schedule-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .schedule-dropdown {
    min-width: auto;
  }
  
  .calendar-header {
    grid-template-columns: 40px repeat(5, 1fr);
  }
  
  .time-column {
    padding: 0.25rem;
    font-size: 0.625rem;
  }
  
  .day-header {
    padding: 0.25rem;
    font-size: 0.75rem;
  }
  
  .time-slot {
    grid-template-columns: 40px repeat(5, 1fr);
    min-height: 50px;
  }
  
  .time-label {
    padding: 0.25rem;
    font-size: 0.625rem;
  }
  
  .day-column {
    min-height: 50px;
  }
  
  .course-block {
    padding: 0.15rem;
  }
  
  .course-code {
    font-size: 0.625rem;
  }
  
  .course-time {
    font-size: 0.5rem;
  }
  
  .modal {
    width: 95%;
    margin: 1rem;
  }
  
  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
  
  .info-item span {
    text-align: left;
  }
}

@media (max-width: 480px) {
  .home {
    padding: 0.125rem;
  }
  
  .calendar-body {
    /* Remove fixed height for mobile too */
  }
  
  .calendar-header {
    grid-template-columns: 35px repeat(5, 1fr);
  }
  
  .time-slot {
    grid-template-columns: 35px repeat(5, 1fr);
    min-height: 45px;
  }
  
  .day-column {
    min-height: 45px;
  }
  
  .day-header {
    font-size: 0.625rem;
    padding: 0.15rem;
  }
  
  .time-label {
    font-size: 0.5rem;
    padding: 0.15rem;
  }
  
  .time-column {
    font-size: 0.5rem;
    padding: 0.15rem;
  }
  
  .course-code {
    font-size: 0.5rem;
  }
  
  .course-time {
    font-size: 0.4rem;
  }
}

/* Course Search Sidebar */
.course-search-sidebar {
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  height: 100%;
  max-height: none;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.search-header {
  padding: 1.25rem;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
}

.btn-create-section {
  padding: 0.5rem 1rem;
  background: #CBDEF8;
  color: #41484e;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
  white-space: nowrap;
  margin-bottom: 1rem;
  display: block;
  width: 100%;
}

.btn-create-section:hover {
  background: #A3C4F3;
  transform: translateY(-1px);
}

.search-controls {
  display: flex;
  gap: 0.75rem;
  align-items: stretch;
}

.search-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.9rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.btn-advanced-filters {
  padding: 0.5rem 1rem;
  background: #CBDEF8;
  color: #41484e;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.btn-advanced-filters:hover {
  background: #A3C4F3;
}

.btn-advanced-filters.active {
  background: #CBDEF8;
}

.advanced-filters {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
}

.filter-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.filter-row label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #495057;
}

.filter-note {
  display: block;
  color: #6c757d;
  font-size: 0.75rem;
  font-style: italic;
  margin-top: 0.25rem;
}

.distribution-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
  padding: 0.5rem;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  background: white;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background 0.2s;
}

.checkbox-label:hover {
  background: #f8f9fa;
}

.checkbox-input {
  cursor: pointer;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.checkbox-text {
  font-size: 0.85rem;
  color: #495057;
  line-height: 1.2;
}

.filter-select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.9rem;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s;
}

.filter-select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.btn-clear-filters {
  width: 100%;
  padding: 0.5rem;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 0.5rem;
}

.btn-clear-filters:hover {
  background: #5a6268;
}

/* AI Suggestions */
.ai-suggestions-section {
  margin-top: 1rem;
  border-radius: 8px;
}

.btn-ai-suggestions {
  width: 100%;
  padding: 0.75rem;
  background: white;
  color: #41484e;
  border: 2px solid #d2e8ffff;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-ai-suggestions:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.btn-ai-suggestions:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.suggested-courses {
  margin-top: 1rem;
}

.suggested-courses-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.suggested-courses h4 {
  color: #41484e;
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
}

.btn-collapse-suggestions {
  background: rgba(255, 255, 255, 0.2);
  color: #41484e;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: bold;
}

.btn-collapse-suggestions:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.suggestions-content {
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
    overflow: hidden;
  }
  to {
    opacity: 1;
    max-height: 1000px;
  }
}

.suggested-course-item {
  background: white;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
  cursor: pointer;
}

.suggested-course-item:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.suggested-course-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.suggested-course-header strong {
  color: #2c3e50;
  font-size: 0.95rem;
}

.section-badge {
  background: #e3f2fd;
  color: #1976d2;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.suggested-course-title {
  color: #495057;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.suggested-course-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  color: #6c757d;
  font-size: 0.75rem;
}

.suggestion-context {
  color: #41484e;
  font-size: 0.8rem;
  margin: 0 0 0.5rem 0;
  font-style: italic;
}

/* AI Modal */
.ai-modal {
  max-width: 600px;
}

/* Suggestion Info Popup */
.suggestion-info-popup {
  background: #e3f2fd;
  border-radius: 16px;
  padding: 0;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;
}

.suggestion-info-content {
  padding: 2.5rem 2rem;
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1rem;
}

.suggestion-info-title {
  margin: 0;
  color: #1976d2;
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.6;
  letter-spacing: 0.3px;
}

.suggestion-info-close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(25, 118, 210, 0.1);
  border: none;
  color: #1976d2;
  font-size: 1.2rem;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.suggestion-info-close-btn:hover {
  background: rgba(25, 118, 210, 0.2);
}

.suggestion-info-close-btn:active {
  background: rgba(25, 118, 210, 0.15);
}

.modal-description {
  color: #6c757d;
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.loading-state {
  text-align: center;
  padding: 2rem;
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-state p {
  color: #6c757d;
  font-size: 0.95rem;
}

.schedule-sections-list {
  max-height: 400px;
  overflow-y: auto;
}

.schedule-section-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  margin-bottom: 0.75rem;
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.schedule-section-item:hover {
  border-color: #667eea;
  background: #f8f9ff;
  transform: translateX(4px);
}

.section-item-content {
  flex: 1;
}

.section-item-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.section-item-header strong {
  color: #2c3e50;
  font-size: 1rem;
}

.section-number {
  background: #e3f2fd;
  color: #1976d2;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.section-item-title {
  color: #495057;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.section-item-instructor {
  color: #6c757d;
  font-size: 0.8rem;
}

.section-item-arrow {
  color: #667eea;
  font-size: 1.5rem;
  font-weight: bold;
  margin-left: 1rem;
  transition: transform 0.2s;
}

.schedule-section-item:hover .section-item-arrow {
  transform: translateX(4px);
}

.active-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.75rem;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  align-items: center;
}

.filter-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #495057;
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: #CFBAF0;
  color: white;
  border-radius: 12px;
  font-size: 0.8rem;
}

.remove-filter {
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  margin-left: 0.25rem;
}

.remove-filter:hover {
  color: #f8f9fa;
}

.department-filter {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.9rem;
  background: white;
  cursor: pointer;
}

.department-filter:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.course-list {
  flex: 0 0 auto;
  max-height: 1000vh;
  overflow-y: auto;
  padding: 0.75rem;
}

.no-courses {
  padding: 2rem 1rem;
  text-align: center;
  color: #6c757d;
  font-style: italic;
}

.course-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.course-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.course-item:hover {
  border-color: #007bff;
  box-shadow: 0 2px 4px rgba(0, 123, 255, 0.1);
  transform: translateY(-1px);
}

.section-hovered {
  border-color: #007bff !important;
  background: rgba(0, 123, 255, 0.05);
  box-shadow: 0 4px 8px rgba(0, 123, 255, 0.2);
  transform: translateY(-1px);
}

.course-info {
  flex: 1;
  min-width: 0;
}

.course-id {
  font-weight: 600;
  color: #007bff;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.course-title {
  font-size: 0.85rem;
  color: #495057;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.course-department {
  font-size: 0.75rem;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.section-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-top: 0.25rem;
}

.section-details .instructor {
  font-size: 0.75rem;
  color: #495057;
  font-weight: 500;
}

.section-details .time-info {
  font-size: 0.7rem;
  color: #6c757d;
}

.btn-add-course {
  padding: 0.375rem 0.75rem;
  background: #81beffff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
  white-space: nowrap;
}

.btn-add-course:hover:not(:disabled) {
  background: #0056b3;
}

.btn-add-course:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.course-added {
  font-size: 0.8rem;
  color: #28a745;
  font-weight: 500;
  padding: 0.375rem 0.75rem;
  background: #d4edda;
  border-radius: 4px;
  white-space: nowrap;
}

/* Responsive Design for Sidebar */
@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 350px 1fr;
    gap: 0.25rem;
  }
}

@media (max-width: 768px) {
  .main-content {
    grid-template-columns: 320px 1fr;
    gap: 0.25rem;
  }
  
  .course-search-sidebar {
    max-height: calc(60vh * 1.96);
  }
  
  .search-header {
    padding: 0.75rem;
  }
  
  .search-header h3 {
    font-size: 1rem;
    margin-bottom: 0.75rem;
  }
  
  .course-item {
    padding: 0.5rem;
  }
  
  .course-id {
    font-size: 0.85rem;
  }
  
  .course-title {
    font-size: 0.8rem;
  }
  
  .course-department {
    font-size: 0.7rem;
  }
}

@media (max-width: 480px) {
  .main-content {
    grid-template-columns: 1fr;
    gap: 0.25rem;
  }
  
  .course-search-sidebar {
    max-height: calc(40vh * 1.96);
  }
}
</style>
