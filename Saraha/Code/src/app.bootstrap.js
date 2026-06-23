import express from "express";
import { ORIGIN, PORT } from "../config/config.service.js";
import { authenticateDb, redicConnection } from "./DB/index.js";
import {NotFoundException,} from "./common/utils/response/index.js";
import {globalErrorHandling,} from "./middleware/index.js";
import { AuthRouter, userRouter, messageRouter } from "./modules/index.js";
import path from "node:path";
import cors from "cors";
import { deleteUnconfirmedUsers } from "./jobs/index.js";
import helmet from "helmet";
import { limiter } from "./middleware/limiter.middleware.js";
async function bootStrap() {
  const app = express();
  const port = process.env.PORT || PORT; 
  //Proxy
  app.set("trust proxy", true);

  //cors
  const corsOptions = {
    // origin: ORIGIN,
    credentials: true,
    optionsSuccessStatus: 200,
  };

  //global Middlewares
  app.use(cors(corsOptions), helmet(), express.json() , limiter);
  //Use Image
  app.use(
    "/Saraha/profile",
    express.static(path.join(path.resolve(), "src", "upload", "profile")),
  );
  //application routing
  app.get("/", (req, res) => res.send("Hello World!"));
  app.use("/Saraha/auth", AuthRouter);
  app.use("/Saraha/profile", userRouter);
  app.use("/Saraha/message", messageRouter);
  // invalid routing
  app.get("{/*dummy}", (req, res) => {
    return NotFoundException();
  });
  //Global Error Handling
  app.use(globalErrorHandling);
  app.listen(port, () => console.log(`listening on ${port}`));
  try {
  //DB
  await authenticateDb();
  //Redis
  await redicConnection();
  //Cron-jobs
  await deleteUnconfirmedUsers();
  } catch (error) {
    console.log(error);
  }
}
export default bootStrap;
