import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { assert, expect } from "chai";
import { parseEther } from "ethers";
import { deployments, ethers, network } from "hardhat";
import { Deployment } from "hardhat-deploy/dist/types";
import { developmentChains, INITIAL_SUPPLY } from "../hardhat-config-helper";
import { Token } from "../typechain-types";

const chainId = network.config.chainId!;

!developmentChains.includes(chainId)
  ? describe.skip
  : describe("Token Unit Test", () => {
      let token: Token;
      let deployer: HardhatEthersSigner;
      let user1: HardhatEthersSigner;
      let accounts: HardhatEthersSigner[];
      let tokenContract: Deployment;
      //Multipler is used to make reading the math easier because of the 18 decimal points
      const multiplier = 10 ** 18;
      beforeEach(async () => {
        accounts = await ethers.getSigners();
        deployer = accounts[0];
        user1 = accounts[1];
        await deployments.fixture("all");
        tokenContract = await deployments.get("Token");
        token = await ethers.getContractAt(
          "Token",
          tokenContract.address,
          deployer
        );
      });
      it("was deployed", async () => {
        assert(token.getAddress());
      });
      describe("constructor", () => {
        it("Should have correct INITIAL_SUPPLY of token ", async () => {
          const totalSupply = await token.totalSupply();
          assert.equal(totalSupply.toString(), INITIAL_SUPPLY);
        });
        it("initializes the token with the correct name and symbol ", async () => {
          const name = (await token.name()).toString();
          assert.equal(name, "OurToken");

          const symbol = (await token.symbol()).toString();
          assert.equal(symbol, "OT");
        });
      });
      describe("transfers", () => {
        it("Should be able to transfer tokens successfully to an address", async () => {
          const tokensToSend = parseEther("10");
          await token.transfer(user1, tokensToSend);
          expect(await token.balanceOf(user1)).to.equal(tokensToSend);
        });
        it("emits an transfer event, when an transfer occurs", async () => {
          await expect(
            token.transfer(user1, (10 * multiplier).toString())
          ).to.emit(token, "Transfer");
        });
      });
      describe("allowances", () => {
        const amount = (20 * multiplier).toString();
        let playerToken: Token;
        beforeEach(async () => {
          playerToken = await ethers.getContractAt(
            "Token",
            tokenContract.address,
            user1
          );
        });
        it("Should approve other address to spend token", async () => {
          const tokensToSpend = parseEther("5");
          //Deployer is approving that user1 can spend 5 of their precious OT's
          await token.approve(user1, tokensToSpend);
          await playerToken.transferFrom(deployer, user1, tokensToSpend);
          expect(await playerToken.balanceOf(user1)).to.equal(tokensToSpend);
        });
        it("doesn't allow an unnaproved member to do transfers", async () => {
          await expect(
            playerToken.transferFrom(deployer, user1, amount)
          ).to.be.revertedWithCustomError(token, "ERC20InsufficientAllowance");
        });
        it("emits an approval event, when an approval occurs", async () => {
          await expect(token.approve(user1, amount)).to.emit(token, "Approval");
        });
        it("the allowance being set is accurate", async () => {
          await token.approve(user1, amount);
          const allowance = await token.allowance(deployer, user1);
          assert.equal(allowance.toString(), amount);
        });
        it("won't allow a user to go over the allowance", async () => {
          await token.approve(user1, amount);
          await expect(
            playerToken.transferFrom(
              deployer,
              user1,
              (40 * multiplier).toString()
            )
          ).to.be.revertedWithCustomError(token, "ERC20InsufficientAllowance");
        });
      });
    });
