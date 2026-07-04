import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

async function globalSetup() {
  console.log('--- GLOBAL SETUP: Initializing Test Database ---');
  
  const backendDir = path.resolve(__dirname, '../../backend');
  const testDbPath = path.join(backendDir, 'app_test.db');
  
  // 1. Destroy existing test data
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  // 2. Recreate database by applying Alembic migrations
  // Since we set DATABASE_URL, alembic will run on app_test.db
  execSync('venv\\Scripts\\alembic upgrade head', {
    cwd: backendDir,
    env: { ...process.env, DATABASE_URL: 'sqlite:///./app_test.db' },
    stdio: 'inherit'
  });

  console.log('--- GLOBAL SETUP: Test Database Ready ---');
}

export default globalSetup;
