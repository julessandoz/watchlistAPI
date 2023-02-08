import mongoose from "mongoose";
import bcrypt from "bcrypt";
import * as config from "../config.js";

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: [true, "Username is already in use"],
    minLength: [2, "Username is too short, minimum 2 characters"],
    maxLength: [10, "Username is too long, maximum 10 characters"],
  },
  email: {
    type: String,
    required: true,
    unique: [true, "Email is already in use"],
    match: [
      /^\w+([\.-]?\w+)*@[a-zA-Z]+([\.-]?[a-zA-Z]+)*(\.[a-zA-Z]{2,3})+$/,
      "Please enter a valid email address",
    ],
  },
  password: {
    type: String,
  },
  ownedWatchlists: [
    {
      type: Schema.Types.ObjectId,
      ref: "Watchlist",
    },
  ],
});

UserSchema.virtual("clearPassword");
UserSchema.virtual("confirmPassword");

UserSchema.pre("save", function () {
    if (!this.clearPassword) {
        const err = new Error("Password is required");
        err.status = 400;
        throw err;
    }

    if (!this.password.match(config.PASSWORD_REGEX)) {
        const err = new Error(config.PASSWORD_REGEX_ERROR_MESSAGE);
        err.status = 400;
        throw err;
    }

    if (this.clearPassword !== this.confirmPassword) {
        const err = new Error("Passwords do not match");
        err.status = 400;
        throw err;
    }

    this.password = bcrypt.hashSync(this.clearPassword, config.bcryptFactor);

    });

function transformJsonUser(doc, json, options){
    delete json.password;
    delete json.__v;
    return json;
}

export default mongoose.model("User", UserSchema);