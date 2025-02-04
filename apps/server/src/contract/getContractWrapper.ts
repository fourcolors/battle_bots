// server/src/getContractWrapper.ts
import { IContractWrapper } from "./IContractWrapper";
import { ContractWrapper } from "./contractWrapper";
import { MockContractWrapper } from "./mockContractWrapper";

const DEBUG_MODE = process.env.DEBUG_MODE === "true";

/**
 * Returns the correct contract wrapper (real or mock).
 */
export function getContractWrapper(): IContractWrapper {
  return DEBUG_MODE ? new MockContractWrapper() : new ContractWrapper();
}
