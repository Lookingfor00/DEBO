import Clarity from "@microsoft/clarity";

export function clarityEvent(name: string): void {
  try {
    Clarity.event(name);
  } catch {
    // ignore
  }
}

export function claritySetTag(key: string, value: string | string[]): void {
  try {
    Clarity.setTag(key, value);
  } catch {
    // ignore
  }
}

export function clarityIdentify(anonId: string): void {
  try {
    if (!anonId) return;
    Clarity.identify(anonId);
  } catch {
    // ignore
  }
}

export function clarityUpgrade(reason: string): void {
  try {
    Clarity.upgrade(reason);
  } catch {
    // ignore
  }
}
