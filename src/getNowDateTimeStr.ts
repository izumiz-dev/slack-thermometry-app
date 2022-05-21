export const getNowDateTimeStr = () => {
  // https://catprogram.hatenablog.com/entry/2015/05/06/143753
  const localeOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    weekday: "narrow",
  };

  const jstNow = nowJST();
  const nowDateTime: string = jstNow.toLocaleDateString(
    "ja-JP",
    localeOptions as any
  );

  return nowDateTime;
};

export const getTodayStartTS = () => {
  const now = nowJST();
  now.setHours(0);
  now.setMinutes(0);
  now.setSeconds(0);
  now.setMilliseconds(0);

  return now.valueOf().toString().substring(0, 10);
};

const nowJST = () => {
  // https://neos21.net/blog/2020/12/09-01.html
  const jstNow = new Date(
    Date.now() + (new Date().getTimezoneOffset() + 9 * 60) * 60 * 1000
  );

  return jstNow;
};
