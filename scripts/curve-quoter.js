require("dotenv").config();

const testMode = false;

const registryAbi = require("../abis/curveRegistyAbi.json");
const stablePoolAbi = require("../abis/curveStablePoolAbi.json");
const cryptoPoolAbi = require("../abis/curveCryptoPoolAbi.json");
const { ethers, Contract } = require("ethers");

const FORK_RPC = process.env.FORK_RPC;

const provider = new ethers.providers.JsonRpcProvider(FORK_RPC);
const registryAddress = "0xF98B45FA17DE75FB1aD0e7aFD971b0ca00e379fC";
const registry = new ethers.Contract(registryAddress, registryAbi, provider);

const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const WBTC_ADDRESS = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const SETH_ADDRESS = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";
const AMOUNT_IN = "1";

const addressArray = [
    ["DAI", "0x6B175474E89094C44Da98b954EedeAC495271d0F"],
    ["USDC", "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"],
    ["USDT", "0xdAC17F958D2ee523a2206206994597C13D831ec7"],
    ["ETH", "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"],
    ["SETH", "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84"],
    ["WBTC", "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"],
    ["WETH", "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"],
];

async function getTokens(tokenIn, tokenOut, pool) {
    const coins = await registry.get_underlying_coins(pool);
    const decimals = await registry.get_underlying_decimals(pool);

    const tokenInId = coins.indexOf(tokenIn);
    const tokenInDecimals = decimals[tokenInId];
    const tokenInObj = {
        address: tokenIn,
        id: tokenInId,
        decimals: tokenInDecimals,
    };

    const tokenOutId = coins.indexOf(tokenOut);
    const tokenOutDecimals = decimals[tokenOutId];
    const tokenOutObj = {
        address: tokenOut,
        id: tokenOutId,
        decimals: tokenOutDecimals,
    };

    return [tokenInObj, tokenOutObj];
}

async function main(token0, token1) {
    const tokenInAddress = WETH_ADDRESS;
    const tokenOutAddress = SETH_ADDRESS;

    const poolAddresses = await registry.find_pools_for_coins(tokenInAddress, tokenOutAddress);

    let bestAmount = 0;
    let bestPoolName = "";
    for (let i = 0; i < poolAddresses.length; i++) {
        const tokens = await getTokens(tokenInAddress, tokenOutAddress, poolAddresses[i]);
        const poolAssetType = await registry.get_pool_asset_type(poolAddresses[i]);
        let pool = "";
        if (poolAssetType > 2) {
            pool = new ethers.Contract(poolAddresses[i], cryptoPoolAbi, provider);
        } else {
            pool = new ethers.Contract(poolAddresses[i], stablePoolAbi, provider);
        }

        let poolName = "";
        try {
            poolName = await registry.get_pool_name(poolAddresses[i]);
        } catch {
            poolName = await pool.name();
        }

        const amountIn = ethers.utils.parseUnits(AMOUNT_IN, tokens[0].decimals);
        let amount = 0;
        try {
            amount = await pool.get_dy_underlying(tokens[0].id, tokens[1].id, amountIn);
        } catch {
            try {
                amount = await pool.get_dy(tokens[0].id, tokens[1].id, amountIn);
            } catch {
                console.log(`Could not get amount from ${poolName}`);
            }
        }
        amount = ethers.utils.formatUnits(amount.toString(), tokens[1].decimals);
        console.log(`amount from ${poolName}: ${amount}`);

        if (amount > bestAmount) {
            bestPoolName = poolName;
        }
        bestAmount = Math.max(bestAmount, amount);
    }
    console.log(`Best amount is from ${bestPoolName}: ${bestAmount}`);
}

async function testing() {
    for (let i = 0; i < addressArray.length; i++) {
        for (let j = 0; j < addressArray.length; j++) {
            if (i === j) continue;
            console.log(
                `----------------------${addressArray[i][0]} ----> ${addressArray[j][0]}----------------------`
            );
            await main(addressArray[i][1], addressArray[j][1]);
        }
    }
}

if (testMode) {
    testing();
} else {
    main();
}
