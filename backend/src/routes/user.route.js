import express from 'express';
import { protectRoute } from '../middlesware/auth.middleware.js';
import { acceptFriendRequest, getFriendRequests, getMyFriends, getOutgoingFriendReqs, getRecommendedUsers, sendFriendRequest } from '../controllers/user.controller.js';

const router = express.Router();

// it is an middle ware to protect the route
router.use(protectRoute);

router.get('/', getRecommendedUsers); // get all users
router.get("/friends", getMyFriends); // get all friends

router.post("/friend-request/:id", sendFriendRequest);

// why put ? Because we are updating the friend request status
router.put("/friend-request/:id/accept", acceptFriendRequest);

// to send notification to the user
router.get("/friend-requests",getFriendRequests);
router.get("/outgoing-friend-requests",getOutgoingFriendReqs);

export default router;
