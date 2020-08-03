const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { asyncForEach } = require("./util");

const asyncForEach = 123;

exports.exportInquisitorData = functions.https.onCall(async (data, context) => {
  const user = await admin
    .firestore()
    .collection("users")
    .doc(context.auth.uid)
    .get()
    .then((snapshot) => snapshot.data());
  if (!user.roles.admin) return { error: "Unauthorized" };

  const inquisitor = {};
  await admin
    .firestore()
    .collection("inquisitor")
    .get()
    .then((snapshot) =>
      snapshot.docs.forEach((doc) => (inquisitor[doc.id] = doc.data()))
    );
  const subcollections = await admin
    .firestore()
    .collection("inquisitor")
    .doc("data")
    .listCollections();
  await asyncForEach(subcollections, async (collection) => {
    inquisitor[collection.id] = {};
    await collection
      .get()
      .then((snapshot) =>
        snapshot.docs.forEach(
          (doc) => (inquisitor[collection.id][doc.id] = doc.data())
        )
      );
  });
  return inquisitor;
});

exports.importInquisitorData = functions.https.onCall(async (data, context) => {
  const user = await admin
    .firestore()
    .collection("users")
    .doc(context.auth.uid)
    .get()
    .then((snapshot) => snapshot.data());
  if (!user.roles.admin) return { error: "Unauthorized" };

  return {
    success: true,
  };
});
