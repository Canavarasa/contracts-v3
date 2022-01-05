import Contracts from '../../components/Contracts';
import { TokenGovernance } from '../../components/LegacyContracts';
import { IERC20, NetworkFeeVault } from '../../typechain-types';
import { ZERO_ADDRESS } from '../../utils/Constants';
import { TokenData, TokenSymbol } from '../../utils/TokenData';
import { expectRole, expectRoles, Roles } from '../helpers/AccessControl';
import { createSystem, createTestToken, TokenWithAddress } from '../helpers/Factory';
import { shouldHaveGap } from '../helpers/Proxy';
import { transfer } from '../helpers/Utils';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('NetworkFeeVault', () => {
    shouldHaveGap('NetworkFeeVault');

    describe('construction', () => {
        let networkTokenGovernance: TokenGovernance;
        let govTokenGovernance: TokenGovernance;
        let networkFeeVault: NetworkFeeVault;

        beforeEach(async () => {
            ({ networkTokenGovernance, govTokenGovernance, networkFeeVault } = await createSystem());
        });

        it('should revert when attempting to create with an invalid network token governance contract', async () => {
            await expect(Contracts.NetworkFeeVault.deploy(ZERO_ADDRESS, govTokenGovernance.address)).to.be.revertedWith(
                'InvalidAddress'
            );
        });

        it('should revert when attempting to create with an invalid gov token governance contract', async () => {
            await expect(
                Contracts.NetworkFeeVault.deploy(networkTokenGovernance.address, ZERO_ADDRESS)
            ).to.be.revertedWith('InvalidAddress');
        });

        it('should revert when attempting to reinitialize', async () => {
            await expect(networkFeeVault.initialize()).to.be.revertedWith(
                'Initializable: contract is already initialized'
            );
        });

        it('should be properly initialized', async () => {
            const [deployer] = await ethers.getSigners();

            expect(await networkFeeVault.version()).to.equal(1);
            expect(await networkFeeVault.isPayable()).to.be.true;

            await expectRole(networkFeeVault, Roles.Upgradeable.ROLE_ADMIN, Roles.Upgradeable.ROLE_ADMIN, [
                deployer.address
            ]);
            await expectRole(networkFeeVault, Roles.Vault.ROLE_ASSET_MANAGER, Roles.Upgradeable.ROLE_ADMIN);
        });
    });

    describe('asset management', () => {
        const amount = 1_000_000;

        let networkFeeVault: NetworkFeeVault;
        let networkToken: IERC20;

        let deployer: SignerWithAddress;
        let user: SignerWithAddress;

        let token: TokenWithAddress;

        const testWithdrawFunds = () => {
            it('should allow withdrawals', async () => {
                await expect(networkFeeVault.connect(user).withdrawFunds(token.address, user.address, amount))
                    .to.emit(networkFeeVault, 'FundsWithdrawn')
                    .withArgs(token.address, user.address, user.address, amount);
            });
        };

        const testWithdrawFundsRestricted = () => {
            it('should revert', async () => {
                await expect(
                    networkFeeVault.connect(user).withdrawFunds(token.address, user.address, amount)
                ).to.revertedWith('AccessDenied');
            });
        };

        before(async () => {
            [deployer, user] = await ethers.getSigners();
        });

        for (const symbol of [TokenSymbol.BNT, TokenSymbol.ETH, TokenSymbol.TKN]) {
            const tokenData = new TokenData(symbol);

            beforeEach(async () => {
                ({ networkFeeVault, networkToken } = await createSystem());

                token = tokenData.isNetworkToken() ? networkToken : await createTestToken();

                transfer(deployer, token, networkFeeVault.address, amount);
            });

            context(`withdrawing ${symbol}`, () => {
                context('with no special permissions', () => {
                    testWithdrawFundsRestricted();
                });

                context('with admin role', () => {
                    beforeEach(async () => {
                        await networkFeeVault.grantRole(Roles.Upgradeable.ROLE_ADMIN, user.address);
                    });

                    testWithdrawFundsRestricted();
                });

                context('with asset manager role', () => {
                    beforeEach(async () => {
                        await networkFeeVault.grantRole(Roles.Vault.ROLE_ASSET_MANAGER, user.address);
                    });

                    testWithdrawFunds();
                });
            });
        }
    });
});
