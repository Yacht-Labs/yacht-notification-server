import { ProviderError, YachtError, DatabaseError, GraphError } from "./errors";

export type Result<T, E = YachtError> = T | E;

export type ProviderResult<T> = Result<T, ProviderError>;

export type GraphResult<T> = Result<T, GraphError>;

export type DatabaseResult<T> = Result<T, DatabaseError>;
