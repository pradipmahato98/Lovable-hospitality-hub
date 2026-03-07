import { Queue, Worker } from "bullmq";
import { env } from "@/config/env";
import { sendEmail } from "./email";

export const emailQueue = new Queue("email", {
  connection: { url: env.REDIS_URL },
});

new Worker("email", async (job) => {
  const { to, subject, html } = job.data;
  await sendEmail({ to, subject, html });
}, {
  connection: { url: env.REDIS_URL },
});
