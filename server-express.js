const app = require('./backend/src/app');
const PORT = Number(process.env.PORT || 3000);

if (require.main === module) {
  app.listen(PORT, ()=> console.log(`[AMS] Ready -> http://localhost:${PORT}`));
}
