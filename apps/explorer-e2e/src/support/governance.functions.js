export function createSuccessorMarketProposal(parentMarketId) {
  cy.VegaWalletSubmitProposal(getSuccessorTxBody(parentMarketId));
}

function getSuccessorTxBody(parentMarketId) {
  return {
    proposalSubmission: {
      rationale: {
        title: 'Test successor market proposal details',
        description: 'E2E test for successor market',
      },
      terms: {
        newMarket: {
          changes: {
            decimalPlaces: '5',
            positionDecimalPlaces: '5',
            linearSlippageFactor: '0.001',
            quadraticSlippageFactor: '0',
            lpPriceRange: '10',
            instrument: {
              name: 'Token test market',
              code: 'TEST.24h',
              future: {
                settlementAsset:
                  '816af99af60d684502a40824758f6b5377e6af48e50a9ee8ef478ecb879ea8bc',
                quoteName: 'fUSDC',
                dataSourceSpecForSettlementData: {
                  external: {
                    oracle: {
                      signers: [
                        {
                          pubKey: {
                            key: '70d14a321e02e71992fd115563df765000ccc4775cbe71a0e2f9ff5a3b9dc680',
                          },
                        },
                      ],
                      filters: [
                        {
                          key: {
                            name: 'prices.BTC.value',
                            type: 'TYPE_INTEGER',
                            numberDecimalPlaces: '0',
                          },
                          conditions: [
                            {
                              operator: 'OPERATOR_GREATER_THAN',
                              value: '0',
                            },
                          ],
                        },
                      ],
                    },
                  },
                },
                dataSourceSpecForTradingTermination: {
                  external: {
                    oracle: {
                      signers: [
                        {
                          pubKey: {
                            key: '70d14a321e02e71992fd115563df765000ccc4775cbe71a0e2f9ff5a3b9dc680',
                          },
                        },
                      ],
                      filters: [
                        {
                          key: {
                            name: 'trading.terminated.ETH5',
                            type: 'TYPE_BOOLEAN',
                          },
                          conditions: [
                            {
                              operator: 'OPERATOR_EQUALS',
                              value: 'true',
                            },
                          ],
                        },
                      ],
                    },
                  },
                },
                dataSourceSpecBinding: {
                  settlementDataProperty: 'prices.BTC.value',
                  tradingTerminationProperty: 'trading.terminated.ETH5',
                },
              },
            },
            metadata: [
              'sector:food',
              'sector:materials',
              'source:docs.vega.xyz',
            ],
            priceMonitoringParameters: {
              triggers: [
                {
                  horizon: '43200',
                  probability: '0.9999999',
                  auctionExtension: '600',
                },
              ],
            },
            liquidityMonitoringParameters: {
              targetStakeParameters: {
                timeWindow: '3600',
                scalingFactor: 10,
              },
              triggeringRatio: '0.7',
              auctionExtension: '1',
            },
            logNormal: {
              tau: 0.0001140771161,
              riskAversionParameter: 0.01,
              params: {
                mu: 0,
                r: 0.016,
                sigma: 0.5,
              },
            },
            successor: {
              parentMarketId: parentMarketId,
              insurancePoolFraction: '0.75',
            },
          },
        },
        closingTimestamp: 1695666618,
        enactmentTimestamp: 1695666618,
      },
    },
  };
}
