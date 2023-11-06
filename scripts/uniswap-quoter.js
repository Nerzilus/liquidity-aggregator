require("dotenv").config();

const quoterV2Abi = require("../abis/uniswapQuoterV2Abi.json");
const factoryAbi = require("../abis/uniswapFactoryAbi.json");
const { ethers } = require("ethers");

const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

const uniswap = {
    name: "Uniswap",
    factory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    fees: ["10000", "3000", "500"],
    quoter: "0x61fFE014bA17989E743c5F6cB21bF9697530B21e",
};
const pancakeswap = {
    name: "Pancakeswap",
    factory: "0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865",
    fees: ["10000", "2500", "500", "100"],
    quoter: "0xB048Bbc1Ee6b733FFfCFb9e9CeF7375518e25997",
};
const sushiswap = {
    name: "Sushiswap",
    factory: "0xbACEB8eC6b9355Dfc0269C18bac9d6E2Bdc29C4F",
    fees: ["3000"],
    quoter: "0x64e8802FE490fa7cc61d3463958199161Bb608A7",
};

const dexes = [uniswap, pancakeswap, sushiswap];

const FORK_RPC = process.env.FORK_RPC;
const provider = new ethers.providers.JsonRpcProvider(FORK_RPC);

const tokenIn = USDC_ADDRESS;
const tokenOut = WETH_ADDRESS;
let fee = "0";
const amountIn = ethers.utils.parseEther("1");
const sqrtPriceLimitX96 = "0";

async function main() {
    for (let i = 0; i < dexes.length; i++) {
        const quoter = new ethers.Contract(dexes[i].quoter, quoterV2Abi, provider);
        const factory = new ethers.Contract(dexes[i].factory, factoryAbi, provider);
        for (let j = 0; j < dexes[i].fees.length; j++) {
            fee = dexes[i].fees[j];
            params = {
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                fee: fee,
                amountIn: amountIn,
                sqrtPriceLimitX96: sqrtPriceLimitX96,
            };
            const poolAddress = await factory.getPool(tokenIn, tokenOut, fee);

            let output = 0;
            if (poolAddress !== "0x0000000000000000000000000000000000000000") {
                output = await quoter.callStatic.quoteExactInputSingle(params);
                console.log(
                    `amountOut on ${dexes[i].name} (${fee}): ${ethers.utils.formatUnits(
                        output.amountOut.toString(),
                        18
                    )}`
                );
            } else {
                console.log(`Pool with fee of ${fee} doesn't exist on ${dexes[i].name}`);
            }
        }
    }
}

main();
