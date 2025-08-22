const { Client } = require("pg");

const getUid = () => Date.now().toString(36);

const setUid = (client, id, uid) => {
  console.log(`Setting id ${id} to ${uid}`);
  return client.query({
    text: "update summaries set uid = $1::text where id = $2::integer",
    values: [uid, Number(id)],
  });
};

const trySettingUid = (client, id) => {
  return new Promise((resolve) => {
    const i = setInterval(() => {
      const uid = getUid();
      if (uid && uid !== lastUid) {
        clearInterval(i);
        lastUid = uid;
        setUid(client, id, uid);
        resolve();
      }
    }, 500);
  });
};

const args = process.argv.slice(2);
if (args.length !== 3) {
  console.log("Usage: node uid.js username password database");
  process.exit();
}
const [user, password, database] = args;

const client = new Client({
  database,
  user,
  password,
});

let lastUid;

client.connect().then(() => {
  client
    .query({ text: "select id from summaries order by id asc" })
    .then((result) => {
      const ids = result.rows.map((row) => row.id);
      console.log("Got IDs: ", ids);
      Promise.all(
        ids.filter(Boolean).map((id) => trySettingUid(client, id)),
      ).then(() => {
        console.log("Success!");
        process.exit();
      });
    });
});
