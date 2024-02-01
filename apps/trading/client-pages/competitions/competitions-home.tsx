import { useT } from '../../lib/use-t';
import { ErrorBoundary } from '@sentry/react';
import { CompetitionsHeader } from '../../components/competitions/competitions-header';
import { Intent, Loader, TradingButton } from '@vegaprotocol/ui-toolkit';

import { useGames } from '../../lib/hooks/use-games';
import { useCurrentEpochInfoQuery } from '../referrals/hooks/__generated__/Epoch';
import { Link, useNavigate } from 'react-router-dom';
import { Links } from '../../lib/links';
import {
  CompetitionsAction,
  CompetitionsActionsContainer,
} from '../../components/competitions/competitions-cta';
import { GamesContainer } from '../../components/competitions/games-container';
import { CompetitionsLeaderboard } from '../../components/competitions/competitions-leaderboard';
import { useTeams } from '../../lib/hooks/use-teams';
import take from 'lodash/take';
import { usePageTitle } from '../../lib/hooks/use-page-title';

export const CompetitionsHome = () => {
  const t = useT();
  const navigate = useNavigate();

  usePageTitle(t('Competitions'));

  const { data: epochData } = useCurrentEpochInfoQuery();
  const currentEpoch = Number(epochData?.epoch.id);

  const { data: gamesData, loading: gamesLoading } = useGames({
    onlyActive: true,
    currentEpoch,
  });

  const { data: teamsData, loading: teamsLoading } = useTeams();

  return (
    <ErrorBoundary>
      <CompetitionsHeader title={t('Competitions')}>
        <p className="text-lg mb-1">
          {t(
            'Be a team player! Participate in games and work together to rake in as much profit to win.'
          )}
        </p>
      </CompetitionsHeader>

      {/** Get started */}
      <h2 className="text-2xl mb-6">{t('Get started')}</h2>

      <CompetitionsActionsContainer>
        <CompetitionsAction
          variant="A"
          title={t('Create a team')}
          description={t(
            'Lorem ipsum dolor sit amet, consectetur adipisicing elit placeat ipsum minus nemo error dicta.'
          )}
          actionElement={
            <TradingButton
              intent={Intent.Primary}
              onClick={(e) => {
                e.preventDefault();
                navigate(Links.COMPETITIONS_CREATE_TEAM());
              }}
              data-testid="create-public-team-button"
            >
              {t('Create a public team')}
            </TradingButton>
          }
        />
        <CompetitionsAction
          variant="B"
          title={t('Solo team / lone wolf')}
          description={t(
            'Lorem ipsum dolor sit amet, consectetur adipisicing elit placeat ipsum minus nemo error dicta.'
          )}
          actionElement={
            <TradingButton
              intent={Intent.Primary}
              onClick={(e) => {
                e.preventDefault();
                navigate(Links.COMPETITIONS_CREATE_TEAM_SOLO());
              }}
              data-testid="create-private-team-button"
            >
              {t('Create a private team')}
            </TradingButton>
          }
        />
        <CompetitionsAction
          variant="C"
          title={t('Join a team')}
          description={t(
            'Lorem ipsum dolor sit amet, consectetur adipisicing elit placeat ipsum minus nemo error dicta.'
          )}
          actionElement={
            <TradingButton
              intent={Intent.Primary}
              onClick={(e) => {
                e.preventDefault();
                navigate(Links.COMPETITIONS_TEAMS());
              }}
              data-testid="choose-team-button"
            >
              {t('Choose a team')}
            </TradingButton>
          }
        />
      </CompetitionsActionsContainer>

      {/** List of available games */}
      <h2 className="text-2xl mb-6">{t('Games')}</h2>

      {gamesLoading ? (
        <Loader size="small" />
      ) : (
        <GamesContainer data={gamesData} currentEpoch={currentEpoch} />
      )}

      {/** The teams ranking */}
      <div className="mb-6 flex flex-row items-baseline justify-between">
        <h2 className="text-2xl">{t('Leaderboard')}</h2>
        <Link to={Links.COMPETITIONS_TEAMS()} className="text-sm underline">
          {t('View all teams')}
        </Link>
      </div>

      {teamsLoading ? (
        <Loader size="small" />
      ) : (
        <CompetitionsLeaderboard data={take(teamsData, 10)} />
      )}
    </ErrorBoundary>
  );
};