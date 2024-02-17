// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;
import "./IERC20.sol";

contract Staking {
    IERC20 public stakingToken;
    IERC20 public rewardToken;

    uint public duration;
    address public owner;
    uint public updatedAt;
    uint public finishAt;
    uint public rewardRate;
    uint public rewardPerTokenStored;

    mapping(address => uint) public userRewardPerTokenPaid;
    mapping(address => uint) public userReward;

    uint public totalSupply;
    mapping(address => uint) public balanceOf;

    modifier onlyOwner(){
        require(msg.sender == owner, "Not Owner");

        _;
    }
     modifier updateReward(address _account){
        rewardPerTokenStored = rewardsPerToken();
        updatedAt = lastTimeRewardApplicable();

        if(_account != address(0)){
            userReward[_account] = earned(_account);
            userRewardPerTokenPaid[_account] =rewardPerTokenStored; 
        }
        _;
    }

    constructor(address _stakingToken, address _rewardsToken) {
        owner = msg.sender;
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardsToken);
    }

    function setRewardsDuration(uint _duration) external onlyOwner {
        require(finishAt > block.timestamp, "There is an ongoing stake"); //Prevent the duration from being changed mid staking time
        duration = _duration;
    }

    function notifyRewardAmount(uint _amount) external onlyOwner {
        if(block.timestamp > finishAt){//Checks that the current staking duration has ended
            rewardRate = _amount / duration;
        }
        else{
            uint remainingRewards = rewardRate*(finishAt -block.timestamp);
            rewardRate = (remainingRewards + _amount) / duration;
        }
        require(rewardRate > 0, "reward rate cannot be zero");
        require( rewardRate  *duration <= rewardToken.balanceOf(address(this)), "reward amount greater than the balance ");

        finishAt = block.timestamp + duration;
        updatedAt = block.timestamp;

    }

    function stake(uint _amount) external updateReward(msg.sender) {
        require(_amount > 0, "amount must be greater than Zero");
        stakingToken.transferFrom(msg.sender, address(this), _amount);
        balanceOf[msg.sender] = balanceOf[msg.sender] + _amount;
        totalSupply = totalSupply + _amount;
    }

    function unstake(uint _amount) external updateReward(msg.sender) {
        require(_amount > 0, "amount must be greater than 0");
        balanceOf[msg.sender] = balanceOf[msg.sender] - _amount;
        totalSupply = totalSupply - _amount;

        stakingToken.transfer(msg.sender, _amount);
    }

    function rewardsPerToken() public view returns(uint) {
        if(totalSupply ==0){
            return rewardPerTokenStored;
        }
        
        return  rewardPerTokenStored +
            (rewardRate * (lastTimeRewardApplicable() - updatedAt) * 1e18) /
            totalSupply;
    
    }

    function earned(address _account) public view returns(uint) {
        return (balanceOf[_account] * (rewardsPerToken() - userRewardPerTokenPaid[_account])) / 1e18
         + userReward[_account];
    }

    function getReward() external updateReward(msg.sender){
        uint reward = userReward[msg.sender];
        if(reward > 0){
            userReward[msg.sender] = 0;
            rewardToken.transfer(msg.sender, reward);
        }

    }

    function lastTimeRewardApplicable() view private  returns(uint) {
        return _min(finishAt, block.timestamp);
    }

    function _min(uint _x, uint _y) pure  private returns(uint) {
        if(_x <= _y){
            return _x;
        }
        return _y;
    }

    // function claim() public {}
}
