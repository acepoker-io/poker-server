import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { ethers } from "ethers";
import dotenv from "dotenv";
import axios from "axios";
import WPT_ABI from "../config/WPT_ABI.json";
// import { ThirdwebSDK } from "@thirdweb-dev/sdk/evm";

dotenv.config();

const sdk = ThirdwebSDK.fromPrivateKey(
  process.env.WALLET_PRIVATE_KEY,
  process.env.CHAIN_ID
);



// const sdk = new ThirdwebSDK("arbitrum-goerli");
// const contract = sdk.getContract("0xc3c637615164f840DD8De0ef782A206794e064f5");
// contract.ThirdwebSDK();
// contract.wallet.transfer()

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
  console.log(
    "rounded amount",
    Math.round(parseFloat(usdRate) * parseFloat(eth))
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

export const getTransactionByHash = async (hash, userAddress) => {
  try {
    const transaction = await sdk.getProvider().getTransaction(hash);
    console.log("transaction", transaction);

    if (userAddress !== transaction?.from) {
      return false;
    }
    // const value = ethers.BigNumber.from(transaction.value);
    // console.log("valueeeeee ===>", value);
    const transactionAmt = await getDecodedData(transaction);
    // const data = JSON.parse(ethers.utils.toUtf8String(transaction.data));
    // console.log("transaction data", data);
    // transaction.value;
    return transactionAmt;
  } catch (error) {
    console.log("error in getTransactionReceiptByHash", error);
  }
};

export const sendTransactionToWinner = async (amount, winnerAddress) => {
  try {
    console.log("sendTransactionToWinner ===>", amount, winnerAddress);
    // const value = await convertUsdToEth(amount);
    // const tx = {
    //   to: winnerAddress,
    //   from: process.env.OWNER_ADDRESS,
    //   gasPrice: ethers.utils.parseUnits("1", "gwei"),
    //   gasLimit: 10000000,
    //   value: ethers.utils.parseEther(value.toFixed(9).toString()),
    //   // nonce: await sdk.getProvider().getTransactionCount(),
    // };
    // console.log("tx ==>", tx);
    // const transferToWinner = await sdk.wallet.sendRawTransaction(tx);
    // const balance = await contract.erc20.balance();
    // console.log("balance ==>", balance);
    const contract = await sdk.getContract(process.env.CONTRACT_ADDRESS);

    // let balance = await contract.call("balanceOf", [process.env.OWNER_ADDRESS]);
    // balance = ethers.utils.
    let balance = await contract.erc20.balance();
    console.log("balance ======>", balance);

    balance = parseFloat(balance.displayValue);

    if(amount > balance){
      return false;
    }
    // const transferToWinner = await contract.erc20.transfer(winnerAddress, amount);
    const transferToWinner = await contract.call("transfer", [winnerAddress, Math.pow(10,6) * parseInt(amount)], {gasLimit: 1000000, gasPrice: ethers.utils.parseUnits("1", "gwei")})
    // contract.call

    // const transferToWinner = await sdk.wallet.transfer(
    //   winnerAddress,
    //   amount,
    //   "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"
    //   // process.env.CONTRACT_ADDRESS
    // );

    // const transferToWinner = await contract.call("transfer", [
    //   winnerAddress,
    //   amount,
    // ]);

    // const transferToWinner = await sdk.getProvider().sendTransaction(tx);

    console.log("transferToWinner ===>", transferToWinner);
    return transferToWinner;
  } catch (error) {
    console.log("error in sendTransactionToWinner", error);
    return false;
  }
};

export const sendCommisionToSharableAddress = async (amount) => {
  try {
    console.log("amount ==>", amount);
    // const value = await convertUsdToEth(amount);
    // const tx = {
    //   to: process.env.COMMISSION_ADDRESS, //"0xc3c637615164f840DD8De0ef782A206794e064f5",
    //   from: process.env.OWNER_ADDRESS, //"0x2e09059610b00A04Ab89412Bd7d7ac73DfAa1Dcc",
    //   gasPrice: ethers.utils.parseUnits("1", "gwei"),
    //   gasLimit: 10000000,
    //   value: ethers.utils.parseEther(value.toFixed(9).toString()),
    // };
    // console.log("tx ==>", tx);
    // const t = await sdk.wallet.sendRawTransaction(tx);
    // const transferToCommisionAddress = await sdk.getProvider();
    const transferToWinner = await sdk.wallet.transfer(
      process.env.COMMISSION_ADDRESS,
      amount,
      process.env.CONTRACT_ADDRESS
    );
    console.log("get provider ==>", transferToWinner);
    // .sendTransaction(tx);
    return transferToWinner;
  } catch (error) {
    console.log("error in sendCommisionToSharableAddress ==>", error);
  }
};

const getDecodedData = async (recipt) => {
  try {
    console.log("rec", recipt.to);
    let iface, contractAddresss;
    
    iface = new ethers.utils.Interface(WPT_ABI);
    contractAddresss = process.env.CONTRACT_ADDRESS;
    
    const decoded = iface.parseTransaction({ data: recipt.data });
    console.log("decoded values ===>", decoded);
    const wptAmt = Number(ethers.utils.formatEther(decoded.args["_amount"]));
    
    console.log("deco", (wptAmt * Math.pow(10,12)));
    
    return (wptAmt * Math.pow(10,12));

   } catch (error) {
    console.log("error", error);
  }
};
