//SPDX-License-Identifier: MIT
pragma solidity ^0.7.5;
pragma experimental ABIEncoderV2;


library SafeMath {

    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");

        return c;
    }


    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a, "SafeMath: subtraction overflow");
        uint256 c = a - b;

        return c;
    }


    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
        // benefit is lost if 'b' is also tested.
        // See: https://github.com/OpenZeppelin/openzeppelin-solidity/pull/522
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");

        return c;
    }


    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        // Solidity only automatically asserts when dividing by 0
        require(b > 0, "SafeMath: division by zero");
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold

        return c;
    }


    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b != 0, "SafeMath: modulo by zero");
        return a % b;
    }
}

library UniswapV2Library {
    using SafeMath for uint;

    // given an input amount of an asset and pair reserves, returns the maximum output amount of the other asset
    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) internal pure returns (uint amountOut) {
        require(amountIn > 0, 'UniswapV2Library: INSUFFICIENT_INPUT_AMOUNT');
        require(reserveIn > 0 && reserveOut > 0, 'UniswapV2Library: INSUFFICIENT_LIQUIDITY');
        uint amountInWithFee = amountIn.mul(997);
        uint numerator = amountInWithFee.mul(reserveOut);
        uint denominator = reserveIn.mul(1000).add(amountInWithFee);
        amountOut = numerator / denominator;
    }

        // returns sorted token addresses, used to handle return values from pairs sorted in this order
    function sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1) {
        require(tokenA != tokenB, 'UniswapV2Library: IDENTICAL_ADDRESSES');
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), 'UniswapV2Library: ZERO_ADDRESS');
    }


}

/// @title Quoter Interface
/// @notice Supports quoting the calculated amounts from exact input or exact output swaps
/// @dev These functions are not marked view because they rely on calling non-view functions and reverting
/// to compute the result. They are also not gas efficient and should not be called on-chain.
interface IQuoter {
    /// @notice Returns the amount out received for a given exact input swap without executing the swap
    /// @param path The path of the swap, i.e. each token pair and the pool fee
    /// @param amountIn The amount of the first token to swap
    /// @return amountOut The amount of the last token that would be received
    function quoteExactInput(bytes memory path, uint256 amountIn) external returns (uint256 amountOut);

    /// @notice Returns the amount out received for a given exact input but for a swap of a single pool
    /// @param tokenIn The token being swapped in
    /// @param tokenOut The token being swapped out
    /// @param fee The fee of the token pool to consider for the pair
    /// @param amountIn The desired input amount
    /// @param sqrtPriceLimitX96 The price limit of the pool that cannot be exceeded by the swap
    /// @return amountOut The amount of `tokenOut` that would be received
    function quoteExactInputSingle(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        uint256 amountIn,
        uint160 sqrtPriceLimitX96
    ) external returns (uint256 amountOut);

    /// @notice Returns the amount in required for a given exact output swap without executing the swap
    /// @param path The path of the swap, i.e. each token pair and the pool fee
    /// @param amountOut The amount of the last token to receive
    /// @return amountIn The amount of first token required to be paid
    function quoteExactOutput(bytes memory path, uint256 amountOut) external returns (uint256 amountIn);

    /// @notice Returns the amount in required to receive the given exact output amount but for a swap of a single pool
    /// @param tokenIn The token being swapped in
    /// @param tokenOut The token being swapped out
    /// @param fee The fee of the token pool to consider for the pair
    /// @param amountOut The desired output amount
    /// @param sqrtPriceLimitX96 The price limit of the pool that cannot be exceeded by the swap
    /// @return amountIn The amount required as the input for the swap in order to receive `amountOut`
    function quoteExactOutputSingle(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        uint256 amountOut,
        uint160 sqrtPriceLimitX96
    ) external returns (uint256 amountIn);
}

interface IUniswapV2Pair {
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
    function token0() external view returns(address);
    function token1() external view returns(address);
    function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external;

}


interface IERC20 {
    event Approval(address indexed owner, address indexed spender, uint value);
    event Transfer(address indexed from, address indexed to, uint value);

    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
    function totalSupply() external view returns (uint);
    function balanceOf(address owner) external view returns (uint);
    function allowance(address owner, address spender) external view returns (uint);

    function approve(address spender, uint value) external returns (bool);
    function transfer(address to, uint value) external returns (bool);
    function transferFrom(address from, address to, uint value) external returns (bool);
}

interface ICurve{
    function get_exchange_amount(address pool, address from, address to, uint256 amountIn) external view returns(uint256);
}

interface IUniswapV3Pool{
    function fee() external view returns(uint24);
}


contract UniswapV3Simulate {

    using SafeMath for uint256;
    address quoter = 0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6;
    address curveExchange = 0x99a58482BD75cbab83b27EC03CA68fF489b5788f;

    function getUniswapV3AmountOut(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96)
        public returns(uint256){
        uint256 amountOut = IQuoter(quoter).quoteExactInputSingle(tokenIn, tokenOut, fee, amountIn, sqrtPriceLimitX96);
        return amountOut;
    }

    function getUniswapV2AmountOut(address pair, address tokenIn, uint256 amountIn) public view returns(uint256){
        (uint112 reserve0, uint112 reserve1, ) = IUniswapV2Pair(pair).getReserves();
        address token0 = IUniswapV2Pair(pair).token0();
        uint112 reserveIn = tokenIn == token0 ? reserve0 : reserve1; 
        uint112 reserveOut = tokenIn == token0 ? reserve1 : reserve0; 
        uint256 amountOut = UniswapV2Library.getAmountOut(amountIn, reserveIn, reserveOut);
        return(amountOut);
    }

    function getCurveAmountOut(address pair, address tokenIn, address tokenOut, uint256 amountIn) public view returns(uint256){
        return (ICurve(curveExchange).get_exchange_amount(pair, tokenIn, tokenOut, amountIn));
    }

    function simulateTransaction(address[] memory pairs, uint[] memory poolTypes, address[] memory paths, uint256 amountIn) public returns(uint256){
        for (uint i = 0; i < pairs.length; i ++){
            if (poolTypes[i] == 0){
                amountIn = getUniswapV2AmountOut(pairs[i], paths[i], amountIn);
            }
            else if (poolTypes[i]  == 1){
                uint24 fee = IUniswapV3Pool(pairs[i]).fee();
                amountIn = getUniswapV3AmountOut(paths[i], paths[i + 1], fee, amountIn, 0);
            }
            else if (poolTypes[i]  == 2){
                amountIn = getCurveAmountOut(pairs[i], paths[i], paths[i + 1], amountIn);
            }
        }
        return amountIn;
    }

    function ternarySearch(address[] memory pairs, uint[] memory poolTypes, address[] memory paths, uint256 left, uint256 right, uint256 e) public returns(uint256, int256, uint){
        uint i = 0;
        while (right - left > e){
            uint256 r1 = left.add((right.sub(left)).div(3));
            uint256 r2 = right.sub((right.sub(left)).div(3));
            int256 r1Profit = int256(simulateTransaction(pairs, poolTypes, paths, r1)) - int256(r1);
            int256 r2Profit = int256(simulateTransaction(pairs, poolTypes, paths, r2)) - int256(r2);
            if (r2Profit > r1Profit){
                left = r1;
            }
            else{
                right = r2;
            }
            i = i + 1;
        }
        left = uint256(left);
        int256 leftProfit = int256(simulateTransaction(pairs, poolTypes, paths, left)) - int256(left);
        return (left, leftProfit, i);
    }

    function boolConvex(uint256 left, uint256 right, address[] memory pair, uint[] memory poolType, address[] memory path) public returns(bool){
        uint256 mid = (left.add(right)).div(2);
        uint256 leftOutput = simulateTransaction(pair, poolType, path, left);
        int256 leftProfit = int256(leftOutput) - int256(left);
        uint256 rightOutput = simulateTransaction(pair, poolType, path, right);
        int256 rightProfit = int256(rightOutput) - int256(right);
        uint256 midOutput = simulateTransaction(pair, poolType, path, mid);
        int256 midProfit = int256(midOutput) - int256(mid);

        if (((leftProfit + rightProfit) / 2 >= midProfit) && (leftProfit < 0) && (rightProfit < 0)){
            return false;
        }
        else {
            return true;
        }
    } 

    function batchSearch(address[][] memory pairs, uint[][] memory poolTypes, address[][] memory paths) external returns (uint256, int256, uint){
        int256 bestProfit = 0;
        uint256 bestInput = 0;
        uint bestI = 0;
        uint256 left =  100000000000000000;
        for (uint i = 0; i < pairs.length; i++){
            (uint256 optimalInput, int256 profit, uint count) = ternarySearch(pairs[i], poolTypes[i], paths[i], left, left.mul(100), left.div(100));
            if (profit > bestProfit){
                bestProfit = profit;
                bestInput = optimalInput;
                bestI = i;
            }
            bestI = bestI + count;
        }
        return (bestInput, bestProfit, bestI);
    }
}