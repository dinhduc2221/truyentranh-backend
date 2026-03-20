import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

const router = express.Router();

// Đăng ký
router.post("/register", async (req, res) => {
  try {
    const { username, password, email, tuVi, role } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Thiếu tên tài khoản hoặc mật khẩu" });
    }

    const exist = await User.findOne({ where: { username } });
    if (exist) {
      return res.status(400).json({ success: false, message: "Tài khoản đã tồn tại" });
    }

    const hash = await bcrypt.hash(password, 10);
    await User.create({
      username,
      password: hash,
      email,
      linhThach: 0,
      tuVi: tuVi || "Phàm Nhân",
      role: role === "admin" ? "admin" : "member"
    });

    return res.json({ success: true, message: "Đăng ký thành công" });
  } catch (error) {
    console.error("register error:", error);
    return res.status(500).json({ success: false, message: "Lỗi server khi đăng ký" });
  }
});

// Đăng nhập
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Thiếu tên tài khoản hoặc mật khẩu" });
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ success: false, message: "Sai tài khoản hoặc mật khẩu" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: "Sai tài khoản hoặc mật khẩu" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Server chưa cấu hình JWT_SECRET",
      });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      token,
      username: user.username,
      role: user.role
    });
  } catch (error) {
    console.error("login error:", error);
    return res.status(500).json({ success: false, message: "Lỗi server khi đăng nhập" });
  }
});

// Đổi mật khẩu
router.post("/change-password", async (req, res) => {
  try {
    const { username, oldPassword, newPassword } = req.body;
    if (!username || !oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin" });
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy tài khoản" });
    }

    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) {
      return res.status(400).json({ success: false, message: "Mật khẩu cũ không đúng" });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await user.update({ password: newHash });

    return res.json({ success: true, message: "Đổi mật khẩu thành công" });
  } catch (error) {
    console.error("change-password error:", error);
    return res.status(500).json({ success: false, message: "Lỗi server khi đổi mật khẩu" });
  }
});

export default router;
