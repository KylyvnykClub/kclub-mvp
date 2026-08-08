import fs from 'fs/promises';
import path from 'path';

async function walk(dir) {
  let results = [];
  const list = await fs.readdir(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = await fs.stat(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(await walk(filePath));
    } else {
      if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        results.push(filePath);
      }
    }
  }
  return results;
}

async function processFiles() {
  const adminSrcPath = path.join(process.cwd(), 'apps', 'admin-app', 'src');
  const files = await walk(adminSrcPath);

  let modifiedCount = 0;

  for (const file of files) {
    let content = await fs.readFile(file, 'utf8');
    let original = content;

    content = content.replace(/\brounded(-[a-z0-9-]+)?\b/g, (match, p1) => {
      // Retain rounded-full and rounded-none
      if (p1 === '-full' || p1 === '-none') {
        return match;
      }
      return '';
    });

    if (content !== original) {
      await fs.writeFile(file, content, 'utf8');
      modifiedCount++;
      console.log(`Modified: ${file}`);
    }
  }

  console.log(`\nDone. Modified ${modifiedCount} files.`);
}

processFiles().catch(console.error);
