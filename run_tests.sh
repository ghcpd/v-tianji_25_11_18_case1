#!/bin/bash

# run_tests.sh - Install dependencies and run Jest test suite
# Exit successfully only if tests pass

set -e

echo "====================================="
echo "Installing dependencies..."
echo "====================================="

# Initialize package.json if it doesn't exist
if [ ! -f package.json ]; then
  echo "Creating package.json..."
  npm init -y
fi

# Install required dependencies
echo "Installing test dependencies..."
npm install --save-dev \
  jest \
  @types/jest \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  @types/react \
  @types/react-dom \
  react \
  react-dom \
  ts-jest \
  typescript \
  @babel/preset-env \
  @babel/preset-react \
  @babel/preset-typescript \
  jest-environment-jsdom

echo ""
echo "====================================="
echo "Configuring Jest..."
echo "====================================="

# Create Jest configuration
cat > jest.config.js << 'EOF'
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/*.test.{ts,tsx}',
  ],
};
EOF

# Create Jest setup file
cat > jest.setup.js << 'EOF'
import '@testing-library/jest-dom';
EOF

# Create TypeScript configuration
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "types": ["jest", "@testing-library/jest-dom"]
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
EOF

echo "Configuration files created successfully"
echo ""
echo "====================================="
echo "Running Jest tests..."
echo "====================================="

# Run tests with coverage
npx jest --coverage --verbose

# Check test exit code
if [ $? -eq 0 ]; then
  echo ""
  echo "====================================="
  echo "✓ All tests passed successfully!"
  echo "====================================="
  exit 0
else
  echo ""
  echo "====================================="
  echo "✗ Tests failed!"
  echo "====================================="
  exit 1
fi
