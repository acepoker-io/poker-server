import mongoose from "mongoose";
const Schema = mongoose.Schema;

const tournamentSchema = new Schema(
  {
    name: { type: String, required: true, index: true },
    tournamentFee: { type: String, required: true },
    levels: { type: Object, required: true },
    startTime: { type: String, default: null },
    active: { type: Boolean, default: false, index: true },
    isFinished: { type: Boolean, default: false },
    havePlayers: { type: Number, default: 0, required: true },
    rooms: [{ type: Schema.Types.ObjectId, ref: "rooms", default: [] }],
    destroyedRooms: [
      { type: Schema.Types.ObjectId, ref: "rooms", default: [] },
    ],
    tournamentDate: { type: Date, required: true, default: new Date() },
    incBlindTime: { type: Number, required: true },
    // winTotalPlayer: { type: Number, required: true },
    winPlayer: { type: Array },
    buyIn: { type: Number, required: true },
    isStart: { type: Boolean, default: false, index: true },
    eleminatedPlayers: [],
    totalJoinPlayer: { type: Number, default: 0 },
    tournamentType: { type: String, default: "Multi-Table" },
    winnerAmount: { type: Number, default: 0 },
    waitingArray: { type: Array, default: [] },
    // prizeType:{ type: String, required: true },
    // prizeDistribution:{ type: String, required: true },
  },
  { timestamps: true }
);
const tournamentModel = mongoose.model("tournament", tournamentSchema);

export default tournamentModel;
