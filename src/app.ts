import { App } from "@slack/bolt";
import { getNowDateTimeStr, getTodayStartTS } from "./getNowDateTimeStr";

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

app.message(/^検温$/, async ({ say }) => {
  const nowDateTime = getNowDateTimeStr();

  const result = await say({
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `検温確認: ${nowDateTime}\n体温が37.5℃以下であれば確認してください。`,
        },
        accessory: {
          type: "button",
          style: "primary",
          text: {
            type: "plain_text",
            text: "確認",
            emoji: true,
          },
          action_id: "thermometry_ok",
        },
      },
    ],
  });

  await say({
    text: `ts: ${result.ts}`,
  });
});
// 確認ボタンが押されたとき
app.action("thermometry_ok", async ({ body, ack, say }: any) => {
  await ack();

  let latestTimeStamp = "";

  const history = await app.client.conversations.history({
    channel: body.channel.id,
    oldest: getTodayStartTS(),
    limit: 50,
  });

  history.messages?.forEach((msg: any) => {
    const regex = /^ts: \d{10}\.\d{6}$/;
    if (regex.test(msg.text)) {
      latestTimeStamp = msg.text.match(/^ts: \d{10}\.\d{6}$/);
    }
  });

  const replies = await app.client.conversations.replies({
    channel: body.channel.id,
    ts: latestTimeStamp,
  });

  // 配列の先頭は不要なので削除
  replies.messages?.shift();

  const confirmedUserIds: string[] = [];
  replies.messages?.forEach((msg: any) => {
    const matched = msg.text.match(/(?<=<@).*?(?=>)/);
    if (!!matched) {
      confirmedUserIds.push(matched[0]);
    }
  });

  if (!confirmedUserIds.includes(body.user.id)) {
    await say({
      fallback: "検温を確認しました。",
      text: `<@${body.user.id}>さんが確認しました`,
      thread_ts: latestTimeStamp,
    });
  } else {
    await app.client.chat.postEphemeral({
      fallback: "既に検温確認済みです。",
      text: "既に検温確認済みです。",
      channel: body.channel.id,
      user: body.user.id,
    });
  }
});

(async () => {
  await app.start(process.env.PORT || 3000);

  console.log(
    `Slack thermometry is running! http://localhost:${process.env.PORT || 3000}`
  );
})();
