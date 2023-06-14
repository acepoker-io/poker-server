/* eslint-disable import/no-unresolved */
/* eslint-disable import/extensions */
/* eslint-disable import/no-dynamic-require */

import { CronJob } from "cron";
import { ISO_8601 } from "moment/moment";
import { activateTournament } from "../functions/functions";
import gameService from "../service/game.service";
const returnCron = async (io) => {
  console.log("cron executed");
  const job1 = new CronJob("*    *    *    *    *", async () => {
    console.log("cron executed");
    await gameService.checkTournamentHasMinimumPlayers();
    await gameService.checkPlayerLimitHasReached();
    // await gameService.checkToStartTournament();
    // await gameService.sendAcknowledgementForJoinTournament(io);
    await activateTournament(io);
  });
  job1.start();
};
export default returnCron;
