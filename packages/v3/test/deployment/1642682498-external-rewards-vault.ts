import { ExternalRewardsVault, ProxyAdmin } from '../../components/Contracts';
import { ContractName } from '../../utils/Constants';
import { DeployedContracts, runTestDeployment } from '../../utils/Deploy';
import { expectRole, Roles } from '../helpers/AccessControl';
import { expect } from 'chai';
import { getNamedAccounts } from 'hardhat';

describe('1642682498-external-rewards-vault', () => {
    let deployer: string;
    let proxyAdmin: ProxyAdmin;
    let externalRewardsVault: ExternalRewardsVault;

    before(async () => {
        ({ deployer } = await getNamedAccounts());
    });

    beforeEach(async () => {
        await runTestDeployment(ContractName.ExternalRewardsVault);

        proxyAdmin = await DeployedContracts.ProxyAdmin.deployed();
        externalRewardsVault = await DeployedContracts.ExternalRewardsVault.deployed();
    });

    it('should deploy and configure the external rewards vault contract', async () => {
        expect(await proxyAdmin.getProxyAdmin(externalRewardsVault.address)).to.equal(proxyAdmin.address);

        expect(await externalRewardsVault.version()).to.equal(1);

        await expectRole(externalRewardsVault, Roles.Upgradeable.ROLE_ADMIN, Roles.Upgradeable.ROLE_ADMIN, [deployer]);
        await expectRole(externalRewardsVault, Roles.Vault.ROLE_ASSET_MANAGER, Roles.Upgradeable.ROLE_ADMIN);
    });
});
