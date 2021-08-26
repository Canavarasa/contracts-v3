import {
    BancorNetwork__factory,
    BancorVault__factory,
    ERC20__factory,
    PoolCollection__factory,
    NetworkSettings__factory,
    NetworkTokenPool__factory,
    PendingWithdrawals__factory,
    PoolToken__factory,
    ProxyAdmin__factory,
    TestBancorNetwork__factory,
    TestERC20Burnable__factory,
    TestERC20Token__factory,
    TestPoolCollection__factory,
    TestNetworkTokenPool__factory,
    TestMathEx__factory,
    TestOwnedUpgradeable__factory,
    TestPendingWithdrawals__factory,
    TestReserveToken__factory,
    TestSafeERC20Ex__factory,
    TokenHolderUpgradeable__factory,
    TransparentUpgradeableProxy__factory
} from '../typechain';
import { TokenGovernance__factory } from '@bancor/token-governance';
import { Signer } from '@ethersproject/abstract-signer';
import { ContractFactory } from '@ethersproject/contracts';
import { ethers } from 'hardhat';

type AsyncReturnType<T extends (...args: any) => any> = T extends (...args: any) => Promise<infer U>
    ? U
    : T extends (...args: any) => infer U
    ? U
    : any;

export type Contract<F extends ContractFactory> = AsyncReturnType<F['deploy']>;

export interface ContractBuilder<F extends ContractFactory> {
    contractName: string;
    deploy(...args: Parameters<F['deploy']>): Promise<Contract<F>>;
    attach(address: string, signer?: Signer): Promise<Contract<F>>;
}

const deployOrAttach = <F extends ContractFactory>(contractName: string, signer?: Signer): ContractBuilder<F> => {
    return {
        contractName,
        deploy: async (...args: Parameters<F['deploy']>): Promise<Contract<F>> => {
            let defaultSigner = signer ? signer : (await ethers.getSigners())[0];

            return (await ethers.getContractFactory(contractName, defaultSigner)).deploy(
                ...(args || [])
            ) as Contract<F>;
        },
        attach: attachOnly<F>(contractName, signer).attach
    };
};

const attachOnly = <F extends ContractFactory>(contractName: string, passedSigner?: Signer) => {
    return {
        attach: async (address: string, signer?: Signer): Promise<Contract<F>> => {
            let defaultSigner = passedSigner ? passedSigner : (await ethers.getSigners())[0];
            return ethers.getContractAt(contractName, address, signer || defaultSigner) as Contract<F>;
        }
    };
};

const deployOrAttachExternal = <F extends ContractFactory>(
    contractName: string,
    // @TODO: needs to replace with correctly typed params but it doesn't work properly for some reason https://github.com/microsoft/TypeScript/issues/31278
    factoryConstructor: { new (signer?: Signer): F },
    initialPassedSigner?: Signer
): ContractBuilder<F> => {
    return {
        contractName,
        deploy: async (...args: Parameters<F['deploy']>): Promise<Contract<F>> => {
            let defaultSigner = initialPassedSigner ? initialPassedSigner : (await ethers.getSigners())[0];

            return new factoryConstructor(defaultSigner).deploy(...(args || [])) as Contract<F>;
        },
        attach: attachOnlyExternal<F>(factoryConstructor, initialPassedSigner).attach
    };
};

const attachOnlyExternal = <F extends ContractFactory>(
    factoryConstructor: { new (signer?: Signer): F },
    initialPassedSigner?: Signer
) => {
    return {
        attach: async (address: string, signer?: Signer): Promise<Contract<F>> => {
            let defaultSigner = initialPassedSigner ? initialPassedSigner : (await ethers.getSigners())[0];
            return new factoryConstructor(signer || defaultSigner).attach(address) as Contract<F>;
        }
    };
};

const getContracts = (signer?: Signer) => ({
    connect: (signer: Signer) => getContracts(signer),

    BancorNetwork: deployOrAttach<BancorNetwork__factory>('BancorNetwork', signer),
    BancorVault: deployOrAttach<BancorVault__factory>('BancorVault', signer),
    ERC20: deployOrAttach<ERC20__factory>('ERC20', signer),
    PoolCollection: deployOrAttach<PoolCollection__factory>('PoolCollection', signer),
    NetworkSettings: deployOrAttach<NetworkSettings__factory>('NetworkSettings', signer),
    NetworkTokenPool: deployOrAttach<NetworkTokenPool__factory>('NetworkTokenPool', signer),
    PendingWithdrawals: deployOrAttach<PendingWithdrawals__factory>('PendingWithdrawals', signer),
    PoolToken: deployOrAttach<PoolToken__factory>('PoolToken', signer),
    ProxyAdmin: deployOrAttach<ProxyAdmin__factory>('ProxyAdmin', signer),
    TestBancorNetwork: deployOrAttach<TestBancorNetwork__factory>('TestBancorNetwork', signer),
    TestERC20Token: deployOrAttach<TestERC20Token__factory>('TestERC20Token', signer),
    TestERC20Burnable: deployOrAttach<TestERC20Burnable__factory>('TestERC20Burnable', signer),
    TestPoolCollection: deployOrAttach<TestPoolCollection__factory>('TestPoolCollection', signer),
    TestNetworkTokenPool: deployOrAttach<TestNetworkTokenPool__factory>('TestNetworkTokenPool', signer),
    TestMathEx: deployOrAttach<TestMathEx__factory>('TestMathEx', signer),
    TestOwnedUpgradeable: deployOrAttach<TestOwnedUpgradeable__factory>('TestOwnedUpgradeable', signer),
    TestPendingWithdrawals: deployOrAttach<TestPendingWithdrawals__factory>('TestPendingWithdrawals', signer),
    TestReserveToken: deployOrAttach<TestReserveToken__factory>('TestReserveToken', signer),
    TestSafeERC20Ex: deployOrAttach<TestSafeERC20Ex__factory>('TestSafeERC20Ex', signer),
    TokenHolderUpgradeable: deployOrAttach<TokenHolderUpgradeable__factory>('TokenHolderUpgradeable', signer),
    TransparentUpgradeableProxy: deployOrAttach<TransparentUpgradeableProxy__factory>(
        'TransparentUpgradeableProxy',
        signer
    ),

    // external contracts
    TokenGovernance: deployOrAttachExternal('TokenGovernance', TokenGovernance__factory, signer)
});

export type Contracts = ReturnType<typeof getContracts>;

export default getContracts();
