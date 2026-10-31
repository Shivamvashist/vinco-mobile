/**
 * The HUD's public API for launching flights. Components are imported from their own files
 * (HudCounters, RewardFlightLayer); this file exposes only the flight functions and types.
 */
export {
  clearRewardFlight,
  type FlightPoint,
  launchCoinFlight,
  launchRewardFlight,
  measureCentre,
  type RewardAmounts,
  type RewardFlightRequest,
  type RewardKind,
} from './rewardFlight';
