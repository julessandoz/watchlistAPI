import express from "express";
import { authenticate } from "../middlewares/auth.js";
import User from "../models/User.js";
import Watchlist from "../models/Watchlist.js";
const router = express.Router();

/*
* @api {get} /watchlists Get all watchlists user owns or is invited to
* @apiGroup Watchlists
* @apiName GetWatchlists
* @apiHeader {String} Authorization Bearer token
* @apiSuccess {String} watchlistId Watchlist ID
* @apiSuccess {String} name Watchlist name
* @apiSuccess {String} owner Watchlist owner
* @apiSuccessExample {json} Success-Response:
*    HTTP/1.1 200 OK
*       [
*           {
*               "_id": "5f9e1b9b9b9b9b9b9b9b9b9b",
*               "name": "My watchlist",
*               "owner": {
*                           "_id": "5f9e1b9b9b9b9b9b9b9b9b9b",
                            "username": "test"
*               }
*           }
*       ]
* @apiError (401) HeaderMissing Authorization header is missing
* @apiError (401) HeaderInvalid Authorization header is invalid
* @apiError (401) InvalidToken Invalid token
*
*/
router.get("/", authenticate, async function (req, res, next) {
  try {
    const userWatchlists = Watchlist.find({ owner: req.userId }).populate(
      "owner"
    );
    const watchlistsUserInvitedTo = Watchlist.find({
      invitedUsers: req.userId,
    }).populate("owner");
    const watchlists = [
      ...(await userWatchlists),
      ...(await watchlistsUserInvitedTo),
    ];
    watchlists.forEach((watchlist) => {
      watchlist.invitedUsers = undefined;
      watchlist.owner.email = undefined;
      watchlist.owner.ownedWatchlists = undefined;
    });
    res.send(watchlists);
  } catch (error) {
    next(error);
  }
});

/**
 * @api {post} /watchlists Create a new watchlist
 * @apiGroup Watchlists
 * @apiName CreateWatchlist
 * @apiHeader {String} Authorization Bearer token
 * @apiBody {String{2-10}} name Name
 * @apiParamExample {json} Request-Example:
 * {
 *      "name": "My watchlist"
 * }
 * @apiSuccess {String} watchlistId Watchlist ID
 * @apiSuccess {String} name Name
 * @apiSuccessExample {json} Success-Response:
 *   HTTP/1.1 201 Created
 *  {
 *      "watchlistId": "5f9e1b9b9b9b9b9b9b9b9b9b",
 *      "name": "My watchlist"
 * }
 *
 * @apiError (401) HeaderMissing Authorization header is missing
 * @apiError (401) HeaderInvalid Authorization header is invalid
 * @apiError (401) TokenInvalid Invalid token
 * @apiError (400) NameRequired Name is required
 * @apiError (400) NameTooShort Name is too short, minimum 2 characters
 * @apiError (400) NameTooLong Name is too long, maximum 10 characters
 *
 */
router.post("/", authenticate, async function (req, res, next) {
  const watchlist = new Watchlist({ owner: req.userId, name: req.body.name });
  try {
    await watchlist.save();
    res.status(201).send({ watchlistId: watchlist._id, name: watchlist.name });
  } catch (error) {
    next(error);
  }
});

/**
 * @api {put} /watchlists/:watchlistId/invite Invite a user to a watchlist
 * @apiGroup Watchlists
 * @apiName InviteUser
 * @apiHeader {String} Authorization Bearer token
 * @apiParam {String} watchlistId Watchlist ID
 * @apiBody {String} username Username
 * @apiParamExample {json} Request-Example:
 * {
 *      "username": "test"
 * }
 * @apiSuccess {String} message User added to watchlist
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 * {
 *     "message": "User added to watchlist"
 * }
 * @apiError (401) HeaderMissing Authorization header is missing
 * @apiError (401) HeaderInvalid Authorization header is invalid
 * @apiError (401) TokenInvalid Invalid token
 * @apiError (403) NotAllowed You are not allowed to invite users to this watchlist
 * @apiError (404) WatchlistNotFound Watchlist not found
 * @apiError (404) UserNotFound User not found
 * @apiError (400) UsernameRequired Username is required
 *
 */
router.put(
  "/:watchlistId/invite",
  authenticate,
  async function (req, res, next) {
    try {
        if (!req.body.username) {
            return res.status(400).send("Username is required");
        }
        const watchlist = await Watchlist.findById(req.params.watchlistId);
        const addedUser = await User.find({ username: req.body.username });
        if (!watchlist) {
            return res.status(404).send("Watchlist not found");
        }
        if (watchlist.owner.toString() !== req.userId) {
            return res
            .status(403)
            .send("You are not allowed to invite users to this watchlist");
        }
        if (!addedUser) {
            return res.status(404).send("User not found");
        }
        watchlist.invitedUsers.push(addedUser._id);
        await watchlist.save();
        res.status(200).send("User added to watchlist");
    } catch (error) {
        next(error);
    }
  }
);

/**
 * @api {delete} /watchlists/:watchlistId/remove-user Remove a user from a watchlist
 * @apiGroup Watchlists
 * @apiName RemoveUser
 * @apiHeader {String} Authorization Bearer token
 * @apiParam {String} watchlistId Watchlist ID
 * @apiBody {String} username Username
 * @apiParamExample {json} Request-Example:
 * {
 *      "username": "test"
 * }
 * @apiSuccess {String} message User removed from watchlist
 * @apiSuccessExample {json} Success-Response:
 * HTTP/1.1 200 OK
 * {
 *      "message": "User removed from watchlist"
 * }
 * @apiError (401) HeaderMissing Authorization header is missing
 * @apiError (401) HeaderInvalid Authorization header is invalid
 * @apiError (401) TokenInvalid Invalid token
 * @apiError (403) Unauthorized You are not allowed to remove users from this watchlist
 * @apiError (403) NotAllowed You cannot remove yourself from your own watchlist, you can delete it instead
 * @apiError (404) WatchlistNotFound Watchlist not found
 * @apiError (404) UserNotFound User not found
 * @apiError (400) UsernameRequired Username is required
 * 
 */
router.delete("/:watchlistId/remove-user", authenticate, async function (req, res, next) {
    try {
        if (!req.body.username) {
            return res.status(400).send("Username is required");
        }
        const watchlist = await Watchlist.findById(req.params.watchlistId);
        const userToRemove = await User.findById(req.userId);
        if (!watchlist) {
            return res.status(404).send("Watchlist not found");
        }
        if (!userToRemove) {
            return res.status(404).send("User not found");
        }
        if (userToRemove._id.toString() === watchlist.owner.toString()) {
            return res.sendFile(403).send("You cannot remove yourself from your own watchlist, you can delete it instead");
        }
        if (watchlist.owner.toString() !== req.userId && !userToRemove._id.toString() === req.userId) {
            return res
            .status(403)
            .send("You are not allowed to remove users from this watchlist");
        }
        watchlist.invitedUsers = watchlist.invitedUsers.filter((user) => user.toString() !== userToRemove._id.toString());
        await watchlist.save();
        res.status(200).send("User removed from watchlist");
    } catch (error) {
        next(error);
    }
});



export default router;
