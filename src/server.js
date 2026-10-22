import app from "./app.js";
import { serverConfig } from "./config/server.js";

app.listen(serverConfig.port, () => {
  console.log(`서버 실행: http://localhost:${serverConfig.port}`);
});
