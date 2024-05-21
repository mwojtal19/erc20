interface NetworkConfig {
  [key: number]: {
    name: string;
  };
}

export const networkConfig: NetworkConfig = {
  11155111: {
    name: "sepolia",
  },
  31337: {
    name: "hardhat",
  },
};

export const developmentChains = [31337];
export const DECIMALS = 8;
export const INITIAL_SUPPLY = "1000000000000000000000000";
