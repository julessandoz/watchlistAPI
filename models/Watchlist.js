import mongoose from "mongoose";

const Schema = mongoose.Schema;

const WatchlistSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: false,
        minLength: [2, "Watchlist name is too short, minimum 2 characters"],
        maxLength: [10, "Watchlist name is too long, maximum 10 characters"],
    },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    invitedUsers: [{ type: Schema.Types.ObjectId, ref: "User", unique: [true, "User is already invited to the watchlist"] }],
    movies: [{ type: [Number, "The movie id must be a number"], unique: [true, "Movie is already in the watchlist"] }],
});

function transformJsonWatchlist(doc, json, options) {
    delete json._v;
    return json;
}

export default mongoose.model("Watchlist", WatchlistSchema);