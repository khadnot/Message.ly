const express = require("express");
const router = new express.Router();
const Message = require("../models/message");
const { ensureLoggedIn } = require("../middleware/auth");
const ExpressError = require("../expressError")

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/

router.get('/:id', ensureLoggedIn, async (req, res, next) => {
    try {
        let user = req.user.username;
        let message = await Message.get(req.params.id);

        if (message.to_user.username !== user && message.from_user.username !== user) {
            throw new ExpressError('Message can not be found', 401)
        }

        return res.json({ 'message': message });

    } catch(e) {
        return next(e);
    }
});

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post('/', ensureLoggedIn, async (req, res, next) => {
    try {
        let message = await Message.create({
            id: req.body.id,
            from_username: req.user.username,
            to_username: req.body.to_username,
            body: req.body.body,
            sent_at: req.body.current_timestamp
        });

        return res.json({ 'message': message })

    } catch(e) {
        return next(e);
    }
});

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.post('/:id/read', ensureLoggedIn, async (req, res, next) => {
    try {
        let user = req.user.username;
        let message = await Message.get(req.params.id);

        if (message.to_user.username !== user) {
            throw new ExpressError(`${user} can not set message to read`, 401);
        }

        let readMsg = await Message.markRead(req.params.id);

        return res.json({ readMsg });

    } catch(e) {
        return next(e);
    }
});

module.exports = router;
