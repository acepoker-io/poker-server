import mongoose from "mongoose";
import paginate from "./plugins/paginate.plugin.js";

const withdrawRequestSchema = mongoose.Schema(
  {
    address: {
      type: String,
    },
    redeemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prize",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
    },
    timeData: {
      type: String,
    },
  },
  { timestamps: true }
);

// add plugin that Pagination
withdrawRequestSchema.plugin(paginate);

/**
 * @typedef Token
 */
const withdrawRequest = mongoose.model(
  "withdrawRequest",
  withdrawRequestSchema
);

export default withdrawRequest;
