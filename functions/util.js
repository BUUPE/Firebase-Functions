const admin = require("firebase-admin");

// helper function do a synchronous forEach (wait for each iteration of the loop before starting the next)
exports.asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    // eslint-disable-next-line
    await callback(array[index], index, array);
  }
};

// recursive function that takes a collection path and turns it and all documents/subcollections into an object
exports.exportCollection = async (collection) => {
  const collectionObject = {};

  // get documents refs
  const documentRefs = await admin
    .firestore()
    .collection(collection)
    .listDocuments();

  await asyncForEach(documentRefs, async (documentRef) => {
    // get document ref
    const ref = await documentRef.get();

    // if ref exists, save data
    if (ref.exists) collectionObject[ref.id] = ref.data();
    else {
      // otherwise it must have subcollections
      const subcollections = await admin
        .firestore()
        .doc(documentRef.path)
        .listCollections();

      // recurse for every subcollection
      const promises = subcollections.map(
        (collectionRef) =>
          new Promise((resolve) => {
            resolve(exportCollection(collectionRef.path));
          })
      );

      // once promises are resolved, store the data
      const subcollectionObject = {};
      await Promise.all(promises).then((values) =>
        values.forEach(
          (value, i) => (subcollectionObject[subcollections[i].id] = value)
        )
      );
      collectionObject[ref.id] = subcollectionObject;
    }
  });

  return collectionObject;
};

exports.validEmail = (email) => {
  // eslint-disable-next-line
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

exports.isAdmin = (context) =>
  context.auth.token.hasOwnProperty("admin") ||
  context.auth.token.hasOwnProperty("eboard");
