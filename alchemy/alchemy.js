import { Alchemy, Network } from "alchemy-sdk";

const config = {
  apiKey: process.env.ALCHEMY_API_KEY, // Replace with your API key
  network: Network.ARB_GOERLI, //ETH_MAINNET, // Replace with your network
};

const alchemyInstance = new Alchemy(config);

export default alchemyInstance;
