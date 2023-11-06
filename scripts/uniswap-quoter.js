require("dotenv").config();

const quoterAbi = require("../abis/uniswapQuoterAbi.json");
const { ethers } = require("ethers");

const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const QUOTER_ADDRESS = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6";

const FORK_RPC = process.env.FORK_RPC;
const provider = new ethers.providers.JsonRpcProvider(FORK_RPC);

const tokenIn = WETH_ADDRESS;
const tokenOut = USDC_ADDRESS;
const fee = "3000";
const amountIn = ethers.utils.parseEther("1");
const sqrtPriceLimitX96 = "0";

const quoter = new ethers.Contract(QUOTER_ADDRESS, quoterAbi, provider);

async function main() {
    const amountOut = await quoter.callStatic.quoteExactInputSingle(
        tokenIn,
        tokenOut,
        fee,
        amountIn,
        sqrtPriceLimitX96
    );

    console.log(`amountOut: ${ethers.utils.formatUnits(amountOut.toString(), 6)}`);
}

main();
