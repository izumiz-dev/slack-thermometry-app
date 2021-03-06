import { App } from "@slack/bolt";

let latestTimeStamp: string = "";
let alreadySubmittedUsers: string[] = [];

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

app.message(/^検温$/, async ({ say }) => {
  try {


    alreadySubmittedUsers = []; // initialize
    // https://neos21.net/blog/2020/12/09-01.html
    const jstNow = new Date(
      Date.now() + (new Date().getTimezoneOffset() + 9 * 60) * 60 * 1000
    );

    // https://catprogram.hatenablog.com/entry/2015/05/06/143753
    const localeOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      weekday: "narrow",
    };
    const nowDateTime: string = jstNow.toLocaleDateString(
      "ja-JP",
      localeOptions as any
    );

    const result = await say({
      attachments: [
        {
          fallback: "検温確認 体温が37.5℃以下であれば確認してください。",
          color: "#32a852",
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
        },
      ],
    });

    latestTimeStamp = result.ts || "";
  } catch (error) {
    console.log(error)
  }
});

app.action("thermometry_ok", async ({ body, ack, say }: any) => {
  try {
    await ack();
    const realName = await fetchUserName(body.user.id);

    if (!alreadySubmittedUsers.includes(body.user.id)) {
      await say({
        fallback: "検温を確認しました。",
        text: `${realName}さんが確認しました`,
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
    alreadySubmittedUsers.push(body.user.id);
  } catch (error) {
    console.log(error)
  }
});

const fetchUserName = async (userId: string) => {
  try {
    const res = await app.client.users.profile.get({
      user: userId
    })

    if (typeof res.profile !== 'undefined') {
      const { display_name: userName = "ユーザ名 取得失敗" } = res.profile;
      return userName;
    }

  } catch (error) {
    console.log(error)
  }
}

(async () => {
  await app.start(process.env.PORT || 3000);

  console.log("⚡️ Bolt app is running!");
})();
