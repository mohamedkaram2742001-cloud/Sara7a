import mongoose from "mongoose";
import { GenderEnum, ProviderEnum, RoleEnum } from "../../common/enum/index.js";

const UserSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
      minLength: 2,
      maxLength: 25,
    },
    bio: {
      type: String,
      minLength: 2,
      maxLength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    DOB: Date,
    password: {
      type: String,
      required: [
        function () {
          return this.provider == ProviderEnum.system;
        },
        "Password is required for system accounts",
      ],
    },
    phone: String,
    gender: {
      type: String,
      enum: Object.values(GenderEnum),
      default: GenderEnum.male,
    },
    provider: {
      type: Number,
      enum: Object.values(ProviderEnum),
      default: ProviderEnum.system,
    },
    role: {
      type: Number,
      enum: Object.values(RoleEnum),
      default: RoleEnum.User,
    },
    profilePicture: {
      public_id: String,
      secure_url: String,
    },
    profileCover: {
      public_id: String,
      secure_url: String,
    },
    changeCredentialsTime: Date,
    confirmEmail: {
      type: Date,
      default: null,
    },
    isTwoFactorEnabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    strict: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
UserSchema.index({ createdAt: 1 });
export const userModel =
  mongoose.models.User || mongoose.model("User", UserSchema);
