const ERC20 = artifacts.require("ERC20");
const ReentrancyGuard = artifacts.require("ReentrancyGuard");
const Eclipseum = artifacts.require("Eclipseum");
const DAI = artifacts.require("DAI");

module.exports = (deployer) => {
  deployer.deploy(DAI).then(function() {
    const weiToDeploy = web3.utils.toWei("0.3", "ether");
    const daiAddress = DAI.address;
    return deployer.deploy(Eclipseum, daiAddress, { value: weiToDeploy });
  });
};
