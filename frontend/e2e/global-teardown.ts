import fs from 'fs';
import path from 'path';

async function globalTeardown() {
  console.log('--- GLOBAL TEARDOWN: Destroying Test Database ---');
  
  const backendDir = path.resolve(__dirname, '../../backend');
  const testDbPath = path.join(backendDir, 'app_test.db');
  
  if (fs.existsSync(testDbPath)) {
    try {
      fs.unlinkSync(testDbPath);
      console.log('Test database removed.');
    } catch (e) {
      console.error('Failed to remove test database:', e);
    }
  }
}

export default globalTeardown;
