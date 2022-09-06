type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

export type TokenInfo = {
  name: string;
  address: string;
  chainId: number;
  symbol: string;
  decimals: number;
  logoURI?: string;
  extensions?: any;
};

export type TokenWithPermit = TokenInfo & {
  extensions: {
    permit: {
      type: string;
      variant?: string;
      domain: RequireAtLeastOne<
        {
          name?: string;
          version?: string;
          chainId?: number;
          verifyingContract?: string;
          salt?: string;
        },
        "name" | "version" | "chainId" | "verifyingContract" | "salt"
      >;
    };
    [key: string]: any;
  };
};

export type Permit = {
  signature: {
    r: string;
    s: string;
    _vs: string;
    recoveryParam: number;
    v: number | 28 | 27 | 1 | 0;
    yParityAndS: string;
    compact: string;
    raw: any;
  };
  nonce: any;
};

export type EulerAssetConfig = {
  eTokenAddress: string;
  borrowIsolated: boolean;
  collateralFactor: number;
  borrowFactor: number;
  twapWindow: number;
};
