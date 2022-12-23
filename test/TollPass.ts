import { ethers } from "hardhat";
import { expect } from "chai";
import {
  deployEnsResolverFixture,
  setAddressFunc,
} from "./deploy-ens-resolver.fixture";

describe("TollPass", () => {
  let setAddress: setAddressFunc;

  beforeEach(async () => {
    const ensItems = await deployEnsResolverFixture();
    setAddress = ensItems.setAddress;
  });

  it("Should give toll pass to vehicle", async () => {
    const plateNumber = "A592CY02RUS";
    const plateNumberDomain = `${plateNumber}.eth`;

    // We will use the first account as owner for TollPass contract
    const tollPassOwnerAccount = ethers.provider.getSigner(0);
    const vehicleAccount = ethers.provider.getSigner(1);

    await setAddress(plateNumberDomain, await vehicleAccount.getAddress());

    const TollPass = await ethers.getContractFactory("TollPass");
    const tollPass = await TollPass.connect(tollPassOwnerAccount).deploy();

    const vehicleAddress = await ethers.provider.resolveName("random.eth");
    if (!vehicleAddress) {
      return expect(false, "Resolved address returned null").to.be.true;
    }

    // @todo double check on metadata URI
    const { value: tokenId } = await tollPass.sendItem(vehicleAddress);

    // Test that token owner is the same as set in `sendItem`
    const tokenOwner = await tollPass.ownerOf(tokenId);
    expect(tokenOwner).to.be.equal(vehicleAddress);

    // Test metadata URI
    expect(await tollPass.tokenURI(tokenId)).to.be.equal(
      `https://nft.goznak.ru/metadata/${tokenId.toString()}`,
    );

    // Test enumerable extension
    // This case is useful to check token details
    const totalTokens = await tollPass.balanceOf(vehicleAddress);
    expect(totalTokens.toNumber()).to.be.equal(1);
    const vehicleTokenAt0 = await tollPass.tokenOfOwnerByIndex(
      vehicleAddress,
      0,
    );
    expect(vehicleTokenAt0).to.be.equal(tokenId);
  });
});
