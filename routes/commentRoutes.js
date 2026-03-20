import express from "express";
import { Comment } from "../models/Comment.js";
import { CommentLike } from "../models/CommentLike.js";
import { User } from "../models/User.js";
import auth from "../middleware/auth.js";

const router = express.Router();

async function withLikeCount(comments) {
  const plainComments = comments.filter(Boolean).map((c) => c.toJSON());
  const commentIds = plainComments.map((c) => c.id);

  if (commentIds.length === 0) return plainComments;

  const counts = await Promise.all(
    commentIds.map(async (commentId) => {
      const count = await CommentLike.count({ where: { commentId } });
      return [commentId, count];
    })
  );

  const countMap = Object.fromEntries(counts);
  return plainComments.map((comment) => ({
    ...comment,
    likeCount: countMap[comment.id] || 0,
  }));
}

/**
 * Middleware kiểm tra quyền admin
 */
function isAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ message: "Chưa đăng nhập" });
  if (req.user.role !== "admin") return res.status(403).json({ message: "Không có quyền admin" });
  next();
}

/**
 * Middleware optional auth
 */
function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (token) {
    try {
      return auth(req, res, () => {
        next();
      });
    } catch (err) {
      req.user = null;
      next();
    }
  } else {
    req.user = null;
    next();
  }
}

/**
 * Thêm bình luận
 */
router.post("/", auth, async (req, res) => {
  const {
    comicSlug,
    content,
    displayName,
    avatarFrame,
    realm,
    nameColor,
    nameEffect,
    replyTo
  } = req.body;

  if (!comicSlug || !content) {
    return res.status(400).json({ message: "Thiếu thông tin bình luận" });
  }

  try {
    const comment = await Comment.create({
      userId: req.user.id,
      comicSlug,
      content,
      displayName: displayName || req.user.username,
      avatarFrame: avatarFrame || null,
      realm: realm || null,
      nameColor: nameColor || null,
      nameEffect: nameEffect || null,
      replyTo: replyTo || null
    });

    const commentWithUser = await Comment.findByPk(comment.id, {
      include: [
        {
          model: User,
          attributes: [
            "id",
            "username",
            "role",
            "avatarUrl",
            "nameColor",
            "badge",
            "vipLevel",
            "tuVi",
            "realm"
          ]
        }
      ]
    });

    res.json({
      success: true,
      comment: commentWithUser.toJSON()
    });
  } catch (err) {
    console.error("Error creating comment:", err);
    res.status(500).json({ message: "Lỗi server: " + err.message });
  }
});

/**
 * Lấy danh sách bình luận
 */
router.get("/", optionalAuth, async (req, res) => {
  const { comicSlug } = req.query;

  const where = comicSlug ? { comicSlug } : {};

  try {
    const comments = await Comment.findAll({
      where,
      order: [
        ["isPinned", "DESC"],
        ["createdAt", "DESC"]
      ],
      include: [
        {
          model: User,
          attributes: [
            "id",
            "username",
            "role",
            "avatarUrl",
            "nameColor",
            "badge",
            "vipLevel",
            "tuVi",
            "realm"
          ]
        }
      ]
    });

    const commentsWithLikeCount = await withLikeCount(comments);
    res.json({ comments: commentsWithLikeCount });
  } catch (err) {
    console.error("Error fetching comments:", err);
    res.status(500).json({ message: "Lỗi server: " + err.message });
  }
});

/**
 * Like / unlike bình luận
 */
router.post("/like/:id", auth, async (req, res) => {
  try {
    const commentId = Number(req.params.id);
    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Không tìm thấy bình luận" });
    }

    const existing = await CommentLike.findOne({
      where: { userId: req.user.id, commentId },
    });

    let liked;
    if (existing) {
      await existing.destroy();
      liked = false;
    } else {
      await CommentLike.create({ userId: req.user.id, commentId });
      liked = true;
    }

    const likeCount = await CommentLike.count({ where: { commentId } });
    res.json({ success: true, liked, likeCount });
  } catch (err) {
    console.error("Error liking comment:", err);
    res.status(500).json({ message: "Lỗi server: " + err.message });
  }
});

/**
 * Xóa bình luận (admin)
 */
router.delete("/:id", auth, isAdmin, async (req, res) => {
  try {
    const count = await Comment.destroy({ where: { id: req.params.id } });
    if (count === 0)
      return res.status(404).json({ message: "Không tìm thấy bình luận" });

    res.json({ success: true, message: "Xóa bình luận thành công" });
  } catch (err) {
    console.error("Error deleting comment:", err);
    res.status(500).json({ message: "Lỗi server: " + err.message });
  }
});

/**
 * Ghim / Bỏ ghim bình luận
 */
router.post("/pin/:id", auth, isAdmin, async (req, res) => {
  const { isPinned } = req.body;
  try {
    const comment = await Comment.findByPk(req.params.id);
    if (!comment)
      return res.status(404).json({ message: "Không tìm thấy bình luận" });

    await comment.update({ isPinned: Boolean(isPinned) });

    res.json({ success: true, isPinned: comment.isPinned });
  } catch (err) {
    console.error("Error pinning comment:", err);
    res.status(500).json({ message: "Lỗi server: " + err.message });
  }
});

/**
 * Lấy tất cả bình luận của user hiện tại
 */
router.get("/user", auth, async (req, res) => {
  try {
    const comments = await Comment.findAll({
      where: { userId: req.user.id },
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: User,
          attributes: [
            "id",
            "username",
            "role",
            "avatarUrl",
            "nameColor",
            "badge",
            "vipLevel",
            "tuVi",
            "realm"
          ]
        }
      ]
    });

    const commentsWithLikeCount = await withLikeCount(comments);
    res.json({ comments: commentsWithLikeCount });
  } catch (err) {
    console.error("Error fetching user comments:", err);
    res.status(500).json({ message: "Lỗi server: " + err.message });
  }
});

export default router;