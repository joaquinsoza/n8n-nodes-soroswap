import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';
import { SoroswapSDK, SupportedNetworks, TradeType, SupportedAssetLists, SupportedProtocols } from '@soroswap/sdk';

export class Soroswap implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Soroswap',
		name: 'soroswap',
		icon: { light: 'file:soroswap.svg', dark: 'file:soroswap.svg' },
		group: ['transform'],
		version: 1,
		description: 'Interact with Soroswap DEX on Stellar network',
		defaults: {
			name: 'Soroswap',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'soroswapApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Add Liquidity',
						value: 'addLiquidity',
						description: 'Add liquidity to pool',
						action: 'Add liquidity to pool',
					},
					{
						name: 'Build Transaction',
						value: 'build',
						description: 'Build transaction from quote',
						action: 'Build transaction from quote',
					},
					{
						name: 'Get Asset Lists',
						value: 'getAssetList',
						description: 'Get asset list metadata',
						action: 'Get asset list metadata',
					},
					{
						name: 'Get Asset Prices',
						value: 'getPrice',
						description: 'Get current asset prices',
						action: 'Get current asset prices',
					},
					{
						name: 'Get Contract Address',
						value: 'getContractAddress',
						description: 'Get contract address for network',
						action: 'Get contract address for network',
					},
					{
						name: 'Get Pool by Tokens',
						value: 'getPoolByTokens',
						description: 'Get pool for specific token pair',
						action: 'Get pool for specific token pair',
					},
					{
						name: 'Get Pools',
						value: 'getPools',
						description: 'Get pools for protocols',
						action: 'Get pools for protocols',
					},
					{
						name: 'Get Protocols',
						value: 'getProtocols',
						description: 'Get available trading protocols',
						action: 'Get available trading protocols',
					},
					{
						name: 'Get Quote',
						value: 'quote',
						description: 'Get trading quote for token swap',
						action: 'Get trading quote for token swap',
					},
					{
						name: 'Get User Positions',
						value: 'getUserPositions',
						description: 'Get user liquidity positions',
						action: 'Get user liquidity positions',
					},
					{
						name: 'Remove Liquidity',
						value: 'removeLiquidity',
						description: 'Remove liquidity from pool',
						action: 'Remove liquidity from pool',
					},
					{
						name: 'Send Transaction',
						value: 'send',
						description: 'Send signed transaction',
						action: 'Send signed transaction',
					},
				],
				default: 'getProtocols',
			},
			{
				displayName: 'Network',
				name: 'network',
				type: 'options',
				options: [
					{
						name: 'Mainnet',
						value: 'MAINNET',
					},
					{
						name: 'Testnet',
						value: 'TESTNET',
					},
				],
				default: 'MAINNET',
				description: 'Network to use for the operation',
			},
			// Quote operation fields
			{
				displayName: 'Asset In',
				name: 'assetIn',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['quote'],
					},
				},
				description: 'Source token contract address',
			},
			{
				displayName: 'Asset Out',
				name: 'assetOut',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['quote'],
					},
				},
				description: 'Destination token contract address',
			},
			{
				displayName: 'Amount',
				name: 'amount',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['quote'],
					},
				},
				description: 'Amount to trade (will be converted to BigInt)',
			},
			{
				displayName: 'Trade Type',
				name: 'tradeType',
				type: 'options',
				options: [
					{
						name: 'Exact In',
						value: 'EXACT_IN',
					},
					{
						name: 'Exact Out',
						value: 'EXACT_OUT',
					},
				],
				default: 'EXACT_IN',
				displayOptions: {
					show: {
						operation: ['quote'],
					},
				},
				description: 'Type of trade',
			},
			{
				displayName: 'Protocols',
				name: 'protocols',
				type: 'multiOptions',
				default: ['SOROSWAP'],
				displayOptions: {
					show: {
						operation: ['quote', 'getPools', 'getPoolByTokens'],
					},
				},
				options: [
					{
						name: 'Soroswap',
						value: 'SOROSWAP',
					},
					{
						name: 'Phoenix',
						value: 'PHOENIX',
					},
					{
						name: 'Aqua',
						value: 'AQUA',
					},
					{
						name: 'SDEX',
						value: 'SDEX',
					},
				],
				description: 'Select one or more protocols to use for the operation',
			},
			// Build transaction fields
			{
				displayName: 'Quote',
				name: 'quote',
				type: 'json',
				default: '{}',
				required: true,
				displayOptions: {
					show: {
						operation: ['build'],
					},
				},
				description: 'Quote response from previous quote operation',
			},
			{
				displayName: 'From Address',
				name: 'from',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['build'],
					},
				},
				description: 'Source wallet address',
			},
			{
				displayName: 'To Address',
				name: 'to',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['build'],
					},
				},
				description: 'Destination wallet address',
			},
			// Send transaction fields
			{
				displayName: 'Transaction XDR',
				name: 'xdr',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['send'],
					},
				},
				description: 'Signed transaction XDR string',
			},
			{
				displayName: 'Use Launchtube',
				name: 'launchtube',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						operation: ['send'],
					},
				},
				description: 'Whether to use launchtube for transaction submission',
			},
			// Pool operations fields
			{
				displayName: 'Asset A',
				name: 'assetA',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['getPoolByTokens', 'addLiquidity', 'removeLiquidity'],
					},
				},
				description: 'First token contract address',
			},
			{
				displayName: 'Asset B',
				name: 'assetB',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['getPoolByTokens', 'addLiquidity', 'removeLiquidity'],
					},
				},
				description: 'Second token contract address',
			},
			// Add liquidity fields
			{
				displayName: 'Amount A',
				name: 'amountA',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['addLiquidity'],
					},
				},
				description: 'Amount of first token (BigInt)',
			},
			{
				displayName: 'Amount B',
				name: 'amountB',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['addLiquidity'],
					},
				},
				description: 'Amount of second token (BigInt)',
			},
			// Remove liquidity fields
			{
				displayName: 'Liquidity',
				name: 'liquidity',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['removeLiquidity'],
					},
				},
				description: 'LP token amount to remove (BigInt)',
			},
			// User positions field
			{
				displayName: 'User Address',
				name: 'address',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['getUserPositions'],
					},
				},
				description: 'User wallet address',
			},
			// Asset list field
			{
				displayName: 'Asset List Name',
				name: 'assetListName',
				type: 'options',
				options: [
					{
						name: 'All',
						value: '',
					},
					{
						name: 'Aqua',
						value: 'AQUA',
					},
					{
						name: 'Lobstr',
						value: 'LOBSTR',
					},
					{
						name: 'Soroswap',
						value: 'SOROSWAP',
					},
					{
						name: 'Stellar Expert',
						value: 'STELLAR_EXPERT',
					},
				],
				default: '',
				displayOptions: {
					show: {
						operation: ['getAssetList'],
					},
				},
				description: 'Specific asset list name',
			},
			// Price fields
			{
				displayName: 'Assets',
				name: 'assets',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['getPrice'],
					},
				},
				description: 'Asset addresses (comma-separated for multiple)',
			},
			// Contract address fields
			{
				displayName: 'Contract Name',
				name: 'contractName',
				type: 'options',
				options: [
					{
						name: 'Factory',
						value: 'factory',
					},
					{
						name: 'Router',
						value: 'router',
					},
					{
						name: 'Aggregator',
						value: 'aggregator',
					},
				],
				default: 'factory',
				displayOptions: {
					show: {
						operation: ['getContractAddress'],
					},
				},
				description: 'Contract type',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('soroswapApi');
		const apiKey = credentials.apiKey as string;
		const baseUrl = credentials.baseUrl as string;

		const sdk = new SoroswapSDK({
			apiKey,
			baseUrl,
		});

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const operation = this.getNodeParameter('operation', itemIndex) as string;
				const networkParam = this.getNodeParameter('network', itemIndex) as 'MAINNET' | 'TESTNET';
				const network = networkParam === 'MAINNET' ? SupportedNetworks.MAINNET : SupportedNetworks.TESTNET;

				let result: any;

				switch (operation) {
					case 'getProtocols':
						result = await sdk.getProtocols(network);
						break;

					case 'quote':
						const assetIn = this.getNodeParameter('assetIn', itemIndex) as string;
						const assetOut = this.getNodeParameter('assetOut', itemIndex) as string;
						const amount = this.getNodeParameter('amount', itemIndex) as string;
						const tradeTypeParam = this.getNodeParameter('tradeType', itemIndex) as 'EXACT_IN' | 'EXACT_OUT';
						const tradeType = tradeTypeParam === 'EXACT_IN' ? TradeType.EXACT_IN : TradeType.EXACT_OUT;
						const protocolsParam = this.getNodeParameter('protocols', itemIndex) as string[];
						const protocols = protocolsParam.map(p => SupportedProtocols[p as keyof typeof SupportedProtocols]);

						result = await sdk.quote({
							assetIn,
							assetOut,
							amount: BigInt(amount),
							tradeType,
							protocols,
						}, network);
						break;

					case 'build':
						const quote = this.getNodeParameter('quote', itemIndex) as any;
						const from = this.getNodeParameter('from', itemIndex) as string;
						const to = this.getNodeParameter('to', itemIndex) as string;

						result = await sdk.build({
							quote,
							from: from || undefined,
							to: to || undefined,
						}, network);
						break;

					case 'send':
						const xdr = this.getNodeParameter('xdr', itemIndex) as string;
						const launchtube = this.getNodeParameter('launchtube', itemIndex) as boolean;

						result = await sdk.send(xdr, launchtube, network);
						break;

					case 'getPools':
						const poolProtocolsParam = this.getNodeParameter('protocols', itemIndex) as string[];
						const poolProtocols = poolProtocolsParam.map(p => p.toLowerCase());

						result = await sdk.getPools(network, poolProtocols);
						break;

					case 'getPoolByTokens':
						const assetA = this.getNodeParameter('assetA', itemIndex) as string;
						const assetB = this.getNodeParameter('assetB', itemIndex) as string;
						const poolTokenProtocolsParam = this.getNodeParameter('protocols', itemIndex) as string[];
						const poolTokenProtocols = poolTokenProtocolsParam.map(p => p.toLowerCase());

						result = await sdk.getPoolByTokens(assetA, assetB, network, poolTokenProtocols);
						break;

					case 'addLiquidity':
						const addAssetA = this.getNodeParameter('assetA', itemIndex) as string;
						const addAssetB = this.getNodeParameter('assetB', itemIndex) as string;
						const amountA = this.getNodeParameter('amountA', itemIndex) as string;
						const amountB = this.getNodeParameter('amountB', itemIndex) as string;
						const addTo = this.getNodeParameter('to', itemIndex) as string;

						result = await sdk.addLiquidity({
							assetA: addAssetA,
							assetB: addAssetB,
							amountA: BigInt(amountA),
							amountB: BigInt(amountB),
							to: addTo,
						}, network);
						break;

					case 'removeLiquidity':
						const removeAssetA = this.getNodeParameter('assetA', itemIndex) as string;
						const removeAssetB = this.getNodeParameter('assetB', itemIndex) as string;
						const liquidity = this.getNodeParameter('liquidity', itemIndex) as string;
						const removeTo = this.getNodeParameter('to', itemIndex) as string;

						result = await sdk.removeLiquidity({
							assetA: removeAssetA,
							assetB: removeAssetB,
							liquidity: BigInt(liquidity),
							amountA: BigInt(0),
							amountB: BigInt(0),
							to: removeTo,
						}, network);
						break;

					case 'getUserPositions':
						const address = this.getNodeParameter('address', itemIndex) as string;
						result = await sdk.getUserPositions(address, network);
						break;

					case 'getAssetList':
						const assetListName = this.getNodeParameter('assetListName', itemIndex) as string;
						let assetListValue: SupportedAssetLists | undefined;
						if (assetListName) {
							assetListValue = SupportedAssetLists[assetListName as keyof typeof SupportedAssetLists];
						}
						result = await sdk.getAssetList(assetListValue);
						break;

					case 'getPrice':
						const assetsParam = this.getNodeParameter('assets', itemIndex) as string;
						const assetsList = assetsParam.split(',').map(a => a.trim());
						result = await sdk.getPrice(assetsList.length === 1 ? assetsList[0] : assetsList, network);
						break;

					case 'getContractAddress':
						const contractName = this.getNodeParameter('contractName', itemIndex) as 'factory' | 'router' | 'aggregator';
						result = await sdk.getContractAddress(network, contractName);
						break;

					default:
						throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, {
							itemIndex,
						});
				}

				returnData.push({
					json: result,
					pairedItem: itemIndex,
				});

			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: error.message },
						error,
						pairedItem: itemIndex,
					});
				} else {
					throw new NodeOperationError(this.getNode(), error, {
						itemIndex,
					});
				}
			}
		}

		return [returnData];
	}
}