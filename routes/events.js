const EVENT = require("../lib/event-queries");
const USER = require("../lib/user-queries");
const express = require("express");
const router = express.Router();
const { splitName } = require("../helper");
const { Events } = require("pg");

module.exports = (db) => {
  const event = new EVENT(db);
  const user = new USER(db);
  router.post("/create", (req, res) => {
    const name = splitName(req.body.name);
    const userQueryObj = {
      firstName: name[0],
      lastName: name.length === 2 ? name[1] : null,
      email: req.body.email,
    };

    user
      .newUser(userQueryObj)
      .then((result) => {
        return result.id;
      })
      .then((id) => {
        const eventQueryObj = {
          ownerId: id,
          startDate: req.body.from,
          endDate: req.body.to,
          closeSubmission: req.body.deadline,
          title: req.body.title,
          detail: req.body.description,
          // TODO implement link
          link: req.body.link,
        };

        // console.log(eventQueryObj);
        // newEvent needs to be called within the newUser promise
        // events table need user_id as reference
        event.newEvent(eventQueryObj)
          .then((result) => {
            req.session["event_id"] = result.id;
            res.json({ success: true });
            return result;
          })
      });
  });

  router.get("/links", (req, res) => {
    const eventId = req.session["event_id"];
    const event = new EVENT(db);

    if (eventId) {
      event
        .findLink(eventId)
        .then((result) => {
          console.log('inside get links', result);
          // return result.link;
          res.send(result.link);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  });

  router.get("/polls", (req, res) => {
    const eventId = req.session["event_id"];
    const event = new EVENT(db);

    event.generateRange(eventId)
      .then(rangeDates => {
        event.generateDaysObject(rangeDates)
          .then(daysObject => {
            console.log(daysObject);
            res.send(daysObject);
          })
      })
      .catch((err) => {
        console.log(err);
      });
  });

  return router;
};
