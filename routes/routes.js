const router = require("express").Router();
const authController = require("../controllers/auth.controller.js");
const userController = require('../controllers/user.controller.js');
const conversationController = require('../controllers/conversation.controller')
const auth = require("../middleware/auth.middleware")
const resetMiddleware = require("../middleware/reset.middleware")
const conversation = require('../middleware/conversation.middleware')

// register
router.post("/api/register", authController.signUp);

// login
router.post("/api/login", authController.signIn);

// logout
router.post("/api/logout", authController.logout);

// loggedIn
router.get("/api/loggedIn", authController.loggedIn);

// resetPassword
router.put("/api/resetPassword/:token", resetMiddleware, authController.resetPassword);

// forgotPassword
router.put("/api/forgotPassword", authController.forgotPassword);

// changePassword
router.put("/api/changePassword/:token", auth ,authController.changePassword);

// getUser
router.post("/api/getUser", auth,userController.getUser);

// checkTokenValidity
router.post("/api/checkToken", resetMiddleware,authController.checkToken)

// get admin username
router.post("/api/adminUsername", conversationController.getAdmin);

// start new conversation
router.post("/api/newConversation",conversationController.newConversation);

// send message
router.post("/api/sendMessage", conversationController.sendMessage);

// get single conversation
router.post("/api/conversation/:id", conversationController.getSingleConversation);

// get all conversations
router.post("/api/conversations",conversationController.getAllConversations);

// has already started a conversation ?
router.post("/api/hasConversation", conversationController.hasConversation);

// check is valid conversation
router.post("/api/checkConversation", conversationController.checkIsValidConversation)

module.exports = router;