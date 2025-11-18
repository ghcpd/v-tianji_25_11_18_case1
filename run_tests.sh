#!/bin/bash

# Test runner script for Complex Dashboard component
# Installs dependencies and runs Jest test suite

set -e  # Exit on error

echo "Installing dependencies..."

# Check if node_modules exists, if not install
if [ ! -d "node_modules" ]; then
  npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/react @types/react-dom @types/jest typescript ts-jest @babel/preset-env @babel/preset-react @babel/preset-typescript
fi

# Create jest.config.js if it doesn't exist
if [ ! -f "jest.config.js" ]; then
  cat > jest.config.js << 'EOF'
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/*.test.{ts,tsx}',
  ],
};
EOF
fi

# Create jest.setup.js if it doesn't exist
if [ ! -f "jest.setup.js" ]; then
  cat > jest.setup.js << 'EOF'
import '@testing-library/jest-dom';
EOF
fi

# Create tsconfig.json if it doesn't exist
if [ ! -f "tsconfig.json" ]; then
  cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020", "DOM"],
    "jsx": "react",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "types": ["jest", "@testing-library/jest-dom"]
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
EOF
fi

# Create package.json if it doesn't exist
if [ ! -f "package.json" ]; then
  cat > package.json << 'EOF'
{
  "name": "complex-dashboard-tests",
  "version": "1.0.0",
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "devDependencies": {
    "@babel/preset-env": "^7.23.0",
    "@babel/preset-react": "^7.23.0",
    "@babel/preset-typescript": "^7.23.0",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/react": "^14.1.2",
    "@testing-library/user-event": "^14.5.1",
    "@types/jest": "^29.5.11",
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.18",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "ts-jest": "^29.1.1",
    "typescript": "^5.3.3"
  }
}
EOF
fi

echo "Running tests..."
npm test

echo "All tests passed successfully!"

