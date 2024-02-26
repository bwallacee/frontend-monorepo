import {
  type AssetFieldsFragment,
  useAssetsMapProvider,
} from '@vegaprotocol/assets';
import { useActiveRewardsQuery } from './__generated__/Rewards';
import {
  type MarketFieldsFragment,
  useMarketsMapProvider,
  getAsset,
} from '@vegaprotocol/markets';
import {
  type RecurringTransfer,
  type TransferNode,
  TransferStatus,
  type DispatchStrategy,
  EntityScope,
  IndividualScope,
  MarketState,
} from '@vegaprotocol/types';
import { type ApolloError } from '@apollo/client';
import compact from 'lodash/compact';
import { useEpochInfoQuery } from './__generated__/Epoch';

export type RewardTransfer = TransferNode & {
  transfer: {
    kind: RecurringTransfer & {
      dispatchStrategy: DispatchStrategy;
    };
  };
};

export type EnrichedRewardTransfer = RewardTransfer & {
  /** Dispatch metric asset (reward asset) */
  asset?: AssetFieldsFragment;
  /** A flag determining whether a reward asset is being traded on any of the active markets */
  isAssetTraded?: boolean;
  /** A list of markets in scope */
  markets?: MarketFieldsFragment[];
};

/**
 * Checks if given transfer is a reward.
 *
 * A reward has to be a recurring transfer and has to have a
 * dispatch strategy.
 */
export const isReward = (node: TransferNode): node is RewardTransfer => {
  if (
    node.transfer.kind.__typename === 'RecurringTransfer' &&
    node.transfer.kind.dispatchStrategy != null
  ) {
    return true;
  }
  return false;
};

/**
 * Checks if given reward (transfer) is active.
 */
export const isActiveReward = (node: RewardTransfer, currentEpoch: number) => {
  const { transfer } = node;

  const pending = transfer.status === TransferStatus.STATUS_PENDING;
  const withinEpochs =
    transfer.kind.startEpoch <= currentEpoch &&
    (transfer.kind.endEpoch != null
      ? transfer.kind.endEpoch >= currentEpoch
      : true);

  if (pending && withinEpochs) return true;
  return false;
};

/**
 * Checks if given reward (transfer) is scoped to teams.
 *
 * A reward is scoped to teams if it's entity scope is set to teams or
 * if the scope is set to individuals but the individuals are in a team.
 */
export const isScopedToTeams = (node: EnrichedRewardTransfer) =>
  // scoped to teams
  node.transfer.kind.dispatchStrategy.entityScope ===
    EntityScope.ENTITY_SCOPE_TEAMS ||
  // or to individuals
  (node.transfer.kind.dispatchStrategy.entityScope ===
    EntityScope.ENTITY_SCOPE_INDIVIDUALS &&
    // but they have to be in a team
    node.transfer.kind.dispatchStrategy.individualScope ===
      IndividualScope.INDIVIDUAL_SCOPE_IN_TEAM);

/** Retrieves rewards (transfers) */
export const useRewards = ({
  // get active by default
  onlyActive = true,
  scopeToTeams = false,
}: {
  onlyActive: boolean;
  scopeToTeams?: boolean;
}): {
  data: EnrichedRewardTransfer[];
  loading: boolean;
  error?: ApolloError | Error;
} => {
  const {
    data: epochData,
    loading: epochLoading,
    error: epochError,
  } = useEpochInfoQuery({
    fetchPolicy: 'network-only',
  });

  const currentEpoch = Number(epochData?.epoch.id);

  const { data, loading, error } = useActiveRewardsQuery({
    variables: {
      isReward: true,
    },
    skip: onlyActive && isNaN(currentEpoch),
    fetchPolicy: 'cache-and-network',
  });

  const {
    data: assets,
    loading: assetsLoading,
    error: assetsError,
  } = useAssetsMapProvider();
  const {
    data: markets,
    loading: marketsLoading,
    error: marketsError,
  } = useMarketsMapProvider();

  const enriched = compact(
    data?.transfersConnection?.edges?.map((n) => n?.node)
  )
    .map((n) => n as TransferNode)
    // make sure we have only rewards here
    .filter(isReward)
    // take only active rewards if required, otherwise take all
    .filter((node) => (onlyActive ? isActiveReward(node, currentEpoch) : true))
    // take only those rewards that are scoped to teams if required, otherwise take all
    .filter((node) => (scopeToTeams ? isScopedToTeams(node) : true))
    // enrich with dispatch asset and markets in scope details
    .map((node) => {
      const asset =
        assets &&
        assets[node.transfer.kind.dispatchStrategy.dispatchMetricAssetId];
      const marketsInScope = compact(
        node.transfer.kind.dispatchStrategy.marketIdsInScope?.map(
          (id) => markets && markets[id]
        )
      );
      const isAssetTraded =
        markets &&
        Object.values(markets).some((m) => {
          try {
            const mAsset = getAsset(m);
            return (
              mAsset.id ===
                node.transfer.kind.dispatchStrategy.dispatchMetricAssetId &&
              m.state === MarketState.STATE_ACTIVE
            );
          } catch {
            // NOOP
          }
          return false;
        });
      return {
        ...node,
        asset: asset ? asset : undefined,
        isAssetTraded: isAssetTraded != null ? isAssetTraded : undefined,
        markets: marketsInScope.length > 0 ? marketsInScope : undefined,
      };
    });

  return {
    data: enriched,
    loading: loading || assetsLoading || marketsLoading || epochLoading,
    error: error || assetsError || marketsError || epochError,
  };
};