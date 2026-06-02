const fs = require('fs');
const file = 'src/app/_components/EditTransactionModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// Use regex to remove any class starting with dark:
// E.g., dark:bg-zinc-900, dark:border-zinc-800, dark:text-zinc-50, etc.
// Also handle dark:bg-red-950/30, etc.
content = content.replace(/dark:[^\s"']+/g, '');
content = content.replace(/ +"/g, '"');
content = content.replace(/ +'/g, "'");
content = content.replace(/ +`/g, '`');

fs.writeFileSync(file, content);
