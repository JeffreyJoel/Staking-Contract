import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Staking", function () {
  async function deployStakingFixture() {
    const [owner, otherAccount] = await ethers.getSigners();

    const RewardToken = await ethers.getContractFactory("RewardToken");
    const rewardToken = await RewardToken.deploy(owner);

    const StakingToken = await ethers.getContractFactory("StakingToken");
    const stakingToken = await StakingToken.deploy(owner);

    const Staking = await ethers.getContractFactory("Staking");
    const staking = await Staking.deploy(
      stakingToken.target,
      rewardToken.target
    );

    return { rewardToken, stakingToken, staking, owner, otherAccount };
  }

  // describe("Deployment", function () {
  //   it("Should set the duration of the stake", async function () {
  //     const {staking, owner } = await loadFixture(deployStakingFixture);
  //    const duration =   await staking.connect(owner).setRewardsDuration(0);
  //       await  expect(duration).to.be.revertedWith("There is an ongoing stake");
  //   });
  // });
  describe("Stake", function () {
    it("Should allow the user to stake", async function () {
      const stakeAmount = 100;
      const { staking, owner, stakingToken, otherAccount } = await loadFixture(
        deployStakingFixture
      );
      await stakingToken.connect(otherAccount).approve(staking, 1000);
      await staking.connect(owner).stake(stakeAmount);

      expect(stakeAmount).to.not.equal(0);
      expect(await staking.totalSupply()).to.equal(stakeAmount);
      expect(await staking.balanceOf(owner.address)).to.equal(stakeAmount);
    });
    it("Should revert because of the zero value", async function () {
      const stakeAmount = 0;
      const { staking, owner, stakingToken } = await loadFixture(
        deployStakingFixture
      );
      await stakingToken.connect(owner).approve(staking, 1000);

     await expect(staking.connect(owner).stake(stakeAmount)).to.be.revertedWith("amount must be greater than Zero");
    });
  });

  describe("Unstake", function () {
    it("Should allow the user to unstake", async function () {
      const stakeAmount = 100;
      const { staking, owner, stakingToken } = await loadFixture(
        deployStakingFixture
      );
      await stakingToken.connect(owner).approve(staking, 1000);
      await staking.connect(owner).stake(stakeAmount);
      await staking.connect(owner).unstake(stakeAmount)

      expect(stakeAmount).to.not.equal(0);
      expect(await staking.totalSupply()).to.equal(0);
      expect(await staking.balanceOf(owner.address)).to.equal(0);
    });
    it("Should revert because of the zero value", async function () {
      const stakeAmount = 0;
      const { staking, owner, stakingToken } = await loadFixture(
        deployStakingFixture
      );
      await stakingToken.connect(owner).approve(staking, 1000);
      await staking.connect(owner).stake(1000)

     await expect(staking.connect(owner).unstake(stakeAmount)).to.be.revertedWith("amount must be greater than 0");
    });
  });

  describe("earned", function () {
    it("Should check the amount a user has earned", async function () {
      const stakeAmount = 100;
      const { staking, owner, stakingToken } = await loadFixture(
        deployStakingFixture
      );
      await stakingToken.connect(owner).approve(staking, 1000);
      await staking.connect(owner).stake(stakeAmount);

        expect(await staking.earned(owner)).to.not.equal(stakeAmount);
      
        
      // expect(await staking.totalSupply()).to.equal(0);
      // expect(await staking.balanceOf(owner.address)).to.equal(0);
    });

  });
});
