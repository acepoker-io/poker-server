import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { ethers } from "ethers";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const sdk = ThirdwebSDK.fromPrivateKey(
  process.env.WALLET_PRIVATE_KEY,
  process.env.CHAIN_ID
);

export const convertUsdToEth = async (amount) => {
  try {
    const res = await axios.get(
      "https://api.coingecko.com/api/v3/coins/ethereum"
    );
    if (res.data) {
      const rate = res.data.market_data.current_price.usd;
      return amount / rate;
    }
    return null;
  } catch (error) {
    console.log("error in convertUsdToEth", error);
    return null;
  }
};

export const convertEthToUsd = async (eth) => {
  // var requestOptions = { method: "GET", redirect: "follow" };
  const resp = await axios.get(
    "https://api.coinbase.com/v2/exchange-rates?currency=Eth"
  );
  // console.log("USD RATE", resp?.data?.data?.rates?.USD);
  const usdRate = resp?.data?.data?.rates?.USD;
  console.log(
    "amount ==>",
    parseFloat(usdRate) * eth,
    parseFloat(usdRate),
    eth
  );
  return Math.round(parseFloat(usdRate) * parseFloat(eth));

  // .then((response) => response.json())
  // .then((result) => { return (result.data.rates.USD) })
  // .catch((error) => { return ("error", error) });
};

export const getBalance = async (address) => {
  try {
    const b = await sdk.getBalance(address);
    console.log("bb", b);
    return b;
  } catch (error) {
    console.log("error in getBalance", error);
  }
};

export const getTransactionReceiptByHash = async (hash) => {
  try {
    const receipt = await sdk.getProvider().getTransactionReceipt(hash);
    console.log("receipt", receipt);
    return receipt;
  } catch (error) {
    console.log("error in getTransactionReceiptByHash", error);
  }
};

export const getTransactionByHash = async (hash) => {
  try {
    const transaction = await sdk.getProvider().getTransaction(hash);
    console.log("transaction", transaction);
    const data = JSON.parse(ethers.utils.toUtf8String(transaction.data));
    console.log("transaction data", data);
    transaction.value;
    return transaction;
  } catch (error) {
    console.log("error in getTransactionReceiptByHash", error);
  }
};

export const sendTransactionToWinner = async (amount, winnerAddress) => {
  try {
    console.log("sendTransactionToWinner ===>", amount, winnerAddress);
    const value = await convertUsdToEth(amount);
    const tx = {
      to: winnerAddress,
      from: process.env.OWNER_ADDRESS,
      gasPrice: ethers.utils.parseUnits("2", "gwei"),
      gasLimit: 10000000,
      value: ethers.utils.parseEther(value.toFixed(9).toString()),
      // nonce: await sdk.getProvider().getTransactionCount(),
    };
    console.log("tx ==>", tx);
    const transferToWinner = await sdk.wallet.sendRawTransaction(tx);
    // const transferToWinner = await sdk.getProvider().sendTransaction(tx);

    console.log("transferToWinner ===>", transferToWinner);
    return transferToWinner;
  } catch (error) {
    console.log("error in sendTransactionToWinner", error);
  }
};

export const sendCommisionToSharableAddress = async (amount) => {
  try {
    console.log("amount ==>", amount);
    const value = await convertUsdToEth(amount);
    const tx = {
      to: process.env.COMMISSION_ADDRESS, //"0xc3c637615164f840DD8De0ef782A206794e064f5",
      from: process.env.OWNER_ADDRESS, //"0x2e09059610b00A04Ab89412Bd7d7ac73DfAa1Dcc",
      gasPrice: ethers.utils.parseUnits("2", "gwei"),
      gasLimit: 10000000,
      value: ethers.utils.parseEther(value.toFixed(9).toString()),
    };
    console.log("tx ==>", tx);
    const t = await sdk.wallet.sendRawTransaction(tx);
    // const transferToCommisionAddress = await sdk.getProvider();
    console.log("get provider ==>", t);
    // .sendTransaction(tx);
    return t;
  } catch (error) {
    console.log("error in sendCommisionToSharableAddress ==>", error);
  }
};
