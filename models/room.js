//imports
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
const Schema = mongoose.Schema;

//creating mongo database schema
const roomSchema = new Schema(
  {
    players: [],
    password: { type: String },
    preflopround: [],
    flopround: [],
    turnround: [],
    riverround: [],
    showdown: [],
    inviteEmail: [],
    currency: { type: String },
    pot: { type: Number, default: 0 },
    communityCard: [],
    runninground: { type: Number, default: 0 },
    gameName: { type: String },
    scheduleDate: { type: String },
    gamestart: { type: Boolean, default: false },
    smallBlind: { type: Number, default: 100 },
    bigBlind: { type: Number, default: 200 },
    smallBlindPosition: { type: Number, default: null },
    bigBlindPosition: { type: Number, default: null },
    dealerPosition: { type: Number, default: null },
    raisePlayerPosition: { type: Number, default: null },
    raiseAmount: { type: Number, default: 0 },
    timerPlayer: { type: String },
    lastAction: { type: String, default: null },
    winnerPlayer: [],
    sidePots: [],
    isShowdown: { type: Boolean, default: false },
    isCircleCompleted: { type: Boolean, default: false },
    allinPlayers: [],
    tournament: { type: Schema.Types.ObjectId, ref: "tournament" },
    gameType: { type: String },

    joinRequests: [],
    eleminated: [],
    timer: { type: Number, default: 25 },
    emergencyTimer: { type: Number, default: 0 },
    minchips: { type: Number, default: 0 },
    maxchips: { type: Number, default: 0 },
    hostId: { type: String, default: null },
    buyinrequest: [],
    buyin: [],
    handWinner: [],
    pause: { type: Boolean, default: false },
    finish: { type: Boolean, default: false },
    autoNextHand: { type: Boolean, default: false },
    autoTimer: { type: Boolean, default: false },
    sitin: [],
    leavereq: [],
    showRoomId: { type: String },
    displayTimer: { type: Boolean },
    paymentId: { type: String },
    paymentData: { type: Object },
    promo: { type: String },
    promoamt: { type: Number },
    setupamt: { type: Number },
    paidAmount: { type: Number },
    created_on: { type: String },
    tableId: { type: String },
    gameType: { type: String },
    invPlayers: [],
    watchers: [],
    chats: [],
    public: { type: Boolean, default: false },
    allowWatcher: { type: Boolean, default: false },
    meetingId: { type: String },
    meetingToken: { type: String },
    media: { type: String },
    firstGameTime: { type: Date },
    sitOut: [],
    isGameRunning: { type: Boolean, default: false },
    eliminationCount: { type: Number },
  },
  {
    timestamps: true,
  }
);
/**
 * Check if password matches the user's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
roomSchema.methods.isPasswordMatch = async function (password) {
  const user = this;
  return bcrypt.compare(password, user.password);
};

roomSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password") && user.password !== "") {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

/**
 * @typedef roomModel
 */
const roomModel = mongoose.model("rooms", roomSchema);

export default roomModel;
