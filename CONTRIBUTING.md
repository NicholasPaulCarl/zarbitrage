# Contributing to Crypto Arbitrage Platform

Thank you for your interest in contributing to the Crypto Arbitrage Platform! This document provides guidelines and information for contributors.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Style](#code-style)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 18+ 
- PostgreSQL 12+
- Git
- A code editor (VS Code recommended)

### Development Setup

1. **Fork the repository**
   ```bash
   # Fork the repo on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/crypto-arbitrage-platform.git
   cd crypto-arbitrage-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

4. **Set up the database**
   ```bash
   # Create a PostgreSQL database
   createdb crypto_arbitrage_dev
   
   # Run migrations
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 🎨 Code Style

### TypeScript/JavaScript
- Use TypeScript for all new code
- Follow existing naming conventions
- Use meaningful variable and function names
- Add proper type annotations

### React Components
- Use functional components with hooks
- Follow the existing component structure
- Use proper prop typing with TypeScript interfaces
- Keep components focused and reusable

### File Organization
- Place reusable components in `client/src/components/`
- Put page components in `client/src/pages/`
- Add utility functions to `client/src/lib/`
- Keep server logic in appropriate `server/` subdirectories

### Database
- Use Drizzle ORM for all database operations
- Add proper schema definitions in `shared/schema.ts`
- Follow existing naming conventions for tables and columns

## 🔄 Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, well-documented code
   - Follow existing patterns and conventions
   - Add comments for complex logic

3. **Test your changes**
   ```bash
   # Run type checking
   npx tsc --noEmit
   
   # Build the application
   npm run build
   
   # Test manually in the browser
   npm run dev
   ```

## 🧪 Testing

While we don't currently have automated tests, please:
- Test all new features manually
- Verify existing functionality still works
- Check both authenticated and unauthenticated states
- Test responsive design on different screen sizes

## 📤 Submitting Changes

1. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

2. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create a Pull Request**
   - Go to the original repository on GitHub
   - Click "New Pull Request"
   - Select your feature branch
   - Fill out the PR template with:
     - Clear description of changes
     - Screenshots for UI changes
     - Testing instructions

### Commit Message Format

Use conventional commits format:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for formatting changes
- `refactor:` for code refactoring
- `test:` for adding tests
- `chore:` for maintenance tasks

## 🐛 Reporting Issues

When reporting issues:
1. Use GitHub Issues
2. Provide clear reproduction steps
3. Include error messages and logs
4. Specify browser and operating system
5. Add screenshots for UI issues

## 💡 Feature Requests

For new features:
1. Check existing issues first
2. Describe the use case clearly
3. Explain the expected behavior
4. Consider implementation complexity

## 🔒 Security

If you discover security vulnerabilities:
- **DO NOT** create a public issue
- Email the maintainers directly
- Provide detailed information about the vulnerability

## 📞 Getting Help

If you need help:
- Check existing GitHub Issues
- Ask questions in Discussions
- Review the README.md documentation

Thank you for contributing! 🎉