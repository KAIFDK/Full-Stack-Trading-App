import express from 'express';
import { refreshToken, logout } from '../controller/auth/auth.js';
import { authenticateUser } from '../MiddleWare/authentication.js';
const router = express.Router();

router.post("/refresh-token", refreshToken);
router.post("/logout", authenticateUser, logout);
router.post("/register", register);
router.post("/login", login);

export default router;