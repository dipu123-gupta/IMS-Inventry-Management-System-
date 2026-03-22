try {
  console.log('Starting server wrapper...');
  require('./server');
  console.log('Server module loaded.');
} catch (err) {
  console.error('CRITICAL STARTUP ERROR:');
  console.error('Name:', err.name);
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
  process.exit(1);
}
