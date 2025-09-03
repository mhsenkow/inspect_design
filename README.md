# Inspect Design - Local Development Setup

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- Yarn package manager

## Quick Start

### 1. Install Dependencies

```bash
yarn install
```

### 2. Set Up PostgreSQL

Make sure PostgreSQL is running locally. You can install it via:

**macOS (using Homebrew):**

```bash
brew install postgresql
brew services start postgresql
```

**Ubuntu/Debian:**

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 3. Create Environment Variables

Create a `.env` file in the root directory with the following content:

```env
# Database Configuration
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=inspect

# JWT Token Key (for authentication)
TOKEN_KEY=your-secret-jwt-key-change-this-in-production

# Node Environment
NODE_ENV=development
```

### 4. Set Up Database

Create the database and populate it with the schema and data:

```bash
# Create the database
yarn db:create

# Option 1: Populate with schema and sample data (recommended for testing)
yarn db:migrate

# Option 2: Populate with schema only (for clean development)
yarn db:schema
```

### 5. Start Development Server

```bash
yarn dev
```

The application will be available at `http://localhost:3000`

## Database Schema

The database includes the following tables:

- `users` - User accounts and authentication
- `insights` - Main content pieces with titles and metadata
- `summaries` - Source content and URLs
- `evidence` - Links between insights and summaries
- `comments` - User comments on insights
- `reactions` - User reactions (emojis) on content
- `sources` - Source websites with logos
- `insight_links` - Hierarchical relationships between insights

## Available Scripts

- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn db:create` - Create database
- `yarn db:migrate` - Populate database with schema and sample data
- `yarn db:schema` - Populate database with schema only (no sample data)
- `yarn jest:watch` - Run tests in watch mode
- `yarn e2e` - Run end-to-end tests

## Project Structure

- `src/app/` - Next.js app directory with pages and API routes
- `src/app/api/` - API endpoints for data operations
- `src/app/components/` - React components
- `src/app/insights/` - Insight pages and functionality
- `src/app/links/` - Link management pages
- `public/` - Static assets
- `inspect-dump.sql` - Database schema and sample data

## Features

- User authentication and registration
- Create and manage insights (factual statements)
- Link insights to source content
- Add comments and reactions
- Hierarchical organization of insights
- Source management with logos
- Modern React/Next.js interface

## Troubleshooting

### Database Connection Issues

- Ensure PostgreSQL is running
- Check that the database credentials in `.env` match your PostgreSQL setup
- Verify the database `inspect` exists

### Port Already in Use

- Change the port in `next.config.js` or use `yarn dev -p 3001`

### Build Issues

- Clear node_modules and reinstall: `rm -rf node_modules && yarn install`
- Clear Next.js cache: `rm -rf .next && yarn dev`
