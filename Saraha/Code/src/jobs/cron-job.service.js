import cron from "node-cron";
import { deleteMany } from "../DB/dataBase.service.js";
import { userModel } from "../DB/models/user.model.js";
export const deleteUnconfirmedUsers = async ()=>{
cron.schedule("* * * * *", async () => {
  const limitDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await deleteMany({
    model: userModel,
    filter: {
      confirmEmail: null,
      createdAt: { $lte: limitDate },
    },
  });
});
}

