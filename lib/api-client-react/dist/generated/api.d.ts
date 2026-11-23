import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { FixtureResponse, GetLiga1Clubs200, GetLiga1ClubsParams, GetLiga1FixturesParams, GetLiga1Live200, GetLiga1LiveParams, GetLiga1MatchDetailParams, GetLiga1SnapshotParams, GetLiga1Standings200, GetLiga1StandingsParams, GetLiga1TopScorers200, GetLiga1TopScorersParams, HealthStatus, LeagueSnapshot, MatchDetail, RefreshLiga1Params } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
/**
 * Returns server health status
 * @summary Health check
 */
export declare const healthCheck: (options?: Parameters<typeof customFetch>[1]) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetLiga1SnapshotUrl: (params?: GetLiga1SnapshotParams) => string;
/**
 * @summary Snapshot lengkap kompetisi
 */
export declare const getLiga1Snapshot: (params?: GetLiga1SnapshotParams, options?: Parameters<typeof customFetch>[1]) => Promise<LeagueSnapshot>;
export declare const getGetLiga1SnapshotQueryKey: (params?: GetLiga1SnapshotParams) => readonly ["/api/liga-1", ...GetLiga1SnapshotParams[]];
export declare const getGetLiga1SnapshotQueryOptions: <TData = Awaited<ReturnType<typeof getLiga1Snapshot>>, TError = ErrorType<unknown>>(params?: GetLiga1SnapshotParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getLiga1Snapshot>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getLiga1Snapshot>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetLiga1SnapshotQueryResult = NonNullable<Awaited<ReturnType<typeof getLiga1Snapshot>>>;
export type GetLiga1SnapshotQueryError = ErrorType<unknown>;
/**
 * @summary Snapshot lengkap kompetisi
 */
export declare function useGetLiga1Snapshot<TData = Awaited<ReturnType<typeof getLiga1Snapshot>>, TError = ErrorType<unknown>>(params?: GetLiga1SnapshotParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getLiga1Snapshot>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getRefreshLiga1Url: (params?: RefreshLiga1Params) => string;
/**
 * @summary Paksa refresh data dari iLeague
 */
export declare const refreshLiga1: (params?: RefreshLiga1Params, options?: Parameters<typeof customFetch>[1]) => Promise<LeagueSnapshot>;
export declare const getRefreshLiga1MutationKey: () => readonly ["refreshLiga1"];
export declare const getRefreshLiga1MutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof refreshLiga1>>, TError, RefreshLiga1MutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof refreshLiga1>>, TError, RefreshLiga1MutationVariables, TContext>;
export type RefreshLiga1MutationResult = NonNullable<Awaited<ReturnType<typeof refreshLiga1>>>;
export type RefreshLiga1MutationError = ErrorType<unknown>;
export type RefreshLiga1MutationVariables = {
    params?: RefreshLiga1Params;
};
/**
* @summary Paksa refresh data dari iLeague
*/
export declare const useRefreshLiga1: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof refreshLiga1>>, TError, RefreshLiga1MutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof refreshLiga1>>, TError, RefreshLiga1MutationVariables, TContext>;
export declare const getGetLiga1FixturesUrl: (params?: GetLiga1FixturesParams) => string;
/**
 * @summary Jadwal, live score, dan pertandingan selesai
 */
export declare const getLiga1Fixtures: (params?: GetLiga1FixturesParams, options?: Parameters<typeof customFetch>[1]) => Promise<FixtureResponse>;
export declare const getGetLiga1FixturesQueryKey: (params?: GetLiga1FixturesParams) => readonly ["/api/liga-1/fixtures", ...GetLiga1FixturesParams[]];
export declare const getGetLiga1FixturesQueryOptions: <TData = Awaited<ReturnType<typeof getLiga1Fixtures>>, TError = ErrorType<unknown>>(params?: GetLiga1FixturesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getLiga1Fixtures>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getLiga1Fixtures>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetLiga1FixturesQueryResult = NonNullable<Awaited<ReturnType<typeof getLiga1Fixtures>>>;
export type GetLiga1FixturesQueryError = ErrorType<unknown>;
/**
 * @summary Jadwal, live score, dan pertandingan selesai
 */
export declare function useGetLiga1Fixtures<TData = Awaited<ReturnType<typeof getLiga1Fixtures>>, TError = ErrorType<unknown>>(params?: GetLiga1FixturesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getLiga1Fixtures>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetLiga1LiveUrl: (params?: GetLiga1LiveParams) => string;
/**
 * @summary Pertandingan yang sedang live
 */
export declare const getLiga1Live: (params?: GetLiga1LiveParams, options?: Parameters<typeof customFetch>[1]) => Promise<GetLiga1Live200>;
export declare const getGetLiga1LiveQueryKey: (params?: GetLiga1LiveParams) => readonly ["/api/liga-1/live", ...GetLiga1LiveParams[]];
export declare const getGetLiga1LiveQueryOptions: <TData = Awaited<ReturnType<typeof getLiga1Live>>, TError = ErrorType<unknown>>(params?: GetLiga1LiveParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getLiga1Live>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getLiga1Live>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetLiga1LiveQueryResult = NonNullable<Awaited<ReturnType<typeof getLiga1Live>>>;
export type GetLiga1LiveQueryError = ErrorType<unknown>;
/**
 * @summary Pertandingan yang sedang live
 */
export declare function useGetLiga1Live<TData = Awaited<ReturnType<typeof getLiga1Live>>, TError = ErrorType<unknown>>(params?: GetLiga1LiveParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getLiga1Live>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetLiga1StandingsUrl: (params?: GetLiga1StandingsParams) => string;
/**
 * @summary Klasemen kompetisi
 */
export declare const getLiga1Standings: (params?: GetLiga1StandingsParams, options?: Parameters<typeof customFetch>[1]) => Promise<GetLiga1Standings200>;
export declare const getGetLiga1StandingsQueryKey: (params?: GetLiga1StandingsParams) => readonly ["/api/liga-1/standings", ...GetLiga1StandingsParams[]];
export declare const getGetLiga1StandingsQueryOptions: <TData = Awaited<ReturnType<typeof getLiga1Standings>>, TError = ErrorType<unknown>>(params?: GetLiga1StandingsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getLiga1Standings>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getLiga1Standings>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetLiga1StandingsQueryResult = NonNullable<Awaited<ReturnType<typeof getLiga1Standings>>>;
export type GetLiga1StandingsQueryError = ErrorType<unknown>;
/**
 * @summary Klasemen kompetisi
 */
export declare function useGetLiga1Standings<TData = Awaited<ReturnType<typeof getLiga1Standings>>, TError = ErrorType<unknown>>(params?: GetLiga1StandingsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getLiga1Standings>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetLiga1TopScorersUrl: (params?: GetLiga1TopScorersParams) => string;
/**
 * @summary Top scorer dan assist
 */
export declare const getLiga1TopScorers: (params?: GetLiga1TopScorersParams, options?: Parameters<typeof customFetch>[1]) => Promise<GetLiga1TopScorers200>;
export declare const getGetLiga1TopScorersQueryKey: (params?: GetLiga1TopScorersParams) => readonly ["/api/liga-1/top-scorers", ...GetLiga1TopScorersParams[]];
export declare const getGetLiga1TopScorersQueryOptions: <TData = Awaited<ReturnType<typeof getLiga1TopScorers>>, TError = ErrorType<unknown>>(params?: GetLiga1TopScorersParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getLiga1TopScorers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getLiga1TopScorers>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetLiga1TopScorersQueryResult = NonNullable<Awaited<ReturnType<typeof getLiga1TopScorers>>>;
export type GetLiga1TopScorersQueryError = ErrorType<unknown>;
/**
 * @summary Top scorer dan assist
 */
export declare function useGetLiga1TopScorers<TData = Awaited<ReturnType<typeof getLiga1TopScorers>>, TError = ErrorType<unknown>>(params?: GetLiga1TopScorersParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getLiga1TopScorers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetLiga1ClubsUrl: (params?: GetLiga1ClubsParams) => string;
/**
 * @summary Daftar klub dan URL logo
 */
export declare const getLiga1Clubs: (params?: GetLiga1ClubsParams, options?: Parameters<typeof customFetch>[1]) => Promise<GetLiga1Clubs200>;
export declare const getGetLiga1ClubsQueryKey: (params?: GetLiga1ClubsParams) => readonly ["/api/liga-1/clubs", ...GetLiga1ClubsParams[]];
export declare const getGetLiga1ClubsQueryOptions: <TData = Awaited<ReturnType<typeof getLiga1Clubs>>, TError = ErrorType<unknown>>(params?: GetLiga1ClubsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getLiga1Clubs>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getLiga1Clubs>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetLiga1ClubsQueryResult = NonNullable<Awaited<ReturnType<typeof getLiga1Clubs>>>;
export type GetLiga1ClubsQueryError = ErrorType<unknown>;
/**
 * @summary Daftar klub dan URL logo
 */
export declare function useGetLiga1Clubs<TData = Awaited<ReturnType<typeof getLiga1Clubs>>, TError = ErrorType<unknown>>(params?: GetLiga1ClubsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getLiga1Clubs>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetLiga1MatchDetailUrl: (matchId: string, params?: GetLiga1MatchDetailParams) => string;
/**
 * @summary Detail pertandingan, statistik, linimasa, dan susunan pemain
 */
export declare const getLiga1MatchDetail: (matchId: string, params?: GetLiga1MatchDetailParams, options?: Parameters<typeof customFetch>[1]) => Promise<MatchDetail>;
export declare const getGetLiga1MatchDetailQueryKey: (matchId: string, params?: GetLiga1MatchDetailParams) => readonly [`/api/liga-1/matches/${string}`, ...GetLiga1MatchDetailParams[]];
export declare const getGetLiga1MatchDetailQueryOptions: <TData = Awaited<ReturnType<typeof getLiga1MatchDetail>>, TError = ErrorType<void>>(matchId: string, params?: GetLiga1MatchDetailParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getLiga1MatchDetail>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getLiga1MatchDetail>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetLiga1MatchDetailQueryResult = NonNullable<Awaited<ReturnType<typeof getLiga1MatchDetail>>>;
export type GetLiga1MatchDetailQueryError = ErrorType<void>;
/**
 * @summary Detail pertandingan, statistik, linimasa, dan susunan pemain
 */
export declare function useGetLiga1MatchDetail<TData = Awaited<ReturnType<typeof getLiga1MatchDetail>>, TError = ErrorType<void>>(matchId: string, params?: GetLiga1MatchDetailParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getLiga1MatchDetail>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map