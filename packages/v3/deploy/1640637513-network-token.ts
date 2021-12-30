import { Symbols, TokenNames, DEFAULT_DECIMALS, ContractNames, DeploymentTags } from '../utils/Constants';
import { deploy, execute, isMainnet } from '../utils/Deploy';
import { Roles } from '../utils/Roles';
import { toWei } from '../utils/Types';
import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const func: DeployFunction = async ({ getNamedAccounts }: HardhatRuntimeEnvironment) => {
    const { deployer, foundationMultisig } = await getNamedAccounts();

    const TOTAL_SUPPLY = toWei(1_000_000_000);

    const networkToken = await deploy({
        name: ContractNames.NetworkToken,
        contract: 'SmartToken',
        args: [TokenNames.BNT, Symbols.BNT, DEFAULT_DECIMALS],
        from: deployer
    });

    const networkTokenGovernance = await deploy({
        name: ContractNames.NetworkTokenGovernance,
        contract: 'TokenGovernance',
        args: [networkToken],
        from: deployer
    });

    await execute({
        name: ContractNames.NetworkTokenGovernance,
        methodName: 'grantRole',
        args: [Roles.TokenGovernance.ROLE_SUPERVISOR, foundationMultisig],
        from: deployer
    });

    await execute({
        name: ContractNames.NetworkTokenGovernance,
        methodName: 'revokeRole',
        args: [Roles.TokenGovernance.ROLE_SUPERVISOR, deployer],
        from: deployer
    });

    await execute({
        name: ContractNames.NetworkTokenGovernance,
        methodName: 'grantRole',
        args: [Roles.TokenGovernance.ROLE_SUPERVISOR, foundationMultisig],
        from: foundationMultisig
    });

    await execute({
        name: ContractNames.NetworkTokenGovernance,
        methodName: 'grantRole',
        args: [Roles.TokenGovernance.ROLE_GOVERNOR, deployer],
        from: foundationMultisig
    });

    await execute({
        name: ContractNames.NetworkToken,
        methodName: 'transferOwnership',
        args: [networkTokenGovernance],
        from: deployer
    });

    await execute({
        name: ContractNames.NetworkTokenGovernance,
        methodName: 'acceptTokenOwnership',
        from: foundationMultisig
    });

    await execute({
        name: ContractNames.NetworkTokenGovernance,
        methodName: 'grantRole',
        args: [Roles.TokenGovernance.ROLE_MINTER, deployer],
        from: deployer
    });

    await execute({
        name: ContractNames.NetworkTokenGovernance,
        methodName: 'mint',
        args: [deployer, TOTAL_SUPPLY],
        from: deployer
    });
};

func.skip = async () => isMainnet();
func.tags = [DeploymentTags.V2, ContractNames.NetworkToken, ContractNames.NetworkTokenGovernance];

export default func;
