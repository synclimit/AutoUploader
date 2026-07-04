const fs = require('fs');
const path = require('path');

const dir = 'd:/AutoUploader/frontend/app/src/components/accounts';

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Fix snap scroll bug
  if (content.includes('snap-y snap-mandatory')) {
    content = content.replace(/snap-y snap-mandatory /g, '');
    changed = true;
  }
  if (content.includes('snap-start')) {
    content = content.replace(/snap-start /g, '');
    changed = true;
  }

  // Fix select option styling
  if (content.includes('<option')) {
    // If <option doesn't already have className="bg-[#141821] text-white"
    if (!content.includes('className="bg-[#141821] text-white"')) {
      content = content.replace(/<option([^>]*)>/g, '<option$1 className="bg-[#141821] text-white">');
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed', filePath);
  }
}

function walkDir(currentDir) {
  const files = fs.readdirSync(currentDir);
  for (const file of files) {
    const fullPath = path.join(currentDir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      processFile(fullPath);
    }
  }
}

walkDir(dir);
