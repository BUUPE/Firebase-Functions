const functions = require("firebase-functions");
const sgMail = require("@sendgrid/mail");
const { isAdmin, validEmail } = require("./util");

// initialize APIs once for all functions
sgMail.setApiKey(functions.config().sendgrid.key);

exports.sendEmailTemplate = functions.https.onCall((data, context) => {
  if (!isAdmin(context))
    throw new functions.https.HttpsError(
      "permission-denied",
      "You must be an admin to call this function!"
    );
  else
    return sgMail.send(data).catch((error) => {
      console.error(error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to send email through SendGrid!"
      );
    });
});

exports.sendApplicationReceipt = functions.https.onCall((data, context) => {
  if (!validEmail(data.email))
    throw new functions.https.HttpsError(
      "invalid-argument",
      'The "email" field must be a valid email!'
    );
  if (typeof data.firstName !== "string")
    throw new functions.https.HttpsError(
      "invalid-argument",
      'The "firstName" field must be a string!'
    );

  const receipt = {
    to: data.email,
    from: "BU UPE <upe@bu.edu>",
    templateId: "d-c33887e2f16542b3bf6587314fe26539",
    dynamicTemplateData: {
      firstName: data.firstName,
    },
  };

  return sgMail.send(receipt).catch((error) => {
    console.error(error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to send email through SendGrid!"
    );
  });
});