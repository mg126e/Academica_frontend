# Academica Frontend

[User Journey](C:\Users\marin\OneDrive\Desktop\61040-portfolio\Academica_frontend\UserJourney.md)

[Video](C:\Users\marin\OneDrive\Desktop\61040-portfolio\Academica_frontend\61040rec.mp4)


## Features

- **Vue 3** with Composition API
- **TypeScript** for type safety
- **Vite** for fast development and building
- **Vue Router** for client-side routing
- **Pinia** for state management
- **ESLint** and **Prettier** for code quality
- **Vitest** for unit testing
- **Course Management** - Create and manage courses
- **Section Scheduling** - Schedule sections with time slots
- **Schedule Management** - Build and manage student schedules
- **API Integration** - Full integration with backend API


### Prerequisites

- Node.js (version 18 or higher)
- npm
- Backend API running on `http://localhost:8000`

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

**Note:** The application uses a Vite proxy to handle CORS issues with the backend API. API calls are automatically routed through the development server.

### Building for Production

Build the application for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

### Code Quality

Run ESLint to check for code quality issues:

```bash
npm run lint
```

Format code with Prettier:

```bash
npm run format
```

### Testing

Run unit tests:

```bash
npm run test:unit
```

## Project Structure

```
src/
├── components/     # Reusable Vue components
├── views/          # Page components
│   ├── CoursesView.vue
│   ├── SectionsView.vue
│   ├── SchedulesView.vue
│   ├── ScheduleDetailView.vue
│   └── ...
├── router/         # Vue Router configuration
├── stores/         # Pinia stores
│   ├── courseStore.ts
│   ├── sectionStore.ts
│   └── scheduleStore.ts
├── services/       # API service layer
│   └── api.ts
├── types/          # TypeScript type definitions
│   └── api.ts
├── assets/         # Static assets
├── App.vue         # Root component
├── main.ts         # Application entry point
└── style.css       # Global styles
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run test:unit` - Run unit tests
- `npm run type-check` - Run TypeScript type checking


