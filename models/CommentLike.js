import { DataTypes } from "sequelize";
import { sequelize } from "../database.js";
import { Comment } from "./Comment.js";
import { User } from "./User.js";

export const CommentLike = sequelize.define(
  "CommentLike",
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    commentId: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    timestamps: true,
    tableName: "CommentLikes",
    indexes: [
      {
        unique: true,
        fields: ["userId", "commentId"],
      },
    ],
  }
);

CommentLike.belongsTo(User, { foreignKey: "userId" });
CommentLike.belongsTo(Comment, { foreignKey: "commentId" });

User.hasMany(CommentLike, { foreignKey: "userId" });
Comment.hasMany(CommentLike, { foreignKey: "commentId" });
