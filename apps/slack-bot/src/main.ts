import { start } from './app.js';

start().catch((error) => {
  console.error(
    'Failed to start Newsletter Ops Bot:',
    error instanceof Error ? error.message : String(error),
  );
  process.exit(1);
});
