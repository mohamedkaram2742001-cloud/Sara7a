import mongoose from "mongoose";
import { URI } from "../../config/config.service.js";
import { userModel } from "./models/user.model.js";

export const authenticateDb = async () => {
  try {
    await mongoose.connect(URI);

    await userModel.syncIndexes();

    console.log("DB Connected successfully ✅");
  } catch (error) {
    console.error("Fail to connect on DB ❌");
    console.error(error.message);
  }
};
