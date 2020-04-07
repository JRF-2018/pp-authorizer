/*
 * consts.js of pp-authorizer
 *
 * Time-stamp: <2017-12-26T07:00:28Z>
 */

const INIT_SETTINGS = {
  checkUrl: false,
  prohibitInstall: false,
  disableNotify: false
};

const INIT_AUTHORITIES = [
  {
    name: "Twitter",
    url: "https://api.twitter.com/oauth/authorize",
    versionFrom: "0.1",
    iconUrl: "data:application/ico;base64,\
AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAAAAAAAAAAAAAAAAA\
AAAAAAD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A\
////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD/\
//8A////AP///wD///8A////AP///wD///8A////AP///wz///8f////H////x////8Y////B///\
/wD///8A////AP///wD///8A////AP///wD///8A////A////yj7789g9tV+ofbVfqH21X6h+N+e\
ifz03lf///8o////A////wD///8A////AP///wD///8A////APr37g/PsGCftogQ7r2JAP/bnwD/\
7qwA/+6sAP/urAD/9Mtftv357z////8D////AP///wD///8A////AP///wD///8A////AP///w/5\
7c5a88VQwu6sAP/urAD/7qwA/+6sAP/xvDDb/fnvP////wD///8A////AP///wD///8A////AP//\
/wDz5L5X7bgv2+6sAP/urAD/7qwA/+6sAP/urAD/7qwA//G8MNv///8Y////AP///wD///8A////\
AP///wD///8M9NN+n+6wD/PurAD/7qwA/+6sAP/urAD/7qwA/+6sAP/urAD/9Nyegf///wD///8A\
////AP///wD///8A+O3PVu6wD/PurAD/7qwA/+6sAP/urAD/7qwA/+6sAP/urAD/7qwA//G8MNv/\
//8A////AP///wD///8A////ANasQMXurAD/7qwA/+qpAP/YnAD/1JkA/+6sAP/urAD/7qwA/+6s\
AP/urAD/////FP///wD///8A////AP///wDz255+7qwA/9icAP+6ixDuz7Bgn9m8b5TurAD/7qwA\
/+6sAP/urAD/7qwA//jkr3j///8M////AP///wD///8A47Y/ysmRAP/PsGCf+vfuD////wDw584w\
46QA/+6sAP/urAD/7qwA/9+hAP/orA/z9OrPQv///wD///8A////AMypT7Hhz55g////AP///wD/\
//8A////AMOaL9DMlAD/0JYA/8mRAP/FoEC/vpIf4OPQnmL///8A////AP///wD69+4P////AP//\
/wD///8A////AP///wD69+4P3ceOcNi/foHhz55g////APr37g/69+4P////AP///wD///8A////\
AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A\
////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD/\
//8A//8AAP//AAD//wAA8P8AAMA/AAD4HwAA8A8AAOAHAADgBwAAwAcAAOAHAADHAwAA3wMAAP/f\
AAD//wAA//8AAA=="
  },

  {
    name: "Hatena",
    url: "https://www.hatena.com/oauth/authorize",
    versionFrom: "0.1",
    locales: ["ja", "en"],
    iconUrl: "/icons/m/hatena.ico"
  }
];

const INIT_EXTENSIONS =  [
  {name: "PP Interrupter Lite", id: PP_INTERRUPTER_LITE_ID}
];

if (PP_INTERRUPTER_ID) {
  INIT_EXTENSIONS.push({name: "PP Interrupter", id: PP_INTERRUPTER_ID});
}
