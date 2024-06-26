import { useT } from '../../lib/use-t';
import {
  VegaIcon,
  VegaIconNames,
  TradingInput,
} from '@vegaprotocol/ui-toolkit';
import {
  type TransferNode,
  DispatchMetricLabels,
  EntityScopeLabelMapping,
  AccountType,
  type DispatchStrategy,
  type StakingDispatchStrategy,
} from '@vegaprotocol/types';
import { Card } from '../card/card';
import { useState } from 'react';
import { type AssetFieldsFragment } from '@vegaprotocol/assets';
import { type MarketFieldsFragment } from '@vegaprotocol/markets';
import {
  type EnrichedRewardTransfer,
  useRewards,
  isScopedToTeams,
} from '../../lib/hooks/use-rewards';
import { useMyTeam } from '../../lib/hooks/use-my-team';
import { useVegaWallet } from '@vegaprotocol/wallet-react';
import { useStakeAvailable } from '../../lib/hooks/use-stake-available';
import {
  ActiveRewardCard,
  GroupRewardCard,
  LinkToGame,
  areAllMarketsSettled,
} from './reward-card';
import { groupBy } from 'lodash';

export type Filter = {
  searchTerm: string;
};

export const applyFilter = (
  node: TransferNode & {
    asset?: AssetFieldsFragment | null;
    markets?: (MarketFieldsFragment | null)[];
  },
  filter: Filter
) => {
  const { transfer } = node;

  // if the transfer is a staking reward then it should be displayed
  if (transfer.toAccountType === AccountType.ACCOUNT_TYPE_GLOBAL_REWARD) {
    return true;
  }

  if (
    transfer.kind.__typename !== 'RecurringTransfer' &&
    transfer.kind.__typename !== 'RecurringGovernanceTransfer'
  ) {
    return false;
  }

  if (
    (transfer.kind.dispatchStrategy?.dispatchMetric &&
      DispatchMetricLabels[transfer.kind.dispatchStrategy.dispatchMetric]
        .toLowerCase()
        .includes(filter.searchTerm.toLowerCase())) ||
    transfer.asset?.symbol
      .toLowerCase()
      .includes(filter.searchTerm.toLowerCase()) ||
    (
      (transfer.kind.dispatchStrategy &&
        EntityScopeLabelMapping[transfer.kind.dispatchStrategy.entityScope]) ||
      'Unspecified'
    )
      .toLowerCase()
      .includes(filter.searchTerm.toLowerCase()) ||
    node.asset?.name
      .toLocaleLowerCase()
      .includes(filter.searchTerm.toLowerCase()) ||
    node.markets?.some((m) =>
      m?.tradableInstrument?.instrument?.name
        .toLocaleLowerCase()
        .includes(filter.searchTerm.toLowerCase())
    )
  ) {
    return true;
  }

  return false;
};

export const ActiveRewards = ({ currentEpoch }: { currentEpoch: number }) => {
  const t = useT();
  const { data: allRewards } = useRewards({
    onlyActive: true,
  });
  // filter out the rewards that are scoped to teams on this page
  // we display those on the `Competitions` page
  const data = allRewards.filter((r) => !isScopedToTeams(r));

  const { pubKey } = useVegaWallet();
  const { team } = useMyTeam();
  const { stakeAvailable, isEligible, requiredStake } = useStakeAvailable();
  const requirements = pubKey
    ? {
        isEligible,
        stakeAvailable,
        requiredStake,
        team,
        pubKey,
      }
    : undefined;

  const [filter, setFilter] = useState<Filter>({
    searchTerm: '',
  });

  if (!data || !data.length) return null;

  const cards = data
    .filter((n) => applyFilter(n, filter))
    // filter out the cards (rewards) for which all of the markets
    // are settled
    .filter((n) => !areAllMarketsSettled(n));

  const groupedCards = Object.values(groupBy(cards, determineCardGroup));

  return (
    <Card
      title={t('Active rewards')}
      className="lg:col-span-full"
      data-testid="active-rewards-card"
    >
      {/** CARDS FILTER */}
      {data.length > 1 && (
        <TradingInput
          onChange={(e) =>
            setFilter((curr) => ({ ...curr, searchTerm: e.target.value }))
          }
          value={filter.searchTerm}
          type="text"
          placeholder={t(
            'Search by reward dispatch metric, entity scope or asset name'
          )}
          data-testid="search-term"
          className="mb-4 w-20 mr-2 max-w-xl"
          prependElement={<VegaIcon name={VegaIconNames.SEARCH} />}
        />
      )}
      {/** CARDS */}
      <div className="grid gap-x-8 gap-y-10 h-fit grid-cols-[repeat(auto-fill,_minmax(230px,_1fr))] md:grid-cols-[repeat(auto-fill,_minmax(230px,_1fr))] lg:grid-cols-[repeat(auto-fill,_minmax(320px,_1fr))] xl:grid-cols-[repeat(auto-fill,_minmax(335px,_1fr))] pr-2">
        {groupedCards.map((group, i) => {
          if (group.length === 0) return;
          if (group.length === 1) {
            return (
              <LinkToGame key={i} reward={group[0]}>
                <ActiveRewardCard
                  transferNode={group[0]}
                  currentEpoch={currentEpoch}
                  requirements={requirements}
                />
              </LinkToGame>
            );
          } else {
            return (
              <GroupRewardCard
                key={i}
                transferNodes={group}
                currentEpoch={currentEpoch}
                requirements={requirements}
              />
            );
          }
        })}
      </div>
    </Card>
  );
};

const determineCardGroup = (
  reward: EnrichedRewardTransfer<DispatchStrategy | StakingDispatchStrategy>
) =>
  [
    // groups by:
    // reward asset (usually VEGA)
    reward.transfer.asset?.symbol,
    // reward for (dispatch metric)
    reward.transfer.kind.dispatchStrategy.dispatchMetric,
    // reward scope (teams vs individuals)
    reward.transfer.kind.dispatchStrategy.entityScope,
    // reward distribution strategy
    reward.transfer.kind.dispatchStrategy.distributionStrategy,
  ].join('-');
