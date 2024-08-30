//SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

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

interface IUniswapV2Pair {
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
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

interface IWETH9{
    function withdraw(uint) external ;
}

interface IVault{
    function flashLoan(
        IFlashLoanRecipient recipient,
        IERC20[] memory tokens,
        uint256[] memory amounts,
        bytes memory userData
    ) external;
}

interface IFlashLoanRecipient {
    function receiveFlashLoan(
        IERC20[] memory tokens,
        uint256[] memory amounts,
        uint256[] memory feeAmounts,
        bytes memory userData
    ) external;
}

interface IUniswapV2Router {
    function swapExactTokensForTokensSupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
}

contract FlashloanAndLiquidate{

    using SafeMath for uint256;
    
    address private owner;
    address private weth = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    IVault private constant vault = IVault(0xBA12222222228d8Ba445958a75a0704d566BF2C8);
    IUniswapV2Router private constant router = IUniswapV2Router(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);

    event success(address);

    constructor() public {
        owner = msg.sender;
        IERC20(weth).approve(address(router), 1e50);
    }

    receive() external payable{}

    fallback() external {}

    function startFlashloan(address[] calldata tokens, uint256[] calldata amounts, bytes calldata userData, uint256 toCoinbase) external payable{
        require(msg.sender == owner, "not me");
        IERC20[] memory ierc20Tokens = new IERC20[](tokens.length);
        for(uint i = 0; i < tokens.length; i++){
            ierc20Tokens[i] = IERC20(tokens[i]);
        }
        vault.flashLoan(IFlashLoanRecipient(address(this)), ierc20Tokens, amounts, userData);
        IWETH9(weth).withdraw(IERC20(weth).balanceOf(address(this)));
        // block.coinbase.transfer(toCoinbase);
        // 0x7b9Ce808695836702721f1d40544B13997914a1c.transfer(address(this).balance);
    }

    function receiveFlashLoan(
        IERC20[] calldata tokens,
        uint256[] calldata amounts,
        uint256[] calldata feeAmounts,
        bytes calldata userData
    ) external{
        require(msg.sender == address(vault), "Wrong msg.sender");
        executeFlashloan(userData, amounts, tokens);
        tokens[0].transfer(address(vault), amounts[0] + feeAmounts[0]);
    }

    function executeFlashloan(bytes calldata userData, uint256[] calldata amounts, IERC20[] calldata tokens) public{
        (address[] memory path, uint256 amountOut, address pair0) = abi.decode(userData, (address[], uint256, address));
        IERC20 token = tokens[0];
        uint256 amount = amounts[0];
        // token.transfer(pair0, amount);
        router.swapExactTokensForTokensSupportingFeeOnTransferTokens(amount, 0, path, address(this), block.timestamp);
    }

    function executeFlashloan1(bytes calldata userData, uint256[] calldata amounts, IERC20[] calldata tokens) public{
        (address[] memory path, address[] memory pairs) = abi.decode(userData, (address[], address[]));
        address tokenIn = address(tokens[0]);
        uint256 amountIn = amounts[0];
        // IERC20(token).approve(pair0, 1e50);
        for (uint i = 0; i < pairs.length; i++){
            (address token0, address token1) = UniswapV2Library.sortTokens(path[i], path[i+1]);
            (uint112 reserveIn, uint112 reserveOut, ) = IUniswapV2Pair(pairs[i]).getReserves();
            if (token1 == tokenIn){
                uint112 temp = reserveIn;
                reserveIn = reserveOut;
                reserveOut = temp;
            }
            uint256 amountOut = UniswapV2Library.getAmountOut(amountIn, reserveIn, reserveOut);
            uint256 amount0Out = tokenIn == token0 ? 0 : amountOut;
            uint256 amount1Out = tokenIn == token0 ? amountOut : 0;
            IERC20(tokenIn).transfer(pairs[i], amountIn);
            IUniswapV2Pair(pairs[i]).swap(amount0Out, amount1Out, address(this), "");
            tokenIn = path[i];
            amountIn = getBalance(tokenIn);
        }
    }

    function swapUniswapV2(uint256 amountIn, address pair, address tokenIn, address tokenOut) external {
        (address token0, address token1) = UniswapV2Library.sortTokens(tokenIn, tokenOut);
        (uint112 reserveIn, uint112 reserveOut, ) = IUniswapV2Pair(pair).getReserves();
        if (token1 == tokenIn){
            uint112 temp = reserveIn;
            reserveIn = reserveOut;
            reserveOut = temp;
        }
        uint256 amountOut = UniswapV2Library.getAmountOut(amountIn, reserveIn, reserveOut);
        uint256 amount0Out = tokenIn == token0 ? 0 : amountOut;
        uint256 amount1Out = tokenIn == token0 ? amountOut : 0;
        IERC20(tokenIn).transfer(pair, amountIn);
        IUniswapV2Pair(pair).swap(amount0Out, amount1Out, address(this), "");
    }

    
    function selfDistruct() external{
        if (msg.sender == owner){
            selfdestruct(address(this));
        }
    }

    function getBalance(address token) public view returns (uint256){
        return(IERC20(token).balanceOf(address(this)));
    }
}

