# Overview

This is an interactive 3D Magic 8-Ball web application that combines mystical fortune-telling with modern web technologies. Users can shake a virtual Magic 8-Ball by pressing Space or Enter, and receive AI-generated mystical responses from the Gemini API. The app features a stunning 3D interface built with React Three Fiber, complete with particle effects, dynamic lighting, and immersive audio feedback.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client is built with React 18 and TypeScript, using a modern component-based architecture. The 3D rendering is powered by React Three Fiber (@react-three/fiber) with additional utilities from @react-three/drei for enhanced 3D functionality. The UI components are built with Radix UI primitives and styled with Tailwind CSS for a consistent design system.

State management is handled through Zustand stores with subscribeWithSelector middleware:
- `useMagicBall`: Manages ball shaking state, responses, and loading states
- `useAudio`: Controls sound effects and mute functionality
- `useGame`: Handles game phases (ready, playing, ended)

The application uses keyboard controls (Space/Enter to shake, R to reset) with KeyboardControls from @react-three/drei for input handling.

## Backend Architecture
The server is built with Express.js and follows a modular route-based architecture. The main server file (`server/index.ts`) sets up middleware for JSON parsing, request logging, and error handling. Routes are registered through a centralized `registerRoutes` function that creates an HTTP server.

The storage layer uses an in-memory storage implementation (`MemStorage`) that implements the `IStorage` interface, providing methods for user management. This abstraction allows for easy switching to different storage backends.

## Database Design
The application uses Drizzle ORM with PostgreSQL (configured for Neon Database) for data persistence. The schema defines a simple users table with id, username, and password fields. Drizzle Kit is configured for migrations with the schema located in `shared/schema.ts`.

## AI Integration
The Magic 8-Ball responses are generated using Google's Gemini API. The system includes fallback responses when the API is unavailable. The AI prompts are designed to create mystical, oracle-like responses that are 10-30 words long and feel personally meaningful to users.

## 3D Graphics Pipeline
The 3D scene includes:
- A physically-rendered Magic 8-Ball with realistic materials (metallic black exterior, translucent blue window)
- Dynamic particle systems that respond to ball shaking
- Animated lighting with pulsing and orbital effects
- Physics-based animations for ball movement and rotation
- GLSL shader support for advanced visual effects

## Build System
The project uses Vite for development and building, with React plugin and runtime error overlay. The build process compiles both the client (React app) and server (Express app with esbuild) into a production-ready distribution. Assets include support for 3D models (.gltf, .glb) and audio files (.mp3, .ogg, .wav).

# External Dependencies

## Core Framework Dependencies
- **React Three Fiber**: 3D rendering engine for React applications
- **Express.js**: Web application framework for the Node.js server
- **Drizzle ORM**: Type-safe database toolkit with PostgreSQL support
- **Neon Database**: Serverless PostgreSQL database service
- **Zustand**: State management library with TypeScript support

## UI and Styling
- **Radix UI**: Unstyled, accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for user interface elements

## Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Static type checking and compilation
- **esbuild**: JavaScript bundler for server-side code

## External APIs
- **Google Gemini API**: AI service for generating mystical responses (requires `GEMINI_API_KEY` environment variable)

## Audio and Media
- Audio files for sound effects (shake.mp3, success.mp3)
- Support for 3D model formats and various audio formats
- Font loading through Fontsource (Inter font family)