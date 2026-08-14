import { atom } from "nanostores";

export const pwaUpdateAvailable = atom(false);

let applyUpdate: ((reloadPage?: boolean) => Promise<void>) | undefined;

export function configurePwaUpdate(
  updateServiceWorker: (reloadPage?: boolean) => Promise<void>,
): void {
  applyUpdate = updateServiceWorker;
  pwaUpdateAvailable.set(true);
}

export async function updatePwa(): Promise<void> {
  await applyUpdate?.(true);
}

export function dismissPwaUpdate(): void {
  pwaUpdateAvailable.set(false);
}
