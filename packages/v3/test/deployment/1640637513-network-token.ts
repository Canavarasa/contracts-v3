import { NetworkToken, TokenGovernance } from '../../components/LegacyContracts';
import { AccessControlEnumerable } from '../../typechain-types';
import { ZERO_ADDRESS } from '../../utils/Constants';
import { ContractIds, Tags, isMainnet } from '../../utils/Deploy';
import { toWei } from '../../utils/Types';
import { expectRole, roles } from '../helpers/AccessControl';
import { expect } from 'chai';
import { ethers, deployments, getNamedAccounts } from 'hardhat';

const { TokenGovernance: TokenGovernanceRoles } = roles;

describe('1640637513-network-token', () => {
    let deployer: string;
    let foundationMultisig: string;
    let networkToken: NetworkToken;
    let networkTokenGovernance: TokenGovernance;

    const TOTAL_SUPPLY = toWei(1_000_000_000);

    before(async () => {
        ({ deployer, foundationMultisig } = await getNamedAccounts());
    });

    beforeEach(async () => {
        await deployments.fixture(Tags.V2);

        networkToken = await ethers.getContract<NetworkToken>(ContractIds.NetworkToken);
        networkTokenGovernance = await ethers.getContract<TokenGovernance>(ContractIds.NetworkTokenGovernance);
    });

    it('should deploy network token', async () => {
        expect(networkToken.address).not.to.equal(ZERO_ADDRESS);
        expect(networkTokenGovernance.address).not.to.equal(ZERO_ADDRESS);
    });

    it('should configure network token governance', async () => {
        expect(await networkToken.owner()).to.equal(networkTokenGovernance.address);

        await expectRole(
            networkTokenGovernance as any as AccessControlEnumerable,
            TokenGovernanceRoles.ROLE_SUPERVISOR,
            TokenGovernanceRoles.ROLE_SUPERVISOR,
            [foundationMultisig]
        );

        await expectRole(
            networkTokenGovernance as any as AccessControlEnumerable,
            TokenGovernanceRoles.ROLE_GOVERNOR,
            TokenGovernanceRoles.ROLE_SUPERVISOR,
            [deployer]
        );

        if (!isMainnet()) {
            await expectRole(
                networkTokenGovernance as any as AccessControlEnumerable,
                TokenGovernanceRoles.ROLE_MINTER,
                TokenGovernanceRoles.ROLE_GOVERNOR,
                [deployer]
            );

            expect(await networkToken.balanceOf(deployer)).to.equal(TOTAL_SUPPLY);
        }
    });
});
