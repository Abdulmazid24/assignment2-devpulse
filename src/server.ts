import app from './app.js';
import config from './config/env.js';
import { initDB } from './db/index.js';

const main = async () => {
  try {
    await initDB();
    app.listen(config.port, () => {
      console.log(`Server is running on port ${config.port}`);
    });
  } catch (error) {
    console.error(error);
  }
};

main();
